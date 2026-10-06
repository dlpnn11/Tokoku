"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export function CategoryModal({ isOpen, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (err: any) {
      alert("Gagal menambah kategori: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Kategori Baru"
      description="Kelompokkan produk warung agar mudah difilter di POS dan inventaris."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Nama Kategori
          </label>
          <Input
            placeholder="Contoh: Frozen Food / Bumbu Dapur"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E5E5E0]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Menyimpan..." : "Tambah Kategori"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
