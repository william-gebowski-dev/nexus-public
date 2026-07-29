import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileDrawer } from "./MobileDrawer";

export function Shell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-bg-elevated lg:block ${
          collapsed ? "w-16" : "w-64"
        }`}
        aria-label="Navegação principal"
      >
        <div className="relative h-full">
          <Sidebar collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="absolute right-2 top-3 nx-btn h-7 w-7 px-0 text-text-faint"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-border px-6 py-4 text-[11px] text-text-faint">
          Nexus — painel operacional do ecossistema · dados sanitizados · refresh a cada 15 min
        </footer>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
