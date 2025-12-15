# Toast Notification Migration Guide

## Overview

This guide helps migrate from generic `alert()` calls to the modern toast notification system.

## Why Migrate?

### Problems with alert()
- ❌ Blocks the entire UI (modal and synchronous)
- ❌ No customization (appearance, duration, actions)
- ❌ Poor user experience (interrupts workflow)
- ❌ Not mobile-friendly
- ❌ No accessibility features
- ❌ Can't show multiple alerts simultaneously
- ❌ No retry mechanisms

### Benefits of Toast Notifications
- ✅ Non-blocking and asynchronous
- ✅ Visually polished with animations
- ✅ Automatic dismissal with timers
- ✅ Action buttons (Retry, Undo, etc.)
- ✅ Mobile-optimized with haptic feedback
- ✅ Accessible (ARIA live regions)
- ✅ Stacks multiple notifications
- ✅ Type-specific styling and icons
- ✅ Frosted glass effect
- ✅ Progress bars

## Migration Steps

### Step 1: Import the toast store

```typescript
// Add to your component
import { toast } from '$lib/stores/toast';
```

### Step 2: Replace alert() calls

#### Before: Generic Error
```typescript
try {
  await someOperation();
} catch (error) {
  alert('Operation failed!');
}
```

#### After: Typed Error with Retry
```typescript
try {
  await someOperation();
} catch (error) {
  toast.error('Operation failed. Please try again.', 7000, {
    label: 'Retry',
    callback: someOperation
  });
}
```

#### Before: Success Message
```typescript
alert('Changes saved successfully!');
```

#### After: Success Toast
```typescript
toast.saved(); // or toast.success('Changes saved successfully!', 3000);
```

#### Before: Confirmation (Not Ideal)
```typescript
if (confirm('Are you sure?')) {
  deleteItem();
}
```

#### After: Use ConfirmDialog Component
```typescript
// Toast is not for confirmations - use ConfirmDialog instead
import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
// Then show confirmation dialog, not toast
```

### Step 3: Add Error Type Detection

Instead of generic errors, detect the error type:

```typescript
try {
  await fetch('/api/data');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network error
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    toast.networkError(fetchData);
  }
  // Auth error
  else if (errorMessage.includes('auth') || errorMessage.includes('401')) {
    toast.authError();
  }
  // Rate limit
  else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    toast.rateLimitError(30);
  }
  // Generic error
  else {
    toast.error('An error occurred. Please try again.', 7000, {
      label: 'Retry',
      callback: fetchData
    });
  }
}
```

### Step 4: Handle HTTP Response Codes

```typescript
async function apiCall() {
  const response = await fetch('/api/endpoint');

  switch (response.status) {
    case 200:
      toast.success('Operation completed successfully!');
      break;

    case 401:
      toast.authError();
      break;

    case 403:
      toast.permissionError();
      break;

    case 429:
      const retryAfter = parseInt(response.headers.get('Retry-After') || '30');
      toast.rateLimitError(retryAfter);
      break;

    case 500:
    case 502:
    case 503:
      toast.serverError(apiCall);
      break;

    default:
      if (!response.ok) {
        toast.error('Request failed. Please try again.', 7000, {
          label: 'Retry',
          callback: apiCall
        });
      }
  }
}
```

## Common Patterns

### Pattern 1: Form Validation

#### Before
```typescript
function validateForm() {
  if (!email) {
    alert('Email is required');
    return false;
  }
  if (!password) {
    alert('Password is required');
    return false;
  }
  return true;
}
```

#### After
```typescript
function validateForm() {
  if (!email) {
    toast.validationError('Email is required');
    return false;
  }
  if (!password) {
    toast.validationError('Password is required');
    return false;
  }
  return true;
}
```

### Pattern 2: Async Operation with Retry

#### Before
```typescript
async function saveChanges() {
  try {
    await save();
    alert('Saved!');
  } catch (error) {
    alert('Failed to save');
  }
}
```

#### After
```typescript
async function saveChanges() {
  try {
    await save();
    toast.saved();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('network')) {
      toast.networkError(saveChanges);
    } else {
      toast.error('Failed to save. Please try again.', 7000, {
        label: 'Retry',
        callback: saveChanges
      });
    }
  }
}
```

### Pattern 3: Delete with Undo

#### Before
```typescript
function deleteMessage() {
  if (confirm('Delete this message?')) {
    performDelete();
    alert('Message deleted');
  }
}
```

#### After
```typescript
async function deleteMessage() {
  const backup = currentMessage;

  try {
    await performDelete();

    toast.warning('Message deleted', 5000, {
      label: 'Undo',
      callback: async () => {
        await restoreMessage(backup);
        toast.success('Message restored');
      }
    });
  } catch (error) {
    toast.error('Failed to delete message', 7000);
  }
}
```

### Pattern 4: Copy to Clipboard

#### Before
```typescript
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  alert('Copied!');
}
```

#### After
```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.copied(); // Quick 2-second notification
  } catch (error) {
    toast.error('Failed to copy to clipboard');
  }
}
```

### Pattern 5: Loading State

#### Before
```typescript
// Alert can't show loading states
async function fetchData() {
  const data = await fetch('/api/data');
  alert('Data loaded!');
}
```

#### After
```typescript
async function fetchData() {
  // Option 1: Show loading in UI, then toast on completion
  const data = await fetch('/api/data');
  toast.success('Data loaded successfully!', 3000);

  // Option 2: Persistent toast that you remove manually
  const loadingToastId = toast.info('Loading data...', 0);
  const data = await fetch('/api/data');
  toast.remove(loadingToastId);
  toast.success('Data loaded!');
}
```

## Complete Component Migration Example

### Before: Using alert()

```svelte
<script lang="ts">
  async function handleSubmit() {
    if (!formData.email) {
      alert('Email is required');
      return;
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        alert('Submission failed');
        return;
      }

      alert('Submitted successfully!');
    } catch (error) {
      alert('Network error');
    }
  }
</script>
```

### After: Using toast

```svelte
<script lang="ts">
  import { toast } from '$lib/stores/toast';

  async function handleSubmit() {
    // Validation with specific messages
    if (!formData.email) {
      toast.validationError('Email is required');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.validationError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      // Handle specific HTTP codes
      if (response.status === 401) {
        toast.authError();
        return;
      }

      if (response.status === 429) {
        toast.rateLimitError(60);
        return;
      }

      if (!response.ok) {
        toast.error('Submission failed. Please try again.', 7000, {
          label: 'Retry',
          callback: handleSubmit
        });
        return;
      }

      // Success with short duration
      toast.success('Submitted successfully!', 3000);

    } catch (error) {
      // Network error with retry
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.networkError(handleSubmit);
      } else {
        toast.serverError(handleSubmit);
      }
    }
  }
</script>
```

## Testing Toast Notifications

### Manual Testing Checklist

- [ ] Visual appearance in light/dark themes
- [ ] Slide-in animation works smoothly
- [ ] Progress bar animates correctly
- [ ] Auto-dismiss works at correct duration
- [ ] Manual dismiss (X button) works
- [ ] Action buttons work and dismiss toast
- [ ] Multiple toasts stack properly (max 3)
- [ ] Mobile responsive (full width on small screens)
- [ ] Haptic feedback works on mobile
- [ ] Sound effects work (if enabled)
- [ ] Accessible via screen reader
- [ ] Keyboard navigation for action buttons

### Unit Testing

```typescript
import { toast } from '$lib/stores/toast';
import { get } from 'svelte/store';

describe('Toast Store', () => {
  beforeEach(() => {
    toast.clear();
  });

  it('should add a success toast', () => {
    toast.success('Test message');
    const toasts = get(toast).toasts;

    expect(toasts).toHaveLength(1);
    expect(toasts[0].variant).toBe('success');
    expect(toasts[0].message).toBe('Test message');
  });

  it('should remove toast after duration', async () => {
    toast.success('Test message', 1000);

    await new Promise(resolve => setTimeout(resolve, 1100));

    const toasts = get(toast).toasts;
    expect(toasts).toHaveLength(0);
  });

  it('should limit to 3 toasts', () => {
    toast.info('Message 1');
    toast.info('Message 2');
    toast.info('Message 3');
    toast.info('Message 4');

    const toasts = get(toast).toasts;
    expect(toasts).toHaveLength(3);
    expect(toasts[0].message).toBe('Message 2'); // First one removed
  });

  it('should call action callback', async () => {
    const callback = vi.fn();

    toast.error('Test', 5000, {
      label: 'Retry',
      callback
    });

    const toasts = get(toast).toasts;
    await toasts[0].action?.callback();

    expect(callback).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Toast not appearing

1. Check that Toast component is in layout:
```svelte
<!-- +layout.svelte -->
<Toast />
```

2. Verify import is correct:
```typescript
import { toast } from '$lib/stores/toast';
```

### Multiple toasts not stacking

The system enforces a maximum of 3 visible toasts. Older toasts are automatically removed when the limit is reached.

### Toast disappearing too quickly

Adjust duration:
```typescript
toast.error('Important message', 10000); // 10 seconds
toast.error('Critical message', 0); // Never auto-dismiss
```

### Action button not working

Ensure callback is async-safe:
```typescript
toast.error('Failed', 7000, {
  label: 'Retry',
  callback: async () => {
    await retryOperation(); // Use async/await
  }
});
```

### Sound not playing

Sounds are disabled by default. Enable in localStorage:
```typescript
localStorage.setItem('toastSoundEnabled', 'true');
```

## Best Practices

### Duration Guidelines

- **Success**: 2-3 seconds (quick confirmation)
- **Info**: 5 seconds (standard information)
- **Warning**: 5-6 seconds (needs attention)
- **Error**: 7-10 seconds (needs user action)
- **Critical**: 0 (never auto-dismiss)

### Message Guidelines

- ✅ Be specific: "Failed to save profile" not "Error"
- ✅ Be actionable: "Check your internet connection"
- ✅ Be concise: One sentence maximum
- ✅ Use proper grammar and punctuation
- ❌ Don't use technical jargon
- ❌ Don't show stack traces
- ❌ Don't use ALL CAPS

### When NOT to Use Toasts

- ❌ Confirmations (use ConfirmDialog)
- ❌ Critical errors requiring immediate action (use Modal)
- ❌ Form validation errors (use inline validation)
- ❌ Loading states (use Loading component)
- ❌ Complex information (use Modal or dedicated page)

## Rollout Strategy

1. **Phase 1**: Replace all `alert()` calls with toast
2. **Phase 2**: Add retry mechanisms to errors
3. **Phase 3**: Implement undo for destructive actions
4. **Phase 4**: Add sound/haptic preferences to settings
5. **Phase 5**: Optimize durations based on user feedback

## Checklist

- [ ] All `alert()` calls removed
- [ ] Error types detected and handled appropriately
- [ ] Retry mechanisms added where applicable
- [ ] Success helpers used for common operations
- [ ] Validation errors use `validationError()`
- [ ] Network errors use `networkError()` with retry
- [ ] Auth errors use `authError()` with login button
- [ ] Rate limits use `rateLimitError()` with countdown
- [ ] Durations are appropriate for message severity
- [ ] Action buttons are provided where useful
- [ ] Mobile responsive behavior tested
- [ ] Accessibility tested with screen reader
- [ ] Documentation updated

## Support

For questions or issues, see:
- Usage Guide: `/src/docs/toast-usage-examples.md`
- Examples: `/src/examples/toast-examples.ts`
- Component: `/src/lib/components/ui/Toast.svelte`
- Store: `/src/lib/stores/toast.ts`
