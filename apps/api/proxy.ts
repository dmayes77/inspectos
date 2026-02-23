import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS Proxy for Central API
 * Allows local apps (localhost:3000 / localhost:3001) to make requests to the API (localhost:4000)
 */
export function proxy(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '';

  const allowedExactOrigins = new Set(
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3003',
      'https://inspectos.co',
      'https://www.inspectos.co',
      'https://app.inspectos.co',
      'https://platform.inspectos.co',
      'https://agent.inspectos.co',
      process.env.NEXT_PUBLIC_WEB_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter(Boolean)
  );

  const allowedPatternOrigins = [
    /^https:\/\/(?:[a-z0-9-]+\.)*inspectos\.co$/i, // dev-app.inspectos.co, preview subdomains, etc.
    /^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app$/i,
  ];

  const isAllowedOrigin =
    allowedExactOrigins.has(origin) ||
    allowedPatternOrigins.some((pattern) => pattern.test(origin));
  const requestedHeaders = request.headers.get('access-control-request-headers');
  const allowHeaders = requestedHeaders && requestedHeaders.trim().length > 0
    ? requestedHeaders
    : 'Content-Type, Authorization';

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', allowHeaders);
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin, Access-Control-Request-Headers');

    return response;
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: '/api/:path*', // Apply to all API routes
};
