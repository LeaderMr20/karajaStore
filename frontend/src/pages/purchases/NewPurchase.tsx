import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Product, Supplier, Branch } from '../../types';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  total: number;
}

const NewPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSupplier, setHasSupplier] = useState(false);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    branch_id: user?.branch_id ? String(user.branch_id) : '',
    supplier_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    if (user?.role === 'admin') fetchBranches();
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products', { params: { per_page: 200 } });
      const result = res.data.data;
      setProducts(Array.isArray(result) ? result : result?.data || []);
    } catch {
      toast.error('فشل في تحميل المنتجات');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      const result = res.data.data;
      setSuppliers(Array.isArray(result) ? result : result?.data || []);
    } catch { /* ignore */ }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      const result = res.data.data;
      setBranches(Array.isArray(result) ? result : result?.data || []);
    } catch { /* ignore */ }
  };

  const filteredProducts = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
      )
    : [];

  const addProduct = (product: Product) => {
    setSearch('');
    setShowResults(false);
    const existing = cart.find(c => c.product.id === product.id);
    if (existing) {
      updateQty(product.id, existing.quantity + 1, existing.unit_price);
    } else {
      const unit_price = Number(product.purchase_price);
      const qty = 1;
      const lineTotal = unit_price * qty;
      const tax = lineTotal * (product.tax_rate / 100);
      setCart(prev => [...prev, {
        product,
        quantity: qty,
        unit_price,
        tax_amount: Math.round(tax * 100) / 100,
        total: Math.round((lineTotal + tax) * 100) / 100,
      }]);
    }
  };

  const updateQty = (productId: number, qty: number, price?: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const q = Math.max(1, qty);
      const p = price ?? item.unit_price;
      const lineTotal = p * q;
      const tax = lineTotal * (item.product.tax_rate / 100);
      return {
        ...item,
        quantity: q,
        unit_price: p,
        tax_amount: Math.round(tax * 100) / 100,
        total: Math.round((lineTotal + tax) * 100) / 100,
      };
    }));
  };

  const updatePrice = (productId: number, price: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const p = Math.max(0, price);
      const lineTotal = p * item.quantity;
      const tax = lineTotal * (item.product.tax_rate / 100);
      return {
        ...item,
        unit_price: p,
        tax_amount: Math.round(tax * 100) / 100,
        total: Math.round((lineTotal + tax) * 100) / 100,
      };
    }));
  };

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const subtotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);
  const taxTotal = cart.reduce((s, c) => s + c.tax_amount, 0);
  const total = cart.reduce((s, c) => s + c.total, 0);

  const handleSubmit = async () => {
    if (!form.branch_id) { toast.error('اختر الفرع'); return; }
    if (cart.length === 0) { toast.error('أضف منتجاً واحداً على الأقل'); return; }
    if (hasSupplier && !form.supplier_id) { toast.error('يرجى تحديد المورد'); return; }
    setLoading(true);
    try {
      const payload = {
        branch_id: Number(form.branch_id),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        notes: form.notes || null,
        items: cart.map(c => ({
          product_id: c.product.id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
      };
      const res = await api.post('/purchases', payload);
      toast.success('تم إنشاء فاتورة الشراء بنجاح');
      navigate(`/purchases/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">فاتورة شراء جديدة</h1>
        <button onClick={() => navigate('/purchases')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
          ← رجوع
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Product Search + Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product search */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتج</label>
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                placeholder="ابحث عن منتج بالاسم أو الباركود..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showResults && filteredProducts.length > 0 && (
                <div className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="w-full text-right px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex justify-between items-center">
                      <span className="font-medium text-gray-800 text-sm">{p.name}</span>
                      <span className="text-gray-500 text-xs">{Number(p.purchase_price).toFixed(2)} ر.س</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">📦</p>
                <p className="text-sm">لم تُضف أي منتجات بعد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="px-3 py-3 text-right font-medium">المنتج</th>
                      <th className="px-3 py-3 text-center font-medium w-28">الكمية</th>
                      <th className="px-3 py-3 text-center font-medium w-32">سعر الشراء</th>
                      <th className="px-3 py-3 text-center font-medium w-24">ضريبة</th>
                      <th className="px-3 py-3 text-center font-medium w-28">الإجمالي</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map(item => (
                      <tr key={item.product.id}>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.product.name}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="1" value={item.quantity}
                            onChange={e => updateQty(item.product.id, Number(e.target.value), item.unit_price)}
                            className="w-full text-center px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min="0" step="0.01" value={item.unit_price}
                            onChange={e => updatePrice(item.product.id, Number(e.target.value))}
                            className="w-full text-center px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-gray-500">
                          {item.tax_amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center font-medium text-gray-800">
                          {item.total.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => removeItem(item.product.id)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right — Settings + Summary */}
        <div className="space-y-4">
          {/* Branch & Supplier */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع *</label>
                <select value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">اختر الفرع</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {/* Supplier toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">هل للفاتورة مورد؟</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setHasSupplier(true); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    hasSupplier
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  نعم
                </button>
                <button
                  type="button"
                  onClick={() => { setHasSupplier(false); setForm(f => ({ ...f, supplier_id: '' })); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    !hasSupplier
                      ? 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  لا
                </button>
              </div>
              {hasSupplier && (
                <select
                  value={form.supplier_id}
                  onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">اختر المورد *</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>المجموع قبل الضريبة</span>
              <span>{subtotal.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>الضريبة</span>
              <span>{taxTotal.toFixed(2)} ر.س</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
              <span>الإجمالي</span>
              <span className="text-blue-600 text-lg">{total.toFixed(2)} ر.س</span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || cart.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ فاتورة الشراء'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPurchase;
