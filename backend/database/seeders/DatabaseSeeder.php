<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\BranchStock;
use App\Models\ExpenseCategory;
use App\Models\Account;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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

        // ===== Categories =====
        $cat1 = Category::create(['name' => 'أجهزة إلكترونية', 'name_en' => 'Electronics']);
        $cat2 = Category::create(['name' => 'اكسسوارات', 'name_en' => 'Accessories']);
        $cat3 = Category::create(['name' => 'قطع غيار', 'name_en' => 'Spare Parts']);

        // ===== Products =====
        $products = [
            ['name' => 'شاشة سامسونج 55 بوصة', 'barcode' => '6901234567890', 'category_id' => $cat1->id, 'purchase_price' => 1500, 'sale_price' => 2200, 'min_stock_alert' => 3],
            ['name' => 'ثلاجة LG 18 قدم', 'barcode' => '6901234567891', 'category_id' => $cat1->id, 'purchase_price' => 2000, 'sale_price' => 2800, 'min_stock_alert' => 2],
            ['name' => 'غسالة بوش 8 كيلو', 'barcode' => '6901234567892', 'category_id' => $cat1->id, 'purchase_price' => 1800, 'sale_price' => 2500, 'min_stock_alert' => 2],
            ['name' => 'مكيف سبليت 18000', 'barcode' => '6901234567893', 'category_id' => $cat1->id, 'purchase_price' => 1200, 'sale_price' => 1800, 'min_stock_alert' => 5],
            ['name' => 'كيبل HDMI', 'barcode' => '6901234567894', 'category_id' => $cat2->id, 'purchase_price' => 15, 'sale_price' => 35, 'min_stock_alert' => 20],
            ['name' => 'حامل تلفزيون', 'barcode' => '6901234567895', 'category_id' => $cat2->id, 'purchase_price' => 50, 'sale_price' => 120, 'min_stock_alert' => 10],
            ['name' => 'ريموت تلفزيون', 'barcode' => '6901234567896', 'category_id' => $cat3->id, 'purchase_price' => 20, 'sale_price' => 50, 'min_stock_alert' => 15],
            ['name' => 'فلتر مكيف', 'barcode' => '6901234567897', 'category_id' => $cat3->id, 'purchase_price' => 25, 'sale_price' => 60, 'min_stock_alert' => 10],
        ];

        foreach ($products as $productData) {
            $product = Product::create($productData);

            // Add stock for both branches
            BranchStock::create([
                'branch_id' => $jeddah->id,
                'product_id' => $product->id,
                'quantity' => rand(5, 50),
            ]);

            BranchStock::create([
                'branch_id' => $makkah->id,
                'product_id' => $product->id,
                'quantity' => rand(5, 50),
            ]);
        }

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
    }
}
