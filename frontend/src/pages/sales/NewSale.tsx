import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type { Product, Customer, Branch, CartItem } from '../../types';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi';

export default function NewSale() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number>(user?.branch_id || 0);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [invoiceType, setInvoiceType] = useState<'simplified' | 'standard'>('simplified');
  const [hasCustomer, setHasCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/branches').then((res) => setBranches(res.data.data));
    }
    api.get('/customers').then((res) => setCustomers(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      api.get('/products', { params: { branch_id: selectedBranch } })
        .then((res) => setProducts(res.data.data));
    }
  }, [selectedBranch]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      const taxAmount = (product.sale_price * product.tax_rate) / 100;
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: product.sale_price,
        discount: 0,
        tax_rate: product.tax_rate,
        tax_amount: taxAmount,
        total: product.sale_price + taxAmount,
      }]);
    }
    setShowProductSearch(false);
    setSearchQuery('');
    barcodeRef.current?.focus();
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty < 1) return;
    setCart(cart.map((item) => {
      if (item.product.id === productId) {
        const lineTotal = item.unit_price * qty - item.discount;
        const taxAmount = lineTotal * (item.tax_rate / 100);
        return { ...item, quantity: qty, tax_amount: taxAmount, total: lineTotal + taxAmount };
      }
      return item;
    }));
  };

  const updatePrice = (productId: number, price: number) => {
    setCart(cart.map((item) => {
      if (item.product.id === productId) {
        const lineTotal = price * item.quantity - item.discount;
        const taxAmount = lineTotal * (item.tax_rate / 100);
        return { ...item, unit_price: price, tax_amount: taxAmount, total: lineTotal + taxAmount };
      }
      return item;
    }));
  };

  const updateItemDiscount = (productId: number, disc: number) => {
    setCart(cart.map((item) => {
      if (item.product.id === productId) {
        const lineTotal = item.unit_price * item.quantity - disc;
        const taxAmount = lineTotal * (item.tax_rate / 100);
        return { ...item, discount: disc, tax_amount: taxAmount, total: lineTotal + taxAmount };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const handleBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      const product = products.find((p) => p.barcode === searchQuery);
      if (product) {
        addToCart(product);
      } else {
        toast.error('المنتج غير موجود');
      }
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity - item.discount), 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax_amount, 0);
  const grandTotal = subtotal + totalTax - discount;

  const handleSubmit = async () => {
    if (!selectedBranch) {
      toast.error('اختر الفرع');
      return;
    }
    if (cart.length === 0) {
      toast.error('أضف منتجات للفاتورة');
      return;
    }

    if (invoiceType === 'standard' && !selectedCustomer) {
      toast.error('الفاتورة الضريبية تتطلب تحديد عميل');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        branch_id: selectedBranch,
        customer_id: hasCustomer ? selectedCustomer : null,
        invoice_type: invoiceType,
        payment_method: paymentMethod,
        discount,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
        })),
      };

      const res = await api.post('/sales', payload);
      toast.success('تم إنشاء الفاتورة بنجاح');
      navigate(`/sales/${res.data.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.includes(searchQuery) ||
      p.barcode?.includes(searchQuery) ||
      p.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(val);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">فاتورة جديدة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Right: Cart */}
        <div className="lg:col-span-2 space-y-4">
          {/* Branch, Invoice Type & Customer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user?.role === 'admin' ? (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">الفرع</label>
                  <select value={selectedBranch} onChange={(e) => setSelectedBranch(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value={0}>اختر الفرع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">الفرع</label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg font-medium">{user?.branch?.name}</p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">طريقة الدفع</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="cash">نقدي</option>
                  <option value="card">بطاقة</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit">آجل</option>
                </select>
              </div>
            </div>

            {/* Invoice type toggle */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">نوع الفاتورة</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setInvoiceType('simplified'); setHasCustomer(false); setSelectedCustomer(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    invoiceType === 'simplified'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  مبسطة (B2C)
                </button>
                <button
                  type="button"
                  onClick={() => { setInvoiceType('standard'); setHasCustomer(true); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    invoiceType === 'standard'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ضريبية (B2B) — تتطلب عميل
                </button>
              </div>
            </div>

            {/* Customer — shown when standard invoice or manually toggled */}
            {(invoiceType === 'standard' || hasCustomer) && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  العميل {invoiceType === 'standard' && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={selectedCustomer || ''}
                  onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required={invoiceType === 'standard'}
                >
                  <option value="">اختر العميل</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* For simplified: optional customer toggle */}
            {invoiceType === 'simplified' && !hasCustomer && (
              <button
                type="button"
                onClick={() => setHasCustomer(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                + إضافة عميل (اختياري)
              </button>
            )}
          </div>

          {/* Barcode/Search Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  ref={barcodeRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowProductSearch(e.target.value.length > 0);
                  }}
                  onKeyDown={handleBarcode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                  placeholder="ادخل الباركود أو ابحث عن منتج..."
                  autoFocus
                />

                {/* Product search dropdown */}
                {showProductSearch && filteredProducts.length > 0 && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="w-full text-right px-4 py-3 hover:bg-blue-50 border-b border-gray-100 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.barcode}</p>
                        </div>
                        <p className="text-blue-600 font-bold">{formatCurrency(product.sale_price)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 py-12">لم يتم إضافة أصناف بعد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">الصنف</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 w-24">السعر</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 w-32">الكمية</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 w-20">خصم</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">الضريبة</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500">الإجمالي</th>
                      <th className="py-3 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product.id} className="border-t border-gray-100">
                        <td className="py-3 px-3">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-400">{item.product.barcode}</p>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updatePrice(item.product.id, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            dir="ltr"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 rounded bg-gray-200 hover:bg-gray-300">
                              <HiOutlineMinus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                              className="w-12 px-1 py-1 border border-gray-300 rounded text-sm text-center"
                              dir="ltr" min="1"
                            />
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1 rounded bg-gray-200 hover:bg-gray-300">
                              <HiOutlinePlus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItemDiscount(item.product.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            dir="ltr" min="0" step="0.01"
                          />
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs">
                          {formatCurrency(item.tax_amount)}
                        </td>
                        <td className="py-3 px-3 font-bold">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-3 px-3">
                          <button onClick={() => removeFromCart(item.product.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Left: Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 lg:sticky lg:top-20">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-200 pb-3">ملخص الفاتورة</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">المجموع الفرعي</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">الخصم</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  dir="ltr" min="0" step="0.01"
                />
              </div>

              <div className="flex justify-between text-gray-500">
                <span>الضريبة (15%)</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                <span>الإجمالي</span>
                <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'جاري الإنشاء...' : 'إتمام البيع'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
