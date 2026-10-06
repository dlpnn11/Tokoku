"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone?: string; address?: string }) => Promise<void>;
}

export function SupplierModal({ isOpen, onClose, onSubmit }: SupplierModalProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      setName("");
      setPhone("");
      setAddress("");
      onClose();
    } catch (err: any) {
      alert("Gagal menambah supplier: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Supplier Baru"
      description="Catat kontak dan alamat pemasok / agen kulakan barang warung."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Nama Supplier / Toko Grosir
          </label>
          <Input
            placeholder="Contoh: UD Minuman Nusantara"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Nomor Telepon / WhatsApp
          </label>
          <Input
            placeholder="Contoh: 081234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#1A1A1A] block mb-1">
            Alamat Gudang / Toko
          </label>
          <Input
            placeholder="Contoh: Jl. Pasar Induk No. 12"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E5E5E0]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Menyimpan..." : "Tambah Supplier"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
