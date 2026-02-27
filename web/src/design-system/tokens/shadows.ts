// Design Tokens: Shadow System
// Elevation-based shadows for depth and hierarchy

export const shadows = {
  // No shadow
  none: 'none',
  
  // Subtle shadows for slight elevation
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  
  // Default shadow for cards and panels
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  
  // Elevated shadows for modals and dropdowns
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  
  // Maximum elevation for overlays
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Inner shadows for inset effects
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  
  // Colored shadows for focus states
  focus: {
    primary: '0 0 0 3px rgba(59, 130, 246, 0.5)',
    secondary: '0 0 0 3px rgba(139, 92, 246, 0.5)',
    success: '0 0 0 3px rgba(16, 185, 129, 0.5)',
    warning: '0 0 0 3px rgba(245, 158, 11, 0.5)',
    error: '0 0 0 3px rgba(239, 68, 68, 0.5)',
  },
};

// Semantic shadows for specific use cases
export const semanticShadows = {
  card: shadows.md,
  cardHover: shadows.lg,
  dropdown: shadows.lg,
  modal: shadows.xl,
  tooltip: shadows.md,
  button: shadows.sm,
  buttonHover: shadows.md,
  input: shadows.sm,
  inputFocus: shadows.focus.primary,
};
