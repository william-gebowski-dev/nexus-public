import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Shell } from "@/components/layout/Shell";
import { Overview } from "@/pages/Overview";
import { Routine } from "@/pages/Routine";
import { Executions } from "@/pages/Executions";
import { Infrastructure } from "@/pages/Infrastructure";
import { Agents } from "@/pages/Agents";
import { Mcps } from "@/pages/Mcps";
import { Skills } from "@/pages/Skills";
import { Automations } from "@/pages/Automations";
import { Knowledge } from "@/pages/Knowledge";
import { Projects } from "@/pages/Projects";
import { Activities } from "@/pages/Activities";
import { Configs } from "@/pages/Configs";
import { NotFound } from "@/pages/NotFound";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

// Rotas menos acessadas (não fazem parte do fluxo operacional principal)
// vão em lazy-load — reduz o bundle inicial. `Admin` puxa o cliente
// Supabase (~70 kB).
const Admin = lazy(() => import("@/pages/Admin").then((m) => ({ default: m.Admin })));

function RouteFallback() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton rows={4} />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="routine" element={<Routine />} />
            <Route path="executions" element={<Executions />} />
            <Route path="infrastructure" element={<Infrastructure />} />
            <Route path="agents" element={<Agents />} />
            <Route path="mcps" element={<Mcps />} />
            <Route path="skills" element={<Skills />} />
            <Route path="automations" element={<Automations />} />
            <Route path="projects" element={<Projects />} />
            <Route path="activities" element={<Activities />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="configs" element={<Configs />} />
            <Route
              path="admin"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Admin />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}