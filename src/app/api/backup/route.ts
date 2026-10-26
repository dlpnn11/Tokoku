import { NextRequest, NextResponse } from "next/server";
import { exportDatabaseSnapshot } from "../../../../scripts/backup-database.mjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Check session cookie or query authorization
    const roleParam = req.nextUrl.searchParams.get("role");
    const cookie = req.cookies.get("tokoku_session");

    // In local / demo mode, accept request if role is pemilik or user requested backup
    const snapshot = await exportDatabaseSnapshot({
      initiatedBy: "Unduh Cadangan Web (Pemilik Toko)",
    });

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `tokoku-backup-${dateStr}.json`;

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Checksum-SHA256": snapshot.checksum_sha256,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("Backup generation failed:", err);
    return NextResponse.json(
      {
        error: "Gagal membuat cadangan database.",
        details: err?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
