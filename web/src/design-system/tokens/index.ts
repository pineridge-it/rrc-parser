// Design System Tokens
// Central export for all design tokens

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './breakpoints';
export * from './transitions';

// Re-export as a single design system object for convenience
import { colors } from './colors';
import { typography } from './typography';
import { spacing, semanticSpacing } from './spacing';
import { shadows, semanticShadows } from './shadows';
import { breakpoints, containerMaxWidths, mediaQuery } from './breakpoints';
import { transitions, semanticTransitions, animations } from './transitions';

export const designSystem = {
  colors,
  typography,
  spacing,
  semanticSpacing,
  shadows,
  semanticShadows,
  breakpoints,
  containerMaxWidths,
  mediaQuery,
  transitions,
  semanticTransitions,
  animations,
};

// Type exports for TypeScript support
export type DesignSystem = typeof designSystem;
export type ColorPalette = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Shadows = typeof shadows;
export type Breakpoints = typeof breakpoints;
export type Transitions = typeof transitions;
