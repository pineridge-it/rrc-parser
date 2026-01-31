# Switch Component

The Switch component is a boolean toggle for on/off states, commonly used for settings and preferences.

## Features

- Smooth sliding animation
- Label positioning (left/right)
- Size variants (sm/md/lg)
- Label and helper text support
- Error state handling
- Visible focus indicator
- Controlled/uncontrolled modes
- Accessibility with proper ARIA switch pattern

## Installation

```tsx
import { Switch } from '@/components/ui/switch';
```

## Usage

### Basic Switch

```tsx
<Switch 
  label="Enable notifications" 
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>
```

### Switch with Helper Text

```tsx
<Switch 
  label="Enable dark mode"
  helperText="Changes the appearance of the application"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>
```

### Switch with Error State

```tsx
<Switch 
  label="Accept terms and conditions"
  error="You must accept the terms and conditions"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>
```

### Disabled Switch

```tsx
<Switch 
  label="Auto-save drafts"
  checked={true}
  disabled
/>
```

### Required Switch

```tsx
<Switch 
  label="Agree to marketing emails"
  required
/>
```

### Label Position Left

```tsx
<Switch 
  label="Email notifications"
  labelPosition="left"
/>
```

### Size Variants

```tsx
<Switch label="Small switch" size="sm" />
<Switch label="Medium switch" size="md" />
<Switch label="Large switch" size="lg" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Label text for the switch |
| helperText | string | - | Helper text displayed below the switch |
| error | string | - | Error message |
| labelPosition | "left" \| "right" | "right" | Position of the label relative to the switch |
| size | "sm" \| "md" \| "lg" | "md" | Size variant |
| containerClassName | string | - | Custom className for the container |
| trackClassName | string | - | Custom className for the switch track |
| thumbClassName | string | - | Custom className for the switch thumb |

All other native HTML input attributes are also supported.

## Accessibility

- Proper ARIA switch pattern
- Keyboard navigation (Space/Enter to toggle)
- Visible focus indicator
- Screen reader compatible labels
- Error state announcements