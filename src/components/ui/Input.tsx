/**
 * Input Component
 * Phase 1: Foundation - Design System & Critical Fixes
 * 
 * A reusable input component following the design system specifications.
 * Supports multiple variants, sizes, and states.
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state */
  error?: boolean;
  /** Helper text */
  helperText?: string;
  /** Label text */
  label?: string;
}

/**
 * Input component - Primary form element for text input
 * 
 * @example
 * <Input placeholder="Enter your name" />
 * <Input label="Email" type="email" />
 * <Input error helperText="Invalid email address" />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error = false,
      helperText,
      label,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Base classes
    const baseClasses = [
      'block',
      'w-full',
      'rounded-md',
      'border',
      'shadow-sm',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-0',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    // Size classes
    const sizeClasses = {
      sm: ['px-3', 'py-1.5', 'text-sm'],
      md: ['px-4', 'py-2', 'text-base'],
      lg: ['px-4', 'py-3', 'text-lg'],
    };

    // State classes
    const stateClasses = error
      ? [
          'border-red-300',
          'text-red-900',
          'placeholder-red-300',
          'focus:border-red-500',
          'focus:ring-red-500',
        ]
      : [
          'border-gray-300',
          'text-gray-900',
          'placeholder-gray-400',
          'focus:border-blue-500',
          'focus:ring-blue-500',
        ];

    // Combine all classes
    const classes = [
      ...baseClasses,
      ...sizeClasses[size],
      ...stateClasses,
      className,
    ].join(' ');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classes}
          {...props}
        />
        {helperText && (
          <p
            className={`mt-1 text-sm ${
              error ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
