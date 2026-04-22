import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /pro sub-routes that require an authenticated session
const PROTECTED_PRO = /^\/pro\/(dashboard|contacts|leads|integrations|editor|clients|vessels|schedule|settings)(\/.*)?$/;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options":                    "DENY",
  "X-Content-Type-Options":             "nosniff",
  "Referrer-Policy":                    "strict-origin-when-cross-origin",
  "Permissions-Policy":                 "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security":          "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control":             "off",
  "X-Download-Options":                 "noopen",
  "X-Permitted-Cross-Domain-Policies":  "none",
};

function supabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
}

const SUPABASE_READY =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://") ?? false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Skip auth checks entirely until real Supabase credentials are in .env.local
  if (!SUPABASE_READY) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  const supabase = supabaseMiddlewareClient(request, response);

  // Refresh session so auth cookies stay alive on every request
  const { data: { user } } = await supabase.auth.getUser();

  // ── /pro (login page) — skip if already authenticated
  if (pathname === "/pro" && user) {
    return NextResponse.redirect(new URL("/pro/dashboard", request.url));
  }

  // ── /pro/(dashboard|clients|...) — require Supabase session
  if (PROTECTED_PRO.test(pathname) && !user) {
    const loginUrl = new URL("/pro", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Stamp every response with security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|images/).*)"],
};
