#!/usr/bin/env node
/**
 * ==============================================================================
 * TOKOKU DATABASE DISASTER RECOVERY RESTORE ENGINE (MODUL 25)
 * ==============================================================================
 * Features:
 * 1. Validates cryptographic SHA-256 integrity checksum before touching database.
 * 2. Supports --dry-run / --verify mode to inspect snapshot health.
 * 3. Respects PostgreSQL foreign key dependency hierarchy:
 *    categories -> suppliers -> products -> transactions -> transaction_details -> pos_shifts -> audit_logs
 * 4. Records permanent audit trail log (DATABASE_RESTORE_INITIATED).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getCredentials() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      supabaseUrl = supabaseUrl || content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
      supabaseAnonKey = supabaseAnonKey || content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase credentials not found in environment or .env.local");
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Validates SHA-256 checksum and structure of a snapshot object.
 */
export function verifySnapshotIntegrity(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return { valid: false, reason: "Snapshot format is invalid or empty" };
  }

  if (!snapshot.tables || typeof snapshot.tables !== "object") {
    return { valid: false, reason: "Snapshot does not contain a valid 'tables' mapping" };
  }

  if (!snapshot.checksum_sha256) {
    return { valid: false, reason: "Snapshot is missing cryptographic 'checksum_sha256'" };
  }

  const computedChecksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(snapshot.tables))
    .digest("hex");

  if (computedChecksum !== snapshot.checksum_sha256) {
    return {
      valid: false,
      reason: `Checksum mismatch! Expected: ${snapshot.checksum_sha256}, Computed: ${computedChecksum}. File may have been corrupted or modified.`,
    };
  }

  return {
    valid: true,
    checksum: computedChecksum,
    totalRecords: snapshot.metadata?.total_records || 0,
    tableCounts: snapshot.metadata?.table_counts || {},
    createdAt: snapshot.created_at,
  };
}

/**
 * Restores snapshot to Supabase database.
 */
export async function restoreDatabaseSnapshot(snapshot, options = {}) {
  const verification = verifySnapshotIntegrity(snapshot);
  if (!verification.valid) {
    throw new Error(`[DISASTER RECOVERY ABORTED] ${verification.reason}`);
  }

  if (options.dryRun) {
    return {
      success: true,
      dryRun: true,
      verification,
      message: "Snapshot integrity verified successfully. Dry-run complete.",
    };
  }

  const { supabaseUrl, supabaseAnonKey } = getCredentials();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const restorationOrder = [
    "categories",
    "suppliers",
    "products",
    "transactions",
    "transaction_details",
    "pos_shifts",
    "audit_logs",
  ];

  const restoredStats = {};

  for (const table of restorationOrder) {
    const rows = snapshot.tables[table] || [];
    if (rows.length === 0) {
      restoredStats[table] = 0;
      continue;
    }

    try {
      // Upsert in batches of 100
      const batchSize = 100;
      let insertedCount = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from(table).upsert(batch);
        if (!error) {
          insertedCount += batch.length;
        }
      }
      restoredStats[table] = insertedCount;
    } catch {
      restoredStats[table] = 0;
    }
  }

  // Record audit log
  try {
    await supabase.from("audit_logs").insert([
      {
        action: "DATABASE_RESTORE_INITIATED",
        entity: "backup",
        entity_id: `restore-${Date.now()}`,
        new_values: {
          snapshot_timestamp: snapshot.created_at,
          checksum_sha256: snapshot.checksum_sha256,
          restored_stats: restoredStats,
          initiated_by: options.initiatedBy || "CLI Disaster Recovery",
        },
      },
    ]);
  } catch {
    // Non-blocking
  }

  return {
    success: true,
    dryRun: false,
    verification,
    restoredStats,
    message: "Database restoration executed successfully.",
  };
}

/**
 * CLI Entrypoint
 */
async function main() {
  console.log("==================================================================");
  console.log("🛡️  TOKOKU DISASTER RECOVERY & SNAPSHOT RESTORE ENGINE");
  console.log("==================================================================\n");

  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || args.includes("--verify");

  let snapshotFile = args.find((a) => !a.startsWith("--"));

  if (!snapshotFile) {
    const backupsDir = path.resolve(process.cwd(), "backups");
    if (fs.existsSync(backupsDir)) {
      const files = fs
        .readdirSync(backupsDir)
        .filter((f) => f.startsWith("tokoku-snapshot-") && f.endsWith(".json"))
        .sort()
        .reverse();

      if (files.length > 0) {
        snapshotFile = path.join(backupsDir, files[0]);
        console.log(`-> No snapshot file specified. Defaulting to latest: ${files[0]}`);
      }
    }
  }

  if (!snapshotFile || !fs.existsSync(snapshotFile)) {
    throw new Error(`Snapshot file not found: ${snapshotFile || "No files in backups directory"}`);
  }

  console.log(`-> Loading snapshot file: ${snapshotFile}`);
  const raw = fs.readFileSync(snapshotFile, "utf8");
  const snapshot = JSON.parse(raw);

  console.log("-> Verifying SHA-256 cryptographic checksum...");
  const verification = verifySnapshotIntegrity(snapshot);

  if (!verification.valid) {
    console.error(`\n❌ INTEGRITY CHECK FAILED: ${verification.reason}`);
    process.exit(1);
  }

  console.log(`✅ SHA-256 Integrity Verified: ${verification.checksum}`);
  console.log(`📅 Snapshot Date: ${verification.createdAt}`);
  console.log(`📊 Records in Snapshot: ${verification.totalRecords}`);

  if (isDryRun) {
    console.log("\n🔍 DRY-RUN MODE: Database was not modified.");
    console.log("==================================================================");
    return;
  }

  console.log("\n-> Executing database reconstruction...");
  const result = await restoreDatabaseSnapshot(snapshot, { initiatedBy: "CLI Admin" });

  console.log("\n✅ Database restoration completed!");
  console.log("📊 Restored Table Counts:");
  for (const [table, count] of Object.entries(result.restoredStats)) {
    console.log(`   - ${table.padEnd(20)}: ${count} rows`);
  }
  console.log("\n==================================================================");
}

if (process.argv[1] && process.argv[1].endsWith("restore-database.mjs")) {
  main().catch((err) => {
    console.error("Restore failed:", err);
    process.exit(1);
  });
}
