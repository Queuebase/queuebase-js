import { TOLERANCE_SECONDS } from "./lib/constants";
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

export function verifySignature({
  header,
  payload,
}: {
  header: string;
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
