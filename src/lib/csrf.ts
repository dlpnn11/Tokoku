/**
 * CSRF and Request Origin Validation Utility.
 * Defense-in-depth protection for state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * Enforces W3C Fetch Metadata (Sec-Fetch-Site) and strict Origin/Referer matching
 * to prevent Cross-Site Request Forgery (CSRF) across all TokoKu POS routes and APIs.
 */

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
  origin?: string | null;
  host?: string | null;
  secFetchSite?: string | null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Returns true if the HTTP method can mutate server or session state.
 */
export function isMutationMethod(method: string): boolean {
  if (!method) return false;
  return !SAFE_METHODS.has(method.toUpperCase());
}

/**
 * Normalizes host by removing default ports (80 for http, 443 for https),
 * trailing slashes, and converting to lowercase.
 */
export function normalizeHost(rawHost: string): string {
  if (!rawHost) return "";
  let host = rawHost.toLowerCase().trim();
  // Strip protocol if mistakenly passed
  if (host.startsWith("http://")) host = host.slice(7);
  if (host.startsWith("https://")) host = host.slice(8);
  // Strip trailing path or slash
  host = host.split("/")[0].trim();
  // Strip default ports
  if (host.endsWith(":80")) host = host.slice(0, -3);
  if (host.endsWith(":443")) host = host.slice(0, -4);
  return host;
}

/**
 * Checks whether two hosts are strictly equivalent or valid local loopback aliases.
 */
export function areHostsEquivalent(hostA: string, hostB: string): boolean {
  const normA = normalizeHost(hostA);
  const normB = normalizeHost(hostB);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // In local development or local cashier network, allow loopback equivalences (localhost vs 127.0.0.1)
  const [nameA, portA = ""] = normA.split(":");
  const [nameB, portB = ""] = normB.split(":");

  const isLoopbackA =
    nameA === "localhost" ||
    nameA === "127.0.0.1" ||
    nameA === "::1" ||
    nameA === "[::1]";

  const isLoopbackB =
    nameB === "localhost" ||
    nameB === "127.0.0.1" ||
    nameB === "::1" ||
    nameB === "[::1]";

  if (isLoopbackA && isLoopbackB && portA === portB) {
    return true;
  }

  return false;
}

export interface MinimalRequest {
  method: string;
  headers: {
    get(name: string): string | null;
  };
}

/**
 * Validates request origin and headers against Cross-Site Request Forgery (CSRF).
 *
 * Edge Runtime and Node.js compatible (uses only standard Web APIs).
 *
 * @param req The incoming request (NextRequest or standard Request)
 * @param explicitAllowedOrigins Optional explicit whitelist of origins
 * @returns CsrfValidationResult
 */
export function validateCsrfRequest(
  req: MinimalRequest,
  explicitAllowedOrigins: string[] = []
): CsrfValidationResult {
  const method = req.method.toUpperCase();

  // 1. Safe methods (GET, HEAD, OPTIONS) do not mutate state and are exempt from CSRF rejection
  if (!isMutationMethod(method)) {
    return { valid: true };
  }

  const secFetchSite = req.headers.get("sec-fetch-site")?.toLowerCase() || null;
  const origin = req.headers.get("origin") || null;
  const referer = req.headers.get("referer") || null;

  // Extract authoritative server host (checks X-Forwarded-Host from reverse proxies first)
  const forwardedHost = req.headers.get("x-forwarded-host");
  const directHost = req.headers.get("host");
  const rawEffectiveHost = (forwardedHost || directHost || "").split(",")[0].trim();
  const effectiveHost = normalizeHost(rawEffectiveHost);

  // Combine explicit allowed origins with environment variable whitelist if present
  const envAllowed =
    typeof process !== "undefined" && process.env?.TOKOKU_ALLOWED_ORIGINS
      ? process.env.TOKOKU_ALLOWED_ORIGINS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const allowedOrigins = [...explicitAllowedOrigins, ...envAllowed];

  // 2. Fetch Metadata Security: Disallow cross-site requests
  // Browsers set Sec-Fetch-Site automatically as a forbidden header; client scripts cannot spoof it.
  if (secFetchSite === "cross-site") {
    return {
      valid: false,
      reason: "Sec-Fetch-Site indicates an untrusted cross-site request.",
      origin,
      host: effectiveHost,
      secFetchSite,
    };
  }

  // 3. Origin Header Validation
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const originHost = normalizeHost(originUrl.host);

      // Check if origin matches configured allowed origins list
      if (allowedOrigins.length > 0) {
        const matchesAllowed = allowedOrigins.some((allowed) => {
          try {
            return normalizeHost(new URL(allowed).host) === originHost;
          } catch {
            return normalizeHost(allowed) === originHost;
          }
        });
        if (matchesAllowed) {
          return { valid: true, origin, host: effectiveHost, secFetchSite };
        }
      }

      if (!effectiveHost) {
        return {
          valid: false,
          reason: "Missing Host header in mutative request.",
          origin,
          host: effectiveHost,
          secFetchSite,
        };
      }

      if (!areHostsEquivalent(originHost, effectiveHost)) {
        return {
          valid: false,
          reason: `Origin mismatch: expected host '${effectiveHost}', received origin host '${originHost}'.`,
          origin,
          host: effectiveHost,
          secFetchSite,
        };
      }

      return { valid: true, origin, host: effectiveHost, secFetchSite };
    } catch {
      return {
        valid: false,
        reason: "Malformed Origin header in mutative request.",
        origin,
        host: effectiveHost,
        secFetchSite,
      };
    }
  }

  // 4. Fallback to Referer Header Validation (if Origin is absent)
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererHost = normalizeHost(refererUrl.host);

      if (effectiveHost && !areHostsEquivalent(refererHost, effectiveHost)) {
        return {
          valid: false,
          reason: `Referer mismatch: expected host '${effectiveHost}', received referer host '${refererHost}'.`,
          origin: referer,
          host: effectiveHost,
          secFetchSite,
        };
      }

      return { valid: true, origin: referer, host: effectiveHost, secFetchSite };
    } catch {
      return {
        valid: false,
        reason: "Malformed Referer header in mutative request.",
        origin: referer,
        host: effectiveHost,
        secFetchSite,
      };
    }
  }

  // 5. If neither Origin nor Referer is provided:
  // If Sec-Fetch-Site is present and not cross-site (e.g. same-origin or same-site or none), allow it.
  if (secFetchSite && ["same-origin", "same-site", "none"].includes(secFetchSite)) {
    return { valid: true, origin: null, host: effectiveHost, secFetchSite };
  }

  // Direct tool / test scripts without browser headers
  return { valid: true, origin: null, host: effectiveHost, secFetchSite };
}
