import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "../lib/i18n/I18nContext";

interface NavItem {
  to: string;
  label: string;
}

export function Layout({ navItems, title }: { navItems: NavItem[]; title: string }) {
  const { user, logout } = useAuth();
  const { t } = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navContent = (
    <>
      <div className="h-16 flex items-center gap-2 px-5 border-b border-neutral-200">
        <img src="/favicon.svg" alt="" className="w-7 h-7" />
        <span className="text-lg font-semibold tracking-tight text-brand-600">TablaScan</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-neutral-200 space-y-2">
        <p className="px-3 text-xs text-neutral-400 truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="w-full text-start rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        >
          {t("common.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-e border-neutral-200 bg-white flex-col">
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-64 max-w-[80%] bg-white flex flex-col shadow-lg">{navContent}</aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-3 px-4 md:px-6 border-b border-neutral-200 bg-white">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden -ms-1 w-9 h-9 flex items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
            aria-label={t("common.menu")}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2.5 5h15M2.5 10h15M2.5 15h15" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-neutral-900 flex-1 truncate">{title}</h1>
          <LanguageSwitcher className="w-40 shrink-0" />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
