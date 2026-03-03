<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SystemController;

/*
|--------------------------------------------------------------------------
| API Routes - KarajaERP
|--------------------------------------------------------------------------
*/

// Auth Routes (Public)
Route::prefix('v1')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    // Protected Routes
    Route::middleware('auth:api')->group(function () {
        // Auth
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('change-password', [AuthController::class, 'changePassword']);

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Branches (Admin only for CUD)
        Route::get('branches', [BranchController::class, 'index']);
        Route::get('branches/{branch}', [BranchController::class, 'show']);
        Route::middleware('role:admin')->group(function () {
            Route::post('branches', [BranchController::class, 'store']);
            Route::put('branches/{branch}', [BranchController::class, 'update']);
            Route::delete('branches/{branch}', [BranchController::class, 'destroy']);
        });

        // Users (Admin & Branch Manager)
        Route::middleware('role:admin,branch_manager')->group(function () {
            Route::apiResource('users', UserController::class);
        });

        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Products
        Route::apiResource('products', ProductController::class);
        Route::get('products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
        Route::get('stock/low', [ProductController::class, 'lowStock']);
        Route::post('products/{product}/stock', [ProductController::class, 'updateStock']);

        // Customers
        Route::apiResource('customers', CustomerController::class);

        // Suppliers
        Route::apiResource('suppliers', SupplierController::class);

        // Sales
        Route::get('sales', [SaleController::class, 'index']);
        Route::post('sales', [SaleController::class, 'store']);
        Route::get('sales/{sale}', [SaleController::class, 'show']);
        Route::post('sales/{sale}/cancel', [SaleController::class, 'cancel']);
        Route::get('sales/today/summary', [SaleController::class, 'todaySales']);

        // Purchases
        Route::get('purchases', [PurchaseController::class, 'index']);
        Route::post('purchases', [PurchaseController::class, 'store']);
        Route::get('purchases/{purchase}', [PurchaseController::class, 'show']);

        // Expenses
        Route::apiResource('expenses', ExpenseController::class)->except(['show']);
        Route::get('expense-categories', [ExpenseController::class, 'categories']);
        Route::get('expenses/monthly-summary', [ExpenseController::class, 'monthlySummary']);

        // Transfers
        Route::get('transfers', [TransferController::class, 'index']);
        Route::post('transfers', [TransferController::class, 'store']);
        Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve']);
        Route::post('transfers/{transfer}/reject', [TransferController::class, 'reject']);

        // System Reset (Admin only)
        Route::post('system/reset', [SystemController::class, 'reset'])->middleware('role:admin');

        // Reports (Admin & Accountant)
        Route::prefix('reports')->middleware('role:admin,accountant,branch_manager')->group(function () {
            Route::get('sales', [ReportController::class, 'salesReport']);
            Route::get('profit-loss', [ReportController::class, 'profitLoss']);
            Route::get('vat', [ReportController::class, 'vatReport']);
            Route::get('trial-balance', [ReportController::class, 'trialBalance']);
        });
    });
});
