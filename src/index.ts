import { TOLERANCE_SECONDS } from "./lib/constants";
import { normalizeRequest, sendResponse } from "./lib/http-utils";
import {
  QueuebaseRequest,
  QueuebaseResponse,
  QueuebaseRouterOptions,
} from "./lib/types";
import QueuebaseClient from "./QueuebaseClient";
import crypto from "crypto";

export { default as QueuebaseClient } from "./QueuebaseClient";

/**
 * Create a new Queuebase client instance.
 * @param queuebaseApiKey - The API key for your queue
 * @returns
 */
export const createClient = (queuebaseApiKey: string): QueuebaseClient => {
  return new QueuebaseClient(queuebaseApiKey);
};

/**
 * Verify the signature of a Queuebase webhook request.
 */
export function verifySignature({
  signature: header,
  payload,
}: {
  signature: string;
  payload: any;
}) {
  const secret = process.env.QUEUEBASE_SECRET;

  if (!secret) {
    throw new Error("QUEUEBASE_SECRET environment variable is not set");
  }

  const parts = header.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const expectedSig = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !expectedSig) return false;

  const payloadToSign = `${timestamp}.${JSON.stringify(payload)}`;
  const computedSig = crypto
    .createHmac("sha256", secret)
    .update(payloadToSign)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(computedSig),
    Buffer.from(expectedSig)
  );

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  const timeSkew = Math.abs(now - ts);

  return isValid && timeSkew <= TOLERANCE_SECONDS;
}

/**
 * Create a router for handling Queuebase messages.
 */
export const createMessageRouter =
  (options: QueuebaseRouterOptions) =>
  async (req: QueuebaseRequest, res: QueuebaseResponse) => {
    let parsed;
    try {
      parsed = await normalizeRequest(req);
    } catch {
      sendResponse(res, 400, { error: "Unsupported request format" });
      return;
    }

    if (parsed.method !== "POST") {
      sendResponse(res, 405, { error: "Method Not Allowed" });
      return;
    }

    const { handlers } = options;

    const signature = parsed.headers["x-queuebase-signature"];

    if (!signature) {
      sendResponse(res, 400, { error: "Missing signature header" });
      return;
    }

    const isValid = verifySignature({
      signature,
      payload: parsed.body.payload,
    });

    if (!isValid) {
      sendResponse(res, 401, { error: "Invalid signature" });
      return;
    }

    const { event, payload } = parsed.body;
    const handler = handlers[event];

    if (!handler) {
      sendResponse(res, 400, { error: `No handler for event: ${event}` });
      return;
    }

    try {
      await handler({ payload });
      sendResponse(res, 200, { success: true });
    } catch (err) {
      console.error("Error handling event", err);
      sendResponse(res, 500, { error: "Internal Server Error" });
    }
  };
