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
} from "react-icons/fi";

const links = [
  { href: "/", label: "Dashboard", Icon: FiHome },
  { href: "/accounts", label: "Accounts", Icon: FiDatabase },
  { href: "/transactions", label: "Transactions", Icon: FiRepeat },
  { href: "/invoices", label: "Invoices", Icon: FiFileText },
  { href: "/bills", label: "Bills", Icon: FiClipboard },
  { href: "/customers", label: "Customers", Icon: FiUsers },
  { href: "/suppliers", label: "Suppliers", Icon: FiTruck },
  { href: "/reports", label: "Reports", Icon: FiBarChart2 },
  { href: "/settings", label: "Settings", Icon: FiSettings },
];

// SECTION: Sidebar navigation (desktop)
export function Sidebar() {
  const router = useRouter();
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-950 md:flex">
      <div className="border-b border-slate-800 px-4 py-4">
        <span className="text-sm font-semibold tracking-wide text-sky-400">Accounting</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {links.map((l) => {
          const active = router.pathname === l.href;
          const Icon = l.Icon;
          const base = "rounded-lg px-3 py-2 text-sm transition";
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`${base} ${
                active
                  ? "bg-gradient-to-r from-green-600 via-green-500 to-lime-400 text-slate-100"
                  : "text-slate-400 hover:bg-gradient-to-r hover:from-green-600 hover:via-green-500 hover:to-lime-400 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} />
                {l.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
