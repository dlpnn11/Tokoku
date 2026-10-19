import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { validateCsrfRequest } from "@/lib/csrf";
import { getSafeErrorMessage } from "@/lib/errorHandler";

const SESSION_COOKIE_NAME = "tokoku_session";
const SERVER_SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "tokoku_server_private_session_secret_defense_in_depth_2026_strict_hmac";

interface SessionPayload {
  id: string;
  username: string;
  role: "pemilik" | "kasir";
  full_name: string;
  timestamp: number;
}

function signToken(data: string): string {
  return crypto
    .createHmac("sha256", SERVER_SESSION_SECRET)
    .update(data)
    .digest("hex");
}

function verifyToken(token: string): { valid: boolean; payload?: SessionPayload } {
  try {
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return { valid: false };

    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const expectedSig = signToken(payloadBase64);

    // Pre-hash both strings with SHA-256 to ensure uniform 32-byte buffers
    // Completely eliminates length mismatch errors and timing leaks
    const hashSig = crypto.createHash("sha256").update(signature).digest();
    const hashExpected = crypto.createHash("sha256").update(expectedSig).digest();

    if (!crypto.timingSafeEqual(hashSig, hashExpected)) {
      return { valid: false };
    }

    const payload = JSON.parse(payloadJson) as SessionPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

/**
 * GET: Verifies the httpOnly session cookie and returns authoritative user identity.
 */
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie || !cookie.value) {
    return NextResponse.json({ authenticated: false, message: "No session cookie" });
  }

  const { valid, payload } = verifyToken(cookie.value);
  if (!valid || !payload) {
    // If invalid or tampered, clear corrupted cookie
    const res = NextResponse.json({
      authenticated: false,
      message: "Session cookie signature invalid or tampered",
    });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      full_name: payload.full_name,
    },
  });
}

/**
 * POST: Issues an httpOnly, SameSite=Strict session cookie upon successful login.
 */
export async function POST(req: NextRequest) {
  const csrfCheck = validateCsrfRequest(req);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, message: csrfCheck.reason || "Cross-site request forgery detected." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const user = body?.user;

    if (!user || !user.id || !user.role || !user.username) {
      return NextResponse.json(
        { success: false, message: "Invalid user session payload" },
        { status: 400 }
      );
    }

    const sessionPayload: SessionPayload = {
      id: user.id,
      username: user.username,
      role: user.role === "pemilik" ? "pemilik" : "kasir",
      full_name: user.full_name || user.username,
      timestamp: Date.now(),
    };

    const payloadBase64 = Buffer.from(JSON.stringify(sessionPayload)).toString("base64");
    const signature = signToken(payloadBase64);
    const token = `${payloadBase64}.${signature}`;

    const res = NextResponse.json({
      success: true,
      message: "Secure session cookie established.",
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: getSafeErrorMessage(err, {
          fallbackMessage: "Gagal membuat sesi login.",
          context: "SessionPostRoute",
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Clears the httpOnly session cookie upon logout.
 */
export async function DELETE(req: NextRequest) {
  const csrfCheck = validateCsrfRequest(req);
  if (!csrfCheck.valid) {
    return NextResponse.json(
      { success: false, message: csrfCheck.reason || "Cross-site request forgery detected." },
      { status: 403 }
    );
  }

  const res = NextResponse.json({
    success: true,
    message: "Session cookie destroyed.",
  });

  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
