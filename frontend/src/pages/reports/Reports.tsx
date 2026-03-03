import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import type { Branch } from '../../types';

type TabKey = 'sales' | 'profit-loss' | 'vat' | 'trial-balance';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'sales', label: 'تقرير المبيعات' },
  { key: 'profit-loss', label: 'الأرباح والخسائر' },
  { key: 'vat', label: 'تقرير الضريبة' },
  { key: 'trial-balance', label: 'ميزان المراجعة' },
];

const Reports: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<TabKey>('sales');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');

  useEffect(() => {
    if (isAdmin) {
      api.get('/branches').then(res => setBranches(res.data.data || res.data)).catch(() => {});
    }
  }, [isAdmin]);

  const fetchReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const params: any = { date_from: dateFrom, date_to: dateTo };
      if (isAdmin && selectedBranch) {
        params.branch_id = selectedBranch;
      } else if (!isAdmin && user?.branch_id) {
        params.branch_id = user.branch_id;
      }
      const res = await api.get(`/reports/${activeTab}`, { params });
      setData(res.data.data || res.data);
    } catch {
      toast.error('فشل في تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const renderSalesReport = () => {
    if (!data) return null;
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="إجمالي المبيعات" value={data.total_sales} />
          <SummaryCard label="عدد الفواتير" value={data.total_invoices} isCurrency={false} />
          <SummaryCard label="إجمالي الضريبة" value={data.total_tax} />
          <SummaryCard label="متوسط قيمة الفاتورة" value={data.average_sale} />
        </div>

        {/* Sales by branch */}
        {data.by_branch && data.by_branch.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h3 className="px-4 py-3 font-bold text-gray-700 border-b">المبيعات حسب الفرع</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">الفرع</th>
                  <th className="px-4 py-3 text-right font-medium">عدد الفواتير</th>
                  <th className="px-4 py-3 text-right font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.by_branch.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{row.branch_name || row.name}</td>
                    <td className="px-4 py-3">{row.count || row.total_invoices}</td>
                    <td className="px-4 py-3">{Number(row.total || row.total_sales).toFixed(2)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Daily sales */}
        {data.daily && data.daily.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h3 className="px-4 py-3 font-bold text-gray-700 border-b">المبيعات اليومية</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium">عدد الفواتير</th>
                  <th className="px-4 py-3 text-right font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.daily.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.count}</td>
                    <td className="px-4 py-3">{Number(row.total).toFixed(2)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderProfitLoss = () => {
    if (!data) return null;
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">تقرير الأرباح والخسائر</h3>
          <div className="space-y-3">
            <ReportRow label="الإيرادات (المبيعات)" value={data.revenue || data.total_sales} positive />
            <ReportRow label="تكلفة البضاعة المباعة" value={data.cost_of_goods || data.cogs} negative />
            <div className="border-t pt-3">
              <ReportRow label="الربح الإجمالي" value={data.gross_profit} bold positive />
            </div>
            <ReportRow label="المصاريف التشغيلية" value={data.total_expenses || data.expenses} negative />
            <div className="border-t pt-3">
              <ReportRow
                label="صافي الربح"
                value={data.net_profit}
                bold
                positive={Number(data.net_profit) >= 0}
                negative={Number(data.net_profit) < 0}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVatReport = () => {
    if (!data) return null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="ضريبة المبيعات (المخرجات)" value={data.output_vat || data.sales_tax} />
          <SummaryCard label="ضريبة المشتريات (المدخلات)" value={data.input_vat || data.purchase_tax} />
          <SummaryCard label="صافي الضريبة المستحقة" value={data.net_vat || data.net_tax} />
        </div>

        {data.details && data.details.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h3 className="px-4 py-3 font-bold text-gray-700 border-b">التفاصيل</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-right font-medium">البيان</th>
                  <th className="px-4 py-3 text-right font-medium">المبلغ قبل الضريبة</th>
                  <th className="px-4 py-3 text-right font-medium">الضريبة</th>
                  <th className="px-4 py-3 text-right font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.details.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{row.label || row.description}</td>
                    <td className="px-4 py-3">{Number(row.subtotal || row.amount).toFixed(2)} ر.س</td>
                    <td className="px-4 py-3">{Number(row.tax).toFixed(2)} ر.س</td>
                    <td className="px-4 py-3">{Number(row.total).toFixed(2)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderTrialBalance = () => {
    if (!data) return null;
    const accounts = data.accounts || data;
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h3 className="px-4 py-3 font-bold text-gray-700 border-b">ميزان المراجعة</h3>
        {Array.isArray(accounts) && accounts.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 text-right font-medium">الحساب</th>
                <th className="px-4 py-3 text-right font-medium">مدين</th>
                <th className="px-4 py-3 text-right font-medium">دائن</th>
                <th className="px-4 py-3 text-right font-medium">الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.account_name || row.name}</td>
                  <td className="px-4 py-3">{Number(row.debit || 0).toFixed(2)} ر.س</td>
                  <td className="px-4 py-3">{Number(row.credit || 0).toFixed(2)} ر.س</td>
                  <td className="px-4 py-3 font-medium">{Number(row.balance || 0).toFixed(2)} ر.س</td>
                </tr>
              ))}
            </tbody>
            {data.totals && (
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="px-4 py-3">الإجمالي</td>
                  <td className="px-4 py-3">{Number(data.totals.debit || 0).toFixed(2)} ر.س</td>
                  <td className="px-4 py-3">{Number(data.totals.credit || 0).toFixed(2)} ر.س</td>
                  <td className="px-4 py-3">{Number(data.totals.balance || 0).toFixed(2)} ر.س</td>
                </tr>
              </tfoot>
            )}
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500">لا توجد بيانات</div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">اضغط على "عرض التقرير" لتحميل البيانات</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'sales': return renderSalesReport();
      case 'profit-loss': return renderProfitLoss();
      case 'vat': return renderVatReport();
      case 'trial-balance': return renderTrialBalance();
      default: return null;
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">التقارير</h1>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex overflow-x-auto border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setData(null); }}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 flex flex-wrap items-end gap-4">
          {/* Branch selector — admin only */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-2 border border-gray-300 rounded-lg min-w-[180px]"
              >
                <option value="">جميع الفروع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* Branch badge — branch_manager */}
          {!isAdmin && user?.branch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium min-w-[140px]">
                {user.branch.name}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : 'عرض التقرير'}
          </button>
        </div>
      </div>

      {/* Report Content */}
      {renderContent()}
    </div>
  );
};

// Helper components
const SummaryCard: React.FC<{ label: string; value: any; isCurrency?: boolean }> = ({ label, value, isCurrency = true }) => (
  <div className="bg-white rounded-xl shadow-sm p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-bold text-gray-800">
      {isCurrency ? `${Number(value || 0).toFixed(2)} ر.س` : (value ?? 0)}
    </p>
  </div>
);

const ReportRow: React.FC<{
  label: string;
  value: any;
  bold?: boolean;
  positive?: boolean;
  negative?: boolean;
}> = ({ label, value, bold, positive, negative }) => (
  <div className={`flex justify-between items-center ${bold ? 'font-bold text-lg' : ''}`}>
    <span className="text-gray-700">{label}</span>
    <span className={`${positive ? 'text-green-600' : ''} ${negative ? 'text-red-600' : ''}`}>
      {Number(value || 0).toFixed(2)} ر.س
    </span>
  </div>
);

export default Reports;
