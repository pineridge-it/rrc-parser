"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ========================================
// Password Strength Indicator
// ========================================

export interface PasswordStrengthIndicatorProps {
  /** The password to evaluate */
  password: string;
  /** Minimum required strength (0-4) */
  minStrength?: number;
  /** Whether to show the strength label */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
}

interface StrengthCriteria {
  label: string;
  met: boolean;
}

// zxcvbn-inspired scoring algorithm
const calculateStrength = (password: string): number => {
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  // Bonus for complexity
  if (password.length >= 16) score++;
  if (/(.)\1{2,}/.test(password)) score--; // Penalty for repeated characters
  
  // Cap the score at 4
  return Math.min(score, 4);
};

const getStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0:
      return "Very Weak";
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
};

const getStrengthDescription = (strength: number): string => {
  switch (strength) {
    case 0:
      return "Password is very weak and easily guessed";
    case 1:
      return "Password is weak and vulnerable to attacks";
    case 2:
      return "Password is fair but could be stronger";
    case 3:
      return "Password is good but could be improved";
    case 4:
      return "Password is strong and secure";
    default:
      return "";
  }
};

const getStrengthColor = (strength: number): string => {
  switch (strength) {
    case 0:
    case 1:
      return "bg-[var(--color-error)]";
    case 2:
      return "bg-[var(--color-warning)]";
    case 3:
    case 4:
      return "bg-[var(--color-success)]";
    default:
      return "bg-[var(--color-surface-subtle)]";
  }
};

const PasswordStrengthIndicator = ({
  password,
  minStrength = 2,
  showLabel = true,
  className,
}: PasswordStrengthIndicatorProps) => {
  const strength = calculateStrength(password);
  const meetsMinStrength = strength >= minStrength;
  
  const criteria: StrengthCriteria[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    {
      label: "Upper & lowercase letters",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: "At least one number", met: /\d/.test(password) },
    {
      label: "At least one special character",
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Hidden accessibility element for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        Password strength: {getStrengthLabel(strength)}. {getStrengthDescription(strength)}
        {meetsMinStrength ? "" : `. Minimum required strength is ${getStrengthLabel(minStrength)}`}
      </div>
      
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1 h-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-full transition-all duration-300",
                index < strength
                  ? getStrengthColor(strength)
                  : "bg-[var(--color-surface-subtle)]"
              )}
            />
          ))}
        </div>
        {showLabel && password && (
          <div className="flex justify-between items-center">
            <span
              className={cn(
                "text-xs font-medium",
                strength >= 3
                  ? "text-[var(--color-success)]"
                  : strength >= 2
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-error)]"
              )}
            >
              {getStrengthLabel(strength)}
            </span>
            {!meetsMinStrength && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Min: {getStrengthLabel(minStrength)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Criteria list */}
      <ul className="space-y-1">
        {criteria.map((criterion, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              criterion.met
                ? "text-[var(--color-success)]"
                : "text-[var(--color-text-tertiary)]"
            )}
          >
            {criterion.met ? (
              <Check className="h-3 w-3" aria-hidden="true" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-[var(--color-border-subtle)]" aria-hidden="true" />
            )}
            <span>{criterion.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { PasswordStrengthIndicator };