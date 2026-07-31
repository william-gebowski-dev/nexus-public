import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizeHtml,
  checkPayload,
  safeStringify,
} from "./sanitize";

describe("sanitizeText", () => {
  it("remove caracteres de controle C0/C1", () => {
    const input = "olá\x00\x01\x02mundo";
    expect(sanitizeText(input)).toBe("olámundo");
  });

  it("preserva quebras de linha e tabs", () => {
    expect(sanitizeText("a\nb\tc")).toBe("a\nb\tc");
  });

  it("remove zero-width chars usados para esconder conteúdo", () => {
    const input = "visível‌‍﻿invisível";
    expect(sanitizeText(input)).toBe("visívelinvisível");
  });

  it("retorna string vazia se entrada não é string", () => {
    // @ts-expect-error test runtime guard
    expect(sanitizeText(null)).toBe("");
    // @ts-expect-error test runtime guard
    expect(sanitizeText(undefined)).toBe("");
    // @ts-expect-error test runtime guard
    expect(sanitizeText(42)).toBe("");
  });
});

describe("sanitizeHtml", () => {
  it("escapa os 5 caracteres perigosos", () => {
    expect(sanitizeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("escapa aspas simples também", () => {
    expect(sanitizeHtml("'")).toBe("&#39;");
  });

  it("preserva texto sem tags", () => {
    expect(sanitizeHtml("hello world")).toBe("hello world");
  });

  it("combina com sanitizeText (control chars removidos antes do escape)", () => {
    expect(sanitizeHtml("a\x00b")).toBe("ab");
  });
});

describe("checkPayload", () => {
  it("detecta Tailscale IP", () => {
    const r = checkPayload("server 100.120.5.10 down");
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.label.includes("Tailscale"))).toBe(true);
  });

  it("detecta path interno", () => {
    const r = checkPayload("logs em /home/william/app");
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.label.includes("Path"))).toBe(true);
  });

  it("detecta repositório interno", () => {
    const r = checkPayload("clonado de hermes-nexus-os");
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.label.includes("hermes-nexus-os"))).toBe(true);
  });

  it("passa limpo em payload público", () => {
    const r = checkPayload(JSON.stringify({ name: "Notebook", status: "healthy" }));
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
  });

  it("deduplica matches repetidos", () => {
    // usa pattern /home/ que aceita qualquer path
    const r = checkPayload("/home/a /home/a /home/b");
    const path = r.failures.find((f) => f.label.includes("Path"));
    expect(path).toBeDefined();
    // O sanitizer deve devolver apenas valores únicos, no máximo 3.
    expect(path?.matches.length).toBeLessThanOrEqual(3);
    expect(new Set(path?.matches).size).toBe(path?.matches.length);
  });
});

describe("safeStringify", () => {
  it("retorna JSON válido quando payload limpo", () => {
    const out = safeStringify({ name: "ok", latency: 12 });
    expect(JSON.parse(out)).toEqual({ name: "ok", latency: 12 });
  });

  it("lança erro com diagnóstico quando há vazamento", () => {
    expect(() => safeStringify({ token: "100.120.5.10" })).toThrow(/Tailscale/);
  });
});
