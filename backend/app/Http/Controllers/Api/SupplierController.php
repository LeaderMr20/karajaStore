<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::with('branch')->where('is_active', true);

        if (!$request->user()->isAdmin() && $request->user()->branch_id) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $this->success($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255',
            'phone'      => 'nullable|string|max:20',
            'email'      => 'nullable|email',
            'vat_number' => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'branch_id'  => 'nullable|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $data = $validator->validated();
        if (empty($data['branch_id']) && $request->user()->branch_id) {
            $data['branch_id'] = $request->user()->branch_id;
        }

        $supplier = Supplier::create($data);

        return $this->success($supplier->load('branch'), 'تم إضافة المورد بنجاح', 201);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'sometimes|string|max:255',
            'phone'      => 'nullable|string|max:20',
            'email'      => 'nullable|email',
            'vat_number' => 'nullable|string|max:20',
            'address'    => 'nullable|string',
            'branch_id'  => 'nullable|exists:branches,id',
            'is_active'  => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $supplier->update($validator->validated());

        return $this->success($supplier->load('branch'), 'تم تحديث المورد بنجاح');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->update(['is_active' => false]);

        return $this->success(null, 'تم إلغاء تفعيل المورد');
    }
}
