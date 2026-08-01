import { MOCK_AI_REQUESTS } from "../../src/data/mock-ai-infrastructure";

type ApiRequest = {
  method?: string;
  query?: Record<string, string | string[]>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => { json: (body: unknown) => void };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  const limit = Number(req.query?.limit ?? 10);
  const cursor = req.query?.cursor ? Number(req.query.cursor) : 0;

  const page = MOCK_AI_REQUESTS.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < MOCK_AI_REQUESTS.length ? cursor + limit : null;

  return res.status(200).json({ items: page, nextCursor });
}
