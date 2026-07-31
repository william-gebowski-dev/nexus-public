import { useEffect, useRef } from "react";

/**
 * Salva o elemento atualmente focado e devolve o foco a ele quando
 * `restore` é chamado. Usado por dialogs/drawers (SearchCommand, MobileDrawer)
 * para devolver foco ao botão de origem ao fechar.
 */
export function useRememberFocus(active: boolean) {
  const previousRef = useRef<Element | null>(null);

  useEffect(() => {
    if (active) {
      previousRef.current = (document.activeElement as Element) ?? null;
    }
  }, [active]);

  return previousRef;
}

export function restoreFocus(ref: React.RefObject<Element | null>) {
  const el = ref.current as HTMLElement | null;
  if (el && typeof el.focus === "function") {
    // Pequeno timeout para garantir que o elemento de origem ainda existe
    // e está visível após o unmount do overlay.
    setTimeout(() => el.focus(), 0);
  }
}
