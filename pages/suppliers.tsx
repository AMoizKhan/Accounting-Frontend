import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { DataTable } from "@/components/Tables";
import { Modal } from "@/components/Modal";
import { suppliersApi } from "@/services/api";
import type { Supplier } from "@/types";
import { formatMoney } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [currency, setCurrency] = useState("USD");
  const { pushToast } = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const load = useCallback(async () => {
    const { data } = await suppliersApi.list();
    setRows(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const cur = localStorage.getItem("company_currency");
    if (cur) setCurrency(cur);
  }, []);

  const fmt = (n: number) => formatMoney(n, currency);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    if (!s) return true;
    if (r.name.toLowerCase().includes(s)) return true;
    if ((r.billCount || 0).toString().includes(s)) return true;
    return false;
  });

  function startCreate() {
    setEdit(null);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setOpen(true);
  }

  function startEdit(s: Supplier) {
    setEdit(s);
    setName(s.name);
    setEmail(s.email || "");
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setOpen(true);
  }

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-white">Suppliers</h1>
            <p className="text-sm text-slate-400">Vendors linked to bills</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add supplier
          </button>
        </div>
        <input
          className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Search by name or bill count…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <DataTable<Supplier>
          rows={filtered}
          rowKey={(r) => r._id}
          columns={[
            { key: "name", header: "Name" },
            {
              key: "email",
              header: "Contact",
              render: (r) => (
                <span>
                  {r.email || "—"}
                  {r.phone ? ` · ${r.phone}` : ""}
                </span>
              ),
            },
            {
              key: "billCount",
              header: "Bills",
              render: (r) => String(r.billCount ?? 0),
            },
            {
              key: "billTotal",
              header: "Bill total",
              render: (r) => fmt(r.billTotal ?? 0),
            },
            {
              key: "_id",
              header: "Actions",
              render: (r) => (
                <div className="flex gap-2">
                  <button type="button" className="text-sky-400 hover:underline" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-rose-400 hover:underline"
                    onClick={async () => {
                      if (!confirm("Delete supplier?")) return;
                      try {
                        await suppliersApi.remove(r._id);
                        await load();
                      } catch {
                        pushToast({
                          type: "error",
                          title: "Delete failed",
                          message: "Could not delete this supplier.",
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

      <Modal open={open} title={edit ? "Edit supplier" : "Add supplier"} onClose={() => setOpen(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (!name.trim()) {
                pushToast({
                  type: "error",
                  title: "Name required",
                  message: "Supplier name is required.",
                  durationMs: 3500,
                });
                return;
              }
              if (edit) {
                await suppliersApi.update(edit._id, { name, email, phone, address });
              } else {
                await suppliersApi.create({ name, email, phone, address });
              }
              setOpen(false);
              await load();
            } catch {
              pushToast({
                type: "error",
                title: "Save failed",
                message: "Could not save this supplier.",
                durationMs: 4500,
              });
            }
          }}
        >
          <label className="text-xs text-slate-400">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="text-xs text-slate-400">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Phone
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-400">
            Address
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Save
          </button>
        </form>
      </Modal>
    </Protected>
  );
}
