import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy (CSP) Directives tailored for Next.js & Supabase
const cspDirectives = [
  // Default restriction: only load resources from the application's origin
  "default-src 'self'",
  // Next.js App Router hydration and script execution
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // CSS styles: Tailwind CSS injected styles and inline styles
  "style-src 'self' 'unsafe-inline'",
  // Images: self, data URIs for qrcode generator, blobs for receipt image export, and HTTPS product images
  "img-src 'self' data: blob: https:",
  // Fonts: self and data for next/font/google local bundled assets
  "font-src 'self' data:",
  // Connections: only TokoKu origin and Supabase REST/Realtime channels
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${isDev ? "ws: http: localhost:*" : ""}`,
  // Media: audio beeping on scan and camera video stream for barcode scanner
  "media-src 'self' blob: data:",
  // Anti-object injection: strictly block Flash, Java applets, and plugins
  "object-src 'none'",
  // Base URI restriction: prevent base href hijacking
  "base-uri 'self'",
  // Form submission: only allow forms submitted to self
  "form-action 'self'",
  // Anti-Clickjacking via CSP: align with X-Frame-Options DENY
  "frame-ancestors 'none'",
  // Production SSL enforcement
  ...(isDev ? [] : ["block-all-mixed-content", "upgrade-insecure-requests"]),
];

const contentSecurityPolicy = cspDirectives
  .map((directive) => directive.trim().replace(/\s+/g, " "))
  .filter(Boolean)
  .join("; ");

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
  // Content Security Policy: Strict browser defense against XSS, injection, and unauthorized data exfiltration
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
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
