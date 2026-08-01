import { MOCK_AI_INCIDENTS } from "../../src/data/mock-ai-infrastructure";

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => { json: (body: unknown) => void };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  return res.status(200).json(MOCK_AI_INCIDENTS);
}
