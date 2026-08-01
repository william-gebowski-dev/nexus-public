import { json, type ApiRequest, type ApiResponse } from "./_shared/http";

export default function handler(_req: ApiRequest, res: ApiResponse) {
  return json(res, 404, {
    error: "Endpoint de API não encontrado",
    source: "unavailable",
    generatedAt: null,
  });
}
