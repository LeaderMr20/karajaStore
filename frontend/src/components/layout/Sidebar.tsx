import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { switchLanguage } from '../../i18n';
import {
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineShoppingCart,
  HiOutlineCash,
  HiOutlineSwitchHorizontal,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineTruck,
  HiOutlineTag,
  HiOutlineLogout,
  HiOutlineArchive,
  HiOutlineClipboardList,
  HiOutlineCog,
} from 'react-icons/hi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const menuItems = [
    { path: '/', icon: HiOutlineHome, label: t('nav.dashboard'), roles: ['admin', 'branch_manager', 'cashier', 'accountant'] },
    { path: '/sales/new', icon: HiOutlineShoppingCart, label: t('nav.newSale'), roles: ['admin', 'branch_manager', 'cashier'] },
    { path: '/sales', icon: HiOutlineTag, label: t('nav.sales'), roles: ['admin', 'branch_manager', 'cashier', 'accountant'] },
    { path: '/products', icon: HiOutlineCube, label: t('nav.products'), roles: ['admin', 'branch_manager', 'cashier'] },
    { path: '/customers', icon: HiOutlineUserGroup, label: t('nav.customers'), roles: ['admin', 'branch_manager', 'cashier'] },
    { path: '/suppliers', icon: HiOutlineTruck, label: t('nav.suppliers'), roles: ['admin', 'branch_manager'] },
    { path: '/purchases', icon: HiOutlineArchive, label: t('nav.purchases'), roles: ['admin', 'branch_manager'] },
    { path: '/expenses', icon: HiOutlineCash, label: t('nav.expenses'), roles: ['admin', 'branch_manager', 'accountant'] },
    { path: '/transfers', icon: HiOutlineSwitchHorizontal, label: t('nav.transfers'), roles: ['admin', 'branch_manager'] },
    { path: '/inventory', icon: HiOutlineClipboardList, label: 'جرد المخزون', roles: ['admin', 'branch_manager'] },
    { path: '/branches', icon: HiOutlineOfficeBuilding, label: t('nav.branches'), roles: ['admin'] },
    { path: '/users', icon: HiOutlineUsers, label: t('nav.users'), roles: ['admin', 'branch_manager'] },
    { path: '/reports', icon: HiOutlineChartBar, label: t('nav.reports'), roles: ['admin', 'branch_manager', 'accountant'] },
    { path: '/settings', icon: HiOutlineCog, label: 'الإعدادات', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const roleLabels: Record<string, string> = {
    admin: t('roles.admin'),
    branch_manager: t('roles.branch_manager'),
    cashier: t('roles.cashier'),
    accountant: t('roles.accountant'),
  };
  const roleLabel = user?.role ? roleLabels[user.role] ?? '' : '';

  const handleLangSwitch = () => {
    switchLanguage(isAr ? 'en' : 'ar');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 ${isAr ? 'right-0' : 'left-0'} z-50 h-full w-64 bg-slate-800 text-white transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen
            ? 'translate-x-0'
            : isAr
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-center">KarajaERP</h1>
          <p className="text-slate-400 text-sm text-center mt-1">
            {isAr ? 'نظام إدارة الأعمال' : 'Business Management System'}
          </p>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-slate-700">
          <p className="font-medium text-sm">{user?.name}</p>
          <p className="text-slate-400 text-xs mt-1">{roleLabel}</p>
          {user?.branch && (
            <p className="text-slate-400 text-xs">{user.branch.name}</p>
          )}
        </div>

        {/* Nav items */}
        <nav className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Language toggle + Logout */}
        <div className="absolute bottom-0 w-full p-3 border-t border-slate-700 space-y-1">
          {/* Language toggle */}
          <button
            onClick={handleLangSwitch}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors w-full"
          >
            <span className="text-lg">🌐</span>
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors w-full"
          >
            <HiOutlineLogout className="w-5 h-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
