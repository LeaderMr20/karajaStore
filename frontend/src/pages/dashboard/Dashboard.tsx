import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { DashboardData } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  HiOutlineCash, HiOutlineShoppingCart, HiOutlineTrendingUp,
  HiOutlineExclamation, HiOutlineChartBar,
} from 'react-icons/hi';

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-gray-500">حدث خطأ في تحميل البيانات</p>;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(val);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(data.today_sales.total)}
          subtitle={`${data.today_sales.count} فاتورة`}
          icon={HiOutlineShoppingCart}
          color="bg-blue-600"
        />
        <StatCard
          title="مبيعات الشهر"
          value={formatCurrency(data.monthly_sales)}
          icon={HiOutlineChartBar}
          color="bg-green-600"
        />
        <StatCard
          title="مصاريف الشهر"
          value={formatCurrency(data.monthly_expenses)}
          icon={HiOutlineCash}
          color="bg-orange-500"
        />
        <StatCard
          title="صافي الربح"
          value={formatCurrency(data.net_profit)}
          icon={HiOutlineTrendingUp}
          color={data.net_profit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}
        />
      </div>

      {/* Low stock alert */}
      {data.low_stock_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <HiOutlineExclamation className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">
            تنبيه: يوجد {data.low_stock_count} منتج تحت حد المخزون الأدنى
          </p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-bold mb-4">المبيعات الأسبوعية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.weekly_sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), 'المبيعات']}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Comparison */}
        {data.branch_comparison && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-bold mb-4">مقارنة الفروع</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.branch_comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch_name" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="sales" name="المبيعات" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصاريف" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="الربح" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-bold mb-4">أفضل المنتجات مبيعاً هذا الشهر</h3>
        {data.top_products.length === 0 ? (
          <p className="text-gray-400 text-center py-8">لا توجد مبيعات هذا الشهر</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-medium text-gray-500">#</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">المنتج</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الكمية المباعة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">إجمالي المبيعات</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{product.product_name}</td>
                    <td className="py-3 px-4">{product.total_quantity}</td>
                    <td className="py-3 px-4">{formatCurrency(product.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
