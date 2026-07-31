type ApiRequest = {
  method?: string;
  query?: Record<string, string | string[]>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => { json: (body: unknown) => void };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const metric = (req.query?.metric as string) || "tokens";
  const period = (req.query?.period as string) || "today";

  const points = Array.from({ length: 12 }, (_, i) => ({
    bucket: `${String(i * 2).padStart(2, "0")}:00`,
    value: metric === "tokens" ? Math.floor(10000000 + Math.random() * 15000000) : Math.floor(1 + Math.random() * 8),
  }));

  return res.status(200).json({ metric, period, points, source: "simulated" });
}
