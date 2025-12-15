# Toast Notification Quick Reference

## Import

```typescript
import { toast } from '$lib/stores/toast';
```

## Basic Usage

| Method | Description | Duration | Example |
|--------|-------------|----------|---------|
| `toast.success(msg, duration?)` | Green success notification | 5s | `toast.success('Done!')` |
| `toast.error(msg, duration?, action?)` | Red error notification | 7s | `toast.error('Failed!')` |
| `toast.warning(msg, duration?, action?)` | Yellow warning notification | 6s | `toast.warning('Careful!')` |
| `toast.info(msg, duration?)` | Blue info notification | 5s | `toast.info('FYI...')` |

## Success Helpers

| Method | Message | Duration |
|--------|---------|----------|
| `toast.messageSent()` | "Message sent successfully!" | 3s |
| `toast.profileUpdated()` | "Profile updated successfully!" | 3s |
| `toast.saved()` | "Changes saved!" | 3s |
| `toast.deleted()` | "Deleted successfully!" | 3s |
| `toast.copied()` | "Copied to clipboard!" | 2s |

## Error Helpers

| Method | Message | Action Button |
|--------|---------|---------------|
| `toast.networkError(retry?)` | "Connection lost. Please check..." | Retry (optional) |
| `toast.authError()` | "Session expired. Please log in..." | Log In |
| `toast.rateLimitError(seconds?)` | "Too many requests. Wait X seconds..." | None |
| `toast.serverError(retry?)` | "Server error occurred..." | Retry (optional) |
| `toast.permissionError()` | "You do not have permission..." | None |
| `toast.validationError(msg)` | Custom validation message | None |

## Action Buttons

```typescript
// Error with retry
toast.error('Failed to save', 7000, {
  label: 'Retry',
  callback: async () => {
    await saveChanges();
  }
});

// Warning with undo
toast.warning('Item deleted', 5000, {
  label: 'Undo',
  callback: () => {
    restoreItem();
  }
});
```

## Programmatic Control

| Method | Description |
|--------|-------------|
| `toast.remove(id)` | Remove specific toast by ID |
| `toast.clear()` | Remove all toasts |

```typescript
// Get ID for later removal
const toastId = toast.info('Processing...');
// Remove it
toast.remove(toastId);

// Clear all
toast.clear();
```

## Duration Guide

| Type | Recommended | Notes |
|------|-------------|-------|
| Success | 2-3s | Quick confirmation |
| Info | 5s | Standard information |
| Warning | 5-6s | Needs attention |
| Error | 7-10s | Needs user action |
| Critical | 0 | Never auto-dismiss |

## Common Patterns

### Form Validation
```typescript
if (!email) {
  toast.validationError('Email is required');
  return;
}
```

### API Error Handling
```typescript
try {
  const response = await fetch('/api/data');

  if (response.status === 401) {
    toast.authError();
    return;
  }

  if (response.status === 429) {
    toast.rateLimitError(30);
    return;
  }

  if (!response.ok) {
    throw new Error('Failed');
  }

  toast.success('Data loaded!');

} catch (error) {
  if (error.message.includes('network')) {
    toast.networkError(fetchData);
  } else {
    toast.serverError(fetchData);
  }
}
```

### Delete with Undo
```typescript
async function deleteMessage() {
  const backup = message;

  await performDelete();

  toast.warning('Message deleted', 5000, {
    label: 'Undo',
    callback: async () => {
      await restore(backup);
      toast.success('Restored');
    }
  });
}
```

### Copy to Clipboard
```typescript
await navigator.clipboard.writeText(text);
toast.copied();
```

## Visual Features

- ✅ **4 Types**: Success (green), Error (red), Warning (yellow), Info (blue)
- ✅ **Icons**: Type-specific SVG icons
- ✅ **Frosted Glass**: Backdrop blur effect
- ✅ **Progress Bar**: Visual countdown
- ✅ **Animations**: Smooth slide-in from top-right
- ✅ **Stacking**: Maximum 3 visible toasts
- ✅ **Mobile**: Full-width, responsive design
- ✅ **Haptic**: Vibration on mobile interactions
- ✅ **Sound**: Optional audio cues (disabled by default)

## Accessibility

- ✅ **ARIA Live**: `aria-live="polite"`
- ✅ **Roles**: Proper `role="alert"`
- ✅ **Keyboard**: Tab navigation for actions
- ✅ **Screen Reader**: Announces notifications
- ✅ **Contrast**: High contrast colors

## TypeScript Types

```typescript
interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  duration?: number;      // ms, 0 = no auto-dismiss
  dismissible?: boolean;  // show X button
  action?: {
    label: string;
    callback: () => void | Promise<void>;
  };
}
```

## Sound Effects

Enable/disable via localStorage:

```typescript
// Enable
localStorage.setItem('toastSoundEnabled', 'true');

// Disable (default)
localStorage.setItem('toastSoundEnabled', 'false');
```

Frequencies:
- Success: C5 (523.25 Hz)
- Error: E4 (329.63 Hz)
- Warning: A4 (440 Hz)
- Info: G4 (392 Hz)

## Migration from alert()

| Before | After |
|--------|-------|
| `alert('Saved!')` | `toast.saved()` |
| `alert('Error!')` | `toast.error('Error occurred', 7000)` |
| `alert('Warning!')` | `toast.warning('Please verify')` |
| `confirm('Delete?')` | Use `ConfirmDialog` component instead |

## When NOT to Use

- ❌ Confirmations → Use `ConfirmDialog`
- ❌ Critical errors → Use `Modal`
- ❌ Form validation → Use inline validation
- ❌ Loading states → Use `Loading` component
- ❌ Complex info → Use `Modal` or dedicated page

## Best Practices

✅ **DO:**
- Use specific error helpers
- Provide retry callbacks
- Use appropriate durations
- Include actionable info
- Limit to max 3 toasts

❌ **DON'T:**
- Show generic "Error" messages
- Set very long durations (>30s)
- Use for critical errors
- Spam multiple toasts
- Forget retry mechanisms

## Testing

```typescript
import { toast } from '$lib/stores/toast';
import { get } from 'svelte/store';

// Add toast
toast.success('Test');

// Check state
const toasts = get(toast).toasts;
expect(toasts).toHaveLength(1);
expect(toasts[0].variant).toBe('success');

// Clear
toast.clear();
```

## Demo Component

View live examples at: `/src/lib/components/ui/ToastDemo.svelte`

## Documentation

- **Usage Guide**: `/src/docs/toast-usage-examples.md`
- **Migration Guide**: `/src/docs/toast-migration-guide.md`
- **Examples**: `/src/examples/toast-examples.ts`
- **Component**: `/src/lib/components/ui/Toast.svelte`
- **Store**: `/src/lib/stores/toast.ts`

---

**Tip**: Use error-specific helpers when possible for consistent UX!
