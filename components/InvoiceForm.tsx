import { useMemo, useState, useEffect } from "react";
import type { Bill, Customer, Invoice, LineItem, Supplier } from "@/types";
import { useToast } from "@/contexts/ToastContext";

type Party = { _id: string; name: string };

type Props = {
  mode: "invoice" | "bill";
  customers?: Customer[];
  suppliers?: Supplier[];
  initial?: Partial<Invoice | Bill> | null;
  onSubmit: (values: {
    number: string;
    partyId: string;
    partyName: string;
    date: string;
    status: string;
    items: LineItem[];
    notes: string;
  }) => void;
  submitLabel?: string;
};

function emptyLine(): LineItem {
  return { description: "", quantity: 1, unitPrice: 0, taxRate: 0 };
}

function computeTotals(items: LineItem[]) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const row of items) {
    const line = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);
    subtotal += line;
    taxTotal += (line * (Number(row.taxRate) || 0)) / 100;
  }
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}

export function InvoiceForm({
  mode,
  customers = [],
  suppliers = [],
  initial,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  const { pushToast } = useToast();
  const parties: Party[] = useMemo(
    () =>
      mode === "invoice"
        ? customers.map((c) => ({ _id: c._id, name: c.name }))
        : suppliers.map((s) => ({ _id: s._id, name: s.name })),
    [mode, customers, suppliers]
  );

  const [number, setNumber] = useState("");
  const [partyId, setPartyId] = useState("");
  const [partyName, setPartyName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<LineItem[]>([emptyLine()]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!initial) return;
    setNumber(initial.number || "");
    const inv = initial as Invoice;
    const bill = initial as Bill;
    if (mode === "invoice") {
      const cid = typeof inv.customerId === "object" && inv.customerId && "_id" in inv.customerId
        ? (inv.customerId as { _id: string })._id
        : (inv.customerId as string) || "";
      setPartyId(cid || "");
      setPartyName(inv.customerName || "");
    } else {
      const sid =
        typeof bill.supplierId === "object" && bill.supplierId && "_id" in bill.supplierId
          ? (bill.supplierId as { _id: string })._id
          : (bill.supplierId as string) || "";
      setPartyId(sid || "");
      setPartyName(bill.supplierName || "");
    }
    setDate(
      initial.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
    setStatus(initial.status || "draft");
    setItems(initial.items?.length ? initial.items : [emptyLine()]);
    setNotes(initial.notes || "");
  }, [initial, mode]);

  const totals = computeTotals(items);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = number.trim();
        if (!trimmed) {
          pushToast({
            type: "error",
            title: "Document number required",
            message: "Please enter an invoice/bill number.",
            durationMs: 3500,
          });
          return;
        }
        if (!items.length) {
          pushToast({
            type: "error",
            title: "Missing line items",
            message: "Add at least one line item.",
            durationMs: 3500,
          });
          return;
        }

        for (let i = 0; i < items.length; i++) {
          const row = items[i];
          const qty = Number(row.quantity);
          const price = Number(row.unitPrice);
          const taxRate = Number(row.taxRate);
          if (Number.isNaN(qty) || qty < 0) {
            pushToast({
              type: "error",
              title: "Invalid quantity",
              message: `Line ${i + 1}: quantity must be 0 or more.`,
              durationMs: 4000,
            });
            return;
          }
          if (Number.isNaN(price) || price < 0) {
            pushToast({
              type: "error",
              title: "Invalid unit price",
              message: `Line ${i + 1}: unit price must be 0 or more.`,
              durationMs: 4000,
            });
            return;
          }
          if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
            pushToast({
              type: "error",
              title: "Invalid tax rate",
              message: `Line ${i + 1}: tax rate must be between 0 and 100.`,
              durationMs: 4000,
            });
            return;
          }
        }

        if (totals.total <= 0) {
          pushToast({
            type: "error",
            title: "Total is zero",
            message: "Make sure your line items add up to a total greater than 0.",
            durationMs: 4500,
          });
          return;
        }
        onSubmit({
          number: trimmed,
          partyId,
          partyName,
          date: new Date(date).toISOString(),
          status,
          items,
          notes,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          {mode === "invoice" ? "Invoice" : "Bill"} number
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
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
      </div>
      <label className="block text-xs text-slate-400">
        {mode === "invoice" ? "Customer" : "Supplier"}
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={partyId}
          onChange={(e) => {
            const id = e.target.value;
            setPartyId(id);
            const p = parties.find((x) => x._id === id);
            setPartyName(p?.name || "");
          }}
        >
          <option value="">— Optional —</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-slate-400">
        Display name (if no {mode === "invoice" ? "customer" : "supplier"} selected)
        <input
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
        />
      </label>
      <label className="block text-xs text-slate-400">
        Status
        <select
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {mode === "invoice" ? (
            <>
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="paid">paid</option>
              <option value="overdue">overdue</option>
              <option value="cancelled">cancelled</option>
            </>
          ) : (
            <>
              <option value="draft">draft</option>
              <option value="received">received</option>
              <option value="paid">paid</option>
              <option value="overdue">overdue</option>
              <option value="cancelled">cancelled</option>
            </>
          )}
        </select>
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Line items</span>
          <button
            type="button"
            className="text-xs text-sky-400 hover:underline"
            onClick={() => setItems([...items, emptyLine()])}
          >
            + Row
          </button>
        </div>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-800 p-2">
          {items.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 text-xs">
              <input
                className="col-span-12 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white sm:col-span-4"
                placeholder="Description"
                value={row.description}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...row, description: e.target.value };
                  setItems(next);
                }}
              />
              <input
                type="number"
                className="col-span-4 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white sm:col-span-2"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...row, quantity: Number(e.target.value) };
                  setItems(next);
                }}
              />
              <input
                type="number"
                className="col-span-4 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white sm:col-span-2"
                placeholder="Price"
                value={row.unitPrice}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...row, unitPrice: Number(e.target.value) };
                  setItems(next);
                }}
              />
              <input
                type="number"
                className="col-span-4 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white sm:col-span-2"
                placeholder="Tax %"
                value={row.taxRate}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...row, taxRate: Number(e.target.value) };
                  setItems(next);
                }}
              />
              <button
                type="button"
                className="col-span-12 rounded bg-slate-800 py-1 text-slate-400 hover:text-white sm:col-span-2"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 text-xs text-slate-400">
          <span>Subtotal: {totals.subtotal.toFixed(2)}</span>
          <span>Tax: {totals.taxTotal.toFixed(2)}</span>
          <span className="font-semibold text-white">Total: {totals.total.toFixed(2)}</span>
        </div>
      </div>

      <label className="block text-xs text-slate-400">
        Notes
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          rows={2}
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
