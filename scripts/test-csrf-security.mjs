/**
 * Automated Verification Test Suite: Request Origin & CSRF Header Validation (Modul 13)
 *
 * Verifies:
 * 1. Safe HTTP methods (GET, HEAD, OPTIONS) bypass CSRF checks.
 * 2. State-modifying methods (POST, PUT, PATCH, DELETE) undergo strict origin/header validation.
 * 3. Legitimate same-origin requests are permitted across desktop POS and local cashier environments.
 * 4. Reverse-proxy setups with X-Forwarded-Host are correctly honored.
 * 5. Sec-Fetch-Site: cross-site is immediately blocked with 403 Forbidden.
 * 6. External rogue origins (e.g., https://malicious-site.com) are rejected with 403 Forbidden.
 * 7. Host/Origin port mismatches and subdomain impersonations are strictly rejected.
 * 8. Malformed Origin and Referer headers fail safely with 403 Forbidden.
 * 9. Edge Middleware perimeter intercepts cross-site mutations before API route handlers.
 * 10. Route handler secondary defense rejects untrusted origins independently.
 */

import { NextRequest } from "next/server";
import {
  validateCsrfRequest,
  isMutationMethod,
  normalizeHost,
  areHostsEquivalent,
} from "../src/lib/csrf.ts";
import { middleware } from "../src/middleware.ts";
import { POST as sessionPostHandler, DELETE as sessionDeleteHandler } from "../src/app/api/auth/session/route.ts";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    process.exit(1);
  }
}

async function runCsrfTestSuite() {
  console.log("==========================================================");
  console.log("🛡️  TEST SUITE: Request Origin & CSRF Validation (Modul 13)");
  console.log("==========================================================\n");

  const serverHost = "localhost:3000";
  const serverOrigin = `http://${serverHost}`;

  // 1. Safe vs Mutative Methods
  console.log("[Test 1] Safe vs Mutative Method Classification");
  assert(!isMutationMethod("GET"), "GET is classified as safe");
  assert(!isMutationMethod("HEAD"), "HEAD is classified as safe");
  assert(!isMutationMethod("OPTIONS"), "OPTIONS is classified as safe");
  assert(isMutationMethod("POST"), "POST is classified as state mutation");
  assert(isMutationMethod("PUT"), "PUT is classified as state mutation");
  assert(isMutationMethod("PATCH"), "PATCH is classified as state mutation");
  assert(isMutationMethod("DELETE"), "DELETE is classified as state mutation");

  // 2. Host Normalization and Equivalence
  console.log("\n[Test 2] Host Normalization and Loopback Equivalence");
  assert(normalizeHost("LOCALHOST:3000") === "localhost:3000", "Host is lowercased");
  assert(normalizeHost("http://example.com:80/") === "example.com", "Protocol and default port :80 stripped");
  assert(normalizeHost("https://tokoku.pos.id:443") === "tokoku.pos.id", "Default SSL port :443 stripped");
  assert(areHostsEquivalent("localhost:3000", "127.0.0.1:3000"), "Loopback localhost and 127.0.0.1 on same port match");
  assert(!areHostsEquivalent("localhost:3000", "localhost:8080"), "Different ports do not match");
  assert(!areHostsEquivalent("tokoku.id", "evil-tokoku.id"), "Distinct external domains do not match");

  // 3. Legitimate Same-Origin Requests
  console.log("\n[Test 3] Legitimate Same-Origin Mutations");
  const validSameOriginReq = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      origin: serverOrigin,
      "sec-fetch-site": "same-origin",
    }),
  };
  const resValid = validateCsrfRequest(validSameOriginReq);
  assert(resValid.valid === true, "Valid same-origin POST is allowed");

  const validDeleteReq = {
    method: "DELETE",
    headers: new Headers({
      host: serverHost,
      origin: serverOrigin,
      "sec-fetch-site": "same-origin",
    }),
  };
  assert(validateCsrfRequest(validDeleteReq).valid === true, "Valid same-origin DELETE is allowed");

  // 4. Reverse Proxy Header (X-Forwarded-Host)
  console.log("\n[Test 4] Reverse Proxy X-Forwarded-Host Handling");
  const proxyReq = {
    method: "POST",
    headers: new Headers({
      host: "internal-loadbalancer:8000",
      "x-forwarded-host": "tokoku.myretail.com",
      origin: "https://tokoku.myretail.com",
      "sec-fetch-site": "same-origin",
    }),
  };
  assert(validateCsrfRequest(proxyReq).valid === true, "Matches against X-Forwarded-Host behind proxy");

  // 5. Referer Header Fallback
  console.log("\n[Test 5] Referer Header Matching when Origin is Omitted");
  const refererReq = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      referer: "http://localhost:3000/pos",
      "sec-fetch-site": "same-origin",
    }),
  };
  assert(validateCsrfRequest(refererReq).valid === true, "Valid same-origin Referer is permitted");

  // 6. Explicit & Environment Whitelist
  console.log("\n[Test 6] Explicit Allowed Origins Whitelist");
  const explicitReq = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      origin: "http://192.168.1.50:3000",
      "sec-fetch-site": "same-site",
    }),
  };
  const whitelistRes = validateCsrfRequest(explicitReq, ["http://192.168.1.50:3000"]);
  assert(whitelistRes.valid === true, "Explicitly whitelisted origin passes verification");

  // 7. ATTACK SCENARIO: Sec-Fetch-Site: cross-site
  console.log("\n[Test 7] Attack Mitigation: Sec-Fetch-Site cross-site Rejection");
  const crossSiteReq = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      origin: "https://malicious-ad-tracker.xyz",
      "sec-fetch-site": "cross-site",
    }),
  };
  const crossSiteRes = validateCsrfRequest(crossSiteReq);
  assert(crossSiteRes.valid === false, "Sec-Fetch-Site cross-site is rejected");
  assert(
    crossSiteRes.reason.includes("cross-site"),
    `Rejection reason contains 'cross-site' (got: ${crossSiteRes.reason})`
  );

  // 8. ATTACK SCENARIO: External Rogue Origin
  console.log("\n[Test 8] Attack Mitigation: Untrusted External Origin Mismatch");
  const rogueOriginReq = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      origin: "https://evil-phishing-attacker.com",
    }),
  };
  const rogueRes = validateCsrfRequest(rogueOriginReq);
  assert(rogueRes.valid === false, "Untrusted rogue origin is rejected");
  assert(
    rogueRes.reason.includes("Origin mismatch"),
    `Rejection reason indicates Origin mismatch (got: ${rogueRes.reason})`
  );

  // 9. ATTACK SCENARIO: Subdomain Impersonation & Port Tampering
  console.log("\n[Test 9] Attack Mitigation: Subdomain & Port Tampering");
  const subdomainAttack = {
    method: "POST",
    headers: new Headers({
      host: "tokoku.id",
      origin: "https://tokoku.id.attacker.com",
    }),
  };
  assert(validateCsrfRequest(subdomainAttack).valid === false, "Subdomain spoofing is blocked");

  const portAttack = {
    method: "POST",
    headers: new Headers({
      host: "localhost:3000",
      origin: "http://localhost:8080",
    }),
  };
  assert(validateCsrfRequest(portAttack).valid === false, "Port mismatch attack is blocked");

  // 10. ATTACK SCENARIO: Malformed Headers
  console.log("\n[Test 10] Attack Mitigation: Malformed Origin/Referer Strings");
  const malformedOrigin = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      origin: "://invalid-uri",
    }),
  };
  assert(validateCsrfRequest(malformedOrigin).valid === false, "Malformed Origin URL is rejected safely");

  const rogueReferer = {
    method: "POST",
    headers: new Headers({
      host: serverHost,
      referer: "https://malicious-payload-source.org/exploit.html",
    }),
  };
  assert(validateCsrfRequest(rogueReferer).valid === false, "Untrusted external Referer is rejected");

  // 11. Edge Middleware Live Integration: Perimeter Defense
  console.log("\n[Test 11] Next.js Edge Middleware Perimeter Blocking");
  const rogueApiReq = new NextRequest("http://localhost:3000/api/auth/session", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "https://attacker-payload.com",
      "sec-fetch-site": "cross-site",
      "content-type": "application/json",
    },
    body: JSON.stringify({ user: { id: "pwned" } }),
  });

  const middlewareRes = await middleware(rogueApiReq);
  assert(middlewareRes.status === 403, `Middleware must return 403 Forbidden for cross-site API mutation (got ${middlewareRes.status})`);
  const bodyText = await middlewareRes.text();
  const parsedBody = JSON.parse(bodyText);
  assert(parsedBody.error === "CSRF_FORBIDDEN", `Middleware returns CSRF_FORBIDDEN error code (got ${parsedBody.error})`);

  // Legitimate same-origin API mutation through middleware
  const validApiReq = new NextRequest("http://localhost:3000/api/auth/session", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify({ user: { id: "test", username: "kasir", role: "kasir" } }),
  });
  const validMiddlewareRes = await middleware(validApiReq);
  // Status 200 means middleware permitted the request to proceed to the route handler
  assert(validMiddlewareRes.status === 200, "Middleware permits legitimate same-origin API request (status 200)");

  // Non-API route mutation perimeter defense (e.g. CSRF form submission to /pos)
  const nonApiRogueReq = new NextRequest("http://localhost:3000/pos", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "https://malicious-form.com",
      "sec-fetch-site": "cross-site",
    },
  });
  const nonApiRes = await middleware(nonApiRogueReq);
  assert(nonApiRes.status === 403, `Non-API mutation blocked with 403 Forbidden (got ${nonApiRes.status})`);

  // 12. Route Handler Secondary Defense (Defense-in-Depth)
  console.log("\n[Test 12] Route Handler Secondary Defense Verification");
  const rogueRouteReq = new NextRequest("http://localhost:3000/api/auth/session", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "https://evil-hacker.com",
      "content-type": "application/json",
    },
    body: JSON.stringify({ user: { id: "test" } }),
  });
  const routePostRes = await sessionPostHandler(rogueRouteReq);
  assert(routePostRes.status === 403, `POST route handler directly returns 403 Forbidden for rogue origin (got ${routePostRes.status})`);

  const rogueDeleteReq = new NextRequest("http://localhost:3000/api/auth/session", {
    method: "DELETE",
    headers: {
      host: "localhost:3000",
      origin: "https://evil-hacker.com",
    },
  });
  const routeDeleteRes = await sessionDeleteHandler(rogueDeleteReq);
  assert(routeDeleteRes.status === 403, `DELETE route handler directly returns 403 Forbidden for rogue origin (got ${routeDeleteRes.status})`);

  console.log("\n==========================================================");
  console.log(`🎉 ALL ${passedCount} CSRF & REQUEST ORIGIN TESTS PASSED SUCCESSFULLY!`);
  console.log("==========================================================\n");
}

runCsrfTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
