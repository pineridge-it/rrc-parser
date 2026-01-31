"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ========================================
// Switch Component
// ========================================

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "size"> {
  /** Label text for the switch */
  label?: string;
  /** Helper text displayed below the switch */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Position of the label relative to the switch */
  labelPosition?: "left" | "right";
  /** Custom className for the container */
  containerClassName?: string;
  /** Custom className for the switch track */
  trackClassName?: string;
  /** Custom className for the switch thumb */
  thumbClassName?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      checked,
      defaultChecked,
      onChange,
      disabled,
      required,
      id,
      labelPosition = "right",
      containerClassName,
      trackClassName,
      thumbClassName,
      size = "md",
      ...props
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState(
      defaultChecked || checked || false
    );
    const switchId = id || React.useId();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(
      ref,
      () => inputRef.current as HTMLInputElement,
      []
    );

    // Sync with controlled checked prop
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setIsChecked(e.target.checked);
      }
      onChange?.(e);
    };

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const newChecked = !isChecked;
        setIsChecked(newChecked);

        // Create a synthetic event to pass to onChange
        if (inputRef.current) {
          const event = {
            target: {
              ...inputRef.current,
              checked: newChecked,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(event as any);
        }
      }
    };

    // Size classes
    const sizeClasses = {
      sm: {
        track: "w-9 h-5",
        thumb: "w-3.5 h-3.5",
        thumbTranslate: "translate-x-4",
        label: "text-sm",
        helper: "text-xs",
      },
      md: {
        track: "w-11 h-6",
        thumb: "w-5 h-5",
        thumbTranslate: "translate-x-5",
        label: "text-sm",
        helper: "text-xs",
      },
      lg: {
        track: "w-14 h-7",
        thumb: "w-6 h-6",
        thumbTranslate: "translate-x-7",
        label: "text-base",
        helper: "text-sm",
      },
    };

    const currentSize = sizeClasses[size];

    const switchElement = (
      <div
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
          currentSize.track,
          // Default state
          "bg-[var(--color-surface-subtle)] border border-[var(--color-border-default)]",
          // Checked state
          isChecked &&
            "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]",
          // Focus state
          "focus-within:ring-2 focus-within:ring-[var(--color-brand-primary)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-surface-default)]",
          // Error state
          error &&
            "border-[var(--color-error)] focus-within:ring-[var(--color-error)]",
          // Disabled state
          disabled &&
            "opacity-50 cursor-not-allowed bg-[var(--color-surface-subtle)]",
          trackClassName
        )}
        tabIndex={disabled ? undefined : 0}
        onKeyDown={disabled ? undefined : handleKeyDown}
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={label ? `${switchId}-label` : undefined}
        aria-describedby={helperText ? `${switchId}-helper` : undefined}
        aria-invalid={!!error}
      >
        {/* Hidden input - for form submission and programmatic access */}
        <input
          ref={inputRef}
          type="checkbox"
          id={switchId}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className="sr-only"
          aria-invalid={error ? "true" : "false"}
          {...props}
        />

        {/* Thumb */}
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-white shadow-lg ring-0 transition-all duration-200 ease-out",
            currentSize.thumb,
            isChecked ? currentSize.thumbTranslate : "translate-x-0.5",
            "top-1/2 -translate-y-1/2 absolute",
            thumbClassName
          )}
        />
      </div>
    );

    return (
      <div className={cn("flex flex-col", containerClassName)}>
        <div
          className={cn(
            "flex items-center gap-3",
            disabled && "cursor-not-allowed opacity-50",
            labelPosition === "left" && "flex-row-reverse justify-between"
          )}
        >
          {switchElement}

          {/* Label and helper text */}
          {(label || helperText) && (
            <div className="flex flex-col">
              {label && (
                <span
                  id={`${switchId}-label`}
                  className={cn(
                    currentSize.label,
                    "font-medium text-[var(--color-text-primary)]",
                    error && "text-[var(--color-error)]"
                  )}
                >
                  {label}
                  {required && (
                    <span className="text-[var(--color-error)] ml-0.5">*</span>
                  )}
                </span>
              )}
              {helperText && !error && (
                <span
                  id={`${switchId}-helper`}
                  className={cn(
                    currentSize.helper,
                    "text-[var(--color-text-secondary)] mt-0.5"
                  )}
                >
                  {helperText}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${switchId}-error`}
            className={cn("mt-1 text-[var(--color-error)]", currentSize.helper)}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
