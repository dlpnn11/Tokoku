import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
  {
    variants: {
      variant: {
        default: "bg-[#6FA084] text-white",
        kasir: "bg-[#6B7280] text-white",
        success: "bg-[#6FA084] text-white",
        warning: "bg-[#FDF3E1] text-[#C47D15] border border-[#F5D8A5]",
        danger: "bg-[#FDEAEA] text-[#D64545] border border-[#F8BEBE]",
        outline: "text-[#1A1A1A] border border-[#E5E5E0] bg-white",
        chip: "bg-white text-[#1A1A1A] border border-[#E5E5E0] hover:border-[#6FA084] hover:text-[#6FA084] cursor-pointer",
        chipActive: "bg-[#6FA084] text-white border border-[#6FA084] cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
