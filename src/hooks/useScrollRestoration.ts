import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "nexus-scroll-positions";
const MAX_ENTRIES = 30;

function readMap(): Record<string, number> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, number>) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Restaura a posição de scroll ao voltar/avançar (POP) e reseta ao topo em
 * navegações novas (PUSH/REPLACE) — equivalente ao `scrollRestoration` do
 * data router, mas compatível com `<BrowserRouter>` clássico.
 */
export function useScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();
  const key = location.pathname + location.search;
  const prevKeyRef = useRef<string | null>(null);

  // Salva a posição da rota anterior antes de trocar de rota.
  useEffect(() => {
    return () => {
      const map = readMap();
      map[key] = window.scrollY;
      const entries = Object.entries(map).slice(-MAX_ENTRIES);
      writeMap(Object.fromEntries(entries));
    };
  }, [key]);

  useLayoutEffect(() => {
    if (prevKeyRef.current === key) return;
    prevKeyRef.current = key;
    if (navType === "POP") {
      const map = readMap();
      const y = map[key];
      if (typeof y === "number") {
        window.scrollTo(0, y);
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [key, navType]);
}
