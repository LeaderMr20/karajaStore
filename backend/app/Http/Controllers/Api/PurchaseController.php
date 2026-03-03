<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\BranchStock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with('supplier', 'user', 'branch', 'items.product');

        if (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        } elseif ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $purchases = $query->orderBy('created_at', 'desc')->paginate(20);

        return $this->success($purchases);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        try {
            $purchase = DB::transaction(function () use ($request) {
                $branchId = $request->branch_id;

                // Generate reference
                $lastPurchase = Purchase::orderBy('id', 'desc')->first();
                $nextNum = $lastPurchase ? intval(substr($lastPurchase->reference, -6)) + 1 : 1;
                $reference = 'PO-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);

                $subtotal = 0;
                $totalTax = 0;
                $itemsData = [];

                foreach ($request->items as $item) {
                    $product = \App\Models\Product::findOrFail($item['product_id']);
                    $lineTotal = $item['unit_price'] * $item['quantity'];
                    $taxAmount = $lineTotal * ($product->tax_rate / 100);

                    $itemsData[] = [
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_amount' => round($taxAmount, 2),
                        'total' => round($lineTotal + $taxAmount, 2),
                    ];

                    $subtotal += $lineTotal;
                    $totalTax += $taxAmount;
                }

                $purchase = Purchase::create([
                    'reference' => $reference,
                    'branch_id' => $branchId,
                    'supplier_id' => $request->supplier_id,
                    'user_id' => auth()->id(),
                    'subtotal' => round($subtotal, 2),
                    'tax_amount' => round($totalTax, 2),
                    'total' => round($subtotal + $totalTax, 2),
                    'status' => 'received',
                    'notes' => $request->notes,
                ]);

                foreach ($itemsData as $itemData) {
                    $purchase->items()->create($itemData);

                    // Update stock
                    $stock = BranchStock::firstOrCreate(
                        ['branch_id' => $branchId, 'product_id' => $itemData['product_id']],
                        ['quantity' => 0]
                    );
                    $stock->increment('quantity', $itemData['quantity']);

                    StockMovement::create([
                        'branch_id' => $branchId,
                        'product_id' => $itemData['product_id'],
                        'type' => 'in',
                        'quantity' => $itemData['quantity'],
                        'balance_after' => $stock->fresh()->quantity,
                        'reference_type' => 'purchase',
                        'reference_id' => $purchase->id,
                        'created_by' => auth()->id(),
                    ]);
                }

                return $purchase;
            });

            return $this->success($purchase->load('items.product', 'supplier'), 'تم إنشاء فاتورة الشراء بنجاح', 201);

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function show(Purchase $purchase)
    {
        $purchase->load('items.product', 'supplier', 'user', 'branch');

        return $this->success($purchase);
    }
}
