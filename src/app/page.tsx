"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Store, ShoppingCart, LayoutGrid, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (currentUser?.role === "pemilik") {
      router.replace("/dashboard");
    } else {
      router.replace("/pos");
    }
  }, [isAuthenticated, currentUser?.role, router]);

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center p-6 text-[#1A1A1A] select-none">
      <div className="max-w-md w-full bg-white border border-[#E5E5E0] rounded-2xl p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#6FA084] flex items-center justify-center text-white mx-auto shadow-sm">
          <Store className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">TokoKu POS</h1>
          <p className="text-xs text-[#6B7280]">
            Sistem Kasir & Manajemen Inventaris Warung Kelontong Modern
          </p>
        </div>

        <div className="p-3 bg-[#F4F4F0] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#6FA084]" />
            <span className="font-semibold text-[#1A1A1A]">Masuk Sebagai:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={currentUser.role === "pemilik" ? "default" : "kasir"}>
              {currentUser.full_name} ({currentUser.role === "pemilik" ? "Pemilik" : "Kasir"})
            </Badge>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            className="w-full h-11 text-sm font-bold gap-2"
            onClick={() => router.push("/pos")}
          >
            Buka Terminal POS Kasir
            <ArrowRight className="w-4 h-4" />
          </Button>

          {currentUser.role === "pemilik" && (
            <Button
              variant="outline"
              className="w-full h-10 text-xs font-semibold"
              onClick={() => router.push("/dashboard")}
            >
              Buka Dashboard Pemilik
            </Button>
          )}
        </div>

        <p className="text-[11px] text-[#9E9E9E]">
          Mengarahkan otomatis ke terminal kasir dalam beberapa detik...
        </p>
      </div>
    </div>
  );
}
