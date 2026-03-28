export type UserRole = "admin" | "accountant" | "staff";

export interface User {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  companyId?: string | null;
}

export interface Company {
  _id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  taxId?: string;
  country?: string;
  currency?: string;
  fbrApiKey?: string;
  backupNote?: string;
}

export type AccountType = "bank" | "cash" | "wallet";

export interface Account {
  _id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  balance: number;
}

export type TxType = "income" | "expense";

export interface Transaction {
  _id: string;
  accountId: Account | string;
  type: TxType;
  category: string;
  amount: number;
  notes: string;
  date: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  _id: string;
  number: string;
  customerId?: string | { name?: string } | null;
  customerName?: string;
  date: string;
  status: InvoiceStatus;
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
}

export type BillStatus = "draft" | "received" | "paid" | "overdue" | "cancelled";

export interface Bill {
  _id: string;
  number: string;
  supplierId?: string | { name?: string } | null;
  supplierName?: string;
  date: string;
  status: BillStatus;
  items: LineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  invoiceTotal?: number;
  invoiceCount?: number;
}

export interface Supplier {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  billTotal?: number;
  billCount?: number;
}

export interface ReportSummary {
  income: number;
  expense: number;
  profit: number;
  invoiceTotal: number;
  billTotal: number;
  totalBalance: number;
  transactionCount: number;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}
