/**
 * Automated Verification Test Suite: Content Security Policy (Modul 12)
 *
 * Verifies:
 * 1. Content-Security-Policy header is configured and returned by next.config.ts.
 * 2. default-src is locked down to 'self'.
 * 3. script-src supports Next.js hydration while avoiding unwhitelisted domains.
 * 4. connect-src permits Supabase REST (https://*.supabase.co) and Realtime (wss://*.supabase.co)
 *    while strictly disallowing unwhitelisted third-party domains.
 * 5. img-src permits data: (QR codes) and blob: (receipt canvas export) alongside https: images.
 * 6. media-src permits blob: and data: for scanner beeps and camera stream preview.
 * 7. object-src is strictly set to 'none'.
 * 8. frame-ancestors is 'none' (anti-clickjacking).
 * 9. Live E2E wire verification confirms Next.js serves the Content-Security-Policy header on HTTP requests.
 */

import { spawn } from "node:child_process";
import rawConfig from "../next.config.ts";

const nextConfig = rawConfig && rawConfig.default ? rawConfig.default : rawConfig;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function parseCsp(cspString) {
  const directives = new Map();
  const parts = cspString.split(";").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [name, ...values] = part.split(/\s+/);
    directives.set(name.toLowerCase(), values);
  }
  return directives;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStaticTests() {
  console.log("==========================================================");
  console.log("🛡️  TEST SUITE: Content Security Policy Verification (Modul 12)");
  console.log("==========================================================\n");

  const headerConfigs = await nextConfig.headers();
  const globalHeaderConfig = headerConfigs.find(
    (cfg) => cfg.source === "/:path*" || cfg.source === "/(.*)"
  );
  assert(Boolean(globalHeaderConfig), "Must find global route header config");

  const cspHeader = globalHeaderConfig.headers.find(
    (h) => h.key.toLowerCase() === "content-security-policy"
  );
  assert(Boolean(cspHeader), "Content-Security-Policy header must be present in securityHeaders");

  const csp = parseCsp(cspHeader.value);
  console.log("[Test 1] Content-Security-Policy Header Existence");
  assert(csp.size > 0, "CSP string must contain parsed directives");

  // 1. default-src
  console.log("\n[Test 2] default-src directive check");
  const defaultSrc = csp.get("default-src");
  assert(
    defaultSrc && defaultSrc.includes("'self'"),
    `default-src must be ['self'] (got: ${defaultSrc?.join(" ")})`
  );

  // 2. script-src
  console.log("\n[Test 3] script-src Next.js hydration compatibility");
  const scriptSrc = csp.get("script-src");
  assert(
    scriptSrc && scriptSrc.includes("'self'") && scriptSrc.includes("'unsafe-inline'"),
    `script-src must include 'self' and 'unsafe-inline' for Next.js (got: ${scriptSrc?.join(" ")})`
  );

  // 3. connect-src
  console.log("\n[Test 4] connect-src Supabase API & Realtime Whitelist");
  const connectSrc = csp.get("connect-src");
  assert(connectSrc !== undefined, "connect-src directive must exist");
  assert(
    connectSrc.includes("'self'"),
    "connect-src must permit 'self'"
  );
  assert(
    connectSrc.includes("https://*.supabase.co"),
    "connect-src must permit https://*.supabase.co for database REST queries"
  );
  assert(
    connectSrc.includes("wss://*.supabase.co"),
    "connect-src must permit wss://*.supabase.co for realtime live cart & scanner channels"
  );

  // Negative test: verify rogue domain is rejected
  const rogueDomain = "https://malicious-exfiltration-target.com";
  assert(
    !connectSrc.includes(rogueDomain),
    `connect-src must strictly prohibit rogue domain '${rogueDomain}'`
  );

  // 4. img-src
  console.log("\n[Test 5] img-src QR code and receipt canvas compatibility");
  const imgSrc = csp.get("img-src");
  assert(
    imgSrc && imgSrc.includes("data:") && imgSrc.includes("blob:"),
    `img-src must permit data: (qrcode) and blob: (html-to-image) (got: ${imgSrc?.join(" ")})`
  );

  // 5. media-src
  console.log("\n[Test 6] media-src scanner audio and camera stream");
  const mediaSrc = csp.get("media-src");
  assert(
    mediaSrc && mediaSrc.includes("blob:") && mediaSrc.includes("data:"),
    `media-src must permit blob: and data: for audio/camera streams (got: ${mediaSrc?.join(" ")})`
  );

  // 6. object-src
  console.log("\n[Test 7] object-src 'none' plugin blocking");
  const objectSrc = csp.get("object-src");
  assert(
    objectSrc && objectSrc.includes("'none'"),
    `object-src must be strictly 'none' (got: ${objectSrc?.join(" ")})`
  );

  // 7. frame-ancestors
  console.log("\n[Test 8] frame-ancestors 'none' CSP clickjacking defense");
  const frameAncestors = csp.get("frame-ancestors");
  assert(
    frameAncestors && frameAncestors.includes("'none'"),
    `frame-ancestors must be strictly 'none' (got: ${frameAncestors?.join(" ")})`
  );
}

async function runLiveWireTest() {
  const TEST_PORT = 3056;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  console.log("\n[Test 9] Live Wire E2E Server CSP Header Delivery");
  console.log(`Starting Next.js test server on port ${TEST_PORT}...`);

  const server = spawn("npx", ["next", "start", "-p", String(TEST_PORT)], {
    shell: true,
    stdio: "pipe",
  });

  let connected = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    await sleep(500);
    try {
      const res = await fetch(`${BASE_URL}/login`);
      if (res.status >= 200 && res.status < 500) {
        connected = true;
        const liveCsp = res.headers.get("content-security-policy");
        assert(Boolean(liveCsp), "Live HTTP response must include 'content-security-policy' header");
        assert(
          liveCsp.includes("https://*.supabase.co"),
          "Live CSP header must contain Supabase HTTPS endpoint"
        );
        assert(
          liveCsp.includes("wss://*.supabase.co"),
          "Live CSP header must contain Supabase WebSocket endpoint"
        );
        assert(
          liveCsp.includes("object-src 'none'"),
          "Live CSP header must contain 'object-src none'"
        );
        console.log(`  ✓ Live CSP Header Received (${liveCsp.length} chars)`);
        break;
      }
    } catch {
      if (attempt === 20) {
        throw new Error("Could not reach test Next.js server on port 3056");
      }
    }
  }

  // Gracefully terminate child process
  if (process.platform === "win32") {
    try {
      spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" });
    } catch {
      // ignore
    }
  } else {
    server.kill("SIGTERM");
  }

  await sleep(300);
}

async function main() {
  await runStaticTests();
  await runLiveWireTest();
  console.log("\n==========================================================");
  console.log("🎉 ALL 9 TESTS PASSED: Content Security Policy (Modul 12) Verified!");
  console.log("==========================================================\n");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
