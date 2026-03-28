import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { IncomeExpenseBar } from "@/components/Charts";
import { DataTable } from "@/components/Tables";
import { Modal } from "@/components/Modal";
import { TransactionForm } from "@/components/TransactionForm";
import { InvoiceForm } from "@/components/InvoiceForm";
import {
  accountsApi,
  billsApi,
  customersApi,
  invoicesApi,
  reportsApi,
  suppliersApi,
  transactionsApi,
} from "@/services/api";
import type { Account, Customer, MonthlyPoint, ReportSummary, Supplier, Transaction } from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";

export default function DashboardPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currency, setCurrency] = useState("USD");

  const [txOpen, setTxOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const { pushToast } = useToast();

  const load = useCallback(async () => {
    const [s, m, t, a, c, sup] = await Promise.all([
      reportsApi.summary(),
      reportsApi.monthly(),
      transactionsApi.list(),
      accountsApi.list(),
      customersApi.list(),
      suppliersApi.list(),
    ]);
    setSummary(s.data);
    setMonthly(m.data);
    setRecent(t.data.slice(0, 8));
    setAccounts(a.data);
    setCustomers(c.data);
    setSuppliers(sup.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const cur = localStorage.getItem("company_currency");
    if (cur) setCurrency(cur);
  }, []);

  const fmt = (n: number) => formatMoney(n, currency);

  return (
    <Protected>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">Overview and quick actions</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-xs uppercase text-slate-500">Income</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-400">
              {summary ? fmt(summary.income) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-xs uppercase text-slate-500">Expenses</div>
            <div className="mt-1 text-2xl font-semibold text-rose-400">
              {summary ? fmt(summary.expense) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-xs uppercase text-slate-500">Profit</div>
            <div className="mt-1 text-2xl font-semibold text-sky-400">
              {summary ? fmt(summary.profit) : "—"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-300">Monthly income vs expenses</h2>
            <IncomeExpenseBar data={monthly} />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-slate-300">Quick actions</h2>
            <button
              type="button"
              onClick={() => setTxOpen(true)}
              className="rounded-lg bg-slate-800 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
            >
              + Add transaction
            </button>
            <button
              type="button"
              onClick={() => setInvOpen(true)}
              className="rounded-lg bg-slate-800 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
            >
              + Add invoice
            </button>
            <button
              type="button"
              onClick={() => setBillOpen(true)}
              className="rounded-lg bg-slate-800 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
            >
              + Add bill
            </button>
            <div className="mt-auto space-y-2 border-t border-slate-800 pt-3 text-sm">
              <Link href="/transactions" className="block text-sky-400 hover:underline">
                All transactions →
              </Link>
              <Link href="/invoices" className="block text-sky-400 hover:underline">
                Invoices →
              </Link>
              <Link href="/bills" className="block text-sky-400 hover:underline">
                Bills →
              </Link>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Recent transactions</h2>
          <DataTable<Transaction>
            rows={recent}
            rowKey={(r) => r._id}
            empty="No transactions yet"
            columns={[
              { key: "date", header: "Date", render: (r) => formatDate(r.date) },
              {
                key: "accountId",
                header: "Account",
                render: (r) =>
                  typeof r.accountId === "object" && r.accountId ? r.accountId.name : "—",
              },
              { key: "type", header: "Type" },
              { key: "category", header: "Category" },
              {
                key: "amount",
                header: "Amount",
                render: (r) => (
                  <span className={r.type === "income" ? "text-emerald-400" : "text-rose-400"}>
                    {r.type === "expense" ? "-" : "+"}
                    {fmt(r.amount)}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Modal open={txOpen} title="Add transaction" onClose={() => setTxOpen(false)}>
        <TransactionForm
          accounts={accounts}
          onSubmit={async (v) => {
            try {
              await transactionsApi.create(v);
              setTxOpen(false);
              await load();
            } catch {
              pushToast({
                type: "error",
                title: "Save failed",
                message: "Could not save this transaction.",
                durationMs: 4500,
              });
            }
          }}
        />
      </Modal>

      <Modal open={invOpen} title="Add invoice" onClose={() => setInvOpen(false)} wide>
        <InvoiceForm
          mode="invoice"
          customers={customers}
          onSubmit={async (v) => {
            try {
              await invoicesApi.create({
                number: v.number,
                customerId: v.partyId || undefined,
                customerName: v.partyName,
                date: v.date,
                status: v.status,
                items: v.items,
                notes: v.notes,
              });
              setInvOpen(false);
              await load();
            } catch {
              pushToast({
                type: "error",
                title: "Save failed",
                message: "Could not save this invoice.",
                durationMs: 4500,
              });
            }
          }}
        />
      </Modal>

      <Modal open={billOpen} title="Add bill" onClose={() => setBillOpen(false)} wide>
        <InvoiceForm
          mode="bill"
          suppliers={suppliers}
          onSubmit={async (v) => {
            try {
              await billsApi.create({
                number: v.number,
                supplierId: v.partyId || undefined,
                supplierName: v.partyName,
                date: v.date,
                status: v.status,
                items: v.items,
                notes: v.notes,
              });
              setBillOpen(false);
              await load();
            } catch {
              pushToast({
                type: "error",
                title: "Save failed",
                message: "Could not save this bill.",
                durationMs: 4500,
              });
            }
          }}
        />
      </Modal>
    </Protected>
  );
}
