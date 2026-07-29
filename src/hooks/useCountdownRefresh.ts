import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Countdown regressivo até a próxima sincronização automática.
 * O TanStack Query cuida do refresh; este hook só renderiza o "faltam X min".
 */
export function useCountdownRefresh(refreshMs: number): {
  remainingMs: number;
  label: string;
  refresh: () => void;
} {
  const qc = useQueryClient();
  const [lastTick, setLastTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setLastTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Considera o último tick = momento do último refetch automático conhecido.
  // Como o refetchInterval é 15 min, sincronizamos com isso: o "remaining"
  // volta a 15 min depois de cada refresh.
  const elapsed = (Date.now() - lastTick) % refreshMs;
  const remainingMs = Math.max(0, refreshMs - elapsed);
  const totalSec = Math.round(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const label = min > 0 ? `Próxima atualização em ${min} min` : `Próxima atualização em ${sec}s`;

  return {
    remainingMs,
    label,
    refresh: () => {
      void qc.invalidateQueries();
      setLastTick(Date.now());
    },
  };
}
