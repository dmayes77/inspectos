import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware for route protection and role-based access control
 *
 * This middleware runs on all routes and:
 * 1. Protects authenticated routes (/admin, /inspector)
 * 2. Redirects authenticated users away from auth pages (login, register)
 * 3. Enforces role-based access (Inspector vs Admin/Owner/Office)
 */
export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production" || process.env.BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Get the user session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;

  const publicRoutes = [
    "/",
    "/pricing",
    "/about",
    "/contact",
    "/features",
    "/blog",
    "/privacy",
    "/terms",
    "/offline",
  ];

  // Auth routes (login, register)
  const authRoutes = ["/login", "/register", "/invite"];

  // Public booking and report viewing routes
  const publicServiceRoutes =
    pathname === "/book" ||
    pathname.startsWith("/book/") ||
    pathname === "/report" ||
    pathname.startsWith("/report/");

  // Check if the current path is public
  const isPublicRoute = publicRoutes.includes(pathname) || publicServiceRoutes;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    const dashboardUrl = getDashboardUrl(userRole);
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Allow access to public routes and API routes
  if (isPublicRoute || pathname.startsWith("/api/") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Protect authenticated routes
  if (!isAuthenticated && !isAuthRoute) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (isAuthenticated) {
    // Inspector routes - only accessible by INSPECTOR role
    if (pathname.startsWith("/inspector")) {
      if (userRole !== "INSPECTOR") {
        // Redirect non-inspectors to admin dashboard
        return NextResponse.redirect(new URL("/admin/overview", request.url));
      }
    }

    // Admin routes - accessible by OWNER, ADMIN, OFFICE_STAFF (not INSPECTOR)
    if (pathname.startsWith("/admin")) {
      if (userRole === "INSPECTOR") {
        // Redirect inspectors to their dashboard
        return NextResponse.redirect(new URL("/inspector/schedule", request.url));
      }
    }

    // Platform admin routes - only for super admins (future feature)
    if (pathname.startsWith("/platform")) {
      // For now, allow access - implement platform admin check later
      // if (userRole !== "PLATFORM_ADMIN") {
      //   return NextResponse.redirect(new URL(getDashboardUrl(userRole), request.url));
      // }
    }
  }

  return NextResponse.next();
}

/**
 * Helper function to get the appropriate dashboard URL based on user role
 */
function getDashboardUrl(role: string | undefined): string {
  if (role === "INSPECTOR") {
    return "/inspector/schedule";
  } else if (role === "OWNER" || role === "ADMIN" || role === "OFFICE_STAFF") {
    return "/admin/overview";
  }
  // Default to inspector dashboard
  return "/inspector/schedule";
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
