<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Expense;
use App\Models\Account;
use App\Models\JournalEntry;

class AccountingService
{
    /**
     * Create journal entry for a completed sale
     * Debit: Cash/Receivable
     * Credit: Sales Revenue + VAT Payable
     */
    public function recordSale(Sale $sale): JournalEntry
    {
        $cashAccount = Account::where('code', '1100')->first();    // Cash
        $bankAccount = Account::where('code', '1200')->first();    // Bank
        $receivableAccount = Account::where('code', '1300')->first(); // Receivable
        $revenueAccount = Account::where('code', '4100')->first(); // Sales Revenue
        $vatAccount = Account::where('code', '2200')->first();     // VAT Payable

        // Determine debit account based on payment method
        $debitAccount = match ($sale->payment_method) {
            'cash' => $cashAccount,
            'card', 'bank_transfer' => $bankAccount,
            'credit' => $receivableAccount,
            default => $cashAccount,
        };

        $entry = JournalEntry::create([
            'branch_id' => $sale->branch_id,
            'entry_date' => $sale->created_at->toDateString(),
            'description' => "فاتورة مبيعات رقم {$sale->invoice_number}",
            'reference_type' => 'sale',
            'reference_id' => $sale->id,
            'created_by' => $sale->user_id,
        ]);

        // Debit: Cash/Bank/Receivable (total amount)
        $entry->lines()->create([
            'account_id' => $debitAccount->id,
            'debit' => $sale->total,
            'credit' => 0,
            'description' => 'إجمالي الفاتورة',
        ]);

        // Credit: Sales Revenue (subtotal - discount)
        $entry->lines()->create([
            'account_id' => $revenueAccount->id,
            'debit' => 0,
            'credit' => $sale->subtotal - $sale->discount,
            'description' => 'إيراد المبيعات',
        ]);

        // Credit: VAT Payable (tax amount)
        if ($sale->tax_amount > 0) {
            $entry->lines()->create([
                'account_id' => $vatAccount->id,
                'debit' => 0,
                'credit' => $sale->tax_amount,
                'description' => 'ضريبة القيمة المضافة',
            ]);
        }

        return $entry;
    }

    /**
     * Create journal entry for a purchase
     * Debit: Inventory + Input VAT
     * Credit: Cash/Payable
     */
    public function recordPurchase(Purchase $purchase): JournalEntry
    {
        $inventoryAccount = Account::where('code', '1400')->first(); // Inventory
        $cashAccount = Account::where('code', '1100')->first();      // Cash
        $payableAccount = Account::where('code', '2100')->first();   // Accounts Payable
        $vatAccount = Account::where('code', '2200')->first();       // VAT (input)

        $entry = JournalEntry::create([
            'branch_id' => $purchase->branch_id,
            'entry_date' => $purchase->created_at->toDateString(),
            'description' => "فاتورة مشتريات رقم {$purchase->reference}",
            'reference_type' => 'purchase',
            'reference_id' => $purchase->id,
            'created_by' => $purchase->user_id,
        ]);

        // Debit: Inventory (subtotal)
        $entry->lines()->create([
            'account_id' => $inventoryAccount->id,
            'debit' => $purchase->subtotal,
            'credit' => 0,
            'description' => 'شراء بضاعة',
        ]);

        // Debit: Input VAT
        if ($purchase->tax_amount > 0) {
            $entry->lines()->create([
                'account_id' => $vatAccount->id,
                'debit' => $purchase->tax_amount,
                'credit' => 0,
                'description' => 'ضريبة مشتريات',
            ]);
        }

        // Credit: Cash or Payable
        $creditAccount = $purchase->status === 'received' ? $cashAccount : $payableAccount;
        $entry->lines()->create([
            'account_id' => $creditAccount->id,
            'debit' => 0,
            'credit' => $purchase->total,
            'description' => 'سداد المشتريات',
        ]);

        return $entry;
    }

    /**
     * Create journal entry for an expense
     * Debit: Expense Account
     * Credit: Cash
     */
    public function recordExpense(Expense $expense): JournalEntry
    {
        $cashAccount = Account::where('code', '1100')->first();
        $expenseAccount = Account::where('code', '5200')->first(); // Admin Expenses

        // Map expense categories to specific accounts
        $categoryAccountMap = [
            'إيجار' => '5300',
            'رواتب' => '5400',
        ];

        $categoryName = $expense->category->name ?? '';
        if (isset($categoryAccountMap[$categoryName])) {
            $mapped = Account::where('code', $categoryAccountMap[$categoryName])->first();
            if ($mapped) {
                $expenseAccount = $mapped;
            }
        }

        $entry = JournalEntry::create([
            'branch_id' => $expense->branch_id,
            'entry_date' => $expense->expense_date->toDateString(),
            'description' => "مصروف: " . ($expense->description ?? $expense->category->name ?? 'مصروف'),
            'reference_type' => 'expense',
            'reference_id' => $expense->id,
            'created_by' => $expense->user_id,
        ]);

        // Debit: Expense
        $entry->lines()->create([
            'account_id' => $expenseAccount->id,
            'debit' => $expense->amount,
            'credit' => 0,
            'description' => $expense->description ?? 'مصروف',
        ]);

        // Credit: Cash
        $entry->lines()->create([
            'account_id' => $cashAccount->id,
            'debit' => 0,
            'credit' => $expense->amount,
            'description' => 'سداد نقدي',
        ]);

        return $entry;
    }

    /**
     * Reverse journal entry for cancelled sale
     */
    public function reverseSale(Sale $sale): ?JournalEntry
    {
        $originalEntry = JournalEntry::where('reference_type', 'sale')
            ->where('reference_id', $sale->id)
            ->first();

        if (!$originalEntry) {
            return null;
        }

        $reversal = JournalEntry::create([
            'branch_id' => $sale->branch_id,
            'entry_date' => now()->toDateString(),
            'description' => "عكس فاتورة مبيعات رقم {$sale->invoice_number}",
            'reference_type' => 'sale_cancel',
            'reference_id' => $sale->id,
            'created_by' => auth()->id() ?? $sale->user_id,
        ]);

        // Reverse all lines
        foreach ($originalEntry->lines as $line) {
            $reversal->lines()->create([
                'account_id' => $line->account_id,
                'debit' => $line->credit,
                'credit' => $line->debit,
                'description' => 'عكس: ' . $line->description,
            ]);
        }

        return $reversal;
    }
}
