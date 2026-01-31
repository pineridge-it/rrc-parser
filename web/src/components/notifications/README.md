# Enhanced Notification System

The enhanced notification system provides a comprehensive solution for managing user notifications across multiple channels and contexts.

## Components

### 1. Notification Context (`NotificationContext.tsx`)

The core context provider that manages notification state and provides methods for interacting with notifications.

#### Features:
- Persistent storage using localStorage
- Automatic cleanup of expired notifications
- Real-time unread count tracking
- Category-based filtering
- CRUD operations for notifications

#### Methods:
- `addNotification`: Add a new notification
- `markAsRead`: Mark a specific notification as read
- `markAllAsRead`: Mark all notifications as read
- `clearNotifications`: Clear all notifications
- `removeNotification`: Remove a specific notification
- `getUnreadCountByCategory`: Get unread count for a specific category

### 2. Notification Center (`NotificationCenter.tsx`)

A dropdown component that displays notifications in a categorized, filterable interface.

#### Features:
- Category filtering (All, Permits, Alerts, System, Exports, Usage, Account)
- Visual indicators for unread notifications
- Priority-based styling (normal, high, critical)
- Action buttons (mark as read, remove)
- Responsive design
- Smooth animations

#### Props:
- `notifications`: Array of notification objects
- `unreadCount`: Number of unread notifications
- `onMarkAsRead`: Function to mark a notification as read
- `onMarkAllAsRead`: Function to mark all notifications as read
- `onNotificationClick`: Function called when a notification is clicked
- `onRemoveNotification`: Function to remove a notification

### 3. Notification Preferences (`NotificationPreferences.tsx`)

A settings panel that allows users to customize their notification preferences.

#### Features:
- Channel preferences (Email, SMS, Push)
- Alert type preferences (Permit Alerts, Status Changes, System Updates)
- Frequency settings (Immediate, Weekly Digest)
- Persistent storage using localStorage
- Save and reset functionality

### 4. Banner Notifications (`BannerNotification.tsx`)

Prominent notifications that appear at the top of the screen for important system-wide messages.

#### Features:
- Multiple types (Info, Success, Warning, Error)
- Auto-dismissal with configurable duration
- Dismissible option
- Action buttons
- Smooth animations
- Stacking support

## Notification Types

### Categories:
- `permit`: Drilling permit related notifications
- `alert`: General alert notifications
- `system`: System-related notifications
- `export`: Data export notifications
- `usage`: Usage limit notifications
- `account`: Account-related notifications

### Types:
- `info`: Informational notifications
- `success`: Success notifications
- `warning`: Warning notifications
- `error`: Error notifications

### Priorities:
- `low`: Low priority notifications
- `medium`: Medium priority notifications
- `high`: High priority notifications
- `critical`: Critical priority notifications

## Usage Examples

### Adding a Notification:

```tsx
import { useNotifications } from '@/components/notifications'

function MyComponent() {
  const { addNotification } = useNotifications()
  
  const handleClick = () => {
    addNotification({
      title: 'New Permit Filed',
      body: 'A new drilling permit has been filed in your area of interest.',
      type: 'info',
      category: 'permit',
      icon: 'permit',
      priority: 'high'
    })
  }
  
  return <button onClick={handleClick}>Add Notification</button>
}
```

### Using Banner Notifications:

```tsx
import { BannerNotification } from '@/components/notifications'

function MyComponent() {
  const [bannerNotifications, setBannerNotifications] = useState<BannerNotification[]>([])
  
  const addBanner = () => {
    const newNotification: BannerNotification = {
      id: '1',
      type: 'warning',
      title: 'Maintenance Scheduled',
      message: 'System maintenance scheduled for this weekend.',
      dismissible: true,
      duration: 5000
    }
    
    setBannerNotifications(prev => [newNotification, ...prev])
  }
  
  const dismissBanner = (id: string) => {
    setBannerNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  return (
    <div>
      <button onClick={addBanner}>Show Banner</button>
      <BannerNotificationContainer 
        notifications={bannerNotifications}
        onDismiss={dismissBanner}
      />
    </div>
  )
}
```

### Using Notification Preferences:

```tsx
import { NotificationPreferences } from '@/components/notifications'

function SettingsPage() {
  return (
    <div>
      <h1>Notification Settings</h1>
      <NotificationPreferences />
    </div>
  )
}
```

## Integration with Toast Notifications

The notification system integrates seamlessly with the existing toast notification system:

```tsx
import { toast } from 'sonner'

// Success toast
toast.success('Operation completed successfully!', {
  description: 'Your data has been saved.',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo')
  }
})

// Error toast
toast.error('Failed to save data', {
  description: 'Please try again later.'
})
```

## Best Practices

1. **Use appropriate categories and types**: Always specify the correct category and type for each notification to enable proper filtering.

2. **Set meaningful priorities**: Use priority levels to indicate the importance of notifications.

3. **Provide clear actions**: Include action URLs or callbacks when notifications require user interaction.

4. **Respect user preferences**: Check user preferences before sending notifications through different channels.

5. **Handle expiration**: Set expiration dates for time-sensitive notifications.

6. **Test all notification types**: Ensure all notification types and categories display correctly.

7. **Optimize for accessibility**: Use proper ARIA labels and ensure keyboard navigation works correctly.

## Customization

The notification system can be customized by:

1. Modifying the notification types and categories in `types.ts`
2. Updating the styling in the component files
3. Adding new notification channels in the preferences component
4. Extending the notification context with additional methods
5. Creating custom notification templates for specific use cases

## Performance Considerations

1. **LocalStorage Limits**: Be mindful of localStorage size limits when storing many notifications.

2. **Rendering Performance**: Use virtualization for large lists of notifications.

3. **Cleanup**: Regularly clean up expired notifications to prevent memory bloat.

4. **Batch Updates**: Batch notification updates when possible to reduce re-renders.

## Accessibility

The notification system follows accessibility best practices:

- Proper ARIA attributes for screen readers
- Keyboard navigation support
- Sufficient color contrast
- Focus management
- Reduced motion support