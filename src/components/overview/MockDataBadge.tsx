import { USE_MOCK_DATA } from "@/services/nexus-api";

export function MockDataBadge() {
  if (!USE_MOCK_DATA) return null;
  return (
    <div
      className="fixed bottom-4 right-4 nx-card px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-text-faint"
      role="status"
    >
      Dados de demonstração
    </div>
  );
}