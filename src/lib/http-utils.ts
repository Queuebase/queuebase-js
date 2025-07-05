import { QueuebaseRequest, QueuebaseResponse } from "./types";

export async function normalizeRequest(req: QueuebaseRequest) {
  try {
    // Express or NextApiRequest (req.body is already parsed)
    if ("body" in req && typeof req.body !== "undefined") {
      const raw =
        typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      return {
        method: req.method,
        headers: normalizeHeaders(req.headers),
        rawBody: raw,
        body: JSON.parse(raw),
      };
    }

    // NextRequest (App Router)
    if ("text" in req && typeof req.text === "function") {
      const raw = await req.text();
      return {
        method: req.method,
        headers: normalizeHeaders(req.headers),
        rawBody: raw,
        body: JSON.parse(raw),
      };
    }

    return {
      headers: {},
      rawBody: "",
      body: null,
      error: "Unsupported request type",
    };
  } catch (e) {
    return {
      headers: {},
      rawBody: "",
      body: null,
      error: "Failed to parse request",
    };
  }
}

function normalizeHeaders(headers: any): Record<string, string> {
  const result: Record<string, string> = {};

  if (!headers) return result;

  // Fetch API Headers
  if (typeof headers.get === "function") {
    for (const [key, value] of headers.entries()) {
      result[key.toLowerCase()] = value;
    }
  }

  // Node/Express Headers
  else {
    for (const key in headers) {
      const value = headers[key];
      if (Array.isArray(value)) {
        result[key.toLowerCase()] = value.join(", ");
      } else if (typeof value === "string") {
        result[key.toLowerCase()] = value;
      }
    }
  }

  return result;
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
