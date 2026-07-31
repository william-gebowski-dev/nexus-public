type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => { json: (body: unknown) => void };
};

const SAFE_UNAVAILABLE_STATUS = {
  status: "attention_required",
  overall: "attention_required",
  message: "O servidor não respondeu à última verificação",
  generatedAt: new Date().toISOString(),
  lastUpdate: new Date().toISOString(),
  uptimeSeconds: null,
  cpuUsage: null,
  memoryUsage: null,
  diskUsage: null,
  counts: {
    servicesOperational: 0,
    servicesAttention: 0,
    servicesUnavailable: 0,
    agentsActive: 0,
    mcpsActive: 0,
    skillsActive: 0,
    automationsActive: 0,
    projectsActive: 0,
    executionsLast24h: 0,
  },
  technicalSummary: {
    activeMcps: 0,
    activeSkills: 0,
    activeAgents: 0,
    runningAutomations: 0,
    activeContainers: 0,
    lastSyncAt: null,
    lastBackupAt: null,
    lastFailureAt: null,
  },
  source: "live",
};

function safeJson(res: ApiResponse, body = SAFE_UNAVAILABLE_STATUS, statusCode = 200) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(statusCode).json(body);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return safeJson(res, SAFE_UNAVAILABLE_STATUS, 405);
  }

  const upstream = process.env.NEXUS_STATUS_ENDPOINT;
  const token = process.env.NEXUS_STATUS_TOKEN;

  if (!upstream) {
    return safeJson(res);
  }

  try {
    const upstreamRes = await fetch(upstream, {
      headers: {
        accept: "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(5_000),
    });

    if (!upstreamRes.ok) {
      return safeJson(res);
    }

    const body = await upstreamRes.json();
    return safeJson(res, body);
  } catch {
    return safeJson(res);
  }
}
