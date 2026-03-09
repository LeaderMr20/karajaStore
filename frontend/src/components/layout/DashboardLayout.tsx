import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import { HiOutlineMenuAlt3, HiOutlineBell } from 'react-icons/hi';

export default function DashboardLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Cairo, sans-serif', borderRadius: '10px' },
        }}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on desktop, respects RTL/LTR */}
      <div className={isRtl ? 'lg:mr-64' : 'lg:ml-64'}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="فتح القائمة"
          >
            <HiOutlineMenuAlt3 className="w-6 h-6 text-slate-600" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <h2 className="text-sm font-bold text-slate-700 hidden sm:block truncate max-w-[160px]">
              {user?.branch?.name || 'جميع الفروع'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 relative transition-colors" aria-label="الإشعارات">
              <HiOutlineBell className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block truncate max-w-[120px]">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
