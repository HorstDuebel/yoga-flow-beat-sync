import { NextRequest } from "next/server";
import { handlers } from "auth";

const AUTH_BASE = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000";

/** Erstellt NextRequest mit 127.0.0.1 (Spotify erlaubt kein localhost). */
function withAuthOrigin(req: NextRequest): NextRequest {
  const path = req.nextUrl.pathname + req.nextUrl.search;
  const url = AUTH_BASE.replace(/\/$/, "") + path;
  return new NextRequest(url, {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
  });
}

async function handle(method: "GET" | "POST", req: NextRequest) {
  const handler = method === "GET" ? handlers.GET : handlers.POST;
  return handler(withAuthOrigin(req));
}

export const GET = (req: NextRequest) => handle("GET", req);
export const POST = (req: NextRequest) => handle("POST", req);
