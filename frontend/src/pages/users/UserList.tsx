import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Branch } from '../../types';
import toast from 'react-hot-toast';

const roleLabels: Record<string, string> = {
  admin: 'مدير النظام',
  branch_manager: 'مدير فرع',
  cashier: 'كاشير',
  accountant: 'محاسب',
};

const roleOptions = [
  { value: 'admin', label: 'مدير النظام' },
  { value: 'branch_manager', label: 'مدير فرع' },
  { value: 'cashier', label: 'كاشير' },
  { value: 'accountant', label: 'محاسب' },
];

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'cashier' as string,
  branch_id: '' as string | number,
  is_active: true,
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      setUsers(res.data.data || res.data);
    } catch {
      toast.error('فشل في تحميل المستخدمين');
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

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      branch_id: u.branch_id || '',
      is_active: u.is_active,
    });
    setShowModal(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteId}`);
      toast.success('تم حذف المستخدم بنجاح');
      setDeleteId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('الاسم والبريد مطلوبان');
      return;
    }
    if (!editId && !form.password) {
      toast.error('كلمة المرور مطلوبة');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;

      if (editId) {
        await api.put(`/users/${editId}`, payload);
        toast.success('تم تحديث المستخدم بنجاح');
      } else {
        await api.post('/users', payload);
        toast.success('تم إضافة المستخدم بنجاح');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          إضافة مستخدم
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
            placeholder="بحث بالاسم أو البريد..."
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
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">لا يوجد مستخدمين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium">البريد</th>
                  <th className="px-4 py-3 text-right font-medium">الدور</th>
                  <th className="px-4 py-3 text-right font-medium">الفرع</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.branch?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteId(user.id)}
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
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
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
                {editId ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور {editId ? '(اتركها فارغة لعدم التغيير)' : '*'}
                </label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required={!editId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدور *</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
                <select name="branch_id" value={form.branch_id} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">بدون فرع</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_active" checked={form.is_active}
                  onChange={handleChange} id="is_active" className="rounded" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">نشط</label>
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

export default UserList;
