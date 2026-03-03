import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Branch } from '../../types';
import toast from 'react-hot-toast';

const emptyBranch = {
  name: '',
  name_en: '',
  location: '',
  phone: '',
  address: '',
  vat_number: '',
  cr_number: '',
};

const BranchList: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyBranch);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || res.data);
    } catch {
      toast.error('فشل في تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyBranch);
    setShowModal(true);
  };

  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({
      name: b.name,
      name_en: b.name_en || '',
      location: b.location,
      phone: b.phone || '',
      address: b.address || '',
      vat_number: b.vat_number || '',
      cr_number: b.cr_number || '',
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/branches/${deleteId}`);
      toast.success('تم حذف الفرع بنجاح');
      setDeleteId(null);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/branches/${editId}`, form);
        toast.success('تم تحديث الفرع بنجاح');
      } else {
        await api.post('/branches', form);
        toast.success('تم إضافة الفرع بنجاح');
      }
      setShowModal(false);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">إدارة الفروع</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          إضافة فرع
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">لا توجد فروع</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium">الموقع</th>
                  <th className="px-4 py-3 text-right font-medium">الهاتف</th>
                  <th className="px-4 py-3 text-right font-medium">عدد المستخدمين</th>
                  <th className="px-4 py-3 text-right font-medium">عدد المبيعات</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches.map(branch => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{branch.name}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.location}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.users_count ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{branch.sales_count ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {branch.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button
                        onClick={() => openEdit(branch)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteId(branch.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">تأكيد الحذف</h2>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editId ? 'تعديل الفرع' : 'إضافة فرع جديد'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم بالإنجليزية</label>
                <input type="text" name="name_en" value={form.name_en} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموقع *</label>
                <input type="text" name="location" value={form.location} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
                <input type="text" name="vat_number" value={form.vat_number} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السجل التجاري</label>
                <input type="text" name="cr_number" value={form.cr_number} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
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

export default BranchList;
