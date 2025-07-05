import { QueuebaseRequest, QueuebaseResponse } from "./types";

export async function normalizeRequest(req: QueuebaseRequest) {
  const headers: Record<string, string> = {};

  if ("headers" in req) {
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        headers[key.toLowerCase()] = value.join(", ");
      }
    }
  }

  if ("method" in req && "body" in req) {
    // Express or NextApiRequest
    return {
      method: req.method,
      headers,
      body: req.body,
    };
  }

  if ("json" in req && typeof req.json === "function") {
    // Standard Fetch API Request
    const body = await req.json();
    return {
      method: req.method,
      headers,
      body: body,
    };
  }

  throw new Error("Unsupported request format");
}

export function sendResponse(
  res: QueuebaseResponse,
  statusCode: number,
  data: any
): void {
  if (
    typeof (res as any).status === "function" &&
    typeof (res as any).json === "function"
  ) {
    (res as any).status(statusCode).json(data);
  } else if (
    typeof (res as any).status === "function" &&
    typeof (res as any).send === "function"
  ) {
    (res as any).status(statusCode).send(data);
  } else {
    throw new Error("Unsupported response format");
  }
}
