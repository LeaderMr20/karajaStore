<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('category', 'branch', 'user');

        if (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        } elseif ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('month')) {
            $query->whereMonth('expense_date', $request->month);
        }

        if ($request->has('year')) {
            $query->whereYear('expense_date', $request->year);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->paginate($request->input('per_page', 20));

        return $this->success($expenses);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'expense_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $expense = Expense::create(array_merge(
            $validator->validated(),
            ['user_id' => auth()->id()]
        ));

        return $this->success($expense->load('category', 'branch'), 'تم إضافة المصروف بنجاح', 201);
    }

    public function update(Request $request, Expense $expense)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'sometimes|exists:expense_categories,id',
            'amount' => 'sometimes|numeric|min:0.01',
            'description' => 'nullable|string',
            'expense_date' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return $this->error('بيانات غير صالحة', 422, $validator->errors());
        }

        $expense->update($validator->validated());

        return $this->success($expense->load('category', 'branch'), 'تم تحديث المصروف بنجاح');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return $this->success(null, 'تم حذف المصروف بنجاح');
    }

    public function categories()
    {
        $categories = ExpenseCategory::where('is_active', true)->orderBy('name')->get();

        return $this->success($categories);
    }

    public function monthlySummary(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $month = $request->input('month', date('m'));

        $query = Expense::with('category')
            ->whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month);

        if (!$request->user()->isAdmin()) {
            $query->where('branch_id', $request->user()->branch_id);
        } elseif ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $summary = $query->selectRaw('
            category_id,
            SUM(amount) as total_amount,
            COUNT(*) as count
        ')->groupBy('category_id')->get();

        $total = $summary->sum('total_amount');

        return $this->success([
            'summary' => $summary,
            'total' => $total,
            'year' => $year,
            'month' => $month,
        ]);
    }
}
