/**
 * Catch-all para /api/ai/*
 *
 * Por que existe: na Vercel, cada arquivo em `api/` vira uma função
 * serverless isolada → 1 cold-start por endpoint (8 endpoints = até 8
 * cold-starts por sessão de usuário). Esta função unifica summary,
 * timeseries, models, providers, quotas, requests, incidents e
 * topology em um único Lambda. Após a 1ª request, todos os endpoints
 * ficam warm no mesmo processo e respondem em <50ms.
 *
 * Migração: clientes (nexus-api.ts) continuam chamando `/api/ai/{name}`
 * — Vercel roteia para este catch-all em vez dos arquivos antigos, que
 * foram removidos.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import summary from "./_handlers/summary";
import timeseries from "./_handlers/timeseries";
import models from "./_handlers/models";
import providers from "./_handlers/providers";
import quotas from "./_handlers/quotas";
import requests from "./_handlers/requests";
import incidents from "./_handlers/incidents";
import topology from "./_handlers/topology";

type Handler = (req: unknown, res: unknown) => unknown | Promise<unknown>;

const routes: Record<string, Handler> = {
  summary,
  timeseries,
  models,
  providers,
  quotas,
  requests,
  incidents,
  topology,
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? "";
  const match = url.match(/^\/api\/ai\/([^/?]+)/);
  const slug = match?.[1] ?? "";

  const handlerFn = routes[slug];
  if (!handlerFn) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: `Endpoint AI não encontrado: ${slug}` }));
    return;
  }

  const headers: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = v;

  const urlObj = new URL(url, `http://${req.headers.host ?? "localhost"}`);
  const query: Record<string, string> = {};
  for (const [k, v] of urlObj.searchParams.entries()) query[k] = v;

  const adaptedReq = { method: req.method, headers, query };
  let statusCode = 200;
  let body: unknown;
  const adaptedRes = {
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
    },
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return { json(b: unknown) { body = b; } };
    },
  };

  await handlerFn(adaptedReq, adaptedRes);

  if (!res.headersSent) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.statusCode = statusCode;
    res.end(JSON.stringify(body ?? {}));
  }
}