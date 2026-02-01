"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, X, Check, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

// Input variants
const inputVariants = cva(
  "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-text-placeholder)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-border-default)] focus-visible:border-[var(--color-brand-primary)]",
        error:
          "border-[var(--color-error)] focus-visible:border-[var(--color-error)]",
        success:
          "border-[var(--color-success)] focus-visible:border-[var(--color-success)]",
        // New animated variant with underline animation
        animated:
          "border-0 border-b-2 border-[var(--color-border-default)] rounded-none px-0 focus-visible:border-[var(--color-brand-primary)] bg-transparent",
      },
      size: {
        sm: "h-8 text-xs",
        md: "h-10",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Animated underline component for the "animated" variant
const AnimatedUnderline = ({ 
  isFocused, 
  hasError, 
  hasSuccess 
}: { 
  isFocused: boolean; 
  hasError: boolean; 
  hasSuccess: boolean;
}) => {
  const getBorderColor = () => {
    if (hasError) return "var(--color-error)";
    if (hasSuccess) return "var(--color-success)";
    if (isFocused) return "var(--color-brand-primary)";
    return "var(--color-border-default)";
  };

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
      initial={{ scaleX: 0 }}
      animate={{ 
        scaleX: isFocused ? 1 : 0,
        backgroundColor: getBorderColor()
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    />
  );
};

// Enhanced Input Component
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: string;
  success?: string;
  label?: string;
  helperText?: string;
  floatingLabel?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  animateUnderline?: boolean;
  shakeOnError?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      error,
      success,
      label,
      helperText,
      floatingLabel = false,
      clearable = false,
      onClear,
      leftIcon,
      rightIcon,
      tooltip,
      animateUnderline = false,
      shakeOnError = true,
      type = "text",
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!value);
    const [shouldShake, setShouldShake] = React.useState(false);

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    // Determine variant based on error/success state
    const inputVariant = error ? "error" : success ? "success" : variant;
    
    // Use animated variant if requested
    const effectiveVariant = animateUnderline ? "animated" : inputVariant;

    // Trigger shake animation when error appears
    React.useEffect(() => {
      if (error && shakeOnError) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 500);
        return () => clearTimeout(timer);
      }
    }, [error, shakeOnError]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      onClear?.();
      const event = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
      setHasValue(false);
    };

    const containerVariants = {
      shake: {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      }
    };

    return (
      <motion.div 
        className="w-full space-y-2"
        animate={shouldShake ? "shake" : undefined}
        variants={containerVariants}
      >
        {/* Label with tooltip */}
        {label && !floatingLabel && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">
              {label}
            </label>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-brand-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] rounded"
                      aria-label={`Help for ${label}`}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className="max-w-xs text-sm"
                    sideOffset={5}
                  >
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        <div className={cn("relative", animateUnderline && "overflow-visible")}>
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </div>
          )}

          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: effectiveVariant, size }),
              leftIcon && "pl-10",
              (rightIcon || clearable || isPassword) && "pr-10",
              floatingLabel && "peer",
              animateUnderline && "pb-3",
              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={!!error}
            aria-describedby={
              [
                error && `${props.id}-error`,
                helperText && `${props.id}-helper`
              ].filter(Boolean).join(' ') || undefined
            }
            {...props}
          />

          {/* Animated underline */}
          {animateUnderline && (
            <AnimatedUnderline 
              isFocused={isFocused} 
              hasError={!!error} 
              hasSuccess={!!success}
            />
          )}

          {/* Floating Label */}
          {floatingLabel && label && (
            <label
              className={cn(
                "absolute left-3 transition-all duration-200 pointer-events-none origin-left",
                size === "sm" && "top-1.5 text-xs",
                size === "md" && "top-2.5 text-sm",
                size === "lg" && "top-3 text-base",
                (isFocused || hasValue) &&
                  "-top-2.5 scale-90 text-xs bg-[var(--color-surface-default)] px-1",
                isFocused && "text-[var(--color-brand-primary)]",
                !isFocused &&
                  !hasValue &&
                  "text-[var(--color-text-placeholder)]",
                !isFocused && hasValue && "text-[var(--color-text-secondary)]",
                leftIcon && "left-10",
                error && "text-[var(--color-error)]",
                success && !error && "text-[var(--color-success)]"
              )}
            >
              {label}
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex ml-1">
                        <HelpCircle className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-sm">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </label>
          )}

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clearable && hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle className="h-4 w-4 text-[var(--color-error)]" />
                </motion.div>
              )}

              {success && !error && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                </motion.div>
              )}
            </AnimatePresence>

            {rightIcon && !error && !success && rightIcon}
          </div>
        </div>

        {/* Helper text / Error / Success message with animation */}
        <AnimatePresence mode="wait">
          {(error || success || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              id={error ? `${props.id}-error` : `${props.id}-helper`}
              className={cn(
                "text-sm flex items-center gap-1",
                error && "text-[var(--color-error)]",
                success && !error && "text-[var(--color-success)]",
                !error && !success && "text-[var(--color-text-secondary)]"
              )}
              role={error ? "alert" : undefined}
            >
              {error || success || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
