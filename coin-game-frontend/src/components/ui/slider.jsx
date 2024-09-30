import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const sliderVariants = cva(
  "relative flex items-center select-none touch-none w-full h-5",
  {
    variants: {
      variant: {
        default: "bg-input",
      },
      size: {
        default: "h-5",
        sm: "h-4",
        lg: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Slider = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(sliderVariants({ variant, size }), className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative bg-muted flex-grow rounded-full h-1">
          <SliderPrimitive.Range className="absolute bg-primary rounded-full h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block w-4 h-4 bg-primary rounded-full shadow focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 disabled:bg-muted" />
      </SliderPrimitive.Root>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
