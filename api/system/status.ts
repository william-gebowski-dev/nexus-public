import { json, methodNotAllowed, type ApiRequest, type ApiResponse } from "../_shared/http";

const NO_DATA_STATUS = {
  status: "no_data",
  message: "Nenhuma fonte operacional foi configurada.",
  generatedAt: null,
  lastUpdate: null,
  source: "unavailable",
};

const UPSTREAM_UNAVAILABLE_STATUS = {
  status: "unavailable",
  message: "A fonte operacional não respondeu.",
  generatedAt: null,
  lastUpdate: null,
  source: "unavailable",
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const upstream = process.env.NEXUS_STATUS_ENDPOINT;
  const token = process.env.NEXUS_STATUS_TOKEN;

  if (!upstream) {
    return json(res, 503, NO_DATA_STATUS);
  }

  try {
    const upstreamRes = await fetch(upstream, {
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });

    const contentType = upstreamRes.headers.get("content-type");
    if (!upstreamRes.ok || !contentType?.includes("application/json")) {
      return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
    }

    const body = await upstreamRes.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
    }

    return json(res, 200, body);
  } catch {
    return json(res, 503, UPSTREAM_UNAVAILABLE_STATUS);
  }
}
