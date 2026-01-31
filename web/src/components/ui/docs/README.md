# Form Components Documentation

Enhanced form components for the RRC Permit Research application with improved UX, accessibility, and consistency.

## Components

1. [Input](./Input.md) - Enhanced text input with password visibility, clear button, and floating labels
2. [PasswordStrengthIndicator](./PasswordStrengthIndicator.md) - Visual password strength feedback with criteria checklist
3. [Textarea](./Textarea.md) - Multi-line input with auto-resize and character count
4. [Switch](./Switch.md) - Toggle switch component for boolean values

## Migration

- [Migration Guide](./MIGRATION_GUIDE.md) - How to migrate from basic HTML inputs to enhanced components

## Best Practices

### Accessibility

All form components follow WCAG 2.1 AA compliance standards:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast ratios
- Error state announcements

### Consistency

Components follow a consistent API pattern:

```tsx
<Component
  label="Field Label"
  helperText="Optional helper text"
  error="Error message"
  success="Success message"
  floatingLabel // For Input and Textarea
  size="md" // sm | md | lg
  disabled={false}
  required={false}
  value={value}
  onChange={handleChange}
/>
```

### Form Validation

Components support both client-side and server-side validation:

```tsx
// Client-side validation
<Input 
  label="Email"
  type="email"
  error={emailError}
  onChange={(e) => {
    setEmail(e.target.value);
    // Clear error when user types
    if (emailError) setEmailError('');
  }}
/>

// Server-side validation
<Input 
  label="Username"
  error={serverError?.field === 'username' ? serverError.message : undefined}
/>
```

## Usage Examples

### Login Form

```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    placeholder="your.email@example.com"
    floatingLabel
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={emailError}
  />
  
  <div className="space-y-2">
    <Input
      label="Password"
      type="password"
      placeholder="Enter password"
      floatingLabel
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <PasswordStrengthIndicator password={password} />
  </div>
  
  <Switch
    label="Remember me"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
  />
  
  <button type="submit">Sign In</button>
</form>
```

### Profile Form

```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Full Name"
    placeholder="Enter your full name"
    floatingLabel
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
  />
  
  <Textarea
    label="Bio"
    placeholder="Tell us about yourself"
    floatingLabel
    autoResize
    maxLength={500}
    showCharacterCount
    value={bio}
    onChange={(e) => setBio(e.target.value)}
  />
  
  <Switch
    label="Enable notifications"
    helperText="Receive email notifications for important updates"
    checked={notifications}
    onChange={(e) => setNotifications(e.target.checked)}
  />
  
  <button type="submit">Save Profile</button>
</form>
```

## Customization

All components support customization through className props and design tokens:

```tsx
// Custom styling
<Input 
  label="Custom Input" 
  className="border-2 border-purple-500 rounded-lg"
/>

// Size variants
<Input label="Small" size="sm" />
<Input label="Medium" size="md" />
<Input label="Large" size="lg" />

// Label positioning
<Switch label="Left label" labelPosition="left" />
<Switch label="Right label" labelPosition="right" />
```

## Testing

Components are designed with testing in mind:

- Data-testid attributes for easy selection
- Predictable class names
- Consistent behavior
- Type-safe props

```tsx
// Testing example with React Testing Library
import { render, screen } from '@testing-library/react';

test('Input component renders correctly', () => {
  render(<Input label="Email" data-testid="email-input" />);
  
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  expect(screen.getByTestId('email-input')).toBeInTheDocument();
});
```

## Performance

Components are optimized for performance:

- Minimal re-renders
- Efficient event handling
- Proper cleanup of resources
- Tree-shakable imports

```tsx
// Import only what you need
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
```

## Browser Support

Components support all modern browsers:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

For older browsers, polyfills may be required for:

- CSS Custom Properties
- ES6+ JavaScript features
- Intersection Observer API (for auto-resize)