// ============================================================
// EZVisit — Next.js Middleware (Rate Limiting for API Routes)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// --- In-Memory Rate Limiter ---
// Simple sliding-window rate limiter. Works for single-instance deployments.
// For multi-instance (e.g., Vercel serverless), replace with @upstash/ratelimit.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;  // max 20 requests per minute per IP

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60_000);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): { limited: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return { limited: true, retryAfterMs: entry.resetAt - now };
  }

  return { limited: false, retryAfterMs: 0 };
}

// --- Security Headers ---
const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Block non-POST methods on our API endpoints
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Rate limit check
    const ip = getClientIp(request);
    const { limited, retryAfterMs } = isRateLimited(ip);

    if (limited) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            ...securityHeaders,
          },
        }
      );
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to API routes and pages (skip static assets, _next, etc.)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
