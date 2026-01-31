"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Radio option type for group
export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

// Radio variants
const radioVariants = cva(
  "peer h-4 w-4 rounded-full border border-[var(--color-border-default)] text-[var(--color-brand-primary)] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--color-brand-primary)] data-[state=checked]:bg-[var(--color-brand-primary)]",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// Individual Radio Props
export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof radioVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  error?: string;
}

// Individual Radio Component
const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      checked,
      onCheckedChange,
      label,
      description,
      error,
      size = "md",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const radioId = id || React.useId();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="radio"
            id={radioId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className={cn(radioVariants({ size }), "sr-only")}
            data-state={checked ? "checked" : "unchecked"}
            {...props}
          />
          <label
            htmlFor={radioId}
            className={cn(
              radioVariants({ size }),
              "flex items-center justify-center cursor-pointer transition-colors",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {checked && (
              <span
                className={cn(
                  "rounded-full bg-white",
                  size === "sm" && "h-1.5 w-1.5",
                  size === "md" && "h-2 w-2",
                  size === "lg" && "h-2.5 w-2.5"
                )}
              />
            )}
          </label>
        </div>

        {(label || description || error) && (
          <div className="space-y-1">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  "text-sm font-medium cursor-pointer",
                  disabled && "cursor-not-allowed opacity-50",
                  "text-[var(--color-text-primary)]"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {description}
              </p>
            )}
            {error && (
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = "Radio";

// Radio Group Props
export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

// Radio Group Component
export function RadioGroup({
  options,
  value,
  onChange,
  label,
  error,
  helperText,
  orientation = "vertical",
  size = "md",
  disabled = false,
  className,
  id,
  name,
}: RadioGroupProps) {
  const groupId = id || React.useId();
  const groupName = name || `radio-group-${groupId}`;

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
  };

  return (
    <div
      className={cn("space-y-3", className)}
      role="radiogroup"
      aria-labelledby={label ? `${groupId}-label` : undefined}
    >
      {label && (
        <label
          id={`${groupId}-label`}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            id={`${groupId}-${option.value}`}
            name={groupName}
            checked={value === option.value}
            onCheckedChange={() => handleSelect(option.value)}
            label={option.label}
            description={option.description}
            size={size}
            disabled={disabled || option.disabled}
          />
        ))}
      </div>

      {(helperText || error) && (
        <p
          className={cn(
            "text-sm",
            error
              ? "text-[var(--color-error)]"
              : "text-[var(--color-text-secondary)]"
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export { Radio };
