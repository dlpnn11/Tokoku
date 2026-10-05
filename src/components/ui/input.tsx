import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#E5E5E0] bg-white px-3.5 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9E9E9E] focus-visible:outline-none focus-visible:border-[#6FA084] focus-visible:ring-1 focus-visible:ring-[#6FA084] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
