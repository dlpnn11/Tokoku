import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#6FA084] text-white hover:bg-[#5A8A6F] active:bg-[#4E7A60]",
        secondary:
          "bg-white border-[1.5px] border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5]",
        danger:
          "bg-[#D64545] text-white hover:bg-[#B83636] active:bg-[#9E2E2E]",
        warning:
          "bg-white border-[1.5px] border-[#E8A838] text-[#E8A838] hover:bg-[#FDF9F0]",
        outline:
          "bg-white border border-[#E5E5E0] text-[#1A1A1A] hover:bg-[#F9F9F7]",
        ghost:
          "bg-transparent text-[#1A1A1A] hover:bg-[#F4F4F0]",
        charcoal:
          "bg-[#2C2C2C] text-white hover:bg-[#1A1A1A]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
