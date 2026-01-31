"use client";

import * as React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useKeyboardShortcutsContext,
  formatShortcut,
  KeyboardShortcut,
  getModifierKey,
  getAltKey,
  getShiftKey,
} from "./keyboard-shortcuts-provider";

// ============================================
// Types
// ============================================

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// ============================================
// Animation Variants
// ============================================

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const satisfies Variants;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
} as const satisfies Variants;

// ============================================
// Category Labels
// ============================================

const CATEGORY_LABELS: Record<KeyboardShortcut["category"], string> = {
  navigation: "Navigation",
  actions: "Actions",
  search: "Search",
  help: "Help",
  custom: "Custom",
};

// ============================================
// Icons
// ============================================

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const KeyboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
    <path d="M7 16h10" />
  </svg>
);

const NavigationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const ActionsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const HelpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const CATEGORY_ICONS: Record<KeyboardShortcut["category"], React.ReactNode> = {
  navigation: <NavigationIcon />,
  actions: <ActionsIcon />,
  search: <SearchIcon />,
  help: <HelpIcon />,
  custom: <KeyboardIcon />,
};

// ============================================
// Component
// ============================================

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  className,
}: KeyboardShortcutsHelpProps) {
  const { getShortcutsByCategory } = useKeyboardShortcutsContext();
  const [activeCategory, setActiveCategory] = React.useState<KeyboardShortcut["category"]>("navigation");

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const categories: KeyboardShortcut["category"][] = [
    "navigation",
    "actions",
    "search",
    "help",
    "custom",
  ];

  const shortcuts = getShortcutsByCategory(activeCategory);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl",
              "bg-[var(--color-surface-elevated)]",
              "border border-[var(--color-border-default)]",
              "shadow-2xl",
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="keyboard-shortcuts-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                  <KeyboardIcon />
                </div>
                <div>
                  <h2
                    id="keyboard-shortcuts-title"
                    className="text-lg font-semibold text-[var(--color-text-primary)]"
                  >
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Press {getModifierKey()} + / to show this help
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "text-[var(--color-text-secondary)]",
                  "hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                )}
                aria-label="Close keyboard shortcuts"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 px-4 py-3 border-b border-[var(--color-border-default)] overflow-x-auto">
              {categories.map((category) => {
                const count = getShortcutsByCategory(category).length;
                if (count === 0) return null;

                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      activeCategory === category
                        ? "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
                    )}
                  >
                    {CATEGORY_ICONS[category]}
                    {CATEGORY_LABELS[category]}
                    <span className="text-xs opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Shortcuts List */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {shortcuts.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <KeyboardIcon />
                  <p className="mt-2">No shortcuts in this category</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        "bg-[var(--color-surface-subtle)]",
                        shortcut.disabled && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--color-text-secondary)]">
                          {CATEGORY_ICONS[shortcut.category]}
                        </span>
                        <span className="text-[var(--color-text-primary)]">
                          {shortcut.description}
                        </span>
                      </div>
                      <kbd
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 text-xs font-mono",
                          "bg-[var(--color-surface-raised)]",
                          "border border-[var(--color-border-default)] rounded",
                          "text-[var(--color-text-secondary)]"
                        )}
                      >
                        {formatShortcut(shortcut).split(" ").map((part, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-[var(--color-text-muted)]">+</span>}
                            <span>{part}</span>
                          </React.Fragment>
                        ))}
                      </kbd>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>Tip: Shortcuts work even when typing in most input fields</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] rounded">
                      {getModifierKey()}
                    </kbd>
                    = Command/Ctrl
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] rounded">
                      {getAltKey()}
                    </kbd>
                    = Option/Alt
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Shortcut Badge Component
// ============================================

interface ShortcutBadgeProps {
  shortcut: string;
  className?: string;
}

export function ShortcutBadge({ shortcut, className }: ShortcutBadgeProps) {
  const parts = shortcut.split("+");

  return (
    <kbd
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono",
        "bg-[var(--color-surface-subtle)]",
        "border border-[var(--color-border-default)] rounded",
        "text-[var(--color-text-secondary)]",
        className
      )}
    >
      {parts.map((part, i) => {
        let display = part;
        if (part.toLowerCase() === "cmd" || part.toLowerCase() === "ctrl" || part.toLowerCase() === "meta") {
          display = getModifierKey();
        } else if (part.toLowerCase() === "shift") {
          display = getShiftKey();
        } else if (part.toLowerCase() === "alt" || part.toLowerCase() === "option") {
          display = getAltKey();
        } else {
          display = part.toUpperCase();
        }

        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-[var(--color-text-muted)]">+</span>}
            <span>{display}</span>
          </React.Fragment>
        );
      })}
    </kbd>
  );
}

// ============================================
// Shortcut Hint Component
// ============================================

interface ShortcutHintProps {
  shortcut: string;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function ShortcutHint({
  shortcut,
  children,
  className,
  position = "right",
}: ShortcutHintProps) {
  const [showHint, setShowHint] = React.useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => setShowHint(false)}
    >
      {children}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 whitespace-nowrap",
              positionClasses[position]
            )}
          >
            <ShortcutBadge shortcut={shortcut} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
