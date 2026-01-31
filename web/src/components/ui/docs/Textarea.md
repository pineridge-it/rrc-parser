# Textarea Component

The Textarea component is an enhanced version of the native HTML textarea element with auto-resize functionality and character counting.

## Features

- Auto-resize with configurable max-height
- Character count display with warning threshold
- Label and helper text support
- Error state handling
- Disabled state
- Floating labels
- Paste event handling
- Controlled/uncontrolled modes
- Accessibility support

## Installation

```tsx
import { Textarea } from '@/components/ui/textarea';
```

## Usage

### Basic Textarea

```tsx
<Textarea placeholder="Enter text..." />
```

### Textarea with Auto-resize

```tsx
<Textarea 
  placeholder="Enter text..." 
  autoResize 
/>
```

### Textarea with Character Count

```tsx
<Textarea 
  placeholder="Enter text..." 
  maxLength={200}
  showCharacterCount
/>
```

### Textarea with Label and Helper Text

```tsx
<Textarea 
  label="Description" 
  helperText="Please provide a detailed description" 
  placeholder="Enter a detailed description..." 
/>
```

### Textarea with Floating Label

```tsx
<Textarea 
  label="Comments" 
  placeholder="Enter your comments..." 
  floatingLabel
/>
```

### Textarea with Error State

```tsx
<Textarea 
  label="Description" 
  error="Description is required" 
  placeholder="Enter a detailed description..." 
/>
```

### Textarea with Success State

```tsx
<Textarea 
  label="Description" 
  success="Description looks good!" 
  placeholder="Enter a detailed description..." 
/>
```

### Disabled Textarea

```tsx
<Textarea 
  label="Description" 
  placeholder="Enter a detailed description..." 
  disabled
  value="This textarea is disabled"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Label text for the textarea |
| helperText | string | - | Helper text displayed below the textarea |
| error | string | - | Error message |
| success | string | - | Success message |
| maxLength | number | - | Maximum number of characters allowed |
| showCharacterCount | boolean | false | Show character count display |
| autoResize | boolean | false | Enable auto-resize functionality |
| maxHeight | number | 300 | Maximum height for auto-resize |
| warningThreshold | number | 0.8 | Warning threshold for character count (0-1) |
| floatingLabel | boolean | false | Enable floating label animation |

All other native HTML textarea attributes are also supported.

## Accessibility

- Proper ARIA attributes for error/success states
- Keyboard navigation support
- Focus management
- Screen reader compatible labels
- Character count announcements