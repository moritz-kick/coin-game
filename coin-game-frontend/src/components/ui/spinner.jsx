import * as React from "react";
import { Spinner as RadixSpinner } from "@radix-ui/themes";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

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
  ({ className, size, color, ...props }, ref) => {
    return (
      <RadixSpinner
        className={cn(spinnerVariants({ size, color, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };