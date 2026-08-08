import { NavLink } from "react-router-dom";
import {
  Activity,
  Bot,
  BookOpen,
  CalendarClock,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Plug,
  Server,
  Settings,
  Sparkles,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

const NAV = [
  { to: ROUTES.home, label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: ROUTES.routine, label: "Rotina 12×4", icon: CalendarClock },
  { to: ROUTES.executions, label: "Execuções", icon: ListChecks },
  { to: ROUTES.aiInfrastructure, label: "Infraestrutura de IA", icon: Cpu },
  { to: ROUTES.infrastructure, label: "Infraestrutura", icon: Server },
  { to: ROUTES.agents, label: "Agentes", icon: Bot },
  { to: ROUTES.mcps, label: "MCPs", icon: Plug },
  { to: ROUTES.skills, label: "Skills", icon: Sparkles },
  { to: ROUTES.automations, label: "Automações", icon: Workflow },
  { to: ROUTES.projects, label: "Projetos", icon: FolderKanban },
  { to: ROUTES.activities, label: "Atividades", icon: Activity },
  { to: ROUTES.knowledge, label: "Conhecimento", icon: BookOpen },
  { to: ROUTES.configs, label: "Configurações", icon: Settings },
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
      <div className="px-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-xl border border-primary/30 bg-primary-soft" aria-hidden>
            <div className="absolute inset-1 rounded-lg border border-primary/35 bg-surface" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
          </div>
          <div className={cn("min-w-0", collapsed && "sr-only")}>
            <div className="font-mono text-sm font-semibold leading-none tracking-tight">Nexus Dashboard</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-text-faint">
              Centro operacional
            </div>
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
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              isActive
                ? "border border-primary/20 bg-primary-soft text-primary"
                : "text-text-dim hover:bg-surface-hover hover:text-text",
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className={cn("truncate font-mono text-[13px]", collapsed && "sr-only")}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
