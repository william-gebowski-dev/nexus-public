import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Shell } from "@/components/layout/Shell";
import { Overview } from "@/pages/Overview";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

// Todas as rotas além da home vão em lazy-load. O bundle inicial fica só
// com Shell + Overview + dependências compartilhadas (router, query, layout).
// Cada lazy fica wrapped em Suspense com o mesmo fallback.
const Routine = lazy(() => import("@/pages/Routine").then((m) => ({ default: m.Routine })));
const Executions = lazy(() => import("@/pages/Executions").then((m) => ({ default: m.Executions })));
const ExecutionDetail = lazy(() =>
  import("@/pages/ExecutionDetail").then((m) => ({ default: m.ExecutionDetail })),
);
const Infrastructure = lazy(() =>
  import("@/pages/Infrastructure").then((m) => ({ default: m.Infrastructure })),
);
const Agents = lazy(() => import("@/pages/Agents").then((m) => ({ default: m.Agents })));
const Mcps = lazy(() => import("@/pages/Mcps").then((m) => ({ default: m.Mcps })));
const Skills = lazy(() => import("@/pages/Skills").then((m) => ({ default: m.Skills })));
const Automations = lazy(() => import("@/pages/Automations").then((m) => ({ default: m.Automations })));
const Projects = lazy(() => import("@/pages/Projects").then((m) => ({ default: m.Projects })));
const Activities = lazy(() => import("@/pages/Activities").then((m) => ({ default: m.Activities })));
const Knowledge = lazy(() => import("@/pages/Knowledge").then((m) => ({ default: m.Knowledge })));
const Configs = lazy(() => import("@/pages/Configs").then((m) => ({ default: m.Configs })));
const Admin = lazy(() => import("@/pages/Admin").then((m) => ({ default: m.Admin })));
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));

function RouteFallback() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton rows={4} />
    </div>
  );
}

function lazyRoute(node: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="routine" element={lazyRoute(<Routine />)} />
            <Route path="executions" element={lazyRoute(<Executions />)} />
            <Route path="executions/:id" element={lazyRoute(<ExecutionDetail />)} />
            <Route path="infrastructure" element={lazyRoute(<Infrastructure />)} />
            <Route path="agents" element={lazyRoute(<Agents />)} />
            <Route path="mcps" element={lazyRoute(<Mcps />)} />
            <Route path="skills" element={lazyRoute(<Skills />)} />
            <Route path="automations" element={lazyRoute(<Automations />)} />
            <Route path="projects" element={lazyRoute(<Projects />)} />
            <Route path="activities" element={lazyRoute(<Activities />)} />
            <Route path="knowledge" element={lazyRoute(<Knowledge />)} />
            <Route path="configs" element={lazyRoute(<Configs />)} />
            <Route path="admin" element={lazyRoute(<Admin />)} />
            <Route path="*" element={lazyRoute(<NotFound />)} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
