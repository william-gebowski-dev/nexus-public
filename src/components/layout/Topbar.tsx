import { useQuery } from "@tanstack/react-query";
import { Menu, RefreshCw, Search, Wifi, WifiOff } from "lucide-react";
import { api } from "@/lib/api";
import { useCountdownRefresh } from "@/hooks/useCountdownRefresh";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SearchCommand } from "@/components/ui/SearchCommand";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const REFRESH_MS = 15 * 60 * 1000;

export function Topbar({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { data: status } = useQuery({
    queryKey: ["status"],
    queryFn: api.status,
  });
  const { refresh, label } = useCountdownRefresh(REFRESH_MS);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // Listeners de conexão dentro de um effect — registrados uma única vez,
  // removidos no cleanup (antes isto rodava a cada render, vazando handlers).
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg-elevated/90 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Abrir menu"
        className="nx-btn h-9 w-9 px-0 lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      <div className="flex-1">
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="nx-btn w-full max-w-md justify-start gap-2 text-text-faint"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="text-xs">Buscar…</span>
          <kbd className="ml-auto font-mono text-[10px] text-text-faint">Ctrl+K</kbd>
        </button>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span
          className={cn(
            "nx-pill text-[11px]",
            isOnline ? "text-green border-green/40" : "text-red border-red/40",
          )}
        >
          {isOnline ? <Wifi className="h-3 w-3" aria-hidden /> : <WifiOff className="h-3 w-3" aria-hidden />}
          {isOnline ? "Conectado" : "Offline"}
        </span>
        <DataFreshnessBadge iso={status?.generatedAt ?? null} />
        <span className="text-[11px] text-text-faint hidden md:inline">{label}</span>
        <button
          type="button"
          onClick={refresh}
          aria-label="Atualizar agora"
          title="Atualizar agora"
          className="nx-btn h-9 w-9 px-0"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
        <ThemeToggle />
      </div>

      <ThemeToggle className="sm:hidden" />

      {cmdOpen && <SearchCommand />}
    </header>
  );
}
