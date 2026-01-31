"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// ============================================
// Types
// ============================================

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  commands?: CommandItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

// ============================================
// Icons
// ============================================

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

const HomeIcon = () => (
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
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MapIcon = () => (
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
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" x2="9" y1="3" y2="18" />
    <line x1="15" x2="15" y1="6" y2="21" />
  </svg>
);

const SettingsIcon = () => (
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
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const UserIcon = () => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PlusIcon = () => (
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
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const BellIcon = () => (
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
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const DownloadIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const LogOutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

const FileTextIcon = () => (
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
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const CreditCardIcon = () => (
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
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

// ============================================
// Default Commands Factory
// ============================================

export function createDefaultCommands(
  router: ReturnType<typeof useRouter>,
  toast: ReturnType<typeof useToast>["toast"]
): CommandItem[] {
  return [
    // Navigation Commands
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: <HomeIcon />,
      shortcut: "G D",
      category: "Navigation",
      keywords: ["home", "main", "start"],
      action: () => router.push("/dashboard"),
    },
    {
      id: "nav-map",
      label: "Go to Map",
      icon: <MapIcon />,
      shortcut: "G M",
      category: "Navigation",
      keywords: ["map", "view", "location"],
      action: () => router.push("/map"),
    },
    {
      id: "nav-search",
      label: "Go to Search",
      icon: <SearchIcon />,
      shortcut: "G S",
      category: "Navigation",
      keywords: ["search", "find", "query"],
      action: () => router.push("/search"),
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: <SettingsIcon />,
      shortcut: "G ,",
      category: "Navigation",
      keywords: ["settings", "preferences", "config"],
      action: () => router.push("/settings"),
    },
    {
      id: "nav-profile",
      label: "Go to Profile",
      icon: <UserIcon />,
      shortcut: "G P",
      category: "Navigation",
      keywords: ["profile", "account", "user"],
      action: () => router.push("/profile"),
    },
    {
      id: "nav-billing",
      label: "Go to Billing",
      icon: <CreditCardIcon />,
      shortcut: "G B",
      category: "Navigation",
      keywords: ["billing", "payment", "subscription"],
      action: () => router.push("/billing"),
    },

    // Action Commands
    {
      id: "action-new-aoi",
      label: "Create New AOI",
      icon: <PlusIcon />,
      shortcut: "C A",
      category: "Actions",
      keywords: ["aoi", "area", "draw", "create"],
      action: () => {
        router.push("/map?mode=draw");
        toast("success", "Drawing mode activated", {
          description: "Click on the map to start drawing an AOI.",
        });
      },
    },
    {
      id: "action-new-alert",
      label: "Create Alert",
      icon: <BellIcon />,
      shortcut: "C L",
      category: "Actions",
      keywords: ["alert", "notification", "watch"],
      action: () => router.push("/alerts/new"),
    },
    {
      id: "action-export",
      label: "Export Data",
      icon: <DownloadIcon />,
      shortcut: "C E",
      category: "Actions",
      keywords: ["export", "download", "save"],
      action: () => router.push("/export"),
    },
    {
      id: "action-invite",
      label: "Invite Team Member",
      icon: <UserIcon />,
      shortcut: "C I",
      category: "Actions",
      keywords: ["invite", "team", "member", "user"],
      action: () => router.push("/settings/team?invite=true"),
    },
    {
      id: "action-signout",
      label: "Sign Out",
      icon: <LogOutIcon />,
      category: "Actions",
      keywords: ["logout", "signout", "exit"],
      action: () => {
        // Sign out logic would go here
        toast("success", "Signed out", {
          description: "You have been successfully signed out.",
        });
      },
    },

    // Search Commands
    {
      id: "search-permits",
      label: "Search Permits...",
      icon: <FileTextIcon />,
      shortcut: "S P",
      category: "Search",
      keywords: ["permits", "search", "find"],
      action: () => router.push("/search?type=permits"),
    },
    {
      id: "search-aois",
      label: "Search AOIs...",
      icon: <MapIcon />,
      shortcut: "S A",
      category: "Search",
      keywords: ["aoi", "area", "search"],
      action: () => router.push("/search?type=aois"),
    },
    {
      id: "search-saved",
      label: "Search Saved Searches...",
      icon: <SearchIcon />,
      shortcut: "S S",
      category: "Search",
      keywords: ["saved", "search", "history"],
      action: () => router.push("/search?type=saved"),
    },
  ];
}

// ============================================
// Command Palette Component
// ============================================

export function CommandPalette({
  commands: customCommands,
  open: controlledOpen,
  onOpenChange,
  placeholder = "Type a command or search...",
  emptyMessage = "No commands found.",
  className,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  const { toast } = useToast();

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Get default commands
  const commands = React.useMemo(
    () => customCommands ?? createDefaultCommands(router, toast),
    [customCommands, router, toast]
  );

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    commands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [commands]);

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (onOpenChange) {
          onOpenChange(!isOpen);
        } else {
          setInternalOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onOpenChange]);

  // Handle command execution
  const handleSelect = React.useCallback(
    async (commandId: string) => {
      const command = commands.find((c) => c.id === commandId);
      if (command && !command.disabled) {
        setIsOpen(false);
        setSearch("");
        await command.action();
      }
    },
    [commands, setIsOpen]
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "flex items-center gap-2 px-4 py-2",
          "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]",
          "border border-[var(--color-border-default)] rounded-lg",
          "shadow-lg hover:shadow-xl transition-shadow",
          "hover:text-[var(--color-text-primary)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]",
          className
        )}
        aria-label="Open command palette"
      >
        <SearchIcon />
        <span className="text-sm hidden sm:inline">Command Palette</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-[var(--color-surface-subtle)] rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className={cn(
          "fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl px-4",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className={cn(
            "w-full overflow-hidden rounded-xl",
            "bg-[var(--color-surface-elevated)]",
            "border border-[var(--color-border-default)]",
            "shadow-2xl shadow-black/20"
          )}
          value={search}
          onValueChange={setSearch}
          loop
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-default)]">
            <SearchIcon />
            <Command.Input
              placeholder={placeholder}
              className={cn(
                "flex-1 bg-transparent text-[var(--color-text-primary)]",
                "placeholder:text-[var(--color-text-muted)]",
                "focus:outline-none text-base"
              )}
              aria-label="Search commands"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] rounded">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-[var(--color-text-muted)]">
              {emptyMessage}
            </Command.Empty>

            {Object.entries(groupedCommands).map(([category, items]) => (
              <Command.Group
                key={category}
                heading={category}
                className="px-2 py-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"
              >
                {items.map((command) => (
                  <Command.Item
                    key={command.id}
                    value={command.id}
                    keywords={command.keywords}
                    disabled={command.disabled}
                    onSelect={() => handleSelect(command.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                      "text-[var(--color-text-secondary)] cursor-pointer",
                      "data-[selected=true]:bg-[var(--color-brand-primary)] data-[selected=true]:text-white",
                      "data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed",
                      "transition-colors"
                    )}
                  >
                    {command.icon && (
                      <span className="flex-shrink-0 opacity-70">{command.icon}</span>
                    )}
                    <span className="flex-1">{command.label}</span>
                    {command.shortcut && (
                      <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-xs bg-[var(--color-surface-subtle)] data-[selected=true]:bg-white/20 rounded">
                        {command.shortcut.split(" ").map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <span className="text-[10px]">+</span>}
                            <span>{key}</span>
                          </React.Fragment>
                        ))}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--color-surface-subtle)] rounded">↑↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--color-surface-subtle)] rounded">↵</kbd>
                to select
              </span>
            </div>
            <span>
              {commands.length} commands available
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

// ============================================
// Hook for using command palette
// ============================================

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  const toggle = React.useCallback(() => setOpen((o) => !o), []);
  const openPalette = React.useCallback(() => setOpen(true), []);
  const closePalette = React.useCallback(() => setOpen(false), []);

  return {
    open,
    setOpen,
    toggle,
    openPalette,
    closePalette,
  };
}

// ============================================
// Export types
// ============================================

export type { CommandPaletteProps as CommandPaletteType };
