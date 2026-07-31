import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Countdown regressivo até a próxima sincronização automática.
 * O TanStack Query cuida do refresh; este hook só renderiza o "faltam X min".
 *
 * Re-render só ocorre quando o label muda (de "X min" para "X-1 min"),
 * não a cada segundo — o efeito colateral é medido, não carimbado.
 */

export function useCountdownRefresh(refreshMs: number): {
  remainingMs: number;
  label: string;
  refresh: () => void;
} {
  const qc = useQueryClient();
  // `tickRef` é a única fonte de verdade para "quando começou o ciclo
  // atual". Antes, atualizar lastTick quando o label mudava realimentava
  // o cálculo do elapsed, fazendo o contador reiniciar/oscilar (audit
  // D.9). O ref evita esse loop e o label só serve para o re-render.
  const tickRef = useRef<number>(Date.now());
  const lastLabelRef = useRef<string>("");

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
    // Invalida todas as queries ativas — antes isto usava uma lista
    // hardcoded de chaves que ficava dessincronizada das chaves reais
    // (audit D.9). Sem predicate, qualquer refetch com refetchInterval
    // também é resetado pelo TanStack Query.
    void qc.invalidateQueries();
    const now = Date.now();
    tickRef.current = now;
    const v = computeLabel(now);
    lastLabelRef.current = v.label;
    setLabel(v.label);
  }, [qc]);

  const { remainingMs } = computeLabel(Date.now());
  return { remainingMs, label, refresh };
}
