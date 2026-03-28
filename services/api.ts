import axios from "axios";
import type {
  Account,
  Bill,
  Company,
  Customer,
  Invoice,
  LineItem,
  MonthlyPoint,
  ReportSummary,
  Supplier,
  Transaction,
  User,
} from "@/types";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL });

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export const authApi = {
  register: (body: { email: string; password: string; name?: string }) =>
    api.post<{ token: string; user: User }>("/auth/register", body),
  login: (body: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>("/auth/login", body),
  me: () => api.get<{ user: User; company: Company | null }>("/auth/me"),
};

export const accountsApi = {
  list: () => api.get<Account[]>("/accounts"),
  create: (body: { name: string; type: string; openingBalance?: number }) =>
    api.post<Account>("/accounts", body),
  update: (id: string, body: Partial<{ name: string; type: string; openingBalance: number }>) =>
    api.put<Account>(`/accounts/${id}`, body),
  remove: (id: string) => api.delete(`/accounts/${id}`),
};

export const transactionsApi = {
  list: (params?: Record<string, string | undefined>) =>
    api.get<Transaction[]>("/transactions", { params }),
  create: (body: {
    accountId: string;
    type: string;
    category?: string;
    amount: number;
    notes?: string;
    date?: string;
  }) => api.post<Transaction>("/transactions", body),
  update: (
    id: string,
    body: Partial<{
      accountId: string;
      type: string;
      category: string;
      amount: number;
      notes: string;
      date: string;
    }>
  ) => api.put<Transaction>(`/transactions/${id}`, body),
  remove: (id: string) => api.delete(`/transactions/${id}`),
};

export const invoicesApi = {
  list: () => api.get<Invoice[]>("/invoices"),
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (body: {
    number: string;
    customerId?: string;
    customerName?: string;
    date?: string;
    status?: string;
    items?: LineItem[];
    notes?: string;
  }) => api.post<Invoice>("/invoices", body),
  update: (id: string, body: Partial<Record<string, unknown>>) =>
    api.put<Invoice>(`/invoices/${id}`, body),
  remove: (id: string) => api.delete(`/invoices/${id}`),
};

export const billsApi = {
  list: () => api.get<Bill[]>("/bills"),
  get: (id: string) => api.get<Bill>(`/bills/${id}`),
  create: (body: {
    number: string;
    supplierId?: string;
    supplierName?: string;
    date?: string;
    status?: string;
    items?: LineItem[];
    notes?: string;
  }) => api.post<Bill>("/bills", body),
  update: (id: string, body: Partial<Record<string, unknown>>) =>
    api.put<Bill>(`/bills/${id}`, body),
  remove: (id: string) => api.delete(`/bills/${id}`),
};

export const customersApi = {
  list: () => api.get<Customer[]>("/customers"),
  create: (body: { name: string; email?: string; phone?: string; address?: string }) =>
    api.post<Customer>("/customers", body),
  update: (id: string, body: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, body),
  remove: (id: string) => api.delete(`/customers/${id}`),
};

export const suppliersApi = {
  list: () => api.get<Supplier[]>("/suppliers"),
  create: (body: { name: string; email?: string; phone?: string; address?: string }) =>
    api.post<Supplier>("/suppliers", body),
  update: (id: string, body: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, body),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
};

export const reportsApi = {
  summary: (params?: Record<string, string | undefined>) =>
    api.get<ReportSummary>("/reports/summary", { params }),
  monthly: (params?: Record<string, string | undefined>) =>
    api.get<MonthlyPoint[]>("/reports/monthly", { params }),
  categories: (params?: Record<string, string | undefined>) =>
    api.get<{ name: string; value: number }[]>("/reports/categories", { params }),
  profitLoss: (params?: Record<string, string | undefined>) =>
    api.get<{
      revenue: { category: string; amount: number }[];
      expenses: { category: string; amount: number }[];
      totalIncome: number;
      totalExpense: number;
      net: number;
    }>("/reports/profit-loss", { params }),
  balanceSheet: () =>
    api.get<{
      accounts: { name: string; type: string; balance: number }[];
      totalAssets: number;
      totalLiabilities: number;
      equity: number;
    }>("/reports/balance-sheet"),
  cashFlow: (params?: Record<string, string | undefined>) =>
    api.get<{ operatingInflow: number; operatingOutflow: number; net: number }>(
      "/reports/cash-flow",
      { params }
    ),
  tax: (params?: Record<string, string | undefined>) =>
    api.get<{
      outputTax: number;
      inputTax: number;
      netTax: number;
      invoiceCount: number;
      billCount: number;
    }>("/reports/tax", { params }),
};

export const settingsApi = {
  getCompany: () => api.get<{ company: Company | null }>("/settings/company"),
  updateCompany: (body: Partial<Company>) => api.put<{ company: Company }>("/settings/company", body),
  listUsers: () => api.get<User[]>("/settings/users"),
  updateUserRole: (id: string, role: string) =>
    api.patch<User>(`/settings/users/${id}/role`, { role }),
  backupInfo: () => api.get<{ message: string; mongodumpExample: string }>("/settings/backup"),
};
