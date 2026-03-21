# Permit Detail Page Design Specification

## Overview

This document outlines the design specification for the permit detail page, which will display detailed information about a specific permit and provide users with the ability to subscribe to status change alerts.

## Page Structure

### Header Section
- Permit API Number (large, prominent display)
- Permit Status Badge (with color coding)
- "Watch This Permit" button (primary action)
- Operator Name and Number
- Lease/Well Name
- County
- Filed Date

### Map Section
- Interactive map showing permit location
- Buffer zone visualization (if applicable)
- Nearby AOIs (if any)

### Tabbed Content Area
1. **General Information Tab**
   - Permit Type
   - Well Number
   - API Number
   - Operator Details
   - Lease Information
   - County
   - Field Name
   - District
   - Filed Date
   - Updated Date

2. **Status History Tab**
   - Timeline of status changes
   - Date, Old Status, New Status for each change
   - Reason for status change (if available)

3. **Activity Timeline Tab**
   - All activities related to the permit
   - Drilling reports
   - Inspection records
   - Amendment filings

## Component Specifications

### PermitDetailHeader Component
```
Props:
- permit: Permit object containing all permit details
- isSubscribed: Boolean indicating if user is watching this permit
- onSubscribe: Function to handle subscription action
- loading: Boolean indicating if subscription action is in progress

Structure:
┌─────────────────────────────────────────────────────────────────────┐
│ Permit API Number                      [Watch This Permit] Button  │
│ Status Badge                                                       │
│ Operator Name & Number                                             │
│ Lease/Well Name                                                    │
│ County | Filed Date                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### PermitStatusBadge Component
```
Props:
- status: String representing permit status
- size: Enum (small, medium, large) - default medium

Status Colors:
- Approved: Green (#10B981)
- Pending: Yellow (#F59E0B)
- Denied: Red (#EF4444)
- Amendment: Blue (#3B82F6)
- Expired: Gray (#6B7280)
- Cancelled: Gray (#6B7280)
```

### WatchPermitButton Component
```
Props:
- isSubscribed: Boolean indicating current subscription state
- onClick: Function to handle button click
- loading: Boolean indicating if action is in progress
- variant: Enum (primary, secondary) - default primary

States:
1. Not Watching (default):
   - Text: "Watch This Permit"
   - Icon: Bell (outline)
   - Style: Primary button

2. Watching:
   - Text: "Watching"
   - Icon: Bell (filled)
   - Style: Success button with subtle green tint

3. Loading:
   - Text: "Updating..."
   - Icon: Spinner
   - Style: Primary button with disabled state
```

### AlertSubscriptionModal Component
```
Props:
- isOpen: Boolean controlling modal visibility
- onClose: Function to close modal
- permit: Permit object for which subscription is being configured
- existingSubscription: Existing subscription object (if any)
- onSubmit: Function to handle form submission

Form Fields:
1. Subscription Name (auto-generated but editable)
2. Status Change Triggers (checkboxes):
   - [ ] Approved
   - [ ] Denied
   - [ ] Amendment
   - [ ] Expired
   - [ ] Cancelled
   - [ ] Any Status Change (selects all)
3. Notification Channels:
   - [x] Email
   - [x] In-App Notifications
4. Action Buttons:
   - Cancel (secondary)
   - Save Subscription (primary)

Success State:
- Confirmation message
- Option to view all alerts in settings
- Close button
```

## User Flows

### Watching a Permit for the First Time
1. User navigates to permit detail page
2. User clicks "Watch This Permit" button
3. Alert Subscription Modal opens
4. User configures alert preferences
5. User clicks "Save Subscription"
6. Modal shows success confirmation
7. Button updates to "Watching" state

### Updating an Existing Subscription
1. User navigates to permit detail page
2. User clicks "Watching" button
3. Alert Subscription Modal opens with existing settings
4. User modifies alert preferences
5. User clicks "Save Subscription"
6. Modal shows success confirmation
7. Button remains in "Watching" state

### Unsubscribing from Alerts
1. User navigates to permit detail page
2. User clicks "Watching" button
3. Alert Subscription Modal opens with existing settings
4. User clicks "Unsubscribe" link/button
5. Confirmation dialog appears
6. User confirms unsubscribe action
7. Button updates to "Watch This Permit" state

## Responsive Design

### Desktop (> 1024px)
- Two-column layout for header (permit info on left, watch button on right)
- Full-width map section
- Tabbed content area with ample spacing

### Tablet (768px - 1024px)
- Single column layout for header
- Watch button below permit info
- Map section scales appropriately
- Tabbed content area adapts to screen width

### Mobile (< 768px)
- Single column layout for all sections
- Stacked elements with appropriate padding
- Touch-friendly button sizes
- Simplified modal layout

## Accessibility Considerations

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 contrast ratio)
- Status badges have sufficient contrast against backgrounds
- Interactive elements have clear focus states

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order follows visual layout
- Escape key closes modals
- Enter/space activate buttons and links

### Screen Reader Support
- Proper heading hierarchy (h1 for permit number, h2 for sections, etc.)
- ARIA labels for icons and status indicators
- Live regions for status updates
- Descriptive alt text for map and visual elements

## Animation and Micro-interactions

### Button State Transitions
- Smooth color transition when toggling between "Watch" and "Watching" states
- Subtle pulse animation when button enters "Watching" state
- Loading spinner with smooth rotation

### Modal Interactions
- Fade-in/fade-out for modal overlay
- Slide-up animation for modal content
- Smooth transitions between form and success states

### Status Badge Animations
- Subtle glow effect when status is updated
- Smooth color transitions between status changes

## Design Tokens

### Colors
- Primary: var(--color-brand-primary) (#3B82F6)
- Success: var(--color-success) (#10B981)
- Warning: var(--color-warning) (#F59E0B)
- Error: var(--color-error) (#EF4444)
- Info: var(--color-info) (#3B82F6)
- Text Primary: var(--color-text-primary) (#111827)
- Text Secondary: var(--color-text-secondary) (#6B7280)
- Text Tertiary: var(--color-text-tertiary) (#9CA3AF)
- Surface Raised: var(--color-surface-raised) (#FFFFFF)
- Surface Subtle: var(--color-surface-subtle) (#F9FAFB)
- Border Default: var(--color-border-default) (#E5E7EB)

### Typography
- Permit Number: text-2xl font-bold
- Status Badge: text-xs font-semibold
- Section Headers: text-lg font-semibold
- Body Text: text-sm
- Secondary Text: text-xs

### Spacing
- Section Padding: 1.5rem
- Element Spacing: 1rem
- Component Padding: 0.75rem
- Icon Spacing: 0.5rem

## Edge Cases and Error States

### No Permit Data
- Display friendly error message
- Provide link back to search results
- Show "Try Again" button

### Network Errors
- Display connection error message
- Show retry button
- Maintain partial UI if some data is cached

### Unauthorized Access
- Redirect to login if session expired
- Show appropriate error message for forbidden access

### Rate Limiting
- Display rate limit warning
- Show countdown timer for retry
- Disable subscription actions temporarily

This design specification provides a comprehensive blueprint for implementing the permit detail page with alert subscription functionality, ensuring a consistent and user-friendly experience across all device sizes and user scenarios.