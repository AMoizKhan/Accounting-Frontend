import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi } from "@/services/api";
import type { User } from "@/types";
import { useToast } from "@/contexts/ToastContext";

export default function SettingsPage() {
  const { user, refreshMe } = useAuth();
  const { pushToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [backup, setBackup] = useState<{ message: string; mongodumpExample: string } | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [fbrApiKey, setFbrApiKey] = useState("");
  const [backupNote, setBackupNote] = useState("");

  const load = useCallback(async () => {
    const [{ data: c }, { data: u }] = await Promise.all([
      settingsApi.getCompany(),
      user?.role === "admin" ? settingsApi.listUsers() : Promise.resolve({ data: [] as User[] }),
    ]);
    const comp = c.company;
    if (comp) {
      setName(comp.name || "");
      setLogoUrl(comp.logoUrl || "");
      setAddress(comp.address || "");
      setTaxId(comp.taxId || "");
      setCountry(comp.country || "");
      setCurrency(comp.currency || "USD");
      setFbrApiKey(comp.fbrApiKey || "");
      setBackupNote(comp.backupNote || "");
      if (comp.currency) localStorage.setItem("company_currency", comp.currency);
    }
    setUsers(u);
  }, [user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadBackup = useCallback(async () => {
    if (user?.role !== "admin") return;
    const { data } = await settingsApi.backupInfo();
    setBackup(data);
  }, [user?.role]);

  useEffect(() => {
    void loadBackup();
  }, [loadBackup]);

  return (
    <Protected>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Company, roles, backup, integrations</p>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-medium text-white">Company info</h2>
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (!name.trim()) {
                  pushToast({
                    type: "error",
                    title: "Company name required",
                    message: "Please enter a company name.",
                    durationMs: 3500,
                  });
                  return;
                }
                await settingsApi.updateCompany({
                  name,
                  logoUrl,
                  address,
                  taxId,
                  country,
                  currency,
                  fbrApiKey,
                  backupNote,
                });
                localStorage.setItem("company_currency", currency);
                await refreshMe();
              } catch {
                pushToast({
                  type: "error",
                  title: "Save failed",
                  message: "Could not save company settings.",
                  durationMs: 4500,
                });
              }
            }}
          >
            <label className="text-xs text-slate-400">
              Company name
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="text-xs text-slate-400">
              Logo URL
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">
                Tax ID
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </label>
              <label className="text-xs text-slate-400">
                Country
                <input
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </label>
            </div>
            <label className="text-xs text-slate-400">
              Currency (ISO code)
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="USD"
              />
            </label>
            <label className="text-xs text-slate-400">
              FBR / API integration key
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={fbrApiKey}
                onChange={(e) => setFbrApiKey(e.target.value)}
                placeholder="Stored securely in your DB — wire to real API in production"
              />
            </label>
            <label className="text-xs text-slate-400">
              Backup note (last backup reminder)
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                placeholder="e.g. Last mongodump 2026-03-01"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              Save company
            </button>
          </form>
        </section>

        {user?.role === "admin" && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-medium text-white">User roles</h2>
            <p className="mt-1 text-sm text-slate-500">Admin, Accountant, Staff</p>
            <ul className="mt-4 space-y-2">
              {users.map((u) => (
                <li
                  key={u._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-300">{u.email}</span>
                  <select
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                    value={u.role}
                    onChange={async (e) => {
                      try {
                        await settingsApi.updateUserRole(u._id, e.target.value);
                        const { data } = await settingsApi.listUsers();
                        setUsers(data);
                      } catch {
                        pushToast({
                          type: "error",
                          title: "Role update failed",
                          message: "Could not update this user's role.",
                          durationMs: 4500,
                        });
                      }
                    }}
                    disabled={u._id === user._id}
                  >
                    <option value="admin">admin</option>
                    <option value="accountant">accountant</option>
                    <option value="staff">staff</option>
                  </select>
                </li>
              ))}
            </ul>
          </section>
        )}

        {user?.role === "admin" && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-medium text-white">Backup / restore</h2>
            <p className="mt-2 text-sm text-slate-400">
              {backup?.message}
            </p>
            {backup && (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                {backup.mongodumpExample}
              </pre>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Restore: use mongorestore against the same URI. Full UI restore is not exposed here to avoid
              accidental data loss.
            </p>
          </section>
        )}
      </div>
    </Protected>
  );
}
