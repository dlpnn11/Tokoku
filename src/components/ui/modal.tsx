"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop (solid flat overlay with opacity, NO BLUR/NO GRADIENT) */}
      <div
        className="fixed inset-0 bg-[#000000] opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl bg-white border border-[#E5E5E0] shadow-xl transition-all",
          maxWidthClass
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-[#E5E5E0] p-5">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-[#1A1A1A] leading-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-[#6B7280]">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#9E9E9E] hover:bg-[#F4F4F0] hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
