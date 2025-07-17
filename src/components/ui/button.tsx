import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "bg-gradient-cta text-white font-semibold hover:bg-gradient-hover hover:scale-105 hover:-translate-y-1 shadow-cta rounded-2xl",
        "cta-outline": "border-2 border-cta-primary text-cta-primary bg-transparent hover:bg-cta-primary hover:text-white hover:scale-105 hover:-translate-y-1 shadow-interactive rounded-2xl font-semibold",
        game: "bg-gradient-primary text-white hover:scale-105 shadow-game transition-all duration-300 rounded-xl",
        "answer-red": "bg-answer-red text-white hover:bg-answer-red/90 hover:scale-105 shadow-answer transition-all duration-200 font-bold rounded-2xl",
        "answer-blue": "bg-answer-blue text-white hover:bg-answer-blue/90 hover:scale-105 shadow-answer transition-all duration-200 font-bold rounded-2xl",
        "answer-yellow": "bg-answer-yellow text-white hover:bg-answer-yellow/90 hover:scale-105 shadow-answer transition-all duration-200 font-bold rounded-2xl",
        "answer-green": "bg-answer-green text-white hover:bg-answer-green/90 hover:scale-105 shadow-answer transition-all duration-200 font-bold rounded-2xl",
        glass: "glass-effect text-white hover:bg-white/20 hover:scale-105 hover:-translate-y-1 shadow-interactive rounded-2xl backdrop-blur-md",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-12 w-12",
        answer: "h-20 sm:h-24 px-6 text-lg",
        hero: "h-16 px-10 text-lg font-bold",
        cta: "h-14 px-8 text-base font-semibold",
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
