# Input Component

The Input component is an enhanced version of the native HTML input element with additional features for better UX and accessibility.

## Features

- Password visibility toggle
- Clear button
- Floating labels
- Error/success states
- Helper text
- Left/right icons
- Size variants (sm/md/lg)
- Controlled/uncontrolled modes
- Forward refs
- Keyboard navigation
- Accessibility support

## Installation

```tsx
import { Input } from '@/components/ui/input';
```

## Usage

### Basic Input

```tsx
<Input placeholder="Enter text..." />
```

### Input with Label

```tsx
<Input label="Email" placeholder="your.email@example.com" />
```

### Input with Floating Label

```tsx
<Input label="Email" placeholder="your.email@example.com" floatingLabel />
```

### Password Input

```tsx
<Input type="password" label="Password" placeholder="Enter password" />
```

### Input with Left Icon

```tsx
import { Search } from 'lucide-react';

<Input 
  placeholder="Search..." 
  leftIcon={<Search className="w-4 h-4" />} 
/>
```

### Input with Right Icon

```tsx
import { User } from 'lucide-react';

<Input 
  placeholder="Enter username..." 
  rightIcon={<User className="w-4 h-4" />} 
/>
```

### Clearable Input

```tsx
<Input 
  placeholder="Enter text..." 
  clearable 
  value={value} 
  onChange={(e) => setValue(e.target.value)} 
/>
```

### Input with Error State

```tsx
<Input 
  label="Email" 
  placeholder="Enter email..." 
  error="Please enter a valid email address" 
/>
```

### Input with Success State

```tsx
<Input 
  label="Password" 
  type="password" 
  placeholder="Enter password..." 
  success="Password strength: Strong" 
/>
```

### Size Variants

```tsx
<Input placeholder="Small input" size="sm" />
<Input placeholder="Medium input" size="md" />
<Input placeholder="Large input" size="lg" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Label text for the input |
| helperText | string | - | Helper text displayed below the input |
| error | string | - | Error message |
| success | string | - | Success message |
| floatingLabel | boolean | false | Enable floating label animation |
| clearable | boolean | false | Show clear button |
| leftIcon | ReactNode | - | Icon to display on the left side |
| rightIcon | ReactNode | - | Icon to display on the right side |
| size | "sm" \| "md" \| "lg" | "md" | Size variant |

All other native HTML input attributes are also supported.

## Accessibility

- Proper ARIA attributes for error/success states
- Keyboard navigation support
- Focus management
- Screen reader compatible labels