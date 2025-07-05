import { NextFunction, Request, RequestHandler, Response } from "express";
import { verifySignature } from "..";
import { QueuebaseRouterOptions } from "../lib/types";

/**
 * Middleware to handle Queuebase requests in an Express application.
 */
export function useQueuebase(options: QueuebaseRouterOptions): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send({ error: "Method Not Allowed" });
        return;
      }

      const signature = req.headers["x-queuebase-signature"];

      if (!signature || typeof signature !== "string") {
        res.status(400).send({ error: "Missing signature header" });
        return;
      }

      const isValid = verifySignature({
        signature,
        rawBody: JSON.stringify(req.body),
      });

      if (!isValid) {
        res.status(401).send({ error: "Invalid signature" });
        return;
      }

      const handler = options.handlers[req.body.event];

      if (!handler) {
        res
          .status(400)
          .send({ error: `No handler for event: ${req.body.event}` });
        return;
      }

      try {
        await handler({ payload: req.body.payload });
        res.status(200).send({ success: true });
      } catch (err) {
        console.error("Error handling event", err);
        res.status(500).send({ error: "Internal Server Error" });
      }
    } catch (err) {
      console.error("Error in Queuebase middleware", err);
      next(err);
    }
  };
}
