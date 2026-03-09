import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Purchase } from '../../types';
import toast from 'react-hot-toast';

const PurchaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    try {
      const res = await api.get(`/purchases/${id}`);
      setPurchase(res.data.data);
    } catch {
      toast.error('فشل في تحميل الفاتورة');
      navigate('/purchases');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!purchase) return null;

  const branch = purchase.branch;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          #purchase-invoice, #purchase-invoice * { visibility: visible; }
          #purchase-invoice {
            position: absolute; top: 0; left: 0; right: 0;
            padding-top: 4cm; padding-bottom: 5cm;
            padding-left: 0.5cm; padding-right: 0.5cm;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print p-4 flex items-center gap-3 border-b bg-white">
        <button onClick={() => navigate('/purchases')}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
          ← رجوع
        </button>
        <button onClick={handlePrint}
          className="mr-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
          🖨️ طباعة
        </button>
      </div>

      {/* Invoice */}
      <div id="purchase-invoice" className="max-w-3xl mx-auto p-6" dir="rtl">
        {/* Header info (hidden in print — pre-printed on paper) */}
        <div className="print-hide-header mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">{branch?.name}</h1>
          {branch?.vat_number && (
            <p className="text-sm text-gray-500">الرقم الضريبي: {branch.vat_number}</p>
          )}
          {branch?.address && (
            <p className="text-sm text-gray-500">{branch.address}</p>
          )}
        </div>

        {/* Invoice title & meta */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 inline-block px-8">
            فاتورة شراء
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">رقم الفاتورة:</span>
              <span className="font-bold text-gray-800">{purchase.reference}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">التاريخ:</span>
              <span className="text-gray-800">
                {new Date(purchase.created_at).toLocaleDateString('en-US')}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">الوقت:</span>
              <span className="text-gray-800">
                {new Date(purchase.created_at).toLocaleTimeString('en-US')}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            {purchase.supplier && (
              <>
                <div className="flex gap-2">
                  <span className="font-medium text-gray-600 w-28">المورد:</span>
                  <span className="text-gray-800">{purchase.supplier.name}</span>
                </div>
                {purchase.supplier.phone && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-28">الهاتف:</span>
                    <span className="text-gray-800">{purchase.supplier.phone}</span>
                  </div>
                )}
                {purchase.supplier.vat_number && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-28">الرقم الضريبي:</span>
                    <span className="text-gray-800">{purchase.supplier.vat_number}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2">
              <span className="font-medium text-gray-600 w-28">الفرع:</span>
              <span className="text-gray-800">{branch?.name}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-right font-medium">#</th>
              <th className="border border-gray-300 px-3 py-2 text-right font-medium">المنتج</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-medium">الكمية</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-medium">سعر الوحدة</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-medium">ضريبة</th>
              <th className="border border-gray-300 px-3 py-2 text-center font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {(purchase.items || []).map((item, i) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-3 py-2 text-center text-gray-500">{i + 1}</td>
                <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">
                  {item.product?.name || `منتج #${item.product_id}`}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-200 px-3 py-2 text-center">
                  {Number(item.unit_price).toFixed(2)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-center text-gray-500">
                  {Number(item.tax_amount).toFixed(2)}
                </td>
                <td className="border border-gray-200 px-3 py-2 text-center font-medium">
                  {Number(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع قبل الضريبة</span>
              <span>{Number(purchase.subtotal).toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ضريبة القيمة المضافة</span>
              <span>{Number(purchase.tax_amount).toFixed(2)} ر.س</span>
            </div>
            <div className="border-t-2 border-gray-400 pt-2 flex justify-between font-bold text-gray-800 text-base">
              <span>الإجمالي</span>
              <span>{Number(purchase.total).toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {purchase.notes && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
            <span className="font-medium">ملاحظات: </span>{purchase.notes}
          </div>
        )}

        {/* Footer (hidden in print — pre-printed on paper) */}
        <div className="print-hide-footer mt-8 text-center text-xs text-gray-400 border-t pt-4">
          <p>KarajaERP — نظام إدارة الأعمال</p>
        </div>
      </div>
    </>
  );
};

export default PurchaseDetail;
