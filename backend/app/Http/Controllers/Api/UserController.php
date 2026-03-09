<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('branch');

        if (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('name')->get();

        return $this->success($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'branch_id' => 'nullable|exists:branches,id',
            'role' => 'required|in:admin,branch_manager,cashier,accountant',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $user = User::create($validator->validated());

        return $this->success($user->load('branch'), 'تم إنشاء المستخدم بنجاح', 201);
    }

    public function show(User $user)
    {
        return $this->success($user->load('branch'));
    }

    public function update(Request $request, User $user)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'branch_id' => 'nullable|exists:branches,id',
            'role' => 'sometimes|in:admin,branch_manager,cashier,accountant',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $data = $validator->validated();
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return $this->success($user->load('branch'), 'تم تحديث المستخدم بنجاح');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return $this->error('لا يمكنك حذف حسابك', 400);
        }

        $user->delete();

        return $this->success(null, 'تم حذف المستخدم بنجاح');
    }
}
