import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as SpinnerPrimitive from "@radix-ui/react-spinner";

const spinnerVariants = cva(
  "inline-block rounded-full border-4 animate-spin",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
      },
      color: {
        primary: "border-t-primary",
        secondary: "border-t-secondary",
        accent: "border-t-accent",
      },
    },
    defaultVariants: {
      size: "md",
      color: "primary",
    },
  }
);

const Spinner = React.forwardRef(
  ({ className, size, color, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : SpinnerPrimitive.Root;
    return (
      <Comp
        className={cn(spinnerVariants({ size, color, className }))}
        ref={ref}
        {...props}
        role="status"
      >
        <SpinnerPrimitive.Circle />
        <span className="sr-only">Loading...</span>
      </Comp>
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };