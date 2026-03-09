// ===== Base Types =====
export interface Branch {
  id: number;
  name: string;
  name_en?: string;
  location: string;
  phone?: string;
  address?: string;
  vat_number?: string;
  cr_number?: string;
  is_active: boolean;
  users_count?: number;
  sales_count?: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  branch_id: number | null;
  role: 'admin' | 'branch_manager' | 'cashier' | 'accountant';
  is_active: boolean;
  branch?: Branch;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  name_en?: string;
  parent_id: number | null;
  is_active: boolean;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  name_en?: string;
  barcode?: string;
  category_id: number | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  tax_rate: number;
  min_stock_alert: number;
  description?: string;
  is_active: boolean;
  category?: Category;
  branch_stock?: BranchStock[];
}

export interface BranchStock {
  id: number;
  branch_id: number;
  product_id: number;
  quantity: number;
  branch?: Branch;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  vat_number?: string;
  address?: string;
  branch_id: number | null;
  is_active: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  vat_number?: string;
  address?: string;
  branch_id: number | null;
  branch?: Branch;
  is_active: boolean;
}

export interface Sale {
  id: number;
  invoice_number: string;
  branch_id: number;
  customer_id: number | null;
  user_id: number;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  invoice_type: 'standard' | 'simplified';
  zatca_uuid?: string;
  zatca_status?: 'pending' | 'cleared' | 'reported' | 'error';
  notes?: string;
  branch?: Branch;
  customer?: Customer;
  user?: User;
  items?: SaleItem[];
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  product?: Product;
}

export interface Expense {
  id: number;
  branch_id: number;
  category_id: number;
  user_id: number;
  amount: number;
  description?: string;
  expense_date: string;
  branch?: Branch;
  category?: ExpenseCategory;
  user?: User;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  name_en?: string;
  is_active: boolean;
}

export interface Transfer {
  id: number;
  from_branch_id: number;
  to_branch_id: number;
  created_by: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  from_branch?: Branch;
  to_branch?: Branch;
  creator?: User;
  items?: TransferItem[];
  created_at: string;
}

export interface TransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  quantity: number;
  product?: Product;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ===== Dashboard Types =====
export interface DashboardData {
  today_sales: { count: number; total: number; tax: number };
  monthly_sales: number;
  monthly_expenses: number;
  net_profit: number;
  low_stock_count: number;
  top_products: { product_name: string; total_quantity: number; total_amount: number }[];
  branch_comparison: { branch_id: number; branch_name: string; sales: number; expenses: number; profit: number }[] | null;
  weekly_sales: { date: string; day: string; total: number; count: number }[];
}

// ===== Cart Types (for POS) =====
export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

// ===== Purchase Types =====
export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  total: number;
  product?: Product;
}

export interface Purchase {
  id: number;
  reference: string;
  branch_id: number;
  supplier_id: number | null;
  user_id: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'received' | 'pending' | 'cancelled';
  notes?: string;
  branch?: Branch;
  supplier?: Supplier;
  user?: User;
  items?: PurchaseItem[];
  created_at: string;
}

// ===== Auth Types =====
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}
