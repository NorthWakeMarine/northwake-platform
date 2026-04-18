import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes under /pro that require an authenticated session.
// Expand this regex as dashboard pages are added.
const PROTECTED = /^\/pro\/(dashboard|clients|vessels|schedule|settings)(\/.*)?$/;

// Security headers applied to every response
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options":           "DENY",
  "X-Content-Type-Options":    "nosniff",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control":    "off",
  "X-Download-Options":        "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block access to protected dashboard routes without a session cookie
  if (PROTECTED.test(pathname)) {
    const session = request.cookies.get("nwm_pro_session");
    if (!session?.value) {
      const loginUrl = new URL("/pro", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Stamp every response with security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|images/).*)"],
};
