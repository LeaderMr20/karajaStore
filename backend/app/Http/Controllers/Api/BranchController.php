<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::withCount('users', 'sales')
            ->orderBy('name')
            ->get();

        return $this->success($branches);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'location' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'vat_number' => 'nullable|string|max:20',
            'cr_number' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $branch = Branch::create($validator->validated());

        return $this->success($branch, 'تم إنشاء الفرع بنجاح', 201);
    }

    public function show(Branch $branch)
    {
        $branch->load('users');

        return $this->success($branch);
    }

    public function update(Request $request, Branch $branch)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'location' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'vat_number' => 'nullable|string|max:20',
            'cr_number' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $branch->update($validator->validated());

        return $this->success($branch, 'تم تحديث الفرع بنجاح');
    }

    public function destroy(Branch $branch)
    {
        if ($branch->sales()->exists()) {
            return $this->error('لا يمكن حذف فرع يحتوي على فواتير', 400);
        }

        $branch->delete();

        return $this->success(null, 'تم حذف الفرع بنجاح');
    }
}
