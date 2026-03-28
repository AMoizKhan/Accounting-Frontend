import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { DataTable } from "@/components/Tables";
import { Modal } from "@/components/Modal";
import { accountsApi } from "@/services/api";
import type { Account } from "@/types";
import { formatMoney } from "@/utils/format";
import { useToast } from "@/contexts/ToastContext";

export default function AccountsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [currency, setCurrency] = useState("USD");
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Account | null>(null);
  const [confirmDel, setConfirmDel] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"bank" | "cash" | "wallet">("bank");
  const [opening, setOpening] = useState("0");

  const load = useCallback(async () => {
    const { data } = await accountsApi.list();
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

  function openCreate() {
    setEdit(null);
    setName("");
    setType("bank");
    setOpening("0");
    setOpen(true);
  }

  function openEdit(a: Account) {
    setEdit(a);
    setName(a.name);
    setType(a.type);
    setOpening(String(a.openingBalance));
    setOpen(true);
  }

  return (
    <Protected>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-white">Accounts</h1>
            <p className="text-sm text-slate-400">Bank, cash, and wallet</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Add account
          </button>
        </div>

        <DataTable<Account>
          rows={rows}
          rowKey={(r) => r._id}
          columns={[
            { key: "name", header: "Name" },
            { key: "type", header: "Type" },
            {
              key: "balance",
              header: "Balance",
              render: (r) => <span className="font-medium text-white">{fmt(r.balance)}</span>,
            },
            {
              key: "_id",
              header: "Actions",
              render: (r) => (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-sky-400 hover:underline"
                    onClick={() => openEdit(r)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-rose-400 hover:underline"
                    onClick={() => setConfirmDel(r)}
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
        title={edit ? "Edit account" : "Add account"}
        onClose={() => setOpen(false)}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ob = parseFloat(opening) || 0;
            try {
              if (!name.trim()) {
                pushToast({ type: "error", title: "Name required", message: "Account name is required.", durationMs: 3500 });
                return;
              }
              if (Number.isNaN(ob)) {
                pushToast({ type: "error", title: "Invalid balance", message: "Opening balance must be a number.", durationMs: 4000 });
                return;
              }
              if (edit) {
                await accountsApi.update(edit._id, { name, type, openingBalance: ob });
              } else {
                await accountsApi.create({ name, type, openingBalance: ob });
              }
              setOpen(false);
              await load();
            } catch {
              pushToast({ type: "error", title: "Save failed", message: "Could not save this account.", durationMs: 4500 });
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
            Type
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
              <option value="wallet">Wallet</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Opening balance
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
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

      <Modal
        open={!!confirmDel}
        title="Delete account?"
        onClose={() => setConfirmDel(null)}
      >
        <p className="text-sm text-slate-400">
          This cannot be undone. Accounts with transactions cannot be deleted.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300"
            onClick={() => setConfirmDel(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-500"
            onClick={async () => {
              if (!confirmDel) return;
              try {
                await accountsApi.remove(confirmDel._id);
                setConfirmDel(null);
                await load();
              } catch {
                pushToast({
                  type: "error",
                  title: "Delete failed",
                  message: "This account may have transactions and cannot be deleted.",
                  durationMs: 4500,
                });
              }
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </Protected>
  );
}
