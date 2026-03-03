import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Sale } from '../../types';
import toast from 'react-hot-toast';

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSales = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    api.get('/sales', { params })
      .then((res) => setSales(res.data.data.data || res.data.data))
      .catch(() => toast.error('خطأ في تحميل المبيعات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(val);

  const statusLabel: Record<string, { text: string; class: string }> = {
    completed: { text: 'مكتملة', class: 'bg-green-100 text-green-700' },
    cancelled: { text: 'ملغاة', class: 'bg-red-100 text-red-700' },
    draft: { text: 'مسودة', class: 'bg-gray-100 text-gray-700' },
    refunded: { text: 'مرتجعة', class: 'bg-orange-100 text-orange-700' },
  };

  const zatcaLabel: Record<string, { text: string; class: string }> = {
    cleared: { text: 'Cleared', class: 'bg-green-100 text-green-700' },
    reported: { text: 'Reported', class: 'bg-blue-100 text-blue-700' },
    pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
    error: { text: 'Error', class: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">المبيعات</h1>
        <Link
          to="/sales/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + فاتورة جديدة
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">من تاريخ</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">إلى تاريخ</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" dir="ltr" />
        </div>
        <button onClick={fetchSales}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium text-sm">
          بحث
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : sales.length === 0 ? (
          <p className="text-center text-gray-400 py-12">لا توجد مبيعات</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">رقم الفاتورة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الفرع</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">العميل</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الإجمالي</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الضريبة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">ZATCA</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">التاريخ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm" dir="ltr">{sale.invoice_number}</td>
                    <td className="py-3 px-4">{sale.branch?.name}</td>
                    <td className="py-3 px-4">{sale.customer?.name || 'عميل نقدي'}</td>
                    <td className="py-3 px-4 font-bold">{formatCurrency(sale.total)}</td>
                    <td className="py-3 px-4 text-gray-500">{formatCurrency(sale.tax_amount)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabel[sale.status]?.class}`}>
                        {statusLabel[sale.status]?.text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sale.zatca_status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${zatcaLabel[sale.zatca_status]?.class}`}>
                          {zatcaLabel[sale.zatca_status]?.text}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs" dir="ltr">
                      {new Date(sale.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/sales/${sale.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        عرض
                      </Link>
                    </td>
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
