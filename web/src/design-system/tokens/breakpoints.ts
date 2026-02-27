// Design Tokens: Responsive Breakpoints
// Mobile-first breakpoint system

export const breakpoints = {
  // Pixel values
  values: {
    xs: 0,      // Extra small devices (phones)
    sm: 640,    // Small devices (large phones)
    md: 768,    // Medium devices (tablets)
    lg: 1024,   // Large devices (desktops)
    xl: 1280,   // Extra large devices (large desktops)
    '2xl': 1536, // 2X large devices (ultra-wide)
  },
  
  // Media query strings
  up: {
    xs: '@media (min-width: 0px)',
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)',
  },
  
  down: {
    xs: '@media (max-width: 639px)',
    sm: '@media (max-width: 767px)',
    md: '@media (max-width: 1023px)',
    lg: '@media (max-width: 1279px)',
    xl: '@media (max-width: 1535px)',
    '2xl': '@media (max-width: 9999px)',
  },
  
  only: {
    xs: '@media (min-width: 0px) and (max-width: 639px)',
    sm: '@media (min-width: 640px) and (max-width: 767px)',
    md: '@media (min-width: 768px) and (max-width: 1023px)',
    lg: '@media (min-width: 1024px) and (max-width: 1279px)',
    xl: '@media (min-width: 1280px) and (max-width: 1535px)',
    '2xl': '@media (min-width: 1536px)',
  },
};

// Container max-widths for each breakpoint
export const containerMaxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Helper function to create media queries
export const mediaQuery = {
  up: (breakpoint: keyof typeof breakpoints.values) => 
    `@media (min-width: ${breakpoints.values[breakpoint]}px)`,
  down: (breakpoint: keyof typeof breakpoints.values) => 
    `@media (max-width: ${breakpoints.values[breakpoint] - 1}px)`,
  between: (min: keyof typeof breakpoints.values, max: keyof typeof breakpoints.values) =>
    `@media (min-width: ${breakpoints.values[min]}px) and (max-width: ${breakpoints.values[max] - 1}px)`,
};
