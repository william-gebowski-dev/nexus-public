import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Shell } from "@/components/layout/Shell";
import { Overview } from "@/pages/Overview";
import { Infrastructure } from "@/pages/Infrastructure";
import { AI } from "@/pages/AI";
import { Projects } from "@/pages/Projects";
import { Roadmap } from "@/pages/Roadmap";
import { Activities } from "@/pages/Activities";
import { Executions } from "@/pages/Executions";
import { Documentation } from "@/pages/Documentation";
import { Settings } from "@/pages/Settings";
import { Admin } from "@/pages/Admin";
import { LegacyDocs } from "@/pages/LegacyDocs";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Overview />} />
            <Route path="infraestrutura" element={<Infrastructure />} />
            <Route path="ia" element={<AI />} />
            <Route path="projetos" element={<Projects />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="atividades" element={<Activities />} />
            <Route path="execucoes" element={<Executions />} />
            <Route path="documentacao" element={<Documentation />} />
            <Route path="configuracoes" element={<Settings />} />
            <Route path="admin" element={<Admin />} />
            <Route path="docs" element={<LegacyDocs />} />
            <Route
              path="*"
              element={
                <div className="nx-card mx-auto max-w-md p-8 text-center">
                  <h1 className="font-mono text-2xl">404</h1>
                  <p className="mt-2 text-sm text-text-dim">Página não encontrada.</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
