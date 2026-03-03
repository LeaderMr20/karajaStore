<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth()->attempt($credentials)) {
            return $this->error('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
        }

        $user = auth()->user();

        if (!$user->is_active) {
            auth()->logout();
            return $this->error('الحساب معطل، تواصل مع المدير', 403);
        }

        return $this->respondWithToken($token);
    }

    public function me()
    {
        $user = auth()->user()->load('branch');

        return $this->success($user);
    }

    public function logout()
    {
        auth()->logout();

        return $this->success(null, 'تم تسجيل الخروج بنجاح');
    }

    public function refresh()
    {
        return $this->respondWithToken(auth()->refresh());
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->error('كلمة المرور الحالية غير صحيحة', 400);
        }

        $user->update(['password' => $request->new_password]);

        return $this->success(null, 'تم تغيير كلمة المرور بنجاح');
    }

    protected function respondWithToken(string $token)
    {
        $user = auth()->user()->load('branch');

        return $this->success([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
        ], 'تم تسجيل الدخول بنجاح');
    }
}
