import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import SalesList from './pages/sales/SalesList';
import NewSale from './pages/sales/NewSale';
import SaleDetail from './pages/sales/SaleDetail';
import ProductList from './pages/products/ProductList';
import CustomerList from './pages/customers/CustomerList';
import SupplierList from './pages/suppliers/SupplierList';
import BranchList from './pages/branches/BranchList';
import UserList from './pages/users/UserList';
import ExpenseList from './pages/expenses/ExpenseList';
import PurchaseList from './pages/purchases/PurchaseList';
import NewPurchase from './pages/purchases/NewPurchase';
import PurchaseDetail from './pages/purchases/PurchaseDetail';
import TransferList from './pages/transfers/TransferList';
import Reports from './pages/reports/Reports';
import InventoryReport from './pages/inventory/InventoryReport';
import Settings from './pages/settings/Settings';
import './i18n';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Sales */}
          <Route path="/sales" element={<SalesList />} />
          <Route path="/sales/new" element={
            <ProtectedRoute roles={['admin', 'branch_manager', 'cashier']}>
              <NewSale />
            </ProtectedRoute>
          } />
          <Route path="/sales/:id" element={<SaleDetail />} />

          {/* Products */}
          <Route path="/products" element={<ProductList />} />

          {/* Customers */}
          <Route path="/customers" element={<CustomerList />} />

          {/* Suppliers */}
          <Route path="/suppliers" element={
            <ProtectedRoute roles={['admin', 'branch_manager']}>
              <SupplierList />
            </ProtectedRoute>
          } />

          {/* Purchases */}
          <Route path="/purchases" element={
            <ProtectedRoute roles={['admin', 'branch_manager']}>
              <PurchaseList />
            </ProtectedRoute>
          } />
          <Route path="/purchases/new" element={
            <ProtectedRoute roles={['admin', 'branch_manager']}>
              <NewPurchase />
            </ProtectedRoute>
          } />
          <Route path="/purchases/:id" element={
            <ProtectedRoute roles={['admin', 'branch_manager', 'accountant']}>
              <PurchaseDetail />
            </ProtectedRoute>
          } />

          {/* Expenses */}
          <Route path="/expenses" element={
            <ProtectedRoute roles={['admin', 'branch_manager', 'accountant']}>
              <ExpenseList />
            </ProtectedRoute>
          } />

          {/* Inventory Report */}
          <Route path="/inventory" element={
            <ProtectedRoute roles={['admin', 'branch_manager']}>
              <InventoryReport />
            </ProtectedRoute>
          } />

          {/* Transfers */}
          <Route path="/transfers" element={
            <ProtectedRoute roles={['admin', 'branch_manager']}>
              <TransferList />
            </ProtectedRoute>
          } />

          {/* Branches (Admin only) */}
          <Route path="/branches" element={
            <ProtectedRoute roles={['admin']}>
              <BranchList />
            </ProtectedRoute>
          } />

          {/* Users */}
          <Route path="/users" element={
            <ProtectedRoute roles={['admin', 'branch_manager']}>
              <UserList />
            </ProtectedRoute>
          } />

          {/* Reports */}
          <Route path="/reports" element={
            <ProtectedRoute roles={['admin', 'branch_manager', 'accountant']}>
              <Reports />
            </ProtectedRoute>
          } />

          {/* Settings (Admin only) */}
          <Route path="/settings" element={
            <ProtectedRoute roles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
