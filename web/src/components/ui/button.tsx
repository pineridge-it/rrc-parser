"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary with gradient
        primary:
          "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] text-white hover:opacity-90 active:scale-[0.98] shadow-md hover:shadow-lg",
        // Secondary
        secondary:
          "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)]",
        // Outline
        outline:
          "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)]",
        // Destructive
        destructive:
          "bg-[var(--color-error)] text-white hover:opacity-90 active:scale-[0.98] shadow-md",
        // Ghost
        ghost:
          "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]",
        // Link
        link: "text-[var(--color-brand-primary)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Button state types
export type ButtonState = "idle" | "loading" | "success" | "error";

// Extended button props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Get state icon based on button state
const getStateIcon = (state: ButtonState) => {
  switch (state) {
    case "loading":
      return <Loader2 className="animate-spin" />;
    case "success":
      return <Check className="animate-scale-in" />;
    case "error":
      return <X className="animate-shake" />;
    default:
      return null;
  }
};

// Get state text based on button state
const getStateText = (
  state: ButtonState,
  children: React.ReactNode,
  loadingText?: string,
  successText?: string,
  errorText?: string
) => {
  switch (state) {
    case "loading":
      return loadingText || children;
    case "success":
      return successText || "Success!";
    case "error":
      return errorText || "Error";
    default:
      return children;
  }
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      state = "idle",
      loadingText,
      successText,
      errorText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const stateIcon = getStateIcon(state);
    const stateText = getStateText(
      state,
      children,
      loadingText,
      successText,
      errorText
    );

    // Determine if button is in a non-idle state
    const isLoading = state === "loading";
    const isSuccess = state === "success";
    const isError = state === "error";
    const isNonIdle = isLoading || isSuccess || isError;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          // State-specific styles
          isSuccess && "bg-[var(--color-success)]",
          isError && "bg-[var(--color-error)]",
          // Ensure 44px touch target on mobile
          "min-h-[44px] min-w-[44px]"
        )}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-live="polite"
        {...props}
      >
        {/* Left icon (shown only in idle state) */}
        {!isNonIdle && leftIcon}

        {/* State icon (shown in non-idle states) */}
        {stateIcon}

        {/* Button text */}
        <span>{stateText}</span>

        {/* Right icon (shown only in idle state) */}
        {!isNonIdle && rightIcon}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
