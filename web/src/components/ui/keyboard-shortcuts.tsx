"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  KeyboardShortcutsProvider,
  useKeyboardShortcut,
  PREDEFINED_SHORTCUTS,
} from "./keyboard-shortcuts-provider";
import { KeyboardShortcutsHelp } from "./keyboard-shortcuts-help";

// ============================================
// Global Shortcuts Component
// ============================================

function GlobalShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = React.useState(false);

  // Navigation shortcuts
  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.GO_HOME,
    action: () => router.push("/dashboard"),
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.GO_MAP,
    action: () => router.push("/map"),
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.GO_SEARCH,
    action: () => router.push("/search"),
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.GO_SETTINGS,
    action: () => router.push("/settings"),
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.GO_BACK,
    action: () => window.history.back(),
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.GO_FORWARD,
    action: () => window.history.forward(),
  });

  // Action shortcuts
  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.NEW_ITEM,
    action: () => {
      // Dispatch custom event for new item
      window.dispatchEvent(new CustomEvent("shortcut:new-item"));
    },
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.REFRESH,
    action: () => window.location.reload(),
  });

  // Help shortcuts
  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.SHOW_SHORTCUTS,
    action: () => setShowHelp(true),
  });

  useKeyboardShortcut({
    ...PREDEFINED_SHORTCUTS.ESCAPE,
    action: () => setShowHelp(false),
    enabled: showHelp,
  });

  return (
    <KeyboardShortcutsHelp
      isOpen={showHelp}
      onClose={() => setShowHelp(false)}
    />
  );
}

// ============================================
// Provider Wrapper
// ============================================

interface KeyboardShortcutsWrapperProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function KeyboardShortcutsWrapper({
  children,
  enabled = true,
}: KeyboardShortcutsWrapperProps) {
  return (
    <KeyboardShortcutsProvider enabled={enabled}>
      {enabled && <GlobalShortcuts />}
      {children}
    </KeyboardShortcutsProvider>
  );
}

// ============================================
// Hook for consuming shortcuts
// ============================================

export { useKeyboardShortcut, PREDEFINED_SHORTCUTS };
export type { KeyboardShortcut } from "./keyboard-shortcuts-provider";
