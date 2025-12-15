# Toast Notification System - Usage Guide

## Overview

The toast notification system provides a modern, user-friendly way to display notifications with visual polish, animations, and smart error handling.

## Basic Usage

### Import the toast store

```typescript
import { toast } from '$lib/stores/toast';
```

### Simple Notifications

```typescript
// Success (green, checkmark icon)
toast.success('Operation completed successfully!');

// Error (red, X icon)
toast.error('Something went wrong!');

// Info (blue, info icon)
toast.info('Here is some information.');

// Warning (yellow, warning triangle icon)
toast.warning('Please be careful!');
```

### Custom Duration

```typescript
// Auto-dismiss after 3 seconds
toast.success('Quick message!', 3000);

// Never auto-dismiss (duration = 0)
toast.error('Critical error - please review', 0);
```

## Advanced Usage

### With Action Buttons

```typescript
// Error with retry button
toast.error('Failed to save changes.', 7000, {
  label: 'Retry',
  callback: async () => {
    await saveChanges();
  }
});

// Warning with undo action
toast.warning('Message deleted', 5000, {
  label: 'Undo',
  callback: () => {
    restoreMessage();
  }
});
```

### Programmatic Control

```typescript
// Get toast ID for later removal
const toastId = toast.info('Processing...');

// Remove specific toast
toast.remove(toastId);

// Clear all toasts
toast.clear();
```

## Error-Specific Helpers

### Network Errors

```typescript
// With retry callback
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    // ... handle response
  } catch (error) {
    toast.networkError(fetchData); // Shows "Connection lost" with Retry button
  }
}
```

### Authentication Errors

```typescript
// Automatically shows login button
if (response.status === 401) {
  toast.authError(); // "Session expired. Please log in again" with Log In button
}
```

### Rate Limiting

```typescript
// Shows countdown timer
if (response.status === 429) {
  toast.rateLimitError(30); // "Too many requests. Please wait 30 seconds"
}
```

### Server Errors

```typescript
// Generic server error with retry
try {
  await apiCall();
} catch (error) {
  toast.serverError(apiCall); // "Server error occurred" with Retry button
}
```

### Permission Errors

```typescript
if (!hasPermission) {
  toast.permissionError(); // "You do not have permission to perform this action"
}
```

### Validation Errors

```typescript
if (!isValidEmail(email)) {
  toast.validationError('Please enter a valid email address');
}
```

## Success-Specific Helpers

```typescript
// Pre-configured success messages
toast.messageSent();      // "Message sent successfully!" (3s)
toast.profileUpdated();   // "Profile updated successfully!" (3s)
toast.saved();            // "Changes saved!" (3s)
toast.deleted();          // "Deleted successfully!" (3s)
toast.copied();           // "Copied to clipboard!" (2s)
```

## Complete Example: Form Submission

```typescript
async function handleSubmit() {
  try {
    // Validate
    if (!formData.email) {
      toast.validationError('Email is required');
      return;
    }

    // Submit
    const response = await fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (response.status === 401) {
      toast.authError();
      return;
    }

    if (response.status === 429) {
      toast.rateLimitError(60);
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to save');
    }

    // Success
    toast.profileUpdated();

  } catch (error) {
    // Network or unknown error
    if (error.message.includes('network')) {
      toast.networkError(handleSubmit);
    } else {
      toast.error('Failed to save profile. Please try again.', 7000, {
        label: 'Retry',
        callback: handleSubmit
      });
    }
  }
}
```

## Features

### Visual Features
- **4 Types**: Success (green), Error (red), Warning (yellow), Info (blue)
- **Icons**: SVG icons for visual consistency
- **Frosted Glass**: Backdrop blur effect for modern appearance
- **Progress Bar**: Visual countdown showing time remaining
- **Animations**: Smooth slide-in from top-right with fade
- **Stacking**: Maximum 3 visible toasts, older ones auto-removed

### Interaction Features
- **Auto-dismiss**: Configurable timer (default 5s)
- **Manual Dismiss**: X button on dismissible toasts
- **Action Buttons**: Optional action buttons (Retry, Undo, etc.)
- **Haptic Feedback**: Vibration on mobile devices when interacting
- **Sound Effects**: Optional audio cues (user-configurable)

### Accessibility Features
- **ARIA Live Region**: `aria-live="polite"` for screen readers
- **Semantic Roles**: Proper `role="alert"` attributes
- **Keyboard Navigation**: Focus management for action buttons
- **High Contrast**: Color schemes work in dark/light modes

### Responsive Design
- **Desktop**: Top-right corner, 300-400px wide
- **Mobile**: Full-width at top, respects safe areas
- **Scrolling**: Vertical scrolling if many toasts (max-height: 90vh)

## Sound Effects Configuration

Users can enable/disable sound effects via localStorage:

```typescript
// Enable sounds
localStorage.setItem('toastSoundEnabled', 'true');

// Disable sounds
localStorage.setItem('toastSoundEnabled', 'false');
```

Different toast types play different frequencies:
- Success: C5 (523.25 Hz)
- Error: E4 (329.63 Hz)
- Warning: A4 (440 Hz)
- Info: G4 (392 Hz)

## Best Practices

### Do's
- ✅ Use specific error helpers when available
- ✅ Provide retry callbacks for transient failures
- ✅ Use appropriate durations (shorter for success, longer for errors)
- ✅ Include actionable information in messages
- ✅ Use success helpers for common operations

### Don'ts
- ❌ Don't show too many toasts at once (max 3 enforced)
- ❌ Don't use generic "Error" messages - be specific
- ❌ Don't set very long durations (>30s) for auto-dismiss
- ❌ Don't use toasts for critical errors requiring immediate action
- ❌ Don't forget to provide retry mechanisms for recoverable errors

## Migration from alert()

### Before (Using alert)
```typescript
alert('Failed to send message. Please try again.');
```

### After (Using toast)
```typescript
toast.error('Failed to send message. Please try again.', 7000, {
  label: 'Retry',
  callback: sendMessage
});
```

## TypeScript Types

```typescript
interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  duration?: number;          // milliseconds, 0 = no auto-dismiss
  dismissible?: boolean;      // show X button
  action?: {
    label: string;            // button text
    callback: () => void | Promise<void>;
  };
}
```

## Integration

The Toast component is automatically included in the app layout. No additional setup required - just import and use the toast store.

```svelte
<!-- +layout.svelte -->
<script>
  import Toast from '$lib/components/ui/Toast.svelte';
</script>

<Toast />
<slot />
```
