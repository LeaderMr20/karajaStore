<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\BranchStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', $search)
                  ->orWhere('name_en', 'like', "%{$search}%");
            });
        }

        if ($request->has('branch_id')) {
            $branchId = $request->branch_id;
            $query->with(['branchStock' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            }]);
        } else {
            $query->with('branchStock');
        }

        $products = $query->where('is_active', true)->orderBy('name')->get();

        return $this->success($products);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|unique:products,barcode',
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'sometimes|string|max:50',
            'purchase_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'min_stock_alert' => 'sometimes|integer|min:0',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $product = Product::create($validator->validated());

        return $this->success($product->load('category'), 'تم إضافة المنتج بنجاح', 201);
    }

    public function show(Product $product)
    {
        $product->load('category', 'branchStock.branch');

        return $this->success($product);
    }

    public function update(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|unique:products,barcode,' . $product->id,
            'category_id' => 'nullable|exists:categories,id',
            'unit' => 'sometimes|string|max:50',
            'purchase_price' => 'sometimes|numeric|min:0',
            'sale_price' => 'sometimes|numeric|min:0',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'min_stock_alert' => 'sometimes|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $product->update($validator->validated());

        return $this->success($product->load('category'), 'تم تحديث المنتج بنجاح');
    }

    public function destroy(Product $product)
    {
        $product->update(['is_active' => false]);

        return $this->success(null, 'تم إلغاء تفعيل المنتج بنجاح');
    }

    public function findByBarcode(Request $request)
    {
        $product = Product::with('category', 'branchStock')
            ->where('barcode', $request->barcode)
            ->where('is_active', true)
            ->first();

        if (!$product) {
            return $this->error('المنتج غير موجود', 404);
        }

        return $this->success($product);
    }

    public function updateStock(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'quantity'  => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        BranchStock::updateOrCreate(
            ['branch_id' => $request->branch_id, 'product_id' => $product->id],
            ['quantity' => $request->quantity]
        );

        return $this->success(null, 'تم تحديث المخزون بنجاح');
    }

    public function lowStock(Request $request)
    {
        $branchId = $request->input('branch_id');

        $query = BranchStock::with('product', 'branch')
            ->whereHas('product', function ($q) {
                $q->where('is_active', true);
            })
            ->whereRaw('quantity <= (SELECT min_stock_alert FROM products WHERE products.id = branch_stock.product_id)');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $lowStock = $query->get();

        return $this->success($lowStock);
    }
}
