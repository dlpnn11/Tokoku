"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/database";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, id?: string) => Promise<void>;
  categoryToEdit?: (Category & { product_count?: number }) | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  categoryToEdit,
}: CategoryModalProps) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName(categoryToEdit ? categoryToEdit.name : "");
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), categoryToEdit ? categoryToEdit.id : undefined);
      setName("");
      onClose();
    } catch (err: any) {
      alert("Gagal menyimpan kategori: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!categoryToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}
      description={
        isEditing
          ? "Ubah nama kelompok barang warung."
          : "Kelompokkan produk warung agar mudah difilter di POS dan inventaris."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Nama Kategori <span className="text-[#D64545]">*</span>
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
            {loading
              ? "Menyimpan..."
              : isEditing
              ? "Perbarui Kategori"
              : "Tambah Kategori"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
