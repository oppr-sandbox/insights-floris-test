import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// const badgeVariants = cva(
//   "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
//   {
//     variants: {
//       variant: {
//         default:
//           "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
//         secondary:
//           "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
//         destructive:
//           "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
//         outline: "text-foreground",
//         success:
//           "border-transparent bg-green-500 text-white hover:bg-green-600",
//       },
//     },
//     defaultVariants: {
//       variant: "default",
//     },
//   }
// )

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        solid: "",
        outline: "bg-transparent border",
      },
      color: {
        default: "text-primary-foreground border-transparent",
        secondary: "text-secondary-foreground border-transparent",
        tertiary: "text-white border-transparent",
        destructive: "text-white border-transparent",
        success: "text-white border-transparent",
        warning: "text-white border-transparent",
        muted: "text-white border-transparent",
      },
    },
    compoundVariants: [

      {
        variant: "solid",
        color: "default",
        class: "bg-primary",
      },
      {
        variant: "solid",
        color: "secondary",
        class: "bg-secondary",
      },
      {
        variant: "solid",
        color: "tertiary",
        class: "bg-tertiary",
      },
      {
        variant: "solid",
        color: "destructive",
        class: "bg-destructive",
      },
      {
        variant: "solid",
        color: "success",
        class: "bg-success",
      },
      {
        variant: "solid",
        color: "warning",
        class: "bg-warning",
      },
      {
        variant: "solid",
        color: "muted",
        class: "bg-muted-foreground/40",
      },
      {
        variant: "outline",
        color: "default",
        class: "text-primary-foreground border-primary bg-primary/50",
      },
      {
        variant: "outline",
        color: "secondary",
        class: "text-secondary border-secondary bg-secondary/20",
      },
      {
        variant: "outline",
        color: "tertiary",
        class: "text-tertiary-foreground border-tertiary bg-tertiary/20",
      },
      {
        variant: "outline",
        color: "destructive",
        class: "text-destructive-foreground border-destructive bg-destructive/20",
      },
      {
        variant: "outline",
        color: "success",
        class: "text-success-foreground border-success bg-success/20",
      },
      {
        variant: "outline",
        color: "warning",
        class: "text-warning-foreground border-warning bg-warning/20",
      },
      {
        variant: "outline",
        color: "muted",
        class: "text-muted-foreground border-muted-foreground bg-muted",
      },
    ],
    defaultVariants: {
      variant: "solid",
      color: "default",
    },
  }
)

function Badge({
  className,
  variant,
  color,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> &
  { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, color }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }