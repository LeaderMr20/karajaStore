<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemController extends Controller
{
    /**
     * Reset all transactional data.
     * Keeps: users, branches, products, categories, branch_stock, suppliers, customers, expense_categories
     * Deletes: sales, purchases, expenses, transfers, stock_movements
     */
    public function reset(Request $request)
    {
        // Only admin can reset
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'غير مصرح بهذا الإجراء'], 403);
        }

        // Require confirmation phrase
        $request->validate([
            'confirm' => 'required|string',
        ]);

        if ($request->confirm !== 'RESET') {
            return response()->json(['message' => 'كلمة التأكيد غير صحيحة'], 422);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Clear transactional tables
        DB::table('sale_items')->truncate();
        DB::table('sales')->truncate();
        DB::table('purchase_items')->truncate();
        DB::table('purchases')->truncate();
        DB::table('expenses')->truncate();
        DB::table('transfer_items')->truncate();
        DB::table('transfers')->truncate();
        DB::table('stock_movements')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return response()->json([
            'message' => 'تم إعادة تهيئة النظام بنجاح. تم الاحتفاظ بالمستخدمين والمخزون.',
        ]);
    }
}
