"use client";

import * as React from "react";

/**
 * Theme Provider Component
 * 
 * Manages theme state (light/dark/system) and provides theme context
 * to all child components. Uses CSS custom properties for instant
 * theme switching without flash.
 */

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  systemTheme: "light" | "dark";
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  // Initialize theme from storage
  React.useEffect(() => {
    const root = window.document.documentElement;
    const stored = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = stored || defaultTheme;
    
    setThemeState(initialTheme);
    
    // Get system theme
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = initialTheme === "system" 
      ? (systemPrefersDark ? "dark" : "light")
      : initialTheme;
    
    setSystemTheme(systemPrefersDark ? "dark" : "light");
    setResolvedTheme(resolved);
    
    // Apply theme
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.setAttribute("data-theme", resolved);
    
    setMounted(true);
  }, [defaultTheme, storageKey]);

  // Listen for system theme changes
  React.useEffect(() => {
    if (!enableSystem) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);
      
      if (theme === "system") {
        applyTheme("system");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [enableSystem, theme]);

  const applyTheme = React.useCallback(
    (newTheme: Theme) => {
      const root = window.document.documentElement;
      
      // Disable transitions temporarily
      if (disableTransitionOnChange) {
        root.classList.add("disable-transitions");
      }
      
      // Determine resolved theme
      let resolved: "light" | "dark";
      if (newTheme === "system") {
        resolved = systemTheme;
      } else {
        resolved = newTheme;
      }
      
      // Apply theme
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.setAttribute("data-theme", resolved);
      
      setResolvedTheme(resolved);
      
      // Re-enable transitions
      if (disableTransitionOnChange) {
        requestAnimationFrame(() => {
          root.classList.remove("disable-transitions");
        });
      }
    },
    [disableTransitionOnChange, systemTheme]
  );

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(storageKey, newTheme);
      applyTheme(newTheme);
    },
    [applyTheme, storageKey]
  );

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme]
  );

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem("${storageKey}") || "${defaultTheme}";
                const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
                document.documentElement.classList.add(resolved);
                document.documentElement.setAttribute("data-theme", resolved);
              })();
            `,
          }}
        />
        <div style={{ visibility: "hidden" }}>{children}</div>
      </>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    // Return default values during SSR/SSG when ThemeProvider is not available
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      resolvedTheme: "light" as "light" | "dark",
      themes: ["light", "dark", "system"] as Theme[],
      systemTheme: "light" as "light" | "dark" | undefined,
    };
  }
  return context;
}

/**
 * Theme Toggle Component
 * 
 * A button that toggles between light and dark themes.
 * Can be used standalone or with custom children.
 */
interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center justify-center
        rounded-md p-2
        text-[var(--color-text-secondary)]
        hover:bg-[var(--color-surface-subtle)]
        hover:text-[var(--color-text-primary)]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[var(--color-brand-primary)]
        transition-colors
        ${className}
      `}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="ml-2">
          {resolvedTheme === "dark" ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}
