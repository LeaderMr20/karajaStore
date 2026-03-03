import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (confirmText !== 'RESET') {
      toast.error('اكتب RESET بالأحرف الكبيرة للتأكيد');
      return;
    }
    setResetting(true);
    try {
      const res = await api.post('/system/reset', { confirm: 'RESET' });
      toast.success(res.data.message || 'تم إعادة تهيئة النظام بنجاح');
      setShowResetModal(false);
      setConfirmText('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في إعادة التهيئة');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">الإعدادات</h1>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <h2 className="text-lg font-bold text-red-700">منطقة الخطر</h2>
          <p className="text-sm text-red-600 mt-1">هذه الإجراءات لا يمكن التراجع عنها. تأكد قبل المتابعة.</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-800">إعادة تهيئة النظام</h3>
              <p className="text-sm text-gray-500 mt-1">
                حذف جميع المعاملات (المبيعات، المشتريات، المصاريف، نقل المخزون) مع الاحتفاظ بـ:
                المستخدمين، الفروع، المنتجات، التصنيفات، المخزون، الموردين، العملاء.
              </p>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 font-medium whitespace-nowrap flex-shrink-0"
            >
              إعادة التهيئة
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Warning Header */}
            <div className="bg-red-600 text-white rounded-t-xl p-6 text-center">
              <div className="text-5xl mb-2">⚠️</div>
              <h2 className="text-xl font-bold">تحذير! إجراء لا يمكن التراجع عنه</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-medium">سيتم حذف البيانات التالية نهائياً:</p>
              <ul className="text-sm text-red-700 bg-red-50 rounded-lg p-4 space-y-1">
                <li>• جميع فواتير المبيعات وبنودها</li>
                <li>• جميع أوامر الشراء وبنودها</li>
                <li>• جميع المصاريف</li>
                <li>• جميع عمليات نقل المخزون</li>
                <li>• سجل حركات المخزون</li>
              </ul>

              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
                ✓ سيتم الاحتفاظ بـ: المستخدمين، الفروع، المنتجات، المخزون، الموردين، العملاء
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اكتب <span className="font-bold text-red-600 font-mono">RESET</span> للتأكيد:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="اكتب RESET هنا"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none font-mono text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => { setShowResetModal(false); setConfirmText(''); }}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleReset}
                disabled={resetting || confirmText !== 'RESET'}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {resetting ? 'جاري إعادة التهيئة...' : 'تأكيد الحذف النهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
