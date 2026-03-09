<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\BranchStock;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $branchId = $user->isAdmin() ? null : $user->branch_id;

        return $this->success([
            'today_sales' => $this->todaySales($branchId),
            'monthly_sales' => $this->monthlySales($branchId),
            'monthly_expenses' => $this->monthlyExpenses($branchId),
            'net_profit' => $this->netProfit($branchId),
            'low_stock_count' => $this->lowStockCount($branchId),
            'top_products' => $this->topProducts($branchId),
            'branch_comparison' => $user->isAdmin() ? $this->branchComparison() : null,
            'weekly_sales' => $this->weeklySales($branchId),
        ]);
    }

    private function todaySales(?int $branchId): array
    {
        $query = Sale::where('status', 'completed')
            ->whereDate('created_at', today());

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return [
            'count' => $query->count(),
            'total' => (float) $query->sum('total'),
            'tax' => (float) $query->sum('tax_amount'),
        ];
    }

    private function monthlySales(?int $branchId): float
    {
        $query = Sale::where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return (float) $query->sum('total');
    }

    private function monthlyExpenses(?int $branchId): float
    {
        $query = Expense::whereMonth('expense_date', now()->month)
            ->whereYear('expense_date', now()->year);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return (float) $query->sum('amount');
    }

    private function netProfit(?int $branchId): float
    {
        return $this->monthlySales($branchId) - $this->monthlyExpenses($branchId);
    }

    private function lowStockCount(?int $branchId): int
    {
        $query = BranchStock::whereHas('product', function ($q) {
            $q->where('is_active', true);
        })->whereRaw('quantity <= (SELECT min_stock_alert FROM products WHERE products.id = branch_stock.product_id)');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->count();
    }

    private function topProducts(?int $branchId, int $limit = 10): array
    {
        $query = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', 'completed')
            ->whereMonth('sales.created_at', now()->month)
            ->select(
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.total) as total_amount')
            );

        if ($branchId) {
            $query->where('sales.branch_id', $branchId);
        }

        return $query->groupBy('sale_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    private function branchComparison(): array
    {
        $branches = Branch::where('is_active', true)->get();
        $result = [];

        foreach ($branches as $branch) {
            $monthlySales = Sale::where('branch_id', $branch->id)
                ->where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->sum('total');

            $monthlyExpenses = Expense::where('branch_id', $branch->id)
                ->whereMonth('expense_date', now()->month)
                ->sum('amount');

            $result[] = [
                'branch_id' => $branch->id,
                'branch_name' => $branch->name,
                'sales' => (float) $monthlySales,
                'expenses' => (float) $monthlyExpenses,
                'profit' => (float) ($monthlySales - $monthlyExpenses),
            ];
        }

        return $result;
    }

    private function weeklySales(?int $branchId): array
    {
        $result = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);

            $query = Sale::where('status', 'completed')
                ->whereDate('created_at', $date);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $result[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->translatedFormat('l'),
                'total' => (float) $query->sum('total'),
                'count' => $query->count(),
            ];
        }

        return $result;
    }
}
