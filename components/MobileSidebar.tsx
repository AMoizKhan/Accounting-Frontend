import Link from "next/link";
import { useRouter } from "next/router";
import {
  FiHome,
  FiDatabase,
  FiRepeat,
  FiFileText,
  FiClipboard,
  FiUsers,
  FiTruck,
  FiBarChart2,
  FiSettings,
  FiX,
} from "react-icons/fi";

type LinkItem = {
  href: string;
  label: string;
  Icon: (props: { size?: number }) => JSX.Element;
};

const links: LinkItem[] = [
  { href: "/", label: "Dashboard", Icon: FiHome as unknown as LinkItem["Icon"] },
  { href: "/accounts", label: "Accounts", Icon: FiDatabase as unknown as LinkItem["Icon"] },
  { href: "/transactions", label: "Transactions", Icon: FiRepeat as unknown as LinkItem["Icon"] },
  { href: "/invoices", label: "Invoices", Icon: FiFileText as unknown as LinkItem["Icon"] },
  { href: "/bills", label: "Bills", Icon: FiClipboard as unknown as LinkItem["Icon"] },
  { href: "/customers", label: "Customers", Icon: FiUsers as unknown as LinkItem["Icon"] },
  { href: "/suppliers", label: "Suppliers", Icon: FiTruck as unknown as LinkItem["Icon"] },
  { href: "/reports", label: "Reports", Icon: FiBarChart2 as unknown as LinkItem["Icon"] },
  { href: "/settings", label: "Settings", Icon: FiSettings as unknown as LinkItem["Icon"] },
];

// SECTION: Mobile sidebar navigation (drawer for mobile/tablet)
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 transform border-r border-slate-800 bg-slate-950 p-4 transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-sm font-semibold tracking-wide text-sky-400">Accounting</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 hover:opacity-95"
            aria-label="Close navigation"
          >
            <FiX size={18} />
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {links.map((l) => {
            const active = router.pathname === l.href;
            const base = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition";
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={onClose}
                className={`${base} ${
                  active
                    ? "bg-gradient-to-r from-green-600 via-green-500 to-lime-400 text-slate-100"
                    : "text-slate-400 hover:bg-gradient-to-r hover:from-green-600 hover:via-green-500 hover:to-lime-400 hover:text-slate-100"
                }`}
              >
                <l.Icon size={16} />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

