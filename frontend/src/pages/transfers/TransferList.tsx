import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Transfer, Branch, Product } from '../../types';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
  completed: 'مكتمل',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

interface TransferItemForm {
  product_id: string;
  quantity: string;
}

const TransferList: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form
  const [form, setForm] = useState({
    from_branch_id: '',
    to_branch_id: '',
    notes: '',
  });
  const [items, setItems] = useState<TransferItemForm[]>([{ product_id: '', quantity: '' }]);

  useEffect(() => {
    fetchTransfers();
    fetchBranches();
    fetchProducts();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transfers');
      const result = res.data.data;
      setTransfers(Array.isArray(result) ? result : result?.data || []);
    } catch {
      toast.error('فشل في تحميل التحويلات');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || res.data);
    } catch {
      // ignore
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data || res.data);
    } catch {
      // ignore
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/transfers/${id}/approve`);
      toast.success('تم اعتماد التحويل');
      fetchTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/transfers/${id}/reject`);
      toast.success('تم رفض التحويل');
      fetchTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, { product_id: '', quantity: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TransferItemForm, value: string) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from_branch_id || !form.to_branch_id) {
      toast.error('يرجى تحديد الفرع المرسل والمستقبل');
      return;
    }
    if (form.from_branch_id === form.to_branch_id) {
      toast.error('لا يمكن التحويل لنفس الفرع');
      return;
    }
    const validItems = items.filter(i => i.product_id && i.quantity);
    if (validItems.length === 0) {
      toast.error('يرجى إضافة منتج واحد على الأقل');
      return;
    }
    setSaving(true);
    try {
      await api.post('/transfers', {
        from_branch_id: Number(form.from_branch_id),
        to_branch_id: Number(form.to_branch_id),
        notes: form.notes,
        items: validItems.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
      });
      toast.success('تم إنشاء طلب التحويل بنجاح');
      setShowModal(false);
      setForm({ from_branch_id: '', to_branch_id: '', notes: '' });
      setItems([{ product_id: '', quantity: '' }]);
      fetchTransfers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">نقل المخزون</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          طلب تحويل جديد
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">لا توجد تحويلات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 text-right font-medium">من فرع</th>
                  <th className="px-4 py-3 text-right font-medium">إلى فرع</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transfers.map(transfer => (
                  <React.Fragment key={transfer.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{transfer.id}</td>
                      <td className="px-4 py-3 text-gray-600">{transfer.from_branch?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{transfer.to_branch?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[transfer.status] || ''}`}>
                          {statusLabels[transfer.status] || transfer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(transfer.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === transfer.id ? null : transfer.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          {expandedId === transfer.id ? 'إخفاء' : 'التفاصيل'}
                        </button>
                        {transfer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transfer.id)}
                              className="text-green-600 hover:text-green-800 font-medium text-xs"
                            >
                              اعتماد
                            </button>
                            <button
                              onClick={() => handleReject(transfer.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-xs"
                            >
                              رفض
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {expandedId === transfer.id && transfer.items && (
                      <tr>
                        <td colSpan={6} className="px-8 py-3 bg-gray-50">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="py-1 text-right">المنتج</th>
                                <th className="py-1 text-right">الكمية</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transfer.items.map((item, idx) => (
                                <tr key={idx} className="border-t border-gray-200">
                                  <td className="py-1">{item.product?.name || `منتج #${item.product_id}`}</td>
                                  <td className="py-1">{item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {transfer.notes && (
                            <p className="mt-2 text-xs text-gray-500">ملاحظات: {transfer.notes}</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">طلب تحويل جديد</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">من فرع *</label>
                  <select
                    value={form.from_branch_id}
                    onChange={e => setForm(prev => ({ ...prev, from_branch_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" required
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">إلى فرع *</label>
                  <select
                    value={form.to_branch_id}
                    onChange={e => setForm(prev => ({ ...prev, to_branch_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" required
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">المنتجات *</label>
                  <button type="button" onClick={addItem}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    + إضافة منتج
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.product_id}
                        onChange={e => updateItem(index, 'product_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">اختر المنتج</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                        placeholder="الكمية"
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        min="1"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 text-lg px-1">&times;</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'جاري الحفظ...' : 'إنشاء التحويل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferList;
