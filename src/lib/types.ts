import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export type QueuebaseRequest =
  | Request
  | ExpressRequest
  | NextRequest
  | NextApiRequest;
export type QueuebaseResponse =
  | Response
  | ExpressResponse
  | NextResponse
  | NextApiResponse;

export type QueuebaseRouterOptions = {
  handlers: Record<string, (payload: any) => Promise<void>>;
};
