# Spacing System Documentation

## Overview

Our spacing system is based on a **4px baseline grid** that creates visual rhythm and consistency throughout the application. This modular scale ensures harmonious proportions and reduces cognitive load.

## Base Scale (Numeric)

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--space-0` | 0 | 0px | No spacing |
| `--space-px` | 1px | 1px | Hairline borders |
| `--space-0.5` | 0.125rem | 2px | Micro adjustments |
| `--space-1` | 0.25rem | 4px | **Base unit** |
| `--space-1.5` | 0.375rem | 6px | Small gaps |
| `--space-2` | 0.5rem | 8px | Tight spacing |
| `--space-2.5` | 0.625rem | 10px | Compact elements |
| `--space-3` | 0.75rem | 12px | Standard gaps |
| `--space-3.5` | 0.875rem | 14px | Form fields |
| `--space-4` | 1rem | 16px | Component padding |
| `--space-5` | 1.25rem | 20px | Medium spacing |
| `--space-6` | 1.5rem | 24px | Section gaps |
| `--space-7` | 1.75rem | 28px | Large components |
| `--space-8` | 2rem | 32px | Layout spacing |
| `--space-9` | 2.25rem | 36px | Spacious layouts |
| `--space-10` | 2.5rem | 40px | Large sections |
| `--space-11` | 2.75rem | 44px | Extra large |
| `--space-12` | 3rem | 48px | Major sections |
| `--space-14` | 3.5rem | 56px | Hero spacing |
| `--space-16` | 4rem | 64px | Feature sections |
| `--space-20` | 5rem | 80px | Large features |
| `--space-24` | 6rem | 96px | Extra large |
| `--space-28` | 7rem | 112px | Massive |
| `--space-32` | 8rem | 128px | Huge |
| `--space-36` | 9rem | 144px | Gigantic |
| `--space-40` | 10rem | 160px | Maximum |

## Semantic Spacing (Recommended)

Use semantic tokens for consistent component spacing:

### Component Padding
```css
--component-padding-xs: 4px   /* Compact elements */
--component-padding-sm: 8px   /* Small buttons, tags */
--component-padding-md: 12px  /* Standard inputs, buttons */
--component-padding-lg: 16px  /* Cards, panels */
--component-padding-xl: 24px  /* Large cards, modals */
```

### Component Gaps
```css
--component-gap-xs: 4px   /* Tight groupings */
--component-gap-sm: 8px   /* Standard gaps */
--component-gap-md: 12px  /* Form fields */
--component-gap-lg: 16px  /* Section gaps */
--component-gap-xl: 24px  /* Large sections */
```

### Layout Spacing
```css
--layout-gap-xs: 16px  /* Small layouts */
--layout-gap-sm: 24px  /* Standard layouts */
--layout-gap-md: 32px  /* Spacious layouts */
--layout-gap-lg: 48px  /* Large layouts */
--layout-gap-xl: 64px  /* Hero sections */
```

### Section Spacing
```css
--section-padding-xs: 24px  /* Compact sections */
--section-padding-sm: 32px  /* Standard sections */
--section-padding-md: 48px  /* Large sections */
--section-padding-lg: 64px  /* Hero sections */
--section-padding-xl: 80px  /* Feature sections */
```

### Content Spacing
```css
--content-gap-xs: 8px   /* Tight content */
--content-gap-sm: 12px  /* Standard content */
--content-gap-md: 16px  /* Paragraph spacing */
--content-gap-lg: 24px  /* Section content */
--content-gap-xl: 32px  /* Large content gaps */
```

## Usage Guidelines

### When to Use Each Scale

**4px (space-1)**: Icons, tight internal padding, micro-adjustments
**8px (space-2)**: Small buttons, tags, compact list items
**12px (space-3)**: Form inputs, standard buttons, card padding
**16px (space-4)**: Card padding, section gaps, layout spacing
**24px (space-6)**: Major section divisions, modal padding
**32px+ (space-8+)**: Page sections, hero areas, feature blocks

### CSS Usage

```css
/* Using CSS custom properties */
.my-component {
  padding: var(--component-padding-md);
  gap: var(--component-gap-sm);
  margin-bottom: var(--layout-gap-md);
}

/* Using Tailwind with CSS variables */
.my-component {
  padding: var(--space-3);
  gap: var(--space-2);
}
```

### React/Component Usage

```tsx
// Using inline styles with CSS variables
<div style={{ padding: 'var(--component-padding-md)' }}>

// Using Tailwind arbitrary values
<div className="p-[var(--space-3)]">

// Recommended: Use semantic tokens
<div className="p-[var(--component-padding-md)] gap-[var(--component-gap-sm)]">
```

## Best Practices

1. **Use semantic tokens** when possible for consistency
2. **Stick to the scale** - avoid arbitrary values like 13px or 27px
3. **8px is the standard** - most components use 8px or multiples
4. **Double for emphasis** - when you need more space, double (8→16→32)
5. **Halve for tight** - when you need less, halve (16→8→4)
6. **Maintain rhythm** - keep vertical spacing consistent within sections

## Migration Guide

When updating existing components:

| Old Value | New Token | Notes |
|-----------|-----------|-------|
| `p-1` (4px) | `--space-1` | No change needed |
| `p-2` (8px) | `--space-2` or `--component-padding-sm` | Use semantic |
| `p-3` (12px) | `--space-3` or `--component-padding-md` | Use semantic |
| `p-4` (16px) | `--space-4` or `--component-padding-lg` | Use semantic |
| `p-6` (24px) | `--space-6` or `--component-padding-xl` | Use semantic |
| `gap-4` (16px) | `--component-gap-lg` | Use semantic |
| `gap-6` (24px) | `--component-gap-xl` | Use semantic |

## Accessibility

- Maintain minimum 44px touch targets (use `--space-11` for padding)
- Ensure sufficient spacing between interactive elements
- Use consistent spacing to support predictable navigation
- Test with screen magnifiers to verify spacing remains clear
