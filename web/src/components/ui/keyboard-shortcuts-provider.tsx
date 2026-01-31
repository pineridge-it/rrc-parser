"use client";

import * as React from "react";

// ============================================
// Types
// ============================================

export interface KeyboardShortcut {
  id: string;
  key: string;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  action: () => void | Promise<void>;
  description: string;
  category: "navigation" | "actions" | "search" | "help" | "custom";
  disabled?: boolean;
  preventDefault?: boolean;
}

export interface ShortcutContext {
  shortcuts: Map<string, KeyboardShortcut>;
  register: (shortcut: KeyboardShortcut) => void;
  unregister: (id: string) => void;
  isRegistered: (id: string) => boolean;
  getShortcutById: (id: string) => KeyboardShortcut | undefined;
  getShortcutsByCategory: (category: KeyboardShortcut["category"]) => KeyboardShortcut[];
}

// ============================================
// Platform Detection
// ============================================

function getPlatform(): "mac" | "windows" | "linux" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (platform.includes("mac") || userAgent.includes("mac")) return "mac";
  if (platform.includes("win") || userAgent.includes("win")) return "windows";
  if (platform.includes("linux") || userAgent.includes("linux")) return "linux";
  
  return "unknown";
}

export function isMac(): boolean {
  return getPlatform() === "mac";
}

export function getModifierKey(): "⌘" | "Ctrl" {
  return isMac() ? "⌘" : "Ctrl";
}

export function getAltKey(): "⌥" | "Alt" {
  return isMac() ? "⌥" : "Alt";
}

export function getShiftKey(): "⇧" | "Shift" {
  return isMac() ? "⇧" : "Shift";
}

// ============================================
// Shortcut Formatting
// ============================================

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers?.meta || shortcut.modifiers?.ctrl) {
    parts.push(getModifierKey());
  }
  if (shortcut.modifiers?.shift) {
    parts.push(getShiftKey());
  }
  if (shortcut.modifiers?.alt) {
    parts.push(getAltKey());
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(" ");
}

export function formatShortcutDisplay(shortcut: string): string {
  // Convert internal format (e.g., "cmd+k", "ctrl+shift+s") to display format
  const parts = shortcut.toLowerCase().split("+");
  const displayParts: string[] = [];
  
  for (const part of parts) {
    if (part === "cmd" || part === "ctrl" || part === "meta") {
      displayParts.push(getModifierKey());
    } else if (part === "shift") {
      displayParts.push(getShiftKey());
    } else if (part === "alt" || part === "option") {
      displayParts.push(getAltKey());
    } else {
      displayParts.push(part.toUpperCase());
    }
  }
  
  return displayParts.join(" ");
}

// ============================================
// Context
// ============================================

const KeyboardShortcutsContext = React.createContext<ShortcutContext | null>(null);

export function useKeyboardShortcutsContext(): ShortcutContext {
  const context = React.useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider"
    );
  }
  return context;
}

// ============================================
// Provider
// ============================================

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function KeyboardShortcutsProvider({
  children,
  enabled = true,
}: KeyboardShortcutsProviderProps) {
  const shortcutsRef = React.useRef<Map<string, KeyboardShortcut>>(new Map());
  const [shortcuts, setShortcuts] = React.useState<Map<string, KeyboardShortcut>>(
    new Map()
  );

  const register = React.useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current.set(shortcut.id, shortcut);
    setShortcuts(new Map(shortcutsRef.current));
  }, []);

  const unregister = React.useCallback((id: string) => {
    shortcutsRef.current.delete(id);
    setShortcuts(new Map(shortcutsRef.current));
  }, []);

  const isRegistered = React.useCallback((id: string) => {
    return shortcutsRef.current.has(id);
  }, []);

  const getShortcutById = React.useCallback((id: string) => {
    return shortcutsRef.current.get(id);
  }, []);

  const getShortcutsByCategory = React.useCallback(
    (category: KeyboardShortcut["category"]) => {
      return Array.from(shortcutsRef.current.values()).filter(
        (s) => s.category === category
      );
    },
    []
  );

  // Global keyboard event handler
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.getAttribute("role") === "textbox"
      ) {
        // Allow certain shortcuts even in input fields
        const isEscape = event.key === "Escape";
        const isCmdK = (event.metaKey || event.ctrlKey) && event.key === "k";
        const isCmdSlash = (event.metaKey || event.ctrlKey) && event.key === "/";
        
        if (!isEscape && !isCmdK && !isCmdSlash) {
          return;
        }
      }

      for (const shortcut of shortcutsRef.current.values()) {
        if (shortcut.disabled) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.modifiers?.ctrl === (event.ctrlKey && !isMac());
        const metaMatch = !!shortcut.modifiers?.meta === (event.metaKey && isMac());
        const shiftMatch = !!shortcut.modifiers?.shift === event.shiftKey;
        const altMatch = !!shortcut.modifiers?.alt === event.altKey;

        // Handle both ctrl and meta as "command" key
        const cmdMatch = (shortcut.modifiers?.ctrl || shortcut.modifiers?.meta) 
          ? (event.metaKey || event.ctrlKey)
          : true;

        if (
          keyMatch &&
          shiftMatch &&
          altMatch &&
          ((shortcut.modifiers?.ctrl || shortcut.modifiers?.meta) ? cmdMatch : true)
        ) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  const value = React.useMemo(
    () => ({
      shortcuts,
      register,
      unregister,
      isRegistered,
      getShortcutById,
      getShortcutsByCategory,
    }),
    [shortcuts, register, unregister, isRegistered, getShortcutById, getShortcutsByCategory]
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================
// Hook for individual shortcuts
// ============================================

interface UseKeyboardShortcutOptions {
  id: string;
  key: string;
  modifiers?: KeyboardShortcut["modifiers"];
  action: () => void | Promise<void>;
  description: string;
  category: KeyboardShortcut["category"];
  disabled?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcut(options: UseKeyboardShortcutOptions) {
  const { register, unregister } = useKeyboardShortcutsContext();

  React.useEffect(() => {
    if (options.enabled === false) return;

    const shortcut: KeyboardShortcut = {
      id: options.id,
      key: options.key,
      modifiers: options.modifiers,
      action: options.action,
      description: options.description,
      category: options.category,
      disabled: options.disabled,
      preventDefault: options.preventDefault,
    };

    register(shortcut);
    return () => unregister(options.id);
  }, [
    options.id,
    options.key,
    options.modifiers,
    options.action,
    options.description,
    options.category,
    options.disabled,
    options.preventDefault,
    options.enabled,
    register,
    unregister,
  ]);
}

// ============================================
// Predefined Shortcuts
// ============================================

export const PREDEFINED_SHORTCUTS = {
  // Navigation
  GO_HOME: { id: "go-home", key: "h", modifiers: { meta: true, shift: true }, description: "Go to home/dashboard", category: "navigation" as const },
  GO_MAP: { id: "go-map", key: "m", modifiers: { meta: true, shift: true }, description: "Go to map view", category: "navigation" as const },
  GO_SEARCH: { id: "go-search", key: "s", modifiers: { meta: true, shift: true }, description: "Go to search", category: "navigation" as const },
  GO_SETTINGS: { id: "go-settings", key: ",", modifiers: { meta: true }, description: "Go to settings", category: "navigation" as const },
  GO_BACK: { id: "go-back", key: "[", modifiers: { meta: true }, description: "Go back", category: "navigation" as const },
  GO_FORWARD: { id: "go-forward", key: "]", modifiers: { meta: true }, description: "Go forward", category: "navigation" as const },
  
  // Actions
  NEW_ITEM: { id: "new-item", key: "n", modifiers: { meta: true }, description: "Create new item", category: "actions" as const },
  SAVE: { id: "save", key: "s", modifiers: { meta: true }, description: "Save current item", category: "actions" as const },
  CLOSE: { id: "close", key: "w", modifiers: { meta: true }, description: "Close current view", category: "actions" as const },
  REFRESH: { id: "refresh", key: "r", modifiers: { meta: true }, description: "Refresh page", category: "actions" as const },
  DELETE: { id: "delete", key: "Backspace", modifiers: { meta: true }, description: "Delete selected item", category: "actions" as const },
  SELECT_ALL: { id: "select-all", key: "a", modifiers: { meta: true }, description: "Select all items", category: "actions" as const },
  
  // Search
  COMMAND_PALETTE: { id: "command-palette", key: "k", modifiers: { meta: true }, description: "Open command palette", category: "search" as const },
  FIND: { id: "find", key: "f", modifiers: { meta: true }, description: "Find in page", category: "search" as const },
  
  // Help
  SHOW_SHORTCUTS: { id: "show-shortcuts", key: "/", modifiers: { meta: true }, description: "Show keyboard shortcuts", category: "help" as const },
  ESCAPE: { id: "escape", key: "Escape", description: "Close modal/exit current mode", category: "help" as const },
};
