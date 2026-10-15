/**
 * Automated Verification Test Suite: HTTP Security Response Headers (Modul 11)
 *
 * Verifies:
 * 1. next.config.ts properly defines and exports the async headers() function.
 * 2. All incoming application routes (/:path*) are covered by the security header configuration.
 * 3. Anti-Clickjacking header (X-Frame-Options: DENY) is strictly applied.
 * 4. Anti-MIME-sniffing header (X-Content-Type-Options: nosniff) is strictly applied.
 * 5. Privacy protection header (Referrer-Policy: strict-origin-when-cross-origin) is present.
 * 6. Permissions-Policy restricts microphone and geolocation while safely keeping camera=(self) for POS scanning.
 * 7. HSTS header enforces HTTPS for 1 year with includeSubDomains and preload.
 * 8. Modern protection headers (X-DNS-Prefetch-Control, Cross-Origin-Opener-Policy) are configured.
 */

import rawConfig from "../next.config.ts";

const nextConfig = (rawConfig && rawConfig.default) ? rawConfig.default : rawConfig;

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
  console.log("🛡️  TEST SUITE: HTTP Security Response Headers (Modul 11)");
  console.log("==========================================================\n");

  // 1. Verify headers function existence
  console.log("[Test 1] Verify nextConfig.headers() function existence");
  assert(
    typeof nextConfig.headers === "function",
    "nextConfig must have an async headers() function defined"
  );

  const headerConfigs = await nextConfig.headers();
  assert(
    Array.isArray(headerConfigs) && headerConfigs.length > 0,
    "nextConfig.headers() must return a non-empty array of route header objects"
  );

  // 2. Verify global route matching rule
  console.log("\n[Test 2] Verify global route matching rule (/:path*)");
  const globalHeaderConfig = headerConfigs.find(
    (cfg) => cfg.source === "/:path*" || cfg.source === "/(.*)"
  );
  assert(
    Boolean(globalHeaderConfig),
    `Must have a wildcard route matcher such as '/:path*' or '/(.*)' (found: ${headerConfigs.map((c) => c.source).join(", ")})`
  );

  const headers = globalHeaderConfig.headers;
  assert(
    Array.isArray(headers) && headers.length > 0,
    "Global header config must specify a list of headers"
  );

  const headerMap = new Map();
  for (const h of headers) {
    headerMap.set(h.key.toLowerCase(), h.value);
  }

  // 3. X-Frame-Options (Clickjacking defense)
  console.log("\n[Test 3] Verify X-Frame-Options (Clickjacking defense)");
  const xFrame = headerMap.get("x-frame-options");
  assert(
    xFrame === "DENY",
    `X-Frame-Options must be strictly 'DENY' to protect cashier UI from clickjacking (got: '${xFrame}')`
  );

  // 4. X-Content-Type-Options (MIME Sniffing defense)
  console.log("\n[Test 4] Verify X-Content-Type-Options (MIME Sniffing defense)");
  const xContentType = headerMap.get("x-content-type-options");
  assert(
    xContentType === "nosniff",
    `X-Content-Type-Options must be 'nosniff' (got: '${xContentType}')`
  );

  // 5. Referrer-Policy (Information leakage defense)
  console.log("\n[Test 5] Verify Referrer-Policy (Information leakage defense)");
  const referrerPolicy = headerMap.get("referrer-policy");
  assert(
    referrerPolicy === "strict-origin-when-cross-origin",
    `Referrer-Policy must be 'strict-origin-when-cross-origin' (got: '${referrerPolicy}')`
  );

  // 6. Permissions-Policy (Hardware & API restriction)
  console.log("\n[Test 6] Verify Permissions-Policy (Camera preserved for POS, mic/geo disabled)");
  const permissionsPolicy = headerMap.get("permissions-policy");
  assert(
    Boolean(permissionsPolicy),
    "Permissions-Policy must be present"
  );
  assert(
    permissionsPolicy.includes("camera=(self)"),
    `Permissions-Policy must allow camera=(self) for POS barcode/QR scanner (got: '${permissionsPolicy}')`
  );
  assert(
    permissionsPolicy.includes("microphone=()"),
    `Permissions-Policy must disable microphone=() (got: '${permissionsPolicy}')`
  );
  assert(
    permissionsPolicy.includes("geolocation=()"),
    `Permissions-Policy must disable geolocation=() (got: '${permissionsPolicy}')`
  );

  // 7. Strict-Transport-Security (HSTS)
  console.log("\n[Test 7] Verify Strict-Transport-Security (HSTS)");
  const hsts = headerMap.get("strict-transport-security");
  assert(
    Boolean(hsts),
    "Strict-Transport-Security header must be present"
  );
  assert(
    hsts.includes("max-age=31536000"),
    `HSTS must have max-age of at least 31536000 (1 year) (got: '${hsts}')`
  );
  assert(
    hsts.includes("includeSubDomains"),
    `HSTS must include 'includeSubDomains' directive (got: '${hsts}')`
  );
  assert(
    hsts.includes("preload"),
    `HSTS must include 'preload' directive (got: '${hsts}')`
  );

  // 8. Supplementary enterprise headers
  console.log("\n[Test 8] Verify Supplementary Enterprise Headers");
  const dnsPrefetch = headerMap.get("x-dns-prefetch-control");
  assert(
    dnsPrefetch === "on",
    `X-DNS-Prefetch-Control should be 'on' (got: '${dnsPrefetch}')`
  );

  const coop = headerMap.get("cross-origin-opener-policy");
  assert(
    coop === "same-origin",
    `Cross-Origin-Opener-Policy should be 'same-origin' (got: '${coop}')`
  );

  console.log("\n==========================================================");
  console.log("🎉 ALL 8 TESTS PASSED: HTTP Security Response Headers Verified!");
  console.log("==========================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
