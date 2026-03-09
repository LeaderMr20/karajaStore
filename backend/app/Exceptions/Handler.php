<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    protected function unauthenticated($request, AuthenticationException $exception)
    {
        return response()->json([
            'success' => false,
            'message' => 'غير مصرح لك بالوصول',
        ], 401);
    }

    public function render($request, Throwable $exception)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            if ($exception instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'خطأ في البيانات المدخلة',
                    'errors' => $exception->errors(),
                ], 422);
            }

            if ($exception instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'العنصر غير موجود',
                ], 404);
            }

            if ($exception instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return response()->json([
                    'success' => false,
                    'message' => 'المسار غير موجود',
                ], 404);
            }

            if ($exception instanceof \Illuminate\Database\QueryException ||
                $exception instanceof \PDOException) {
                return response()->json([
                    'success' => false,
                    'message' => 'خطأ في الاتصال بقاعدة البيانات. تأكد من تشغيل MySQL.',
                ], 500);
            }

            $status = method_exists($exception, 'getStatusCode') ? $exception->getStatusCode() : 500;
            return response()->json([
                'success' => false,
                'message' => config('app.debug') ? $exception->getMessage() : 'حدث خطأ في الخادم',
            ], $status);
        }

        return parent::render($request, $exception);
    }
}
