"use client";

import * as React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  popIn,
  slideUp,
  slideDown,
  staggerContainer,
  staggerItem,
  buttonTap,
  cardHover,
  cardTap,
  modalOverlay,
  modalContent,
  pageTransition,
} from "@/lib/animations";

/**
 * Animated Components
 * 
 * Pre-built animated components using Framer Motion with
 * reduced motion support built-in.
 */

// ============================================
// Animated Container
// ============================================

interface AnimatedContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  animation?: "fade" | "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scale" | "pop" | "slideUp" | "slideDown";
  delay?: number;
  duration?: number;
  className?: string;
}

const animationVariants = {
  fade: fadeIn,
  fadeUp: fadeInUp,
  fadeDown: fadeInDown,
  fadeLeft: fadeInLeft,
  fadeRight: fadeInRight,
  scale: scaleIn,
  pop: popIn,
  slideUp: slideUp,
  slideDown: slideDown,
};

export function AnimatedContainer({
  children,
  animation = "fade",
  delay = 0,
  duration,
  className,
  ...props
}: AnimatedContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const variants = animationVariants[animation];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay, duration }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Animated List (with stagger)
// ============================================

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function AnimatedList({
  children,
  className,
  staggerDelay = 0.05,
  delayChildren = 0.1,
}: AnimatedListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={staggerItem}>{child}</motion.div>
      ))}
    </motion.div>
  );
}

// ============================================
// Animated Button
// ============================================

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  whileHoverScale?: number;
  whileTapScale?: number;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children,
  className,
  whileHoverScale = 1.02,
  whileTapScale = 0.97,
  ...props
}: AnimatedButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  }

  return (
    <motion.button
      className={className}
      whileHover={{ scale: whileHoverScale }}
      whileTap={{ scale: whileTapScale }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// Animated Card
// ============================================

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  tap?: boolean;
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  tap = true,
  ...props
}: AnimatedCardProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      whileTap={tap ? { scale: 0.98, transition: { duration: 0.1 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Animated Modal
// ============================================

interface AnimatedModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  overlayClassName?: string;
}

export function AnimatedModal({
  children,
  isOpen,
  onClose,
  className,
  overlayClassName,
}: AnimatedModalProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className={cn(
              "fixed inset-0 bg-black/50 z-40",
              overlayClassName
            )}
            variants={prefersReducedMotion ? undefined : modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              className
            )}
            variants={prefersReducedMotion ? undefined : modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Animated Page
// ============================================

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Animated Presence (wrapper for AnimatePresence)
// ============================================

interface AnimatedPresenceProps {
  children: React.ReactNode;
  mode?: "sync" | "popLayout" | "wait";
}

export function AnimatedPresence({
  children,
  mode = "sync",
}: AnimatedPresenceProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}

// ============================================
// Fade In View (animates when element enters viewport)
// ============================================

interface FadeInViewProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function FadeInView({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.5,
  once = true,
  ...props
}: FadeInViewProps) {
  const prefersReducedMotion = useReducedMotion();

  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-50px" }}
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1] as const,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Skeleton Loading
// ============================================

interface SkeletonProps {
  className?: string;
  variant?: "pulse" | "shimmer";
}

export function Skeleton({ className, variant = "pulse" }: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "bg-[var(--color-surface-subtle)] rounded",
          className
        )}
      />
    );
  }

  if (variant === "shimmer") {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-[var(--color-surface-subtle)] via-[var(--color-surface-raised)] to-[var(--color-surface-subtle)] bg-[length:200%_100%] rounded animate-[shimmer_1.5s_infinite_linear]",
          className
        )}
      />
    );
  }

  return (
    <motion.div
      className={cn(
        "bg-[var(--color-surface-subtle)] rounded",
        className
      )}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
      }}
    />
  );
}

// ============================================
// Loading Spinner
// ============================================

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "border-2 border-[var(--color-border-default)] border-t-[var(--color-brand-primary)] rounded-full",
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <motion.div
      className={cn(
        "border-2 border-[var(--color-border-default)] border-t-[var(--color-brand-primary)] rounded-full",
        sizes[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// ============================================
// Shake Animation (for errors)
// ============================================

interface ShakeProps {
  children: React.ReactNode;
  className?: string;
  trigger: boolean;
  onShakeEnd?: () => void;
}

export function Shake({
  children,
  className,
  trigger,
  onShakeEnd,
}: ShakeProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={trigger ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      onAnimationComplete={onShakeEnd}
    >
      {children}
    </motion.div>
  );
}
