# Migration Guide: HTML Inputs to Enhanced Form Components

This guide helps you migrate from basic HTML form elements to the enhanced form components with better UX and accessibility.

## Input Component Migration

### Before: Basic HTML Input

```html
<div>
  <label for="email">Email</label>
  <input 
    type="email" 
    id="email" 
    placeholder="your.email@example.com" 
    class="border rounded p-2"
  />
</div>
```

### After: Enhanced Input Component

```tsx
<Input 
  type="email" 
  label="Email" 
  placeholder="your.email@example.com" 
  floatingLabel
/>
```

### Benefits of Migration

1. **Floating Labels**: Animated labels that move out of the way when focused
2. **Built-in Validation**: Error and success states with proper styling
3. **Accessibility**: Proper ARIA attributes and screen reader support
4. **Consistent Styling**: Unified design system with design tokens
5. **Enhanced Features**: Password visibility toggle, clear button, icons

## Textarea Component Migration

### Before: Basic HTML Textarea

```html
<div>
  <label for="description">Description</label>
  <textarea 
    id="description" 
    placeholder="Enter description..." 
    class="border rounded p-2"
  ></textarea>
</div>
```

### After: Enhanced Textarea Component

```tsx
<Textarea 
  label="Description" 
  placeholder="Enter description..." 
  autoResize
  maxLength={500}
  showCharacterCount
  floatingLabel
/>
```

### Benefits of Migration

1. **Auto-resize**: Automatically adjusts height based on content
2. **Character Count**: Shows remaining characters with warning threshold
3. **Floating Labels**: Animated labels for better UX
4. **Built-in Validation**: Error and success states

## Password Strength Integration

### Before: Basic Password Input

```html
<div>
  <label for="password">Password</label>
  <input 
    type="password" 
    id="password" 
    placeholder="Enter password" 
    class="border rounded p-2"
  />
</div>
```

### After: Password Input with Strength Indicator

```tsx
<div className="space-y-2">
  <Input 
    type="password" 
    label="Password" 
    placeholder="Enter password" 
    floatingLabel
  />
  <PasswordStrengthIndicator password={password} />
</div>
```

### Benefits of Migration

1. **Visual Feedback**: Real-time password strength visualization
2. **Criteria Checklist**: Shows what's needed for a strong password
3. **Accessibility**: Screen reader announcements
4. **User Guidance**: Helps users create secure passwords

## Switch Component Migration

### Before: Basic Checkbox

```html
<div>
  <input type="checkbox" id="notifications" />
  <label for="notifications">Enable notifications</label>
</div>
```

### After: Enhanced Switch Component

```tsx
<Switch 
  label="Enable notifications" 
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>
```

### Benefits of Migration

1. **Better UX**: Visual toggle with smooth animation
2. **Accessibility**: Proper ARIA attributes and keyboard navigation
3. **Consistent Styling**: Matches design system
4. **Enhanced Features**: Size variants, label positioning

## Best Practices

### 1. Use Floating Labels for Better UX

```tsx
{/* Good */}
<Input label="Email" placeholder="your.email@example.com" floatingLabel />

{/* Avoid */}
<Input label="Email" placeholder="your.email@example.com" />
```

### 2. Provide Meaningful Error Messages

```tsx
{/* Good */}
<Input 
  label="Email" 
  error="Please enter a valid email address" 
/>

{/* Avoid */}
<Input 
  label="Email" 
  error="Invalid" 
/>
```

### 3. Use Appropriate Size Variants

```tsx
{/* Good - Use size based on context */}
<Switch label="Enable feature" size="sm" /> // Compact form
<Switch label="Enable notifications" size="md" /> // Standard form
```

### 4. Combine Components for Complex Forms

```tsx
<div className="space-y-4">
  <Input 
    type="email" 
    label="Email" 
    placeholder="your.email@example.com" 
    floatingLabel
  />
  
  <div className="space-y-2">
    <Input 
      type="password" 
      label="Password" 
      placeholder="Enter password" 
      floatingLabel
    />
    <PasswordStrengthIndicator password={password} />
  </div>
  
  <Switch 
    label="Remember me" 
  />
</div>
```

## Accessibility Improvements

### 1. Proper Label Association

```tsx
{/* Automatic label association */}
<Input label="Email" id="email" />

{/* Manual label association */}
<label htmlFor="email">Email</label>
<Input id="email" />
```

### 2. Error Announcements

```tsx
{/* Automatic error announcement */}
<Input error="Please enter a valid email" />

{/* Manual error announcement */}
<div role="alert">Please enter a valid email</div>
<Input aria-describedby="email-error" />
```

### 3. Keyboard Navigation

All enhanced components support full keyboard navigation:
- Tab to focus
- Space/Enter to activate
- Arrow keys for radio groups
- Escape to dismiss

## Styling Consistency

### Before: Inconsistent Styles

```css
.input-primary {
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
}

.input-secondary {
  border: 2px solid gray;
  padding: 12px;
  border-radius: 8px;
}
```

### After: Consistent Design System

```tsx
// All components use the same design tokens
<Input className="custom-class" />
<Textarea className="custom-class" />
<Switch className="custom-class" />
```

## Performance Benefits

1. **Bundle Optimization**: Tree-shakable components
2. **Reduced Code Duplication**: Shared logic across components
3. **Better Maintainability**: Centralized component updates
4. **Improved Developer Experience**: Type-safe props and autocomplete

## Migration Checklist

- [ ] Replace basic `<input>` with `<Input>` component
- [ ] Replace basic `<textarea>` with `<Textarea>` component
- [ ] Replace checkboxes with `<Switch>` for toggle scenarios
- [ ] Add password strength indicators for password fields
- [ ] Implement floating labels for better UX
- [ ] Add proper error/success states
- [ ] Ensure accessibility compliance
- [ ] Test keyboard navigation
- [ ] Verify responsive behavior
- [ ] Update styling to match design system