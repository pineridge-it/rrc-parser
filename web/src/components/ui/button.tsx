"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles with enhanced transitions
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
  "transition-all duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 " +
  "relative overflow-hidden " + // For ripple effect
  "active:scale-[0.98] " + // Press feedback
  "transform-gpu", // GPU acceleration for smooth animations
  {
    variants: {
      variant: {
        // Primary with gradient and enhanced hover
        primary:
          "bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-accent)] " +
          "text-white shadow-md " +
          "hover:shadow-lg hover:brightness-110 " +
          "hover:-translate-y-0.5 " + // Lift effect
          "active:translate-y-0 active:shadow-md " +
          "focus-visible:ring-[var(--color-brand-primary)]",
        // Secondary with subtle transitions
        secondary:
          "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] " +
          "border border-[var(--color-border-default)] shadow-sm " +
          "hover:bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)] " +
          "hover:shadow-md hover:-translate-y-0.5 " +
          "active:translate-y-0 active:shadow-sm " +
          "focus-visible:ring-[var(--color-brand-primary)]",
        // Outline variant
        outline:
          "bg-transparent text-[var(--color-text-primary)] " +
          "border border-[var(--color-border-default)] " +
          "hover:bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)] " +
          "hover:shadow-sm hover:-translate-y-0.5 " +
          "active:translate-y-0 " +
          "focus-visible:ring-[var(--color-brand-primary)]",
        // Destructive with enhanced feedback
        destructive:
          "bg-[var(--color-error)] text-white shadow-md " +
          "hover:shadow-lg hover:brightness-110 " +
          "hover:-translate-y-0.5 " +
          "active:translate-y-0 active:shadow-md active:scale-[0.98] " +
          "focus-visible:ring-[var(--color-error)]",
        // Ghost with subtle hover
        ghost:
          "text-[var(--color-text-primary)] " +
          "hover:bg-[var(--color-surface-subtle)] " +
          "active:bg-[var(--color-surface-raised)] " +
          "active:scale-[0.98] " +
          "focus-visible:ring-[var(--color-brand-primary)]",
        // Link with underline animation
        link: 
          "text-[var(--color-brand-primary)] underline-offset-4 " +
          "hover:underline " +
          "active:opacity-80 " +
          "focus-visible:ring-[var(--color-brand-primary)]",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-4 py-2 gap-2",
        lg: "h-12 px-6 text-base gap-2.5",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
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
  enableRipple?: boolean; // Optional ripple effect
}

// Ripple effect component
const Ripple = ({ x, y }: { x: number; y: number }) => {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0.35 }}
      animate={{ scale: 2.5, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 100,
        height: 100,
        marginLeft: -50,
        marginTop: -50,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
        pointerEvents: "none",
      }}
    />
  );
};

// Get state icon based on button state with animations
const StateIcon = ({ state }: { state: ButtonState }) => {
  return (
    <AnimatePresence mode="wait">
      {state === "loading" && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
        >
          <Loader2 className="animate-spin" />
        </motion.div>
      )}
      {state === "success" && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            duration: 0.3, 
            type: "spring",
            stiffness: 500,
            damping: 15
          }}
        >
          <Check className="text-white" />
        </motion.div>
      )}
      {state === "error" && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: [0, -3, 3, -3, 3, 0]
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            duration: 0.4,
            x: {
              duration: 0.4,
              ease: "easeInOut"
            }
          }}
        >
          <X className="text-white" />
        </motion.div>
      )}
    </AnimatePresence>
  );
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
      enableRipple = true,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
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

    // Ripple state
    const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (enableRipple && buttonRef.current && !isNonIdle) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        
        setRipples((prev) => [...prev, { x, y, id }]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 500);
      }
      
      props.onClick?.(e);
    };

    return (
      <motion.div
        whileTap={isNonIdle ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.1 }}
      >
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            // State-specific styles with smooth transitions
            isSuccess && [
              "bg-[var(--color-success)]",
              "hover:bg-[var(--color-success)]",
              "hover:brightness-110"
            ],
            isError && [
              "bg-[var(--color-error)]",
              "hover:bg-[var(--color-error)]",
              "hover:brightness-110"
            ],
            // Ensure 44px touch target on mobile
            "min-h-[44px] min-w-[44px]"
          )}
          ref={(node) => {
            // Handle both refs
            buttonRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
            }
          }}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          aria-live="polite"
          onClick={handleClick}
          {...props}
        >
          {/* Ripple effects */}
          <AnimatePresence>
            {ripples.map((ripple) => (
              <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
            ))}
          </AnimatePresence>

          {/* Left icon (shown only in idle state) */}
          <AnimatePresence mode="wait">
            {!isNonIdle && leftIcon && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {leftIcon}
              </motion.span>
            )}
          </AnimatePresence>

          {/* State icon (shown in non-idle states) */}
          <StateIcon state={state} />

          {/* Button text with animation */}
          <AnimatePresence mode="wait">
            <motion.span
              key={state}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {stateText}
            </motion.span>
          </AnimatePresence>

          {/* Right icon (shown only in idle state) */}
          <AnimatePresence mode="wait">
            {!isNonIdle && rightIcon && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                {rightIcon}
              </motion.span>
            )}
          </AnimatePresence>
        </Comp>
      </motion.div>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
