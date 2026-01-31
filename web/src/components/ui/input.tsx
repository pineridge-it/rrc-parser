"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Input variants
const inputVariants = cva(
  "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-text-placeholder)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-border-default)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]",
        error:
          "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]",
        success:
          "border-[var(--color-success)] focus-visible:border-[var(--color-success)] focus-visible:ring-[var(--color-success)]",
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

    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    // Determine variant based on error/success state
    const inputVariant = error ? "error" : success ? "success" : variant;

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

    return (
      <div className="w-full space-y-2">
        {label && !floatingLabel && (
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </div>
          )}

          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && "pl-10",
              (rightIcon || clearable || isPassword) && "pr-10",
              floatingLabel && "peer",
              className
            )}
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Floating Label */}
          {floatingLabel && label && (
            <label
              className={cn(
                "absolute left-3 transition-all duration-200 pointer-events-none",
                size === "sm" && "top-1.5 text-xs",
                size === "md" && "top-2.5 text-sm",
                size === "lg" && "top-3 text-base",
                (isFocused || hasValue) &&
                  "-top-2 text-xs bg-[var(--color-surface-default)] px-1 text-[var(--color-brand-primary)]",
                !isFocused &&
                  !hasValue &&
                  "text-[var(--color-text-placeholder)]",
                leftIcon && "left-10"
              )}
            >
              {label}
            </label>
          )}

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clearable && hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded-full hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-tertiary)] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}

            {error && (
              <AlertCircle className="h-4 w-4 text-[var(--color-error)]" />
            )}

            {success && !error && (
              <Check className="h-4 w-4 text-[var(--color-success)]" />
            )}

            {rightIcon && !error && !success && rightIcon}
          </div>
        </div>

        {/* Helper text / Error / Success message */}
        {(error || success || helperText) && (
          <p
            className={cn(
              "text-sm flex items-center gap-1",
              error && "text-[var(--color-error)]",
              success && !error && "text-[var(--color-success)]",
              !error && !success && "text-[var(--color-text-secondary)]"
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
