<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transfer;
use App\Models\BranchStock;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TransferController extends Controller
{
    public function index(Request $request)
    {
        $query = Transfer::with('fromBranch', 'toBranch', 'creator', 'items.product');

        if (!$request->user()->isAdmin()) {
            $branchId = $request->user()->branch_id;
            $query->where(function ($q) use ($branchId) {
                $q->where('from_branch_id', $branchId)
                  ->orWhere('to_branch_id', $branchId);
            });
        }

        $transfers = $query->orderBy('created_at', 'desc')->paginate(20);

        return $this->success($transfers);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id|different:from_branch_id',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        // Verify stock availability
        foreach ($request->items as $item) {
            $stock = BranchStock::where('branch_id', $request->from_branch_id)
                ->where('product_id', $item['product_id'])
                ->first();

            if (!$stock || $stock->quantity < $item['quantity']) {
                $product = \App\Models\Product::find($item['product_id']);
                return $this->error("الكمية غير متوفرة للمنتج: {$product->name}", 400);
            }
        }

        $transfer = DB::transaction(function () use ($request) {
            $transfer = Transfer::create([
                'from_branch_id' => $request->from_branch_id,
                'to_branch_id' => $request->to_branch_id,
                'created_by' => auth()->id(),
                'notes' => $request->notes,
                'status' => 'pending',
            ]);

            foreach ($request->items as $item) {
                $transfer->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return $transfer;
        });

        return $this->success($transfer->load('items.product', 'fromBranch', 'toBranch'), 'تم إنشاء طلب النقل بنجاح', 201);
    }

    public function approve(Transfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return $this->error('لا يمكن تعديل حالة هذا النقل', 400);
        }

        DB::transaction(function () use ($transfer) {
            foreach ($transfer->items as $item) {
                // Deduct from source
                $fromStock = BranchStock::firstOrCreate(
                    ['branch_id' => $transfer->from_branch_id, 'product_id' => $item->product_id],
                    ['quantity' => 0]
                );
                $fromStock->decrement('quantity', $item->quantity);

                StockMovement::create([
                    'branch_id' => $transfer->from_branch_id,
                    'product_id' => $item->product_id,
                    'type' => 'transfer_out',
                    'quantity' => $item->quantity,
                    'balance_after' => $fromStock->fresh()->quantity,
                    'reference_type' => 'transfer',
                    'reference_id' => $transfer->id,
                    'created_by' => auth()->id(),
                ]);

                // Add to destination
                $toStock = BranchStock::firstOrCreate(
                    ['branch_id' => $transfer->to_branch_id, 'product_id' => $item->product_id],
                    ['quantity' => 0]
                );
                $toStock->increment('quantity', $item->quantity);

                StockMovement::create([
                    'branch_id' => $transfer->to_branch_id,
                    'product_id' => $item->product_id,
                    'type' => 'transfer_in',
                    'quantity' => $item->quantity,
                    'balance_after' => $toStock->fresh()->quantity,
                    'reference_type' => 'transfer',
                    'reference_id' => $transfer->id,
                    'created_by' => auth()->id(),
                ]);
            }

            $transfer->update(['status' => 'completed']);
        });

        return $this->success($transfer->fresh()->load('items.product'), 'تم اعتماد النقل بنجاح');
    }

    public function reject(Transfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return $this->error('لا يمكن تعديل حالة هذا النقل', 400);
        }

        $transfer->update(['status' => 'rejected']);

        return $this->success($transfer, 'تم رفض طلب النقل');
    }
}
