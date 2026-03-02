import { NextRequest, NextResponse } from "next/server";

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  const exact = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "capacitor://localhost",
    "ionic://localhost",
    "https://inspectos.co",
    "https://www.inspectos.co",
    "https://app.inspectos.co",
    "https://platform.inspectos.co",
    "https://agent.inspectos.co",
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean));

  if (exact.has(origin)) return true;
  return (
    /^https:\/\/(?:[a-z0-9-]+\.)*inspectos\.co$/i.test(origin) ||
    /^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app$/i.test(origin)
  );
}

export function applyCorsHeaders(response: Response, request: NextRequest): Response {
  const origin = request.headers.get("origin") ?? "";
  if (!isAllowedOrigin(origin)) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin, Access-Control-Request-Headers");
  return response;
}

export function buildCorsPreflightResponse(request: NextRequest, methods: string): NextResponse {
  const origin = request.headers.get("origin") ?? "";
  const requestedHeaders = request.headers.get("access-control-request-headers");
  const response = new NextResponse(null, { status: 204 });

  if (isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Access-Control-Allow-Methods", methods);
  response.headers.set("Access-Control-Allow-Headers", requestedHeaders || "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin, Access-Control-Request-Headers");

  return response;
}
