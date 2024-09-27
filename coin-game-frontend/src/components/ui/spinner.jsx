import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        default: "w-5 h-5",
        sm: "w-4 h-4",
        lg: "w-8 h-8",
      },
      color: {
        default: "text-primary",
        secondary: "text-secondary",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
);

const Spinner = React.forwardRef(
  ({ className, size, color, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(spinnerVariants({ size, color, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants };