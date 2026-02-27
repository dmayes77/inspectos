import { NextRequest, NextResponse } from "next/server";
import { getDashboardBaseUrlFromHost } from "@/lib/dashboard-url";

export function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const dashboardBase = getDashboardBaseUrlFromHost(host);
  const redirectUrl = new URL(`${dashboardBase}/auth/callback`);

  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.append(key, value);
  });

  return NextResponse.redirect(redirectUrl, { status: 307 });
}
