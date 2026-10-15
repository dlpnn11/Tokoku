/**
 * Live End-to-End HTTP Response Headers Verification (Modul 11)
 *
 * Spawns production Next.js server on an ephemeral port (3055),
 * issues an HTTP request to /login, and inspects raw HTTP response headers.
 */

import { spawn } from "node:child_process";

const TEST_PORT = 3055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyLiveHeaders() {
  console.log("==========================================================");
  console.log("🌐  LIVE E2E HTTP RESPONSE HEADERS VERIFICATION");
  console.log("==========================================================\n");

  console.log(`Starting Next.js production server on port ${TEST_PORT}...`);
  // On Windows, npx is a cmd file, so we use shell: true
  const server = spawn("npx", ["next", "start", "-p", String(TEST_PORT)], {
    shell: true,
    stdio: "pipe",
  });

  server.stdout.on("data", (data) => {
    // console.log(`[Next.js Server]: ${data}`);
  });
  server.stderr.on("data", (data) => {
    // console.error(`[Next.js Error]: ${data}`);
  });

  let connected = false;
  for (let attempt = 1; attempt <= 20; attempt++) {
    await sleep(500);
    try {
      const res = await fetch(`${BASE_URL}/login`);
      if (res.status >= 200 && res.status < 500) {
        connected = true;
        console.log(`✅ Connected to Next.js server on port ${TEST_PORT} (status ${res.status})\n`);

        console.log("Inspecting live response headers:");
        console.log("--------------------------------");
        const requiredHeaders = [
          "x-frame-options",
          "x-content-type-options",
          "referrer-policy",
          "permissions-policy",
          "strict-transport-security",
          "x-dns-prefetch-control",
          "cross-origin-opener-policy",
        ];

        let allValid = true;
        for (const h of requiredHeaders) {
          const val = res.headers.get(h);
          if (val) {
            console.log(`  ✓ ${h}: "${val}"`);
          } else {
            console.error(`  ❌ Missing header: ${h}`);
            allValid = false;
          }
        }

        // Specific assertions
        if (res.headers.get("x-frame-options") !== "DENY") {
          throw new Error(`Expected X-Frame-Options: DENY, got ${res.headers.get("x-frame-options")}`);
        }
        if (res.headers.get("x-content-type-options") !== "nosniff") {
          throw new Error(`Expected X-Content-Type-Options: nosniff`);
        }
        if (res.headers.get("referrer-policy") !== "strict-origin-when-cross-origin") {
          throw new Error(`Expected Referrer-Policy: strict-origin-when-cross-origin`);
        }
        if (!res.headers.get("permissions-policy")?.includes("camera=(self)")) {
          throw new Error(`Expected Permissions-Policy to include camera=(self)`);
        }
        if (!res.headers.get("strict-transport-security")?.includes("max-age=31536000")) {
          throw new Error(`Expected Strict-Transport-Security to include max-age=31536000`);
        }

        if (!allValid) {
          throw new Error("One or more required security headers were missing!");
        }

        console.log("\n==========================================================");
        console.log("🎉 SUCCESS: All HTTP Security Headers verified over live wire!");
        console.log("==========================================================\n");
        break;
      }
    } catch (e) {
      if (attempt === 20) {
        console.error("Failed to connect to test server after 20 attempts:", e.message);
        throw e;
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

  // Allow stdio handles to drain cleanly before exit
  await sleep(300);
}

verifyLiveHeaders()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
