<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\User;
use App\Models\ExpenseCategory;
use App\Models\Account;
use App\Models\Unit;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ===== Units =====
        foreach (['برميل', 'جالون', 'لتر', 'حبة'] as $i => $name) {
            Unit::create(['name' => $name, 'sort_order' => $i]);
        }

        // ===== Branches =====
        $jeddah = Branch::create([
            'name' => 'فرع جدة',
            'name_en' => 'Jeddah Branch',
            'location' => 'جدة',
            'phone' => '0126000000',
            'address' => 'جدة - حي الصفا',
            'vat_number' => '300000000000003',
            'cr_number' => '4030000000',
        ]);

        $makkah = Branch::create([
            'name' => 'فرع مكة',
            'name_en' => 'Makkah Branch',
            'location' => 'مكة المكرمة',
            'phone' => '0125000000',
            'address' => 'مكة المكرمة - حي العزيزية',
            'vat_number' => '300000000000003',
            'cr_number' => '4030000000',
        ]);

        // ===== Users =====
        User::create([
            'name' => 'مدير النظام',
            'email' => 'admin@karaja.com',
            'password' => '123456',
            'role' => 'admin',
            'branch_id' => null,
        ]);

        User::create([
            'name' => 'مدير فرع جدة',
            'email' => 'jeddah@karaja.com',
            'password' => '123456',
            'role' => 'branch_manager',
            'branch_id' => $jeddah->id,
        ]);

        User::create([
            'name' => 'مدير فرع مكة',
            'email' => 'makkah@karaja.com',
            'password' => '123456',
            'role' => 'branch_manager',
            'branch_id' => $makkah->id,
        ]);

        User::create([
            'name' => 'كاشير جدة',
            'email' => 'cashier.jeddah@karaja.com',
            'password' => '123456',
            'role' => 'cashier',
            'branch_id' => $jeddah->id,
        ]);

        User::create([
            'name' => 'محاسب',
            'email' => 'accountant@karaja.com',
            'password' => '123456',
            'role' => 'accountant',
            'branch_id' => null,
        ]);

        // ===== Expense Categories =====
        $expenseCategories = [
            ['name' => 'إيجار', 'name_en' => 'Rent'],
            ['name' => 'كهرباء', 'name_en' => 'Electricity'],
            ['name' => 'رواتب', 'name_en' => 'Salaries'],
            ['name' => 'نقل', 'name_en' => 'Transportation'],
            ['name' => 'صيانة', 'name_en' => 'Maintenance'],
            ['name' => 'مصروفات متنوعة', 'name_en' => 'Miscellaneous'],
        ];

        foreach ($expenseCategories as $cat) {
            ExpenseCategory::create($cat);
        }

        // ===== Chart of Accounts =====
        $accounts = [
            // Assets
            ['code' => '1000', 'name' => 'الأصول', 'name_en' => 'Assets', 'type' => 'asset'],
            ['code' => '1100', 'name' => 'النقدية', 'name_en' => 'Cash', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'البنك', 'name_en' => 'Bank', 'type' => 'asset'],
            ['code' => '1300', 'name' => 'ذمم مدينة', 'name_en' => 'Accounts Receivable', 'type' => 'asset'],
            ['code' => '1400', 'name' => 'المخزون', 'name_en' => 'Inventory', 'type' => 'asset'],
            // Liabilities
            ['code' => '2000', 'name' => 'الالتزامات', 'name_en' => 'Liabilities', 'type' => 'liability'],
            ['code' => '2100', 'name' => 'ذمم دائنة', 'name_en' => 'Accounts Payable', 'type' => 'liability'],
            ['code' => '2200', 'name' => 'ضريبة القيمة المضافة', 'name_en' => 'VAT Payable', 'type' => 'liability'],
            // Equity
            ['code' => '3000', 'name' => 'حقوق الملكية', 'name_en' => 'Equity', 'type' => 'equity'],
            ['code' => '3100', 'name' => 'رأس المال', 'name_en' => 'Capital', 'type' => 'equity'],
            // Revenue
            ['code' => '4000', 'name' => 'الإيرادات', 'name_en' => 'Revenue', 'type' => 'revenue'],
            ['code' => '4100', 'name' => 'إيرادات المبيعات', 'name_en' => 'Sales Revenue', 'type' => 'revenue'],
            // Expenses
            ['code' => '5000', 'name' => 'المصروفات', 'name_en' => 'Expenses', 'type' => 'expense'],
            ['code' => '5100', 'name' => 'تكلفة البضاعة المباعة', 'name_en' => 'COGS', 'type' => 'expense'],
            ['code' => '5200', 'name' => 'مصاريف إدارية', 'name_en' => 'Admin Expenses', 'type' => 'expense'],
            ['code' => '5300', 'name' => 'مصاريف إيجار', 'name_en' => 'Rent Expense', 'type' => 'expense'],
            ['code' => '5400', 'name' => 'مصاريف رواتب', 'name_en' => 'Salary Expense', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            Account::create($account);
        }

        // ===== Real Inventory =====
        $this->call(MuwaihBranchSeeder::class);
        $this->call(NouraBranchSeeder::class);
    }
}
