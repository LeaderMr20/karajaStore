import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Branch, Product } from '../../types/index';
import toast from 'react-hot-toast';

interface AddItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

const InventoryReport: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addItems, setAddItems] = useState<AddItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      const list: Branch[] = res.data.data || res.data;
      setBranches(list);
      if (list.length > 0) setSelectedBranch(list[0].id);
    } catch {
      toast.error('فشل في تحميل الفروع');
    }
  };

  useEffect(() => {
    if (selectedBranch) fetchInventory();
  }, [selectedBranch]);

  const fetchInventory = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { branch_id: selectedBranch, per_page: 1000 } });
      setProducts(res.data.data || res.data);
    } catch {
      toast.error('فشل في تحميل المخزون');
    } finally {
      setLoading(false);
    }
  };

  const getQuantity = (product: Product): number => {
    if (!product.branch_stock || product.branch_stock.length === 0) return 0;
    return product.branch_stock.reduce((sum, bs) => sum + bs.quantity, 0);
  };

  const selectedBranchName = branches.find(b => b.id === Number(selectedBranch))?.name || '';
  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalQty = products.reduce((sum, p) => sum + getQuantity(p), 0);
  const totalCost = products.reduce((sum, p) => sum + getQuantity(p) * Number(p.purchase_price), 0);
  const lowStockCount = products.filter(p => getQuantity(p) <= p.min_stock_alert).length;

  // Add stock modal handlers
  const handleAddItemRow = () => {
    setAddItems(prev => [...prev, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setAddItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof AddItem, value: string | number) => {
    setAddItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleAddStock = async () => {
    if (!selectedBranch) return;
    const validItems = addItems.filter(i => i.product_id && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      toast.error('أضف منتجاً واحداً على الأقل');
      return;
    }
    setSaving(true);
    try {
      await api.post('/purchases', {
        branch_id: selectedBranch,
        items: validItems.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price) || 0,
        })),
      });
      toast.success('تم إضافة الأصناف للمستودع بنجاح');
      setShowAddModal(false);
      setAddItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في إضافة المخزون');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, aside, header { display: none !important; }
          .print-header { display: block !important; }
          body { background: white !important; }
          .print-table th, .print-table td { border: 1px solid #ccc; padding: 6px 10px; }
          .print-table { border-collapse: collapse; width: 100%; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 no-print">
        <h1 className="text-2xl font-bold text-gray-800">جرد المخزون</h1>
        <div className="flex gap-3">
          <button
            onClick={() => { setAddItems([{ product_id: '', quantity: 1, unit_price: 0 }]); setShowAddModal(true); }}
            disabled={!selectedBranch}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <span className="text-xl font-bold">+</span>
            إضافة أصناف
          </button>
          <button
            onClick={() => window.print()}
            disabled={!selectedBranch || products.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <span>🖨</span>
            طباعة PDF
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 no-print">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الفرع / المستودع</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">-- اختر فرعاً --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          {selectedBranch && !loading && products.length > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center">
                <div className="font-bold text-blue-700 text-lg">{products.length}</div>
                <div className="text-blue-600">إجمالي الأصناف</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
                <div className="font-bold text-green-700 text-lg">{totalQty}</div>
                <div className="text-green-600">إجمالي الكمية</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 text-center">
                <div className="font-bold text-purple-700 text-lg">{totalCost.toFixed(2)}</div>
                <div className="text-purple-600">تكلفة المخزون بالريال</div>
              </div>
              {lowStockCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
                  <div className="font-bold text-red-700 text-lg">{lowStockCount}</div>
                  <div className="text-red-600">منخفض المخزون</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Print-only Header */}
      <div className="print-header mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">كشف جرد المخزون</h1>
        <p className="text-lg mt-1">الفرع: {selectedBranchName}</p>
        <p className="text-sm text-gray-500 mt-1">التاريخ: {today}</p>
        <div className="flex justify-center gap-8 mt-3 text-sm font-medium">
          <span>إجمالي الأصناف: {products.length}</span>
          <span>إجمالي الكمية: {totalQty}</span>
          <span>إجمالي التكلفة: {totalCost.toFixed(2)} ر.س</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!selectedBranch ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🏪</div>
            <p className="text-lg">اختر فرعاً لعرض كشف المخزون</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-lg">لا توجد منتجات في هذا الفرع</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm print-table">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 text-right font-medium">اسم الصنف</th>
                  <th className="px-4 py-3 text-right font-medium">الباركود</th>
                  <th className="px-4 py-3 text-right font-medium">التصنيف</th>
                  <th className="px-4 py-3 text-right font-medium">الوحدة</th>
                  <th className="px-4 py-3 text-center font-medium">الكمية الحالية</th>
                  <th className="px-4 py-3 text-center font-medium">سعر الشراء</th>
                  <th className="px-4 py-3 text-center font-medium">إجمالي التكلفة</th>
                  <th className="px-4 py-3 text-center font-medium">الحد الأدنى</th>
                  <th className="px-4 py-3 text-center font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product, index) => {
                  const qty = getQuantity(product);
                  const isLow = qty <= product.min_stock_alert;
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 text-gray-500 text-center">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.barcode || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{product.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{product.unit}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-base ${isLow ? 'text-red-700' : 'text-gray-800'}`}>{qty}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{Number(product.purchase_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{(qty * Number(product.purchase_price)).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{product.min_stock_alert}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isLow ? 'منخفض' : 'جيد'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td colSpan={5} className="px-4 py-3 text-right text-gray-700">الإجمالي</td>
                  <td className="px-4 py-3 text-center text-gray-800 text-base">{totalQty}</td>
                  <td className="px-4 py-3 text-center text-gray-500">—</td>
                  <td className="px-4 py-3 text-center text-purple-700 text-base">{totalCost.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">إضافة أصناف للمستودع</h2>
                <p className="text-sm text-gray-500 mt-1">الفرع: {selectedBranchName}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-3">
              {/* Column labels */}
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
                <div className="col-span-6">المنتج</div>
                <div className="col-span-2 text-center">الكمية</div>
                <div className="col-span-3">سعر الشراء (ر.س)</div>
                <div className="col-span-1"></div>
              </div>

              {addItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <select
                      value={item.product_id}
                      onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر منتجاً...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (مخزون: {getQuantity(p)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.unit_price || ''}
                      onChange={e => handleItemChange(index, 'unit_price', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {addItems.length > 1 && (
                      <button
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-red-50"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddItemRow}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 mt-2"
              >
                <span className="text-lg font-bold">+</span>
                إضافة صنف آخر
              </button>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddStock}
                disabled={saving}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'جاري الإضافة...' : 'إضافة للمستودع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
