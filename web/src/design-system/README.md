# Design System Documentation

## Overview

This design system provides a comprehensive set of design tokens and UI components to ensure visual consistency and streamline development across the application. It serves as a single source of truth for all UI elements, enabling faster development, easier maintenance, and a cohesive user experience.

## Design Tokens

Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. We use them in place of hard-coded values to ensure consistency and enable easy theming.

### Colors

Located in `tokens/colors.ts`

- **Primary Colors**: Blue palette (50-900) for primary actions and branding
- **Secondary Colors**: Purple palette (50-900) for secondary actions
- **Neutral Colors**: Gray palette (50-900) for text, backgrounds, and borders
- **Status Colors**: Success (green), Warning (amber), Error (red), Info (blue)
- **Semantic Colors**: Text, background, border, and feedback colors

```typescript
import { colors } from '@/design-system/tokens';

// Usage
const primaryButton = {
  backgroundColor: colors.primary[600],
  color: colors.text.inverse,
};
```

### Typography

Located in `tokens/typography.ts`

- **Font Families**: Heading, body, and monospace fonts
- **Font Sizes**: xs to 9xl scale
- **Font Weights**: thin to black (100-900)
- **Line Heights**: none to loose
- **Letter Spacings**: tighter to widest

```typescript
import { typography } from '@/design-system/tokens';

// Usage
const heading = {
  fontFamily: typography.fonts.heading,
  fontSize: typography.fontSizes['2xl'],
  fontWeight: typography.fontWeights.bold,
  lineHeight: typography.lineHeights.tight,
};
```

### Spacing

Located in `tokens/spacing.ts`

- **Base Spacing**: 4px-based scale (0 to 96)
- **Semantic Spacing**: Component-specific spacing values

```typescript
import { spacing, semanticSpacing } from '@/design-system/tokens';

// Usage
const card = {
  padding: semanticSpacing.cardPadding,
  gap: semanticSpacing.cardGap,
};
```

### Shadows

Located in `tokens/shadows.ts`

- **Elevation Shadows**: xs, sm, md, lg, xl, 2xl
- **Focus Shadows**: Colored shadows for focus states
- **Semantic Shadows**: Component-specific shadow values

```typescript
import { shadows, semanticShadows } from '@/design-system/tokens';

// Usage
const card = {
  boxShadow: semanticShadows.card,
  '&:hover': {
    boxShadow: semanticShadows.cardHover,
  },
};
```

### Breakpoints

Located in `tokens/breakpoints.ts`

- **Breakpoint Values**: xs (0), sm (640), md (768), lg (1024), xl (1280), 2xl (1536)
- **Media Queries**: up, down, only, between helpers
- **Container Max Widths**: Responsive container sizes

```typescript
import { breakpoints, mediaQuery } from '@/design-system/tokens';

// Usage
const responsiveStyles = {
  padding: '1rem',
  [mediaQuery.up('md')]: {
    padding: '2rem',
  },
};
```

### Transitions

Located in `tokens/transitions.ts`

- **Duration**: instant, fast, normal, slow, slower
- **Easing**: linear, easeIn, easeOut, easeInOut, sharp, spring
- **Semantic Transitions**: Component-specific transition values
- **Animations**: Keyframe animations for common effects

```typescript
import { transitions, semanticTransitions } from '@/design-system/tokens';

// Usage
const button = {
  transition: semanticTransitions.button,
};
```

## Component Library

The component library provides a set of reusable UI components that follow the design system. All components are accessible, customizable, and well-documented.

### Available Components

#### Form Components
- **Button**: Primary, secondary, outline, ghost, and link variants
- **Input**: Text, email, password, number, and search inputs
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection
- **Checkbox**: Single or multiple selection
- **Radio**: Single selection from options
- **Switch**: Toggle on/off
- **FileUpload**: File selection and upload

#### Feedback Components
- **Toast**: Temporary notifications
- **Badge**: Status indicators and labels
- **Skeleton**: Loading placeholders
- **ErrorBoundary**: Error handling wrapper

#### Layout Components
- **Card**: Content container with variants
- **Dialog**: Modal dialogs
- **Popover**: Contextual overlays
- **Tooltip**: Hover information
- **Sidebar**: Navigation sidebar
- **Breadcrumb**: Navigation trail

#### Data Display Components
- **DataTable**: Sortable, filterable tables
- **VirtualScroll**: Efficient list rendering
- **LazyLoad**: Lazy loading wrapper

#### Utility Components
- **ThemeProvider**: Theme context provider
- **CommandPalette**: Keyboard-driven command interface
- **KeyboardShortcuts**: Keyboard shortcut system
- **SkipLink**: Accessibility skip navigation

### Component Usage

All components are exported from `@/components/ui`:

```typescript
import { Button, Input, Card } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Component Variants

Most components support multiple variants for different contexts:

```typescript
// Button variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

## Best Practices

### 1. Use Design Tokens

Always use design tokens instead of hard-coded values:

```typescript
// ❌ Bad
const styles = {
  color: '#3B82F6',
  padding: '16px',
};

// ✅ Good
import { colors, spacing } from '@/design-system/tokens';

const styles = {
  color: colors.primary[600],
  padding: spacing[4],
};
```

### 2. Use Semantic Tokens

Prefer semantic tokens over base tokens when available:

```typescript
// ❌ Less ideal
import { spacing } from '@/design-system/tokens';

const card = {
  padding: spacing[6],
};

// ✅ Better
import { semanticSpacing } from '@/design-system/tokens';

const card = {
  padding: semanticSpacing.cardPadding,
};
```

### 3. Compose Components

Build complex UIs by composing simple components:

```typescript
import { Card, Button, Input } from '@/components/ui';

function LoginForm() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Login</Card.Title>
      </Card.Header>
      <Card.Content>
        <Input type="email" placeholder="Email" />
        <Input type="password" placeholder="Password" />
      </Card.Content>
      <Card.Footer>
        <Button>Sign In</Button>
      </Card.Footer>
    </Card>
  );
}
```

### 4. Maintain Accessibility

All components are built with accessibility in mind. Follow these guidelines:

- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

### 5. Responsive Design

Use breakpoints for responsive layouts:

```typescript
import { mediaQuery } from '@/design-system/tokens';

const styles = {
  padding: '1rem',
  [mediaQuery.up('md')]: {
    padding: '2rem',
  },
  [mediaQuery.up('lg')]: {
    padding: '3rem',
  },
};
```

## Contributing

When adding new components or tokens:

1. Follow the existing naming conventions
2. Document all props and variants
3. Ensure accessibility compliance
4. Add usage examples
5. Test across different screen sizes
6. Update this documentation

## Resources

- [Design System Tokens](./tokens/)
- [Component Library](../components/ui/)
- [Component Showcase](../components/ui/component-showcase.tsx)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
