"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  success?: string;
  label?: string;
  helperText?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoResize?: boolean;
  maxHeight?: number;
  warningThreshold?: number;
  floatingLabel?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      success,
      label,
      helperText,
      maxLength,
      showCharacterCount = false,
      autoResize = false,
      maxHeight = 300,
      warningThreshold = 0.8,
      floatingLabel = false,
      value,
      onChange,
      onPaste,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [characterCount, setCharacterCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Handle auto-resizing
    const resizeTextarea = React.useCallback(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;
      textarea.style.height = "auto";

      // Calculate the new height
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(scrollHeight, maxHeight);

      textarea.style.height = `${newHeight}px`;
    }, [autoResize, maxHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharacterCount(e.target.value.length);

      // Resize textarea if autoResize is enabled
      if (autoResize) {
        setTimeout(resizeTextarea, 0);
      }

      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Handle paste event
      onPaste?.(e);

      // Resize textarea after paste
      if (autoResize) {
        setTimeout(resizeTextarea, 0);
      }
    };

    // Initialize character count and resize on mount
    React.useEffect(() => {
      if (textareaRef.current) {
        setCharacterCount(textareaRef.current.value.length);
        if (autoResize) {
          resizeTextarea();
        }
      }
    }, [autoResize, resizeTextarea]);

    const inputValue = value?.toString() || "";
    const isAtLimit = maxLength ? characterCount >= maxLength : false;
    const isNearLimit = maxLength ? characterCount >= maxLength * warningThreshold : false;

    return (
      <div className="w-full space-y-2">
        {label && !floatingLabel && (
          <label
            className="text-sm font-medium text-[var(--color-text-primary)]"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors",
              "placeholder:text-[var(--color-text-tertiary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "resize-none",
              error
                ? "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
                : success
                ? "border-[var(--color-success)] focus-visible:border-[var(--color-success)] focus-visible:ring-[var(--color-success)]"
                : "border-[var(--color-border-default)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]",
              floatingLabel && "pt-6",
              className
            )}
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${props.id}-error`
                : helperText
                ? `${props.id}-helper`
                : undefined
            }
            {...props}
          />

          {/* Floating Label */}
          {floatingLabel && label && (
            <label
              className={cn(
                "absolute left-3 transition-all duration-200 pointer-events-none",
                "top-3 text-sm",
                (isFocused || inputValue) &&
                  "-top-2 text-xs bg-[var(--color-surface-default)] px-1 text-[var(--color-brand-primary)]",
                !isFocused &&
                  !inputValue &&
                  "text-[var(--color-text-placeholder)]"
              )}
            >
              {label}
            </label>
          )}
        </div>

        {/* Helper text and character count */}
        <div className="flex justify-between items-start">
          {(helperText || error) && (
            <p
              id={error ? `${props.id}-error` : `${props.id}-helper`}
              className={cn(
                "text-sm",
                error
                  ? "text-[var(--color-error)]"
                  : success
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-text-secondary)]"
              )}
            >
              {error || success || helperText}
            </p>
          )}

          {showCharacterCount && maxLength && (
            <span
              className={cn(
                "text-xs ml-auto",
                isAtLimit
                  ? "text-[var(--color-error)]"
                  : isNearLimit
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-text-tertiary)]"
              )}
            >
              {characterCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
