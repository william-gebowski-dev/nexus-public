import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/cn";
import { restoreFocus, useRememberFocus } from "@/lib/focus";

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRememberFocus(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Foca o botão de fechar ao abrir; devolve o foco ao botão de origem
  // (Menu na Topbar) ao fechar.
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      restoreFocus(previousFocusRef);
    }
  }, [open, previousFocusRef]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-80 max-w-[86vw] transform border-r border-border bg-bg-elevated transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-end p-3">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="nx-btn h-9 w-9 px-0"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
