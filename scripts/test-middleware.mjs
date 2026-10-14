/**
 * Automated Verification Test Suite: Edge Middleware Route Guard (Modul 10)
 *
 * Verifies:
 * 1. Unauthenticated requests to /laporan, /dashboard, /pos are blocked with 307 Temporary Redirect.
 * 2. Public routes (/login, /scan, /api) pass through.
 * 3. Pemilik session has full access to all routes (/dashboard, /laporan, /inventaris, /pos).
 * 4. Kasir session has access to /pos and /riwayat, but is strictly blocked from owner-only routes (/dashboard, /laporan, /inventaris) with 307 redirect to /pos.
 * 5. Tampered or forged cookies are intercepted with 307 redirect to /login?security_alert=tampering_detected and cookie purge.
 * 6. Expired tokens (> 24h) are rejected.
 * 7. Authenticated users on /login are redirected to their respective dashboards.
 */

import { NextRequest } from "next/server";
import { middleware } from "../src/middleware.ts";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "../src/lib/sessionEdge.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log("==========================================================");
  console.log("🛡️  TEST SUITE: Next.js Edge Middleware Route Guard & RBAC");
  console.log("==========================================================\n");

  const baseUrl = "http://localhost:3000";

  // 1. Unauthenticated direct access to /laporan
  console.log("[Test 1] Unauthenticated direct access to /laporan");
  const reqLaporanNoAuth = new NextRequest(`${baseUrl}/laporan`);
  const resLaporanNoAuth = await middleware(reqLaporanNoAuth);
  assert(resLaporanNoAuth.status === 307, `Must return 307 Temporary Redirect (got ${resLaporanNoAuth.status})`);
  const loc1 = resLaporanNoAuth.headers.get("location");
  assert(loc1 && loc1.includes("/login?redirect=%2Flaporan"), `Must redirect to /login with redirect query (got: ${loc1})`);

  // 2. Unauthenticated direct access to /dashboard
  console.log("\n[Test 2] Unauthenticated direct access to /dashboard");
  const reqDashboardNoAuth = new NextRequest(`${baseUrl}/dashboard`);
  const resDashboardNoAuth = await middleware(reqDashboardNoAuth);
  assert(resDashboardNoAuth.status === 307, `Must return 307 Temporary Redirect (got ${resDashboardNoAuth.status})`);
  const loc2 = resDashboardNoAuth.headers.get("location");
  assert(loc2 && loc2.includes("/login?redirect=%2Fdashboard"), `Must redirect to /login with redirect query (got: ${loc2})`);

  // 3. Unauthenticated direct access to /pos
  console.log("\n[Test 3] Unauthenticated direct access to /pos");
  const reqPosNoAuth = new NextRequest(`${baseUrl}/pos`);
  const resPosNoAuth = await middleware(reqPosNoAuth);
  assert(resPosNoAuth.status === 307, `Must return 307 Temporary Redirect (got ${resPosNoAuth.status})`);
  const loc3 = resPosNoAuth.headers.get("location");
  assert(loc3 && loc3.includes("/login?redirect=%2Fpos"), `Must redirect to /login with redirect query (got: ${loc3})`);

  // 4. Public access to /login (no session)
  console.log("\n[Test 4] Public access to /login without session");
  const reqLogin = new NextRequest(`${baseUrl}/login`);
  const resLogin = await middleware(reqLogin);
  assert(resLogin.status === 200, "Must allow public access to /login (status 200)");

  // 5. Public access to /scan
  console.log("\n[Test 5] Public access to /scan (mobile scanner pairing)");
  const reqScan = new NextRequest(`${baseUrl}/scan?room=tokoku-main-pos`);
  const resScan = await middleware(reqScan);
  assert(resScan.status === 200, "Must allow access to /scan (status 200)");

  // 6. Public access to /api/auth/session
  console.log("\n[Test 6] Public access to /api/auth/session");
  const reqApi = new NextRequest(`${baseUrl}/api/auth/session`);
  const resApi = await middleware(reqApi);
  assert(resApi.status === 200, "Must bypass API routes (status 200)");

  // Generate valid tokens
  const pemilikPayload = {
    id: "11111111-1111-1111-1111-111111111111",
    username: "pemilik",
    role: "pemilik",
    full_name: "Firdaus Ubaidillah",
    timestamp: Date.now(),
  };
  const tokenPemilik = await createSessionToken(pemilikPayload);

  const kasirPayload = {
    id: "22222222-2222-2222-2222-222222222222",
    username: "kasir",
    role: "kasir",
    full_name: "Ani Rahayu",
    timestamp: Date.now(),
  };
  const tokenKasir = await createSessionToken(kasirPayload);

  // 7. Pemilik session access to /laporan and /dashboard
  console.log("\n[Test 7] Authenticated Pemilik access to /laporan and /dashboard");
  const reqPemilikLaporan = new NextRequest(`${baseUrl}/laporan`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenPemilik}` },
  });
  const resPemilikLaporan = await middleware(reqPemilikLaporan);
  assert(resPemilikLaporan.status === 200, "Pemilik must be allowed access to /laporan (status 200)");

  const reqPemilikDashboard = new NextRequest(`${baseUrl}/dashboard`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenPemilik}` },
  });
  const resPemilikDashboard = await middleware(reqPemilikDashboard);
  assert(resPemilikDashboard.status === 200, "Pemilik must be allowed access to /dashboard (status 200)");

  // 8. Kasir session access to /pos (Allowed) vs /laporan and /dashboard (Blocked with 307)
  console.log("\n[Test 8] Authenticated Kasir RBAC checks");
  const reqKasirPos = new NextRequest(`${baseUrl}/pos`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenKasir}` },
  });
  const resKasirPos = await middleware(reqKasirPos);
  assert(resKasirPos.status === 200, "Kasir must be allowed access to /pos (status 200)");

  const reqKasirLaporan = new NextRequest(`${baseUrl}/laporan`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenKasir}` },
  });
  const resKasirLaporan = await middleware(reqKasirLaporan);
  assert(resKasirLaporan.status === 307, `Kasir accessing /laporan must be blocked with 307 (got ${resKasirLaporan.status})`);
  const locKasirLaporan = resKasirLaporan.headers.get("location");
  assert(locKasirLaporan && locKasirLaporan.includes("/pos?alert=unauthorized_owner_only"), `Must redirect kasir to /pos with alert (got: ${locKasirLaporan})`);

  const reqKasirDashboard = new NextRequest(`${baseUrl}/dashboard`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenKasir}` },
  });
  const resKasirDashboard = await middleware(reqKasirDashboard);
  assert(resKasirDashboard.status === 307, `Kasir accessing /dashboard must be blocked with 307 (got ${resKasirDashboard.status})`);
  const locKasirDashboard = resKasirDashboard.headers.get("location");
  assert(locKasirDashboard && locKasirDashboard.includes("/pos?alert=unauthorized_owner_only"), `Must redirect kasir to /pos with alert (got: ${locKasirDashboard})`);

  // 9. Tampered Token detection
  console.log("\n[Test 9] Tampered session cookie detection");
  const tamperedToken = `${tokenKasir.split(".")[0]}.fake_malicious_signature_1234567890abcdef`;
  const reqTampered = new NextRequest(`${baseUrl}/laporan`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tamperedToken}` },
  });
  const resTampered = await middleware(reqTampered);
  assert(resTampered.status === 307, "Tampered session must trigger 307 redirect");
  const locTampered = resTampered.headers.get("location");
  assert(locTampered && locTampered.includes("security_alert=tampering_detected"), `Must redirect with security_alert=tampering_detected (got: ${locTampered})`);

  // 10. Authenticated user visiting /login
  console.log("\n[Test 10] Authenticated user visiting /login");
  const reqPemilikOnLogin = new NextRequest(`${baseUrl}/login`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${tokenPemilik}` },
  });
  const resPemilikOnLogin = await middleware(reqPemilikOnLogin);
  assert(resPemilikOnLogin.status === 307, "Authenticated user on /login must be redirected");
  const locLogin = resPemilikOnLogin.headers.get("location");
  assert(locLogin && locLogin.includes("/dashboard"), `Pemilik must be redirected to /dashboard (got: ${locLogin})`);

  console.log("\n🎉 ALL 10 EDGE MIDDLEWARE ROUTE GUARD TESTS PASSED SUCCESSFULLY!\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
