import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  EdgeSessionPayload,
} from "@/lib/sessionEdge";
import { validateCsrfRequest, isMutationMethod } from "@/lib/csrf";

// Routes that strictly require the "pemilik" (Store Owner) role
const OWNER_ONLY_ROUTES = ["/dashboard", "/inventaris", "/laporan", "/audit"];

// Routes that require any authenticated user ("kasir" or "pemilik")
const AUTH_ROUTES = ["/pos", "/riwayat", ...OWNER_ONLY_ROUTES];

/**
 * Checks if a pathname matches or is a sub-path of any route in the list.
 */
function isMatchingRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Next.js Edge Middleware Route Guard.
 *
 * Runs before pages are rendered on the server to prevent:
 * 1. Cross-Site Request Forgery (CSRF) & untrusted origin mutations.
 * 2. Unauthorized access to protected routes without a valid session.
 * 3. Privilege escalation (RBAC) where cashiers attempt to access owner-only pages.
 * 4. Client UI flicker caused by client-only redirects.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Request Origin & CSRF Header Validation for state-modifying requests (POST, PUT, PATCH, DELETE)
  // Protects all endpoints (including /api/* and server mutations) from Cross-Site Request Forgery
  if (isMutationMethod(req.method)) {
    const csrfCheck = validateCsrfRequest(req);
    if (!csrfCheck.valid) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          {
            error: "CSRF_FORBIDDEN",
            message: csrfCheck.reason || "Cross-site request forgery detected.",
          },
          { status: 403 }
        );
      }
      return new NextResponse(
        `403 Forbidden: ${csrfCheck.reason || "Cross-Site Request Forgery detected"}`,
        { status: 403 }
      );
    }
  }

  // 2. Bypass public API routes, Next internals, mobile scan pairing, and favicon
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/scan") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Extract and cryptographically verify httpOnly session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  let session: EdgeSessionPayload | null = null;
  let isTampered = false;

  if (sessionCookie?.value) {
    const verification = await verifySessionToken(sessionCookie.value);
    if (verification.valid && verification.payload) {
      session = verification.payload;
    } else {
      isTampered = true;
    }
  }

  // 3. Handle Login Page (/login)
  if (pathname === "/login") {
    // If explicit logout action requested, purge session cookie and allow login page access
    if (
      req.nextUrl.searchParams.get("action") === "logout" ||
      req.nextUrl.searchParams.has("logout")
    ) {
      const res = NextResponse.next();
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    // If user already has a valid session, redirect away to their respective workspace
    if (session) {
      const destination = session.role === "pemilik" ? "/dashboard" : "/pos";
      return NextResponse.redirect(new URL(destination, req.url), 307);
    }

    // If corrupted or tampered cookie is detected, purge it on the login page
    if (isTampered && sessionCookie) {
      const res = NextResponse.next();
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    return NextResponse.next();
  }

  // 4. Handle Root (/)
  if (pathname === "/") {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url), 307);
    }
    const destination = session.role === "pemilik" ? "/dashboard" : "/pos";
    return NextResponse.redirect(new URL(destination, req.url), 307);
  }

  // 5. Handle Protected Application Routes
  const isAuthRequired = isMatchingRoute(pathname, AUTH_ROUTES);

  if (isAuthRequired) {
    // Case A: Unauthenticated or Invalid Session
    if (!session) {
      // If tampered/forged token was sent, redirect with security alert and delete corrupted cookie
      if (isTampered && sessionCookie) {
        const loginUrl = new URL("/login?security_alert=tampering_detected", req.url);
        const res = NextResponse.redirect(loginUrl, 307);
        res.cookies.delete(SESSION_COOKIE_NAME);
        return res;
      }

      // Standard unauthenticated redirect with 307 Temporary Redirect
      const loginUrl = new URL(
        `/login?redirect=${encodeURIComponent(pathname)}`,
        req.url
      );
      return NextResponse.redirect(loginUrl, 307);
    }

    // Case B: Authenticated User with Role-Based Access Control (RBAC)
    const isOwnerRoute = isMatchingRoute(pathname, OWNER_ONLY_ROUTES);

    if (isOwnerRoute && session.role !== "pemilik") {
      // Kasir attempting to access Owner-only routes (/dashboard, /inventaris, /laporan)
      // Instant server-side 307 redirect to POS workspace without client bundle flicker
      const posUrl = new URL("/pos?alert=unauthorized_owner_only", req.url);
      return NextResponse.redirect(posUrl, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
