"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  className,
  dropdownClassName,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "h-10 w-full px-3.5 rounded-xl border border-[#E5E5E0] bg-white text-xs md:text-sm font-medium text-[#1A1A1A]",
          "flex items-center justify-between gap-2.5 transition-all cursor-pointer",
          "hover:border-[#6FA084] hover:bg-[#FAFBF9]",
          "focus:outline-none focus:border-[#6FA084] focus:ring-2 focus:ring-[#6FA084]/20",
          isOpen && "border-[#6FA084] ring-2 ring-[#6FA084]/20",
          disabled && "opacity-50 cursor-not-allowed bg-[#F4F4F0]"
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#6B7280] transition-transform duration-200 shrink-0",
            isOpen && "transform rotate-180 text-[#6FA084]"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1.5 w-full min-w-[180px] bg-white rounded-xl border border-[#E5E5E0] shadow-lg py-1.5 z-50",
            "max-h-60 overflow-y-auto scrollbar-thin",
            dropdownClassName
          )}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#6B7280] text-center">
              Tidak ada pilihan
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-[calc(100%-8px)] mx-1 px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-left flex items-center justify-between transition-colors cursor-pointer",
                    isSelected
                      ? "bg-[#EBF3EE] text-[#6FA084] font-bold"
                      : "text-[#1A1A1A] hover:bg-[#F4F8F5] hover:text-[#6FA084]"
                  )}
                >
                  <span className="truncate flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#6FA084] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
