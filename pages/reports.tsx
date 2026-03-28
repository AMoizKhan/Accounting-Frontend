import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { Protected } from "@/components/Protected";
import { CategoryPie, IncomeExpenseLine } from "@/components/Charts";
import { reportsApi } from "@/services/api";
import type { MonthlyPoint } from "@/types";
import { formatMoney } from "@/utils/format";

type Tab = "pl" | "balance" | "cash" | "tax";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("pl");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currency, setCurrency] = useState("USD");

  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [cats, setCats] = useState<{ name: string; value: number }[]>([]);
  const [pl, setPl] = useState<{
    revenue: { category: string; amount: number }[];
    expenses: { category: string; amount: number }[];
    totalIncome: number;
    totalExpense: number;
    net: number;
  } | null>(null);
  const [balance, setBalance] = useState<{
    accounts: { name: string; type: string; balance: number }[];
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
  } | null>(null);
  const [cash, setCash] = useState<{ operatingInflow: number; operatingOutflow: number; net: number } | null>(
    null
  );
  const [tax, setTax] = useState<{
    outputTax: number;
    inputTax: number;
    netTax: number;
    invoiceCount: number;
    billCount: number;
  } | null>(null);

  const params = useCallback(() => {
    const p: Record<string, string | undefined> = {};
    if (from) p.from = new Date(from).toISOString();
    if (to) p.to = new Date(to).toISOString();
    return p;
  }, [from, to]);

  const load = useCallback(async () => {
    const p = params();
    const [m, c, plRes, bal, cf, tx] = await Promise.all([
      reportsApi.monthly(p),
      reportsApi.categories({ ...p, type: "expense" }),
      reportsApi.profitLoss(p),
      reportsApi.balanceSheet(),
      reportsApi.cashFlow(p),
      reportsApi.tax(p),
    ]);
    setMonthly(m.data);
    setCats(c.data);
    setPl(plRes.data);
    setBalance(bal.data);
    setCash(cf.data);
    setTax(tx.data);
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const cur = localStorage.getItem("company_currency");
    if (cur) setCurrency(cur);
  }, []);

  const fmt = (n: number) => formatMoney(n, currency);

  function exportCsv(name: string, rows: Record<string, string | number>[]) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const header = keys.join(",");
    const body = rows.map((r) => keys.map((k) => esc(r[k])).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const pdf = new jsPDF();
    let y = 14;
    pdf.setFontSize(14);
    pdf.text("Accounting report", 14, y);
    y += 8;
    pdf.setFontSize(10);
    if (from || to) {
      pdf.text(`Range: ${from || "…"} → ${to || "…"}`, 14, y);
      y += 6;
    }
    if (tab === "pl" && pl) {
      pdf.text(`Net: ${pl.net}`, 14, y);
      y += 6;
      pdf.text("Revenue", 14, y);
      y += 5;
      pl.revenue.forEach((r) => {
        pdf.text(`${r.category}: ${r.amount}`, 18, y);
        y += 5;
        if (y > 280) {
          pdf.addPage();
          y = 14;
        }
      });
      y += 4;
      pdf.text("Expenses", 14, y);
      y += 5;
      pl.expenses.forEach((r) => {
        pdf.text(`${r.category}: ${r.amount}`, 18, y);
        y += 5;
        if (y > 280) {
          pdf.addPage();
          y = 14;
        }
      });
    }
    if (tab === "balance" && balance) {
      pdf.text(`Equity: ${balance.equity}`, 14, y);
      y += 6;
      balance.accounts.forEach((a) => {
        pdf.text(`${a.name} (${a.type}): ${a.balance}`, 14, y);
        y += 5;
        if (y > 280) {
          pdf.addPage();
          y = 14;
        }
      });
    }
    if (tab === "cash" && cash) {
      pdf.text(`Inflow: ${cash.operatingInflow}`, 14, y);
      y += 5;
      pdf.text(`Outflow: ${cash.operatingOutflow}`, 14, y);
      y += 5;
      pdf.text(`Net: ${cash.net}`, 14, y);
    }
    if (tab === "tax" && tax) {
      pdf.text(`Output tax: ${tax.outputTax}`, 14, y);
      y += 5;
      pdf.text(`Input tax: ${tax.inputTax}`, 14, y);
      y += 5;
      pdf.text(`Net tax: ${tax.netTax}`, 14, y);
    }
    pdf.save(`report-${tab}.pdf`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "pl", label: "Profit & Loss" },
    { id: "balance", label: "Balance Sheet" },
    { id: "cash", label: "Cash Flow" },
    { id: "tax", label: "Tax" },
  ];

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-white">Reports</h1>
            <p className="text-sm text-slate-400">Filters, charts, and exports</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => {
                if (tab === "pl" && pl) {
                  exportCsv("profit-loss", [
                    ...pl.revenue.map((r) => ({ kind: "revenue", category: r.category, amount: r.amount })),
                    ...pl.expenses.map((r) => ({ kind: "expense", category: r.category, amount: r.amount })),
                  ]);
                } else if (tab === "balance" && balance) {
                  exportCsv(
                    "balance-sheet",
                    balance.accounts.map((a) => ({ name: a.name, type: a.type, balance: a.balance }))
                  );
                } else if (tab === "cash" && cash) {
                  exportCsv("cash-flow", [
                    { metric: "inflow", value: cash.operatingInflow },
                    { metric: "outflow", value: cash.operatingOutflow },
                    { metric: "net", value: cash.net },
                  ]);
                } else if (tab === "tax" && tax) {
                  exportCsv("tax", [
                    { metric: "outputTax", value: tax.outputTax },
                    { metric: "inputTax", value: tax.inputTax },
                    { metric: "netTax", value: tax.netTax },
                  ]);
                }
              }}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
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

        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === t.id ? "bg-sky-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-slate-300">Trend</h2>
            <IncomeExpenseLine data={monthly} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-slate-300">Expense categories</h2>
            <CategoryPie data={cats.length ? cats : [{ name: "None", value: 1 }]} />
          </div>
        </div>

        {tab === "pl" && pl && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold text-emerald-400">Revenue</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {pl.revenue.map((r) => (
                  <li key={r.category} className="flex justify-between">
                    <span>{r.category}</span>
                    <span>{fmt(r.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-slate-800 pt-2 text-sm font-medium text-white">
                Total {fmt(pl.totalIncome)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-sm font-semibold text-rose-400">Expenses</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {pl.expenses.map((r) => (
                  <li key={r.category} className="flex justify-between">
                    <span>{r.category}</span>
                    <span>{fmt(r.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 border-t border-slate-800 pt-2 text-sm font-medium text-white">
                Total {fmt(pl.totalExpense)}
              </p>
            </div>
            <div className="md:col-span-2 rounded-xl border border-sky-900/50 bg-sky-950/20 p-4 text-center text-lg font-semibold text-sky-300">
              Net {fmt(pl.net)}
            </div>
          </div>
        )}

        {tab === "balance" && balance && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-4 flex flex-wrap gap-6 text-sm">
              <span className="text-slate-400">
                Assets <span className="text-white">{fmt(balance.totalAssets)}</span>
              </span>
              <span className="text-slate-400">
                Liabilities <span className="text-white">{fmt(balance.totalLiabilities)}</span>
              </span>
              <span className="text-slate-400">
                Equity <span className="text-white">{fmt(balance.equity)}</span>
              </span>
            </div>
            <ul className="space-y-1 text-sm text-slate-300">
              {balance.accounts.map((a) => (
                <li key={a.name} className="flex justify-between">
                  <span>
                    {a.name} <span className="text-slate-500">({a.type})</span>
                  </span>
                  <span>{fmt(a.balance)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "cash" && cash && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-500">Operating inflow</div>
              <div className="mt-1 text-xl text-emerald-400">{fmt(cash.operatingInflow)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-500">Operating outflow</div>
              <div className="mt-1 text-xl text-rose-400">{fmt(cash.operatingOutflow)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-500">Net</div>
              <div className="mt-1 text-xl text-sky-400">{fmt(cash.net)}</div>
            </div>
          </div>
        )}

        {tab === "tax" && tax && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm text-slate-400">Output tax (invoices)</p>
              <p className="text-2xl text-white">{fmt(tax.outputTax)}</p>
              <p className="text-xs text-slate-500">{tax.invoiceCount} invoices</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm text-slate-400">Input tax (bills)</p>
              <p className="text-2xl text-white">{fmt(tax.inputTax)}</p>
              <p className="text-xs text-slate-500">{tax.billCount} bills</p>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
              <p className="text-sm text-slate-400">Net tax position</p>
              <p className="text-2xl font-semibold text-sky-300">{fmt(tax.netTax)}</p>
            </div>
          </div>
        )}
      </div>
    </Protected>
  );
}
