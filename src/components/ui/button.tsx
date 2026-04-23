import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#C9A14A] text-black hover:bg-[#B8903E] active:bg-[#A0803A] focus-visible:ring-[#C9A14A] focus-visible:ring-offset-slate-950",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600",
        outline:
          "border border-white/20 bg-white/5 hover:bg-white/10 text-white focus-visible:ring-[#C9A14A]",
        secondary:
          "bg-white/10 text-white hover:bg-white/20 active:bg-white/30 focus-visible:ring-white/40",
        ghost: "text-white hover:bg-white/10 active:bg-white/20 focus-visible:ring-white/40",
        link: "text-[#C9A14A] underline-offset-4 hover:underline focus-visible:ring-[#C9A14A]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
