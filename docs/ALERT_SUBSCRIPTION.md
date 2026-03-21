# Alert Subscription Documentation

## Overview

The alert subscription functionality allows users to receive notifications when specific permits change status. Users can subscribe to individual permits and configure which status changes trigger notifications.

## Components

### PermitDetailHeader
Displays permit information and provides a "Watch This Permit" button to subscribe to alerts.

Props:
- `permit`: Permit object containing permit details

### AlertSubscriptionModal
Modal interface for configuring alert subscription settings.

Props:
- `isOpen`: Boolean controlling modal visibility
- `onClose`: Function to close the modal
- `permit`: Permit object for which subscription is being configured
- `existingSubscription`: Existing subscription object (if any)
- `onSuccess`: Function called when subscription is successfully created/updated

### WatchPermitButton
Button component that toggles between "Watch This Permit" and "Watching" states.

Props:
- `isSubscribed`: Boolean indicating current subscription state
- `onClick`: Function to handle button clicks
- `loading`: Boolean indicating if an operation is in progress

## Hooks

### useAlertSubscriptions
Custom hook for managing alert subscription state.

Returns:
- `subscriptions`: Array of alert subscriptions
- `loading`: Boolean indicating if an operation is in progress
- `error`: Error message (if any)
- `fetchSubscriptions`: Function to refresh subscriptions
- `createSubscription`: Function to create a new subscription
- `updateSubscription`: Function to update an existing subscription
- `deleteSubscription`: Function to delete a subscription
- `isSubscribedToPermit`: Function to check if subscribed to a permit
- `getSubscriptionForPermit`: Function to get subscription for a permit

## Services

### alerts.ts
Service layer for interacting with the alert subscription API.

Functions:
- `fetchAlertSubscriptions`: Fetch all subscriptions for current user
- `fetchAlertSubscriptionById`: Fetch a specific subscription by ID
- `createAlertSubscription`: Create a new subscription
- `updateAlertSubscription`: Update an existing subscription
- `deleteAlertSubscription`: Delete a subscription
- `fetchAlertEvents`: Fetch alert events

## Types

### AlertSubscription
Represents an alert subscription.

Properties:
- `id`: Unique identifier
- `workspace_id`: Workspace identifier
- `user_id`: User identifier
- `name`: Subscription name
- `trigger_type`: Type of trigger ('permit_status_change' or 'search_result_change')
- `permit_api_number`: Permit API number (for permit status change alerts)
- `saved_search_id`: Saved search ID (for search result change alerts)
- `watched_statuses`: Array of status changes to watch
- `notify_channels`: Array of notification channels ('email', 'in_app')
- `is_active`: Boolean indicating if subscription is active
- `created_at`: Creation timestamp

## Usage

To use the alert subscription functionality:

1. Navigate to a permit detail page
2. Click the "Watch This Permit" button
3. Configure alert settings in the modal
4. Save the subscription

Users will receive notifications when the subscribed permit changes status according to their configured preferences.