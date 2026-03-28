import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { DataTable } from "@/components/Tables";
import { Modal } from "@/components/Modal";
import { TransactionForm } from "@/components/TransactionForm";
import { accountsApi, transactionsApi } from "@/services/api";
import type { Account, Transaction } from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";

export default function TransactionsPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Transaction | null>(null);

  const [filterAccount, setFilterAccount] = useState("");
  const [filterType, setFilterType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    const params: Record<string, string | undefined> = {};
    if (filterAccount) params.accountId = filterAccount;
    if (filterType) params.type = filterType;
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    const [{ data: txs }, { data: accs }] = await Promise.all([
      transactionsApi.list(params),
      accountsApi.list(),
    ]);
    setRows(txs);
    setAccounts(accs);
  }, [filterAccount, filterType, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const cur = localStorage.getItem("company_currency");
    if (cur) setCurrency(cur);
  }, []);

  useEffect(() => {
    if (router.query.add === "1") {
      setEdit(null);
      setOpen(true);
      void router.replace("/transactions", undefined, { shallow: true });
    }
  }, [router]);

  const fmt = (n: number) => formatMoney(n, currency);

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-white">Transactions</h1>
            <p className="text-sm text-slate-400">Income and expenses by account</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add transaction
          </button>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <label className="text-xs text-slate-400">
            Account
            <select
              className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              <option value="">All</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Type
            <select
              className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            From
            <input
              type="date"
              className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            To
            <input
              type="date"
              className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-white"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>

        <DataTable<Transaction>
          rows={rows}
          rowKey={(r) => r._id}
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
                  {fmt(r.amount)}
                </span>
              ),
            },
            { key: "notes", header: "Notes", className: "max-w-[200px] truncate" },
            {
              key: "_id",
              header: "Actions",
              render: (r) => (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-sky-400 hover:underline"
                    onClick={() => {
                      setEdit(r);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-rose-400 hover:underline"
                    onClick={async () => {
                      if (!confirm("Delete this transaction?")) return;
                      try {
                        await transactionsApi.remove(r._id);
                        await load();
                      } catch {
                        pushToast({
                          type: "error",
                          title: "Delete failed",
                          message: "Could not delete this transaction.",
                          durationMs: 4000,
                        });
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        open={open}
        title={edit ? "Edit transaction" : "Add transaction"}
        onClose={() => setOpen(false)}
      >
        <TransactionForm
          accounts={accounts}
          initial={edit}
          submitLabel={edit ? "Update" : "Save"}
          onSubmit={async (v) => {
            try {
              if (edit) {
                await transactionsApi.update(edit._id, v);
              } else {
                await transactionsApi.create(v);
              }
              setOpen(false);
              setEdit(null);
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
    </Protected>
  );
}
