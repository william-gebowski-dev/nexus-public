import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Countdown regressivo até a próxima sincronização automática.
 * O TanStack Query cuida do refresh; este hook só renderiza o "faltam X min".
 *
 * Re-render só ocorre quando o label muda (de "X min" para "X-1 min"),
 * não a cada segundo — o efeito colateral é medido, não carimbado.
 */

const REFRESH_KEYS = [
  ["status"],
  ["services"],
  ["agents"],
  ["mcps"],
  ["skills"],
  ["automations"],
  ["models"],
  ["projects"],
  ["roadmap"],
  ["alerts"],
  ["activities"],
  ["executions"],
] as const;

export function useCountdownRefresh(refreshMs: number): {
  remainingMs: number;
  label: string;
  refresh: () => void;
} {
  const qc = useQueryClient();
  const [lastTick, setLastTick] = useState(() => Date.now());
  const lastLabelRef = useRef<string>("");
  const tickRef = useRef(lastTick);

  useEffect(() => {
    tickRef.current = lastTick;
  }, [lastTick]);

  // Médi o label atual no instantâneo; só forcechange render quando muda.
  const computeLabel = (now: number) => {
    const elapsed = (now - tickRef.current) % refreshMs;
    const remainingMs = Math.max(0, refreshMs - elapsed);
    const totalSec = Math.round(remainingMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return {
      remainingMs,
      label: min > 0 ? `Próxima atualização em ${min} min` : `Próxima atualização em ${sec}s`,
    };
  };

  const [label, setLabel] = useState(() => {
    const v = computeLabel(Date.now());
    lastLabelRef.current = v.label;
    return v.label;
  });

  useEffect(() => {
    let cancelled = false;
    const id = window.setInterval(() => {
      if (cancelled) return;
      const now = Date.now();
      const { label: nextLabel } = computeLabel(now);
      if (nextLabel !== lastLabelRef.current) {
        lastLabelRef.current = nextLabel;
        setLastTick(now);
        setLabel(nextLabel);
      }
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // refreshMs é constante durante a vida do app; não precisa entrar nas deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs]);

  const refresh = useCallback(() => {
    // Invalida apenas as queries do dashboard — não derruba caches que
    // outras rotas possam ter (ex.: /search).
    for (const key of REFRESH_KEYS) {
      void qc.invalidateQueries({ queryKey: key as unknown as readonly unknown[] });
    }
    const now = Date.now();
    tickRef.current = now;
    lastLabelRef.current = computeLabel(now).label;
    setLastTick(now);
    setLabel(lastLabelRef.current);
  }, [qc]);

  const { remainingMs } = computeLabel(Date.now());
  return { remainingMs, label, refresh };
}
