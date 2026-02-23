import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS Proxy for Central API
 * Allows the web app (localhost:3000) to make requests to the API (localhost:4000)
 */
export function proxy(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '';

  // Allowed origins (local dev + Vercel deployments)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://dev.inspectos.co', // Development deployment
    'https://inspectos.co', // Production deployment
    process.env.NEXT_PUBLIC_WEB_URL, // Dynamic web app URL (prod or dev)
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, // Vercel preview deployments
  ].filter(Boolean);

  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};
