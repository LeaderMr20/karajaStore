import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">KarajaERP</h1>
          <p className="text-blue-200">نظام إدارة الأعمال</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">تسجيل الدخول</h2>
          <p className="text-gray-500 text-sm mb-6">أدخل بياناتك للمتابعة</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="admin@karaja.com"
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">بيانات تجريبية:</p>
            <div className="space-y-1 text-xs text-gray-600" dir="ltr">
              <p>Admin: admin@karaja.com / 123456</p>
              <p>Manager: jeddah@karaja.com / 123456</p>
              <p>Cashier: cashier.jeddah@karaja.com / 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
