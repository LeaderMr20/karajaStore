<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if (!$request->user()->isAdmin() && $request->user()->branch_id) {
            $query->where(function ($q) use ($request) {
                $q->where('branch_id', $request->user()->branch_id)
                  ->orWhereNull('branch_id');
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('vat_number', 'like', "%{$search}%");
            });
        }

        $customers = $query->where('is_active', true)->orderBy('name')->get();

        return $this->success($customers);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'vat_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $data = $validator->validated();
        if (empty($data['branch_id']) && $request->user()->branch_id) {
            $data['branch_id'] = $request->user()->branch_id;
        }

        $customer = Customer::create($data);

        return $this->success($customer, 'تم إضافة العميل بنجاح', 201);
    }

    public function show(Customer $customer)
    {
        $customer->load('sales');

        return $this->success($customer);
    }

    public function update(Request $request, Customer $customer)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'vat_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $customer->update($validator->validated());

        return $this->success($customer, 'تم تحديث بيانات العميل بنجاح');
    }

    public function destroy(Customer $customer)
    {
        $customer->update(['is_active' => false]);

        return $this->success(null, 'تم إلغاء تفعيل العميل بنجاح');
    }
}
