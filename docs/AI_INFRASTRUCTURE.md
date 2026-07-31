# Módulo de Infraestrutura de IA e Observabilidade do 9Router

## Visão Geral
O módulo de **Infraestrutura de IA** transforma o Nexus em um centro executivo e operacional de observabilidade para a infraestrutura de IA e roteamento do **9Router**.

## Arquitetura
```text
9Router (Local:20128)
   ↓ (coleta local)
scripts/ai-collector.ts (Coletor local)
   ↓ (payload assinado HMAC-SHA256)
POST /api/ai/ingest (Vercel Serverless Function)
   ↓ (persistência service-role)
Supabase DB (RLS habilitado)
   ↓ (leitura server-side)
GET /api/ai/* (Vercel Serverless Functions)
   ↓ (JSON sanitizado + Zod schema)
Dashboard Nexus (React 18 + TanStack Query + Recharts)
```

## Seções e Abas
- **Visão geral (`/ai-infrastructure?tab=overview`):** KPIs principais, gráfico de histórico temporal e diagrama da topologia.
- **Uso e custos (`/ai-infrastructure?tab=usage`):** Distribuição de custo por provedor e modelo.
- **Modelos (`/ai-infrastructure?tab=models`):** Tabela de modelos com busca, ordenação e filtros.
- **Provedores (`/ai-infrastructure?tab=providers`):** Status traduzido e diagnóstico de autenticação/cota.
- **Cotas (`/ai-infrastructure?tab=quotas`):** Barras visuais de cota por provedor.
- **Requisições (`/ai-infrastructure?tab=requests`):** Log paginado de requisições sanitizadas.
- **Incidentes (`/ai-infrastructure?tab=incidents`):** Histórico somente leitura de falhas e 429s.
