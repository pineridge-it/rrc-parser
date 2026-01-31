"use client";

import { Variants, Transition } from "framer-motion";

/**
 * Animation Library
 * 
 * A comprehensive animation system using Framer Motion with design token integration.
 * All animations respect user motion preferences via the useReducedMotion hook.
 * 
 * @example
 * ```tsx
 * import { fadeIn, slideUp } from "@/lib/animations";
 * import { motion } from "framer-motion";
 * 
 * <motion.div
 *   variants={fadeIn}
 *   initial="hidden"
 *   animate="visible"
 * >
 *   Content
 * </motion.div>
 * ```
 */

// ============================================
// Base Transitions (using design tokens)
// ============================================

export const transitions = {
  // Standard transitions
  default: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1], // ease-out
  } as Transition,
  
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  } as Transition,
  
  bounce: {
    type: "spring",
    stiffness: 400,
    damping: 15,
  } as Transition,
  
  // Duration-based
  fast: {
    duration: 0.15,
    ease: "easeOut",
  } as Transition,
  
  normal: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,
  
  slow: {
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,
  
  // Layout transitions
  layout: {
    type: "spring",
    stiffness: 500,
    damping: 35,
    mass: 1,
  } as Transition,
};

// ============================================
// Fade Animations
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15 },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.15 },
  },
};

// ============================================
// Scale Animations
// ============================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const scaleInCenter: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bounce,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.1 },
  },
};

// ============================================
// Slide Animations
// ============================================

export const slideUp: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    y: "100%",
    transition: { duration: 0.2 },
  },
};

export const slideDown: Variants = {
  hidden: { y: "-100%" },
  visible: {
    y: 0,
    transition: transitions.normal,
  },
  exit: {
    y: "-100%",
    transition: { duration: 0.2 },
  },
};

export const slideLeft: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.2 },
  },
};

export const slideRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: transitions.normal,
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2 },
  },
};

// ============================================
// Stagger Animations (for lists)
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.1 },
  },
};

export const staggerScale: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.1 },
  },
};

// ============================================
// Page Transitions
// ============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export const pageSlide: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// ============================================
// Modal/Dialog Animations
// ============================================

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 },
  },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const drawerSlideLeft: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
    },
  },
  exit: {
    x: "-100%",
    transition: { duration: 0.2 },
  },
};

export const drawerSlideRight: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
    },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2 },
  },
};

// ============================================
// Interactive Micro-interactions
// ============================================

export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const cardHover = {
  y: -4,
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};

export const cardTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const iconSpin = {
  rotate: 180,
  transition: { duration: 0.3 },
};

export const iconBounce = {
  scale: [1, 1.2, 1],
  transition: { duration: 0.3 },
};

// ============================================
// Loading/Skeleton Animations
// ============================================

export const skeletonPulse: Variants = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ["-200% 0", "200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const spinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ============================================
// Toast Animations
// ============================================

export const toastSlideIn: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: { duration: 0.2 },
  },
};

export const toastStack: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ============================================
// Error/Shake Animation
// ============================================

export const shake: Variants = {
  shake: {
    x: [-5, 5, -5, 5, 0],
    transition: { duration: 0.4 },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Create a custom stagger animation
 */
export function createStagger(
  staggerChildren: number = 0.05,
  delayChildren: number = 0
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
}

/**
 * Create a fade animation with custom direction
 */
export function createFade(
  direction: "up" | "down" | "left" | "right" = "up",
  distance: number = 20
): Variants {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return {
    hidden: { opacity: 0, ...directions[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: transitions.normal,
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15 },
    },
  };
}

/**
 * Reduced motion variants - returns instant transitions
 */
export function withReducedMotion(variants: Variants): Variants {
  const instantTransition = { duration: 0 };
  
  return {
    ...variants,
    visible: {
      ...variants.visible,
      transition: instantTransition,
    },
    exit: {
      ...variants.exit,
      transition: instantTransition,
    },
  };
}
