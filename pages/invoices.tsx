import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { DataTable } from "@/components/Tables";
import { Modal } from "@/components/Modal";
import { InvoiceForm } from "@/components/InvoiceForm";
import { useAuth } from "@/contexts/AuthContext";
import { customersApi, invoicesApi } from "@/services/api";
import type { Customer, Invoice } from "@/types";
import { formatDate, formatMoney } from "@/utils/format";
import { downloadInvoicePdf } from "@/utils/pdf";
import { useToast } from "@/contexts/ToastContext";

export default function InvoicesPage() {
  const router = useRouter();
  const { company } = useAuth();
  const { pushToast } = useToast();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Invoice | null>(null);
  const [view, setView] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    const [{ data: inv }, { data: cust }] = await Promise.all([
      invoicesApi.list(),
      customersApi.list(),
    ]);
    setRows(inv);
    setCustomers(cust);
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
      void router.replace("/invoices", undefined, { shallow: true });
    }
  }, [router]);

  const fmt = (n: number) => formatMoney(n, currency);

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-white">Invoices</h1>
            <p className="text-sm text-slate-400">Sales and receivables</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEdit(null);
              setOpen(true);
            }}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add invoice
          </button>
        </div>

        <DataTable<Invoice>
          rows={rows}
          rowKey={(r) => r._id}
          columns={[
            { key: "number", header: "Number" },
            {
              key: "customerName",
              header: "Customer",
              render: (r) => r.customerName || (typeof r.customerId === "object" && r.customerId && "name" in r.customerId ? (r.customerId as { name?: string }).name : "") || "—",
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
                    onClick={() => downloadInvoicePdf(r, company?.name || "")}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="text-rose-400 hover:underline"
                    onClick={async () => {
                      if (!confirm("Delete invoice?")) return;
                      try {
                        await invoicesApi.remove(r._id);
                        await load();
                      } catch {
                        pushToast({
                          type: "error",
                          title: "Delete failed",
                          message: "Could not delete this invoice.",
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

      <Modal open={open} title={edit ? "Edit invoice" : "Add invoice"} onClose={() => setOpen(false)} wide>
        <InvoiceForm
          mode="invoice"
          customers={customers}
          initial={edit}
          submitLabel={edit ? "Update" : "Save"}
          onSubmit={async (v) => {
            const payload = {
              number: v.number,
              customerId: v.partyId || undefined,
              customerName: v.partyName,
              date: v.date,
              status: v.status,
              items: v.items,
              notes: v.notes,
            };
            try {
              if (edit) await invoicesApi.update(edit._id, payload);
              else await invoicesApi.create(payload);
              setOpen(false);
              setEdit(null);
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

      <Modal open={!!view} title={`Invoice ${view?.number ?? ""}`} onClose={() => setView(null)} wide>
        {view && (
          <div className="space-y-2 text-sm text-slate-300">
            <p>Customer: {view.customerName || "—"}</p>
            <p>Date: {formatDate(view.date)}</p>
            <p>Status: {view.status}</p>
            <p>Subtotal: {fmt(view.subtotal)} · Tax: {fmt(view.taxTotal)} · Total: {fmt(view.total)}</p>
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
              onClick={() => downloadInvoicePdf(view, company?.name || "")}
            >
              Download PDF
            </button>
          </div>
        )}
      </Modal>
    </Protected>
  );
}
