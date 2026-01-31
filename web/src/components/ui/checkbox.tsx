"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Checkbox option type for group
export interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

// Checkbox variants
const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded border border-[var(--color-border-default)] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--color-brand-primary)] data-[state=checked]:border-[var(--color-brand-primary)] data-[state=checked]:text-white",
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

// Individual Checkbox Props
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof checkboxVariants> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  error?: string;
}

// Individual Checkbox Component
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked,
      indeterminate = false,
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
    const checkboxId = id || React.useId();
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Set indeterminate property
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className={cn(checkboxVariants({ size }), "sr-only")}
            data-state={checked ? "checked" : "unchecked"}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={cn(
              checkboxVariants({ size }),
              "flex items-center justify-center cursor-pointer transition-colors",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {indeterminate ? (
              <Minus className="h-3 w-3" />
            ) : checked ? (
              <Check className="h-3 w-3" />
            ) : null}
          </label>
        </div>

        {(label || description || error) && (
          <div className="space-y-1">
            {label && (
              <label
                htmlFor={checkboxId}
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

Checkbox.displayName = "Checkbox";

// Checkbox Group Props
export interface CheckboxGroupProps {
  options: CheckboxOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  label?: string;
  error?: string;
  helperText?: string;
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Checkbox Group Component
export function CheckboxGroup({
  options,
  value = [],
  onChange,
  label,
  error,
  helperText,
  orientation = "vertical",
  size = "md",
  disabled = false,
  className,
  id,
}: CheckboxGroupProps) {
  const groupId = id || React.useId();

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  // Check if all options are selected
  const allSelected = options.length > 0 && options.every((opt) => value.includes(opt.value));
  const someSelected = value.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onChange?.([]);
    } else {
      onChange?.(options.filter((opt) => !opt.disabled).map((opt) => opt.value));
    }
  };

  return (
    <div className={cn("space-y-3", className)} role="group" aria-labelledby={label ? `${groupId}-label` : undefined}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            id={`${groupId}-label`}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
          {options.length > 1 && (
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={disabled}
              className="text-xs text-[var(--color-brand-primary)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            id={`${groupId}-${option.value}`}
            checked={value.includes(option.value)}
            onCheckedChange={() => handleToggle(option.value)}
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

export { Checkbox };
