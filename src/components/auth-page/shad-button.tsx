import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * A CVA-based button scoped to `auth-page/` only: the shared, app-wide
 * `src/components/ui/Button.tsx` has a different API (`variant` values,
 * no `size`/`asChild`) and is used across the whole app, so this is kept
 * separate rather than replacing it. Colours map to our own CSS tokens
 * (globals.css), not shadcn's default `bg-primary`/`border-input` theme;
 * those custom properties don't exist here.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-colors outline-none focus-visible:border-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-accent-strong",
        destructive: "bg-loss text-white hover:brightness-90",
        outline:
          "border border-hairline-strong bg-surface text-ink hover:bg-surface-sunken",
        secondary: "bg-surface-sunken text-ink hover:bg-hairline",
        ghost: "text-ink-2 hover:bg-surface-sunken hover:text-ink",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[var(--radius-sm)] px-3",
        lg: "h-11 rounded-[var(--radius-sm)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
