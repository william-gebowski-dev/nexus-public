import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Bot,
  FolderKanban,
  Map,
  Activity,
  PlayCircle,
  FileText,
  Settings,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/infraestrutura", label: "Infraestrutura", icon: Server },
  { to: "/ia", label: "Inteligência Artificial", icon: Bot },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/atividades", label: "Atividades", icon: Activity },
  { to: "/execucoes", label: "Execuções", icon: PlayCircle },
  { to: "/documentacao", label: "Documentação", icon: FileText },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
  { to: "/docs", label: "Registro do ecossistema", icon: BookOpen },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="px-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-geb to-accent" aria-hidden />
          <div className={cn("min-w-0", collapsed && "sr-only")}>
            <div className="font-mono text-sm font-semibold leading-none">Nexus</div>
            <div className="text-[10px] uppercase tracking-wider text-text-faint">Painel operacional</div>
          </div>
        </div>
      </div>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent-soft text-accent"
                : "text-text-dim hover:bg-surface-hover hover:text-text",
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className={cn("truncate font-mono text-[13px]", collapsed && "sr-only")}>
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
