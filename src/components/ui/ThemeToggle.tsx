import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Mudar para tema ${theme === "dark" ? "claro" : "escuro"}`}
      title={`Mudar para tema ${theme === "dark" ? "claro" : "escuro"}`}
      className={cn(
        "nx-btn h-9 w-9 px-0",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
