import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium gap-2 rounded-sm transition disabled:cursor-not-allowed [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
        outline:
          "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]",
        destructive:
          "bg-red-500 text-white shadow-theme-xs hover:bg-red-600 disabled:bg-red-300",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
        link:
          "bg-transparent text-brand-500 underline-offset-4 hover:underline dark:text-brand-400",
      },
      size: {
        sm:      "px-4 py-3 text-sm",
        md:      "px-5 py-3.5 text-sm",
        icon:    "size-10 text-sm",
        "icon-sm": "size-8 text-sm",
        "icon-lg": "size-11 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  startIcon,
  endIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const isDisabled = disabled || loading

  // When asChild, pass children directly without icon wrappers
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        {...props}
      >
        {children}
      </Comp>
    )
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin shrink-0" />
      ) : startIcon ? (
        <span className="shrink-0 size-4 flex items-center justify-center">{startIcon}</span>
      ) : null}
      {children}
      {!loading && endIcon && (
        <span className="shrink-0 size-4 flex items-center justify-center">{endIcon}</span>
      )}
    </button>
  )
}

export { Button, buttonVariants }
