import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Product, Category, Branch } from '../../types';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSaved }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [units, setUnits] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockBranchId, setStockBranchId] = useState(
    !isAdmin && user?.branch_id ? String(user.branch_id) : ''
  );
  const [stockQuantity, setStockQuantity] = useState('');
  const [form, setForm] = useState({
    name: product?.name || '',
    barcode: product?.barcode || '',
    category_id: product?.category_id || '',
    unit: product?.unit || 'piece',
    purchase_price: product?.purchase_price || 0,
    sale_price: product?.sale_price || 0,
    tax_rate: product?.tax_rate ?? 15,
    min_stock_alert: product?.min_stock_alert || 0,
    description: product?.description || '',
  });

  useEffect(() => {
    fetchCategories();
    fetchBranches();
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const res = await api.get('/units');
      setUnits(res.data);
    } catch {
      // ignore
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || res.data);
    } catch {
      // ignore
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        purchase_price: Number(form.purchase_price),
        sale_price: Number(form.sale_price),
        tax_rate: Number(form.tax_rate),
        min_stock_alert: Number(form.min_stock_alert),
      };

      let productId: number;
      if (product) {
        await api.put(`/products/${product.id}`, payload);
        productId = product.id;
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const res = await api.post('/products', payload);
        productId = res.data.data.id;
        toast.success('تم إضافة المنتج بنجاح');
      }

      if (stockBranchId && stockQuantity !== '') {
        await api.post(`/products/${productId}/stock`, {
          branch_id: Number(stockBranchId),
          quantity: Number(stockQuantity),
        });
      }

      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">بدون تصنيف</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {units.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر الشراء</label>
              <input
                type="number"
                name="purchase_price"
                value={form.purchase_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
              <input
                type="number"
                name="sale_price"
                value={form.sale_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة (%)</label>
              <input
                type="number"
                name="tax_rate"
                value={form.tax_rate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حد التنبيه للمخزون</label>
              <input
                type="number"
                name="min_stock_alert"
                value={form.min_stock_alert}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          {/* Stock section */}
          <div className="col-span-2 border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">تحديث المخزون (اختياري)</p>
            <div className="grid grid-cols-2 gap-4">
              {isAdmin ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
                  <select
                    value={stockBranchId}
                    onChange={e => setStockBranchId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- اختر الفرع --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
                  <input
                    type="text"
                    value={user?.branch?.name || 'فرعك الحالي'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
