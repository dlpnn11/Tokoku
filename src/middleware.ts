import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  EdgeSessionPayload,
} from "@/lib/sessionEdge";

// Routes that strictly require the "pemilik" (Store Owner) role
const OWNER_ONLY_ROUTES = ["/dashboard", "/inventaris", "/laporan"];

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
 * 1. Unauthorized access to protected routes without a valid session.
 * 2. Privilege escalation (RBAC) where cashiers attempt to access owner-only pages.
 * 3. Client UI flicker caused by client-only redirects.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bypass public API routes, Next internals, mobile scan pairing, and favicon
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
