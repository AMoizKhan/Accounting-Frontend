import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { FiMenu } from "react-icons/fi";

// SECTION: Navbar (desktop header + mobile drawer trigger + theme toggle)
export function Navbar({ onOpenNav }: { onOpenNav?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 hover:opacity-95"
          onClick={() => onOpenNav?.()}
          aria-label="Open navigation"
        >
          <FiMenu size={18} />
        </button>
        <span className="hidden text-sm font-semibold text-sky-400 sm:block">Accounting</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white hover:border-sky-600"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">Quick add</span>
          </button>
          {menu && (
            <div className="absolute right-0 z-40 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg">
              <Link
                href="/transactions?add=1"
                className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => setMenu(false)}
              >
                Transaction
              </Link>
              <Link
                href="/invoices?add=1"
                className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => setMenu(false)}
              >
                Invoice
              </Link>
              <Link
                href="/bills?add=1"
                className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => setMenu(false)}
              >
                Bill
              </Link>
            </div>
          )}
        </div>
        <button
          type="button"
          className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 sm:block"
          title="Notifications placeholder"
        >
          Notifications
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-100 hover:opacity-95 sm:block"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "Light" : "Dark"} mode
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
          <div className="text-right">
            <div className="max-w-[140px] truncate text-xs font-medium text-white">{user?.name || user?.email}</div>
            <div className="text-[10px] uppercase text-slate-500">{user?.role}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:opacity-95"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
