import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Product, Category } from '../../types';
import toast from 'react-hot-toast';
import ProductForm from './ProductForm';
import { useAuthStore } from '../../store/authStore';

const ProductList: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  // للأدمن: يختار الفرع. لغير الأدمن: مثبت على فرعه
  const [selectedBranch, setSelectedBranch] = useState<string>(
    isAdmin ? '' : (user?.branch_id ? String(user.branch_id) : '')
  );
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (isAdmin) fetchBranches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 400);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data || res.data);
    } catch { /* ignore */ }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (categoryFilter) params.category_id = categoryFilter;
      if (selectedBranch) params.branch_id = selectedBranch;
      const res = await api.get('/products', { params });
      setProducts(res.data.data || res.data);
    } catch {
      toast.error('فشل في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || res.data);
    } catch { /* ignore */ }
  };

  const openAdd = () => { setEditProduct(null); setShowModal(true); };
  const openEdit = (p: Product) => { setEditProduct(p); setShowModal(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('تم حذف المنتج بنجاح');
      setDeleteId(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في الحذف');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditProduct(null);
    fetchProducts();
  };

  // يعرض مخزون الفرع المحدد فقط، أو الإجمالي إذا لم يُحدد فرع
  const getStock = (product: Product) => {
    if (!product.branch_stock || product.branch_stock.length === 0) return 0;
    if (selectedBranch) {
      const branchId = Number(selectedBranch);
      const entry = product.branch_stock.find(bs => bs.branch_id === branchId);
      return entry?.quantity ?? 0;
    }
    return product.branch_stock.reduce((sum, bs) => sum + bs.quantity, 0);
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          إضافة منتج
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الباركود..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">الكل</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الفروع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium">الباركود</th>
                  <th className="px-4 py-3 text-right font-medium">التصنيف</th>
                  <th className="px-4 py-3 text-right font-medium">سعر البيع</th>
                  <th className="px-4 py-3 text-right font-medium">المخزون</th>
                  <th className="px-4 py-3 text-right font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600 ltr">{product.barcode || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(product.sale_price).toFixed(2)} ر.س</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStock(product) <= product.min_stock_alert
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {getStock(product)}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteId(product.id)}
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
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف هذا المنتج؟</p>
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

      {showModal && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default ProductList;
