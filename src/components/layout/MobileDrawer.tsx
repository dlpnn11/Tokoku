"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // Prevent body scrolling when drawer is open
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

  const handleClose = React.useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  }, [onClose]);

  // Handle ESC key press to close drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden overflow-hidden pointer-events-none transition-all duration-300",
        isOpen && "pointer-events-auto"
      )}
      inert={!isOpen}
    >
      {/* Solid flat overlay with fade transition */}
      <div
        className={cn(
          "fixed inset-0 bg-black transition-opacity duration-300 ease-in-out",
          isOpen
            ? "opacity-60 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Drawer content with slide transition from left */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-10 w-[240px] h-full flex flex-col bg-[#2C2C2C] shadow-2xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        )}
      >
        {/* Close Button Header */}
        <div className="flex justify-end p-2 border-b border-[#3D3D3D]">
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#9E9E9E] hover:text-white hover:bg-[#3D3D3D] active:scale-90 transition-all cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <Sidebar className="w-full flex-1" onNavClick={handleClose} />
      </div>
    </div>
  );
}
