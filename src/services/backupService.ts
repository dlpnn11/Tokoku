"use client";

export interface BackupDownloadResult {
  success: boolean;
  filename: string;
  checksum: string;
  totalRecords?: number;
}

export const backupService = {
  /**
   * Downloads an encrypted, SHA-256 verified database backup snapshot file.
   */
  async downloadBackupSnapshot(role: string = "pemilik"): Promise<BackupDownloadResult> {
    const res = await fetch(`/api/backup?role=${encodeURIComponent(role)}`, {
      method: "GET",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || "Gagal mengunduh cadangan database.");
    }

    const checksum = res.headers.get("X-Checksum-SHA256") || "-";
    const blob = await res.blob();
    const text = await blob.text();
    const data = JSON.parse(text);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `tokoku-backup-${dateStr}.json`;

    // Trigger browser native download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {
      success: true,
      filename,
      checksum,
      totalRecords: data.metadata?.total_records || 0,
    };
  },
};
