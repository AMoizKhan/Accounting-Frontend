import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { DataTable } from "@/components/Tables";
import { Modal } from "@/components/Modal";
import { InvoiceForm } from "@/components/InvoiceForm";
import { useAuth } from "@/contexts/AuthContext";
import { billsApi, suppliersApi } from "@/services/api";
import type { Bill, Supplier } from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import { downloadBillPdf } from "@/utils/pdf";
import { useToast } from "@/contexts/ToastContext";

export default function BillsPage() {
  const router = useRouter();
  const { company } = useAuth();
  const { pushToast } = useToast();
  const [rows, setRows] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Bill | null>(null);
  const [view, setView] = useState<Bill | null>(null);

  const load = useCallback(async () => {
    const [{ data: b }, { data: sup }] = await Promise.all([billsApi.list(), suppliersApi.list()]);
    setRows(b);
    setSuppliers(sup);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const cur = localStorage.getItem("company_currency") || company?.currency || "USD";
    setCurrency(cur);
  }, [company]);

  useEffect(() => {
    if (router.query.add === "1") {
      setEdit(null);
      setOpen(true);
      void router.replace("/bills", undefined, { shallow: true });
    }
  }, [router]);

  const fmt = (n: number) => formatMoney(n, currency);

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-white">Bills</h1>
            <p className="text-sm text-slate-400">Vendor payables</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add bill
          </button>
        </div>

        <DataTable<Bill>
          rows={rows}
          rowKey={(r) => r._id}
          columns={[
            { key: "number", header: "Number" },
            {
              key: "supplierName",
              header: "Vendor",
              render: (r) =>
                r.supplierName ||
                (typeof r.supplierId === "object" && r.supplierId && "name" in r.supplierId
                  ? (r.supplierId as { name?: string }).name
                  : "") ||
                "—",
            },
            { key: "date", header: "Date", render: (r) => formatDate(r.date) },
            {
              key: "total",
              header: "Amount",
              render: (r) => <span className="font-medium text-white">{fmt(r.total)}</span>,
            },
            { key: "status", header: "Status" },
            {
              key: "_id",
              header: "Actions",
              render: (r) => (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="text-sky-400 hover:underline" onClick={() => setView(r)}>
                    View
                  </button>
                  <button
                    type="button"
                    className="text-slate-300 hover:underline"
                    onClick={() => {
                      setEdit(r);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-slate-400 hover:underline"
                    onClick={() =>
                      pushToast({
                        type: "info",
                        title: "Send placeholder",
                        message: "Connect an email provider (SMTP/provider) in production to enable sending.",
                        durationMs: 5000,
                      })
                    }
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    className="text-emerald-400 hover:underline"
                    onClick={() => downloadBillPdf(r, company?.name || "")}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="text-rose-400 hover:underline"
                    onClick={async () => {
                      if (!confirm("Delete bill?")) return;
                      try {
                        await billsApi.remove(r._id);
                        await load();
                      } catch {
                        pushToast({
                          type: "error",
                          title: "Delete failed",
                          message: "Could not delete this bill.",
                          durationMs: 4500,
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

      <Modal open={open} title={edit ? "Edit bill" : "Add bill"} onClose={() => setOpen(false)} wide>
        <InvoiceForm
          mode="bill"
          suppliers={suppliers}
          initial={edit}
          submitLabel={edit ? "Update" : "Save"}
          onSubmit={async (v) => {
            const payload = {
              number: v.number,
              supplierId: v.partyId || undefined,
              supplierName: v.partyName,
              date: v.date,
              status: v.status,
              items: v.items,
              notes: v.notes,
            };
            try {
              if (edit) await billsApi.update(edit._id, payload);
              else await billsApi.create(payload);
              setOpen(false);
              setEdit(null);
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

      <Modal open={!!view} title={`Bill ${view?.number ?? ""}`} onClose={() => setView(null)} wide>
        {view && (
          <div className="space-y-2 text-sm text-slate-300">
            <p>Vendor: {view.supplierName || "—"}</p>
            <p>Date: {formatDate(view.date)}</p>
            <p>Status: {view.status}</p>
            <p>
              Subtotal: {fmt(view.subtotal)} · Tax: {fmt(view.taxTotal)} · Total: {fmt(view.total)}
            </p>
            <ul className="list-inside list-disc text-slate-400">
              {(view.items || []).map((it, i) => (
                <li key={i}>
                  {it.description || "Line"} — {it.quantity} × {fmt(it.unitPrice)} (tax {it.taxRate}%)
                </li>
              ))}
            </ul>
            {view.notes && <p className="text-slate-500">Notes: {view.notes}</p>}
            <button
              type="button"
              className="mt-2 rounded-lg bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
              onClick={() => downloadBillPdf(view, company?.name || "")}
            >
              Download PDF
            </button>
          </div>
        )}
      </Modal>
    </Protected>
  );
}
