import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Supplier, Branch } from '../../types';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const emptySupplier = {
  name: '',
  phone: '',
  email: '',
  vat_number: '',
  address: '',
  branch_id: '',
};

const SupplierList: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptySupplier);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    if (isAdmin) fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || res.data);
    } catch { /* ignore */ }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/suppliers', { params });
      setSuppliers(res.data.data || res.data);
    } catch {
      toast.error('فشل في تحميل الموردين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSuppliers(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptySupplier);
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      vat_number: s.vat_number || '',
      address: s.address || '',
      branch_id: s.branch_id ? String(s.branch_id) : '',
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, branch_id: form.branch_id ? Number(form.branch_id) : undefined };
      if (editId) {
        await api.put(`/suppliers/${editId}`, payload);
        toast.success('تم تحديث المورد بنجاح');
      } else {
        await api.post('/suppliers', payload);
        toast.success('تم إضافة المورد بنجاح');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">الموردين</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          إضافة مورد
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">لا يوجد موردين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium">الهاتف</th>
                  <th className="px-4 py-3 text-right font-medium">البريد</th>
                  <th className="px-4 py-3 text-right font-medium">الرقم الضريبي</th>
                  <th className="px-4 py-3 text-right font-medium">العنوان</th>
                  {isAdmin && <th className="px-4 py-3 text-right font-medium">الفرع</th>}
                  <th className="px-4 py-3 text-right font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{supplier.name}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.vat_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{supplier.address || '-'}</td>
                    {isAdmin && <td className="px-4 py-3 text-gray-600">{supplier.branch?.name || '-'}</td>}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(supplier)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editId ? 'تعديل المورد' : 'إضافة مورد جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
                <input type="text" name="vat_number" value={form.vat_number} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفرع *</label>
                  <select value={form.branch_id}
                    onChange={e => setForm(prev => ({ ...prev, branch_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">-- اختر الفرع --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">إلغاء</button>
                <button type="submit" disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;
