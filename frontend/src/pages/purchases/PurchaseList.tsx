import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Purchase } from '../../types';
import toast from 'react-hot-toast';

const PurchaseList: React.FC = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchases');
      const result = res.data.data;
      setPurchases(Array.isArray(result) ? result : result?.data || []);
    } catch {
      toast.error('فشل في تحميل المشتريات');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, { text: string; className: string }> = {
    received: { text: 'مستلم', className: 'bg-green-100 text-green-700' },
    pending: { text: 'معلق', className: 'bg-yellow-100 text-yellow-700' },
    cancelled: { text: 'ملغي', className: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">فواتير المشتريات</h1>
        <button
          onClick={() => navigate('/purchases/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          فاتورة شراء جديدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg">لا توجد مشتريات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">رقم الفاتورة</th>
                  <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium">الفرع</th>
                  <th className="px-4 py-3 text-right font-medium">المورد</th>
                  <th className="px-4 py-3 text-right font-medium">المجموع</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map(p => {
                  const status = statusLabel[p.status] ?? { text: p.status, className: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-600">{p.reference}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(p.created_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.branch?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.supplier?.name || 'بدون مورد'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {Number(p.total).toFixed(2)} ر.س
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/purchases/${p.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseList;
