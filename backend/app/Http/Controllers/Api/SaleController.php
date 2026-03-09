<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\BranchStock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with('customer', 'user', 'branch', 'items');

        if (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        } elseif ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        return $this->success($sales);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'sometimes|in:cash,card,bank_transfer,credit',
            'invoice_type' => 'sometimes|in:standard,simplified',
            'discount' => 'sometimes|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'sometimes|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        try {
            $sale = DB::transaction(function () use ($request) {
                $branchId = $request->branch_id;
                $invoiceNumber = Sale::generateInvoiceNumber($branchId);

                $subtotal = 0;
                $totalTax = 0;
                $totalDiscount = $request->input('discount', 0);

                // Calculate totals
                $itemsData = [];
                foreach ($request->items as $item) {
                    $product = \App\Models\Product::findOrFail($item['product_id']);

                    // Check stock
                    $stock = BranchStock::where('branch_id', $branchId)
                        ->where('product_id', $product->id)
                        ->first();

                    if (!$stock || $stock->quantity < $item['quantity']) {
                        throw new \Exception("الكمية غير متوفرة للمنتج: {$product->name}");
                    }

                    $itemDiscount = $item['discount'] ?? 0;
                    $lineTotal = ($item['unit_price'] * $item['quantity']) - $itemDiscount;
                    $taxAmount = $lineTotal * ($product->tax_rate / 100);

                    $itemsData[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount' => $itemDiscount,
                        'tax_rate' => $product->tax_rate,
                        'tax_amount' => round($taxAmount, 2),
                        'total' => round($lineTotal + $taxAmount, 2),
                    ];

                    $subtotal += $lineTotal;
                    $totalTax += $taxAmount;
                }

                $total = $subtotal + $totalTax - $totalDiscount;

                // Create sale
                $sale = Sale::create([
                    'invoice_number' => $invoiceNumber,
                    'branch_id' => $branchId,
                    'customer_id' => $request->customer_id,
                    'user_id' => auth()->id(),
                    'subtotal' => round($subtotal, 2),
                    'discount' => round($totalDiscount, 2),
                    'tax_amount' => round($totalTax, 2),
                    'total' => round($total, 2),
                    'payment_method' => $request->input('payment_method', 'cash'),
                    'invoice_type' => $request->input('invoice_type', 'simplified'),
                    'notes' => $request->notes,
                    'status' => 'completed',
                ]);

                // Create sale items and update stock
                foreach ($itemsData as $itemData) {
                    $sale->items()->create($itemData);

                    // Update stock
                    $stock = BranchStock::where('branch_id', $branchId)
                        ->where('product_id', $itemData['product_id'])
                        ->first();

                    $stock->decrement('quantity', $itemData['quantity']);

                    // Record stock movement
                    StockMovement::create([
                        'branch_id' => $branchId,
                        'product_id' => $itemData['product_id'],
                        'type' => 'out',
                        'quantity' => $itemData['quantity'],
                        'balance_after' => $stock->fresh()->quantity,
                        'reference_type' => 'sale',
                        'reference_id' => $sale->id,
                        'created_by' => auth()->id(),
                    ]);
                }

                return $sale;
            });

            $sale->load('items', 'customer', 'branch', 'user');

            return $this->success($sale, 'تم إنشاء الفاتورة بنجاح', 201);

        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    public function show(Sale $sale)
    {
        $sale->load('items.product', 'customer', 'branch', 'user', 'zatcaLog');

        return $this->success($sale);
    }

    public function cancel(Sale $sale)
    {
        if ($sale->status !== 'completed') {
            return $this->error('لا يمكن إلغاء هذه الفاتورة', 400);
        }

        DB::transaction(function () use ($sale) {
            // Restore stock
            foreach ($sale->items as $item) {
                $stock = BranchStock::where('branch_id', $sale->branch_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($stock) {
                    $stock->increment('quantity', $item->quantity);

                    StockMovement::create([
                        'branch_id' => $sale->branch_id,
                        'product_id' => $item->product_id,
                        'type' => 'in',
                        'quantity' => $item->quantity,
                        'balance_after' => $stock->fresh()->quantity,
                        'reference_type' => 'sale_cancel',
                        'reference_id' => $sale->id,
                        'created_by' => auth()->id(),
                    ]);
                }
            }

            $sale->update(['status' => 'cancelled']);
        });

        return $this->success($sale->fresh(), 'تم إلغاء الفاتورة بنجاح');
    }

    public function todaySales(Request $request)
    {
        $query = Sale::where('status', 'completed')
            ->whereDate('created_at', today());

        if (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        $sales = $query->selectRaw('
            branch_id,
            COUNT(*) as count,
            SUM(total) as total,
            SUM(tax_amount) as tax_total
        ')->groupBy('branch_id')->with('branch')->get();

        return $this->success($sales);
    }
}
