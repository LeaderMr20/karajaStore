<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesReport(Request $request)
    {
        $query = Sale::with('branch', 'customer', 'user')
            ->where('status', 'completed');

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        } elseif (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        $summary = [
            'total_sales' => $sales->sum('total'),
            'total_tax' => $sales->sum('tax_amount'),
            'total_discount' => $sales->sum('discount'),
            'count' => $sales->count(),
        ];

        return $this->success([
            'sales' => $sales,
            'summary' => $summary,
        ]);
    }

    public function profitLoss(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('m'));

        $branchFilter = function ($q) use ($request) {
            if ($request->has('branch_id')) {
                $q->where('branch_id', $request->branch_id);
            } elseif (!$request->user()->isAdmin()) {
                $q->where('branch_id', $request->user()->branch_id);
            }
        };

        // Revenue
        $revenue = Sale::where('status', 'completed')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where($branchFilter)
            ->sum('subtotal');

        // Cost of goods (from purchase prices)
        $cogs = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.status', 'completed')
            ->whereYear('sales.created_at', $year)
            ->whereMonth('sales.created_at', $month)
            ->where($branchFilter)
            ->sum(DB::raw('sale_items.quantity * products.purchase_price'));

        // Expenses
        $expenses = Expense::whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->where($branchFilter)
            ->sum('amount');

        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $expenses;

        return $this->success([
            'period' => ['year' => $year, 'month' => $month],
            'revenue' => (float) $revenue,
            'cost_of_goods' => (float) $cogs,
            'gross_profit' => (float) $grossProfit,
            'expenses' => (float) $expenses,
            'net_profit' => (float) $netProfit,
        ]);
    }

    public function vatReport(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('m'));

        $branchFilter = function ($q) use ($request) {
            if ($request->has('branch_id')) {
                $q->where('branch_id', $request->branch_id);
            } elseif (!$request->user()->isAdmin()) {
                $q->where('branch_id', $request->user()->branch_id);
            }
        };

        $outputVat = Sale::where('status', 'completed')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where($branchFilter)
            ->sum('tax_amount');

        $inputVat = DB::table('purchase_items')
            ->join('purchases', 'purchases.id', '=', 'purchase_items.purchase_id')
            ->where('purchases.status', 'received')
            ->whereYear('purchases.created_at', $year)
            ->whereMonth('purchases.created_at', $month)
            ->where($branchFilter)
            ->sum('purchase_items.tax_amount');

        return $this->success([
            'period' => ['year' => $year, 'month' => $month],
            'output_vat' => (float) $outputVat,
            'input_vat' => (float) $inputVat,
            'net_vat' => (float) ($outputVat - $inputVat),
        ]);
    }

    public function trialBalance(Request $request)
    {
        $accounts = Account::where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(function ($account) use ($request) {
                $query = JournalEntryLine::where('account_id', $account->id);

                if ($request->has('branch_id')) {
                    $query->whereHas('journalEntry', function ($q) use ($request) {
                        $q->where('branch_id', $request->branch_id);
                    });
                }

                $debit = (float) $query->sum('debit');
                $credit = (float) (clone $query)->sum('credit');

                return [
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => in_array($account->type, ['asset', 'expense'])
                        ? $debit - $credit
                        : $credit - $debit,
                ];
            });

        return $this->success($accounts);
    }
}
