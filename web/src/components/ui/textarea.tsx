"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, AlertCircle, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

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
  tooltip?: string;
  animateUnderline?: boolean;
  shakeOnError?: boolean;
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
      tooltip,
      animateUnderline = false,
      shakeOnError = true,
      value,
      onChange,
      onPaste,
      onFocus,
      onBlur,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [characterCount, setCharacterCount] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);
    const [shouldShake, setShouldShake] = React.useState(false);

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

    // Trigger shake animation when error appears
    React.useEffect(() => {
      if (error && shakeOnError) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 500);
        return () => clearTimeout(timer);
      }
    }, [error, shakeOnError]);

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
    const hasValue = inputValue.length > 0;
    const isAtLimit = maxLength ? characterCount >= maxLength : false;
    const isNearLimit = maxLength ? characterCount >= maxLength * warningThreshold : false;

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
            <label
              className="text-sm font-medium text-[var(--color-text-primary)]"
              htmlFor={props.id}
            >
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
          <textarea
            ref={textareaRef}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              "flex w-full bg-transparent px-3 py-2 text-sm transition-all duration-200",
              "placeholder:text-[var(--color-text-tertiary)]",
              "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "resize-none",
              animateUnderline
                ? "border-0 border-b-2 rounded-none px-0 pb-3"
                : "rounded-md border focus-visible:ring-2 focus-visible:ring-offset-2",
              error
                ? animateUnderline
                  ? "border-b-[var(--color-error)]"
                  : "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]"
                : success
                ? animateUnderline
                  ? "border-b-[var(--color-success)]"
                  : "border-[var(--color-success)] focus-visible:border-[var(--color-success)] focus-visible:ring-[var(--color-success)]"
                : animateUnderline
                ? "border-b-[var(--color-border-default)] focus-visible:border-b-[var(--color-brand-primary)]"
                : "border-[var(--color-border-default)] focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]",
              floatingLabel && "pt-6",
              className
            )}
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
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
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: isFocused ? 1 : 0,
                backgroundColor: error 
                  ? "var(--color-error)" 
                  : success 
                  ? "var(--color-success)" 
                  : "var(--color-brand-primary)"
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )}

          {/* Floating Label */}
          {floatingLabel && label && (
            <label
              className={cn(
                "absolute left-3 transition-all duration-200 pointer-events-none origin-left",
                "top-3 text-sm",
                (isFocused || hasValue) &&
                  "-top-2.5 scale-90 text-xs bg-[var(--color-surface-default)] px-1",
                isFocused && "text-[var(--color-brand-primary)]",
                !isFocused && !hasValue && "text-[var(--color-text-placeholder)]",
                !isFocused && hasValue && "text-[var(--color-text-secondary)]",
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

          {/* Status icons */}
          <div className="absolute right-3 top-3 flex items-center gap-1">
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
          </div>
        </div>

        {/* Helper text and character count with animation */}
        <div className="flex justify-between items-start">
          <AnimatePresence mode="wait">
            {(helperText || error || success) && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                id={error ? `${props.id}-error` : `${props.id}-helper`}
                className={cn(
                  "text-sm",
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

          {showCharacterCount && maxLength && (
            <motion.span
              initial={false}
              animate={{
                color: isAtLimit
                  ? "var(--color-error)"
                  : isNearLimit
                  ? "var(--color-warning)"
                  : "var(--color-text-tertiary)"
              }}
              className="text-xs ml-auto"
            >
              {characterCount}/{maxLength}
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
