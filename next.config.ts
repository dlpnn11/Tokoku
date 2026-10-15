import type { NextConfig } from "next";

const securityHeaders = [
  // Anti-Clickjacking: Strictly prevent embedding TokoKu in any iframe
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Anti-MIME Sniffing: Prevent browsers from trying to guess MIME types
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Privacy & Leak Prevention: Restrict Referer header on cross-origin requests
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Feature Restriction: Allow camera for self (POS barcode/QR scanner), disable mic and geolocation
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  // HTTP Strict Transport Security (HSTS): Force HTTPS for 1 year with subdomains and preload
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // DNS Prefetch Control: Standard optimization for Next.js external resource resolution
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // Cross-Origin Isolation: Prevent cross-origin tabs from accessing window references
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
