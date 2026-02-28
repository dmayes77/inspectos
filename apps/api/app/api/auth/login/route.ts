import { NextRequest, NextResponse } from "next/server";
import { badRequest, createAnonClient, unauthorized } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth/session-cookies";
import { logger } from "@/lib/logger";

type LoginBody = {
  email?: string;
  password?: string;
};

function parseJwtIssuer(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    return typeof decoded?.iss === "string" ? decoded.iss : null;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string) {
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
    "https://inspectos.co",
    "https://www.inspectos.co",
    "https://app.inspectos.co",
    "https://dev-app.inspectos.co",
    "https://agent.inspectos.co",
    "https://dev-agent.inspectos.co",
  ]);
  if (exact.has(origin)) return true;
  return /^https:\/\/(?:[a-z0-9-]+\.)*inspectos\.co$/i.test(origin);
}

function applyCorsHeaders(response: Response, origin: string) {
  if (!isAllowedOrigin(origin)) return response;
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin, Access-Control-Request-Headers");
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const requestHeaders = request.headers.get("access-control-request-headers");
  const response = new NextResponse(null, { status: 204 });
  const allowed = isAllowedOrigin(origin);
  logger.info("Auth login preflight", {
    origin,
    allowed,
    requestHeaders,
  });
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", requestHeaders || "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin, Access-Control-Request-Headers");
  return response;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  try {
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const email = body.email?.trim();
    const password = body.password;
    logger.info("Auth login request", {
      origin,
      allowedOrigin: isAllowedOrigin(origin),
      hasEmail: Boolean(email),
      hasPassword: Boolean(password),
    });

    if (!email || !password) {
      logger.warn("Auth login validation failed", {
        origin,
        hasEmail: Boolean(email),
        hasPassword: Boolean(password),
      });
      return applyCorsHeaders(badRequest("Email and password are required."), origin);
    }

    const supabase = createAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      logger.warn("Auth login failed", {
        origin,
        hasSession: Boolean(data?.session),
        reason: error?.message ?? "invalid_credentials",
      });
      return applyCorsHeaders(unauthorized(error?.message || "Invalid email or password."), origin);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user?.id ?? null,
          email: data.user?.email ?? null,
        },
      },
    });

    logger.info("Auth login succeeded", {
      origin,
      userId: data.user?.id ?? null,
      email: data.user?.email ?? null,
      tokenIssuer: parseJwtIssuer(data.session.access_token),
      refreshTokenLength: data.session.refresh_token?.length ?? 0,
    });
    return applyCorsHeaders(
      setSessionCookies(response, {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      }),
      origin
    );
  } catch (error) {
    logger.error("Auth login unexpected error", {
      origin,
    }, error);
    return applyCorsHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Login request failed.",
        },
        { status: 500 }
      ),
      origin
    );
  }
}
