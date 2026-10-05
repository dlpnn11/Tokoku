"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Solid flat overlay without blur */}
      <div
        className="fixed inset-0 bg-[#000000] opacity-60 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative z-10 w-[240px] h-full flex flex-col bg-[#2C2C2C] shadow-2xl">
        {/* Close Button Header */}
        <div className="flex justify-end p-2 border-b border-[#3D3D3D]">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9E9E9E] hover:text-white hover:bg-[#3D3D3D] transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <Sidebar className="w-full flex-1" onNavClick={onClose} />
      </div>
    </div>
  );
}
