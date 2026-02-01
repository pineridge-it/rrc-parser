"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Select option type
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

// Select variants
const selectVariants = cva(
  "flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-border-default)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]",
        error:
          "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]",
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

// Select props
export interface SelectProps extends VariantProps<typeof selectVariants> {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  helperText,
  disabled = false,
  searchable = false,
  multiple = false,
  clearable = false,
  variant,
  size = "md",
  className,
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Normalize value to array for multi-select
  const selectedValues = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return value ? [value as string] : [];
  }, [value, multiple]);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchable, searchQuery]);

  // Get selected option labels for display
  const selectedLabels = React.useMemo(() => {
    return selectedValues
      .map((v) => options.find((o) => o.value === v)?.label)
      .filter(Boolean) as string[];
  }, [selectedValues, options]);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
    }
    setSearchQuery("");
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChange?.([]);
    } else {
      onChange?.("");
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when filtered options change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length, searchQuery]);

  const inputVariant = error ? "error" : variant;

  return (
    <div className="w-full space-y-2" ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Select trigger */}
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            selectVariants({ variant: inputVariant, size }),
            "text-left",
            selectedValues.length === 0 && "text-[var(--color-text-tertiary)]",
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-helper` : undefined
          }
        >
          <span className="truncate flex-1">
            {selectedValues.length > 0
              ? multiple
                ? `${selectedValues.length} selected`
                : selectedLabels[0]
              : placeholder}
          </span>

          <div className="flex items-center gap-1 ml-2">
            {clearable && selectedValues.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
                className="p-1 hover:bg-[var(--color-surface-subtle)] rounded-full transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--color-text-secondary)] transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ transformOrigin: "top" }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] rounded-md shadow-lg max-h-60 overflow-auto"
              role="listbox"
              aria-multiselectable={multiple}
            >
              {/* Search input */}
              {searchable && (
                <div className="sticky top-0 bg-white dark:bg-[var(--color-surface-raised)] border-b border-[var(--color-border-default)] p-2 z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border-default)] rounded-md focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}

              {/* Options list */}
              <ul className="py-1">
                {filteredOptions.length === 0 ? (
                  <motion.li
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 py-2 text-sm text-[var(--color-text-tertiary)] text-center"
                  >
                    No options found
                  </motion.li>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value);
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <motion.li
                        key={option.value}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.15 }}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          "px-3 py-2 cursor-pointer flex items-center gap-2",
                          isHighlighted && "bg-[var(--color-surface-subtle)]",
                          option.disabled && "opacity-50 cursor-not-allowed",
                          "transition-all duration-150 hover:translate-x-1"
                        )}
                      >
                        {/* Checkbox for multi-select */}
                        {multiple && (
                          <motion.span
                            initial={false}
                            animate={isSelected ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "w-4 h-4 border rounded flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white"
                                : "border-[var(--color-border-default)]"
                            )}
                          >
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 45 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <Check className="w-3 h-3" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.span>
                        )}

                        {/* Icon */}
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}

                        {/* Label and description */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[var(--color-text-primary)] truncate">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-xs text-[var(--color-text-secondary)] truncate">
                              {option.description}
                            </div>
                          )}
                        </div>

                        {/* Checkmark for single select */}
                        {!multiple && isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <Check className="w-4 h-4 text-[var(--color-brand-primary)] flex-shrink-0" />
                          </motion.div>
                        )}
                      </motion.li>
                    );
                  })
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper text or error */}
      <AnimatePresence mode="wait">
        {(helperText || error) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id={error ? `${id}-error` : `${id}-helper`}
            className={cn(
              "text-sm flex items-center gap-1",
              error
                ? "text-[var(--color-error)]"
                : "text-[var(--color-text-secondary)]"
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

Select.displayName = "Select";
