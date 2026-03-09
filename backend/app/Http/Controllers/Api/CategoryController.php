<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $category = Category::create($validator->validated());

        return $this->success($category, 'تم إضافة التصنيف بنجاح', 201);
    }

    public function update(Request $request, Category $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $category->update($validator->validated());

        return $this->success($category, 'تم تحديث التصنيف بنجاح');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return $this->error('لا يمكن حذف تصنيف يحتوي على منتجات', 400);
        }

        $category->delete();

        return $this->success(null, 'تم حذف التصنيف بنجاح');
    }
}
