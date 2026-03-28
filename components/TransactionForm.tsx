import { useEffect, useState } from "react";
import type { Account, Transaction } from "@/types";
import { suggestCategory } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  accounts: Account[];
  initial?: Partial<Transaction> | null;
  onSubmit: (values: {
    accountId: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    notes: string;
    date: string;
  }) => void;
  submitLabel?: string;
};

export function TransactionForm({ accounts, initial, onSubmit, submitLabel = "Save" }: Props) {
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { pushToast } = useToast();

  useEffect(() => {
    if (initial) {
      const aid =
        typeof initial.accountId === "object" && initial.accountId
          ? (initial.accountId as Account)._id
          : (initial.accountId as string) || "";
      setAccountId(aid);
      setType((initial.type as "income" | "expense") || "expense");
      setCategory(initial.category || "");
      setAmount(initial.amount != null ? String(initial.amount) : "");
      setNotes(initial.notes || "");
      setDate(
        initial.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
      );
    }
  }, [initial]);

  useEffect(() => {
    if (!initial && notes.length > 2) {
      setCategory(suggestCategory(type, notes));
    }
  }, [notes, type, initial]);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!accountId) {
          pushToast({
            type: "error",
            title: "Account required",
            message: "Please select an account.",
            durationMs: 3500,
          });
          return;
        }
        if (Number.isNaN(amt) || amt < 0) {
          pushToast({
            type: "error",
            title: "Invalid amount",
            message: "Amount must be a valid number (0 or more).",
            durationMs: 4000,
          });
          return;
        }
        const dt = new Date(date);
        if (Number.isNaN(dt.getTime())) {
          pushToast({
            type: "error",
            title: "Invalid date",
            message: "Please choose a valid transaction date.",
            durationMs: 3500,
          });
          return;
        }
        onSubmit({
          accountId,
          type,
          category: category || suggestCategory(type, notes),
          amount: amt,
          notes,
          date: dt.toISOString(),
        });
      }}
    >
      <label className="block text-xs text-slate-400">
        Account
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
        >
          <option value="">Select…</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} ({a.type})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-slate-400">
        Type
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={type}
          onChange={(e) => setType(e.target.value as "income" | "expense")}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </label>
      <label className="block text-xs text-slate-400">
        Category
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Utilities"
        />
      </label>
      <label className="block text-xs text-slate-400">
        Amount
        <input
          type="number"
          step="0.01"
          min="0"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </label>
      <label className="block text-xs text-slate-400">
        Date
        <input
          type="date"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label className="block text-xs text-slate-400">
        Notes
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
      >
        {submitLabel}
      </button>
    </form>
  );
}
