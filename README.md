# KarajaERP - نظام إدارة الأعمال

نظام ERP متكامل يدعم فرعين (جدة ومكة) مع نظام فواتير متوافق مع هيئة الزكاة والدخل (ZATCA Phase 2).

## المتطلبات

### Backend
- PHP >= 8.1
- Composer
- MySQL >= 5.7
- OpenSSL PHP Extension

### Frontend
- Node.js >= 18
- npm >= 9

## التثبيت

### 1. Backend (Laravel)

```bash
cd backend

# تثبيت الحزم
composer install

# نسخ ملف البيئة
cp .env.example .env

# توليد مفتاح التطبيق
php artisan key:generate

# توليد مفتاح JWT
php artisan jwt:secret

# إنشاء قاعدة البيانات
# قم بإنشاء قاعدة بيانات MySQL باسم: karajaerp
# ثم عدل ملف .env بإعدادات قاعدة البيانات

# تشغيل الهجرات
php artisan migrate

# تشغيل البيانات التجريبية
php artisan db:seed

# تشغيل السيرفر
php artisan serve
```

### 2. Frontend (React)

```bash
cd frontend

# تثبيت الحزم (مثبتة مسبقاً)
npm install

# تشغيل في وضع التطوير
npm run dev

# بناء للإنتاج
npm run build
```

## بيانات الدخول التجريبية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير عام | admin@karaja.com | password |
| مدير فرع جدة | jeddah@karaja.com | password |
| مدير فرع مكة | makkah@karaja.com | password |
| كاشير | cashier.jeddah@karaja.com | password |
| محاسب | accountant@karaja.com | password |

## الهيكل

```
karajaerp/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Models/            # 16 Model
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # 10 Controllers
│   │   │   └── Middleware/       # BranchScope, CheckRole
│   │   └── Services/            # ZATCA, Accounting
│   ├── database/
│   │   ├── migrations/        # 11 migrations
│   │   └── seeders/           # بيانات تجريبية
│   └── routes/api.php         # جميع الـ API routes
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/layout/ # Sidebar, DashboardLayout
│   │   ├── pages/             # 14 صفحة
│   │   ├── services/api.ts    # Axios instance
│   │   ├── store/             # Zustand auth store
│   │   ├── types/             # TypeScript types
│   │   └── i18n/              # ترجمات عربية
│   └── dist/                  # ملفات الإنتاج
│
└── README.md
```

## API Endpoints

### Auth
- `POST /api/v1/login` - تسجيل الدخول
- `GET /api/v1/me` - معلومات المستخدم
- `POST /api/v1/logout` - تسجيل الخروج

### Dashboard
- `GET /api/v1/dashboard` - لوحة التحكم

### Branches
- `GET /api/v1/branches` - قائمة الفروع
- `POST /api/v1/branches` - إضافة فرع
- `PUT /api/v1/branches/{id}` - تعديل فرع

### Users
- `GET /api/v1/users` - قائمة المستخدمين
- `POST /api/v1/users` - إضافة مستخدم
- `PUT /api/v1/users/{id}` - تعديل مستخدم

### Products
- `GET /api/v1/products` - قائمة المنتجات
- `POST /api/v1/products` - إضافة منتج
- `GET /api/v1/products/barcode/{barcode}` - بحث بالباركود
- `GET /api/v1/stock/low` - تنبيه نقص مخزون

### Sales
- `GET /api/v1/sales` - قائمة المبيعات
- `POST /api/v1/sales` - إنشاء فاتورة
- `GET /api/v1/sales/{id}` - تفاصيل فاتورة
- `POST /api/v1/sales/{id}/cancel` - إلغاء فاتورة

### Expenses
- `GET /api/v1/expenses` - قائمة المصاريف
- `POST /api/v1/expenses` - إضافة مصروف
- `GET /api/v1/expense-categories` - تصنيفات المصاريف

### Transfers
- `GET /api/v1/transfers` - قائمة التحويلات
- `POST /api/v1/transfers` - إنشاء تحويل
- `POST /api/v1/transfers/{id}/approve` - اعتماد
- `POST /api/v1/transfers/{id}/reject` - رفض

### Reports
- `GET /api/v1/reports/sales` - تقرير المبيعات
- `GET /api/v1/reports/profit-loss` - أرباح وخسائر
- `GET /api/v1/reports/vat` - تقرير الضريبة
- `GET /api/v1/reports/trial-balance` - ميزان المراجعة

## الصلاحيات

| الدور | الصلاحيات |
|-------|----------|
| مدير عام (admin) | جميع الفروع والوظائف |
| مدير فرع (branch_manager) | فرعه فقط + المستخدمين + التقارير |
| كاشير (cashier) | البيع والمنتجات والعملاء |
| محاسب (accountant) | التقارير والمصاريف فقط |
