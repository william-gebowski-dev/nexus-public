import { MOCK_AI_SUMMARY } from "../../src/data/mock-ai-infrastructure";

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

  const period = (req.query?.period as string) || "today";

  return res.status(200).json({
    ...MOCK_AI_SUMMARY,
    period,
    generatedAt: new Date().toISOString(),
  });
}
