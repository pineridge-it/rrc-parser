# Password Strength Indicator Component

The Password Strength Indicator component provides visual feedback on password strength to help users create secure passwords.

## Features

- 4-segment progress bar with color coding (red/yellow/green)
- Strength label (Very Weak to Strong)
- Criteria checklist (8+ chars, upper/lowercase, number, special char)
- Configurable minimum strength requirement
- zxcvbn-inspired scoring algorithm
- Accessibility with aria-live region for screen readers

## Installation

```tsx
import { PasswordStrengthIndicator } from '@/components/ui/password-strength';
```

## Usage

### Basic Usage

```tsx
<PasswordStrengthIndicator password={password} />
```

### With Minimum Strength Requirement

```tsx
<PasswordStrengthIndicator password={password} minStrength={3} />
```

### Without Label

```tsx
<PasswordStrengthIndicator password={password} showLabel={false} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| password | string | - | The password to evaluate |
| minStrength | number | 2 | Minimum required strength (0-4) |
| showLabel | boolean | true | Whether to show the strength label |
| className | string | - | Custom className for the container |

## Strength Levels

| Level | Score | Color | Label |
|-------|-------|-------|-------|
| 0 | 0-1 | Red | Very Weak |
| 1 | 2 | Red | Weak |
| 2 | 3 | Yellow | Fair |
| 3 | 4-5 | Green | Good |
| 4 | 6+ | Green | Strong |

## Criteria

The component evaluates passwords based on the following criteria:

1. At least 8 characters
2. Upper & lowercase letters
3. At least one number
4. At least one special character

## Scoring Algorithm

The component uses a zxcvbn-inspired scoring algorithm that considers:

- Password length
- Character variety (uppercase, lowercase, numbers, special characters)
- Common patterns
- Repeated characters

## Accessibility

- Aria-live region for screen readers
- Color contrast compliant with WCAG 2.1 AA
- Semantic HTML structure
- Proper labeling