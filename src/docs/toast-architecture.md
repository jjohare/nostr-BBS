# Toast Notification System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Components, Routes, Pages)                                 │
│                                                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │   Login   │  │    DM     │  │  Profile  │  ... etc       │
│  │   Page    │  │   View    │  │   Edit    │               │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘               │
│        │              │              │                       │
│        └──────────────┴──────────────┘                       │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │ import { toast }
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Toast Store (Svelte)                      │
│  /src/lib/stores/toast.ts                                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  State Management                                     │   │
│  │  • toasts: Toast[]                                    │   │
│  │  • timeouts: Map<string, Timeout>                     │   │
│  │  • idCounter: number                                  │   │
│  │  • MAX_TOASTS: 3                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Core Methods                                         │   │
│  │  • success(message, duration?)                        │   │
│  │  • error(message, duration?, action?)                 │   │
│  │  • warning(message, duration?, action?)               │   │
│  │  • info(message, duration?)                           │   │
│  │  • remove(id)                                         │   │
│  │  • clear()                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Error Helpers                                        │   │
│  │  • networkError(retry?)                               │   │
│  │  • authError()                                        │   │
│  │  • rateLimitError(seconds)                            │   │
│  │  • serverError(retry?)                                │   │
│  │  • permissionError()                                  │   │
│  │  • validationError(message)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Success Helpers                                      │   │
│  │  • messageSent()                                      │   │
│  │  • profileUpdated()                                   │   │
│  │  • saved()                                            │   │
│  │  • deleted()                                          │   │
│  │  • copied()                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │ subscribe
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Toast Component (Svelte)                    │
│  /src/lib/components/ui/Toast.svelte                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Visual Rendering                                     │   │
│  │  • Frosted glass effect (backdrop-blur)              │   │
│  │  • Type-specific colors (success/error/warning/info) │   │
│  │  • SVG icons                                          │   │
│  │  • Progress bar animation                             │   │
│  │  • Slide-in animation                                 │   │
│  │  • Stacking (max 3, bottom-aligned)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Interaction Handling                                 │   │
│  │  • Auto-dismiss (setTimeout)                          │   │
│  │  • Manual dismiss (X button)                          │   │
│  │  • Action buttons (Retry, Undo, etc.)                │   │
│  │  • Haptic feedback (mobile vibration)                │   │
│  │  • Sound effects (optional, Web Audio API)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Accessibility                                        │   │
│  │  • ARIA live regions                                  │   │
│  │  • role="alert"                                       │   │
│  │  • aria-label on buttons                              │   │
│  │  • Keyboard navigation                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │ renders in
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Browser DOM                               │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Toast Container (fixed position top-right)        │     │
│  │  ┌──────────────────────────────────────────────┐ │     │
│  │  │ ✓ Success: Message sent!          [X]       │ │     │
│  │  │ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  (progress bar)        │ │     │
│  │  └──────────────────────────────────────────────┘ │     │
│  │  ┌──────────────────────────────────────────────┐ │     │
│  │  │ ⚠ Warning: Unsaved changes  [Undo] [X]      │ │     │
│  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  (progress bar)        │ │     │
│  │  └──────────────────────────────────────────────┘ │     │
│  │  ┌──────────────────────────────────────────────┐ │     │
│  │  │ ✕ Error: Connection lost  [Retry] [X]       │ │     │
│  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  (progress bar)        │ │     │
│  │  └──────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Adding a Toast

```
Component/Page
     │
     │ toast.error('Failed', 7000, { label: 'Retry', callback: fn })
     ▼
Toast Store
     │
     │ 1. Generate unique ID
     │ 2. Create Toast object
     │ 3. Check queue size (remove oldest if > 3)
     │ 4. Add to toasts array
     │ 5. Set timeout for auto-dismiss
     │ 6. Update Svelte store (triggers reactivity)
     ▼
Toast Component
     │
     │ $: toasts (reactive subscription)
     │
     ├─→ Render new toast
     ├─→ Play sound (if enabled)
     ├─→ Trigger haptic (if mobile)
     └─→ Start animations
```

### 2. Dismissing a Toast

```
User Action (click X or action button)
     │
     ▼
Toast Component
     │
     │ handleDismiss(id) or handleAction(id, callback)
     ▼
Toast Store
     │
     │ 1. Clear timeout
     │ 2. Remove from timeouts Map
     │ 3. Filter out from toasts array
     │ 4. Update Svelte store
     │ 5. Execute callback (if action button)
     ▼
Toast Component
     │
     │ React to store update
     └─→ Exit animation and remove from DOM
```

### 3. Auto-Dismiss Flow

```
Toast Added
     │
     │ duration = 5000ms
     ▼
setTimeout(5000)
     │
     │ Wait 5 seconds...
     ▼
Timeout Callback
     │
     │ toast.remove(id)
     ▼
Toast Store
     │
     │ 1. Remove from toasts array
     │ 2. Delete from timeouts Map
     │ 3. Update store
     ▼
Toast Component
     │
     └─→ Fade out and remove
```

## Component Hierarchy

```
+layout.svelte
└── Toast.svelte (global, fixed position)
    ├── Toast Container (div.toast)
    │   ├── Toast Item 1 (alert)
    │   │   ├── Progress Bar (div.progress-bar)
    │   │   ├── Icon (svg)
    │   │   ├── Message (span)
    │   │   ├── Action Button (button, optional)
    │   │   └── Dismiss Button (button)
    │   ├── Toast Item 2 (alert)
    │   └── Toast Item 3 (alert)
    └── (max 3 visible)
```

## State Management

### Toast Store State

```typescript
interface ToastStore {
  toasts: Toast[]  // Array of visible toasts
}

interface Toast {
  id: string               // Unique identifier
  message: string          // Display message
  variant: Variant         // 'success' | 'error' | 'warning' | 'info'
  duration?: number        // Auto-dismiss time (ms), 0 = never
  dismissible?: boolean    // Show X button
  action?: {
    label: string          // Button text
    callback: () => void   // Click handler
  }
}
```

### Internal State

```typescript
// Store instance
const { subscribe, update } = writable<ToastStore>({ toasts: [] })

// Counters and tracking
let idCounter = 0                           // Unique ID generation
const timeouts = new Map<string, Timeout>() // Timeout tracking

// Constants
const MAX_TOASTS = 3                        // Queue limit
```

## Lifecycle

### Toast Lifecycle Stages

```
1. Creation
   ├─ Generate ID: `toast-${Date.now()}-${idCounter++}`
   ├─ Create Toast object
   ├─ Validate queue size (remove oldest if full)
   └─ Add to store

2. Active
   ├─ Display in UI
   ├─ Progress bar animating
   ├─ Timeout counting down
   └─ User can interact (dismiss, click action)

3. Dismissal
   ├─ Trigger: Timeout, manual click, or action click
   ├─ Clear timeout
   ├─ Execute callback (if action)
   ├─ Remove from store
   └─ Exit animation

4. Cleanup
   ├─ Remove from DOM
   ├─ Delete timeout reference
   └─ Free memory
```

## Animation Timeline

```
0ms                  300ms              5000ms            5300ms
│                    │                  │                 │
│  ┌─────────────────┤                  │                 │
│  │ Slide-in        │                  │                 │
│  │ from right      │                  │                 │
│  │ (opacity 0→1)   │                  │                 │
│  └─────────────────┤                  │                 │
│                    │                  │                 │
│                    ├──────────────────┤                 │
│                    │  Visible         │                 │
│                    │  (progress bar   │                 │
│                    │   animating)     │                 │
│                    │                  │                 │
│                    │                  ├─────────────────┤
│                    │                  │ Slide-out       │
│                    │                  │ (opacity 1→0)   │
│                    │                  │                 │
│                    │                  │                 └─ Removed
│                    │                  │                    from DOM
└────────────────────┴──────────────────┴─────────────────────────>
                                                          Time
```

## Error Handling Flow

```
API Call Fails
     │
     ├─ Network Error? ─→ toast.networkError(retryFn)
     │                    ├─ "Connection lost..."
     │                    └─ [Retry] button
     │
     ├─ 401 Unauthorized? ─→ toast.authError()
     │                       ├─ "Session expired..."
     │                       └─ [Log In] button
     │
     ├─ 429 Rate Limit? ─→ toast.rateLimitError(30)
     │                     ├─ "Too many requests. Wait 30s"
     │                     └─ Auto-dismiss after 30s
     │
     ├─ 403 Forbidden? ─→ toast.permissionError()
     │                    └─ "You do not have permission..."
     │
     ├─ 500 Server Error? ─→ toast.serverError(retryFn)
     │                       ├─ "Server error occurred..."
     │                       └─ [Retry] button
     │
     └─ Other Error? ─→ toast.error(message, 7000, {
                        label: 'Retry',
                        callback: fn
                      })
```

## Integration Points

### 1. Authentication Flow

```
Login Attempt
     │
     ├─ Success ─→ toast.success('Welcome back!', 3000)
     │            └─ Redirect to dashboard
     │
     └─ Failure ─→ Check error type
                  ├─ Invalid credentials ─→ toast.validationError('Invalid email or password')
                  ├─ Network error ─→ toast.networkError(loginFn)
                  └─ Rate limited ─→ toast.rateLimitError(60)
```

### 2. Form Submission

```
Submit Form
     │
     ├─ Validation ─→ toast.validationError('Email is required')
     │               └─ Stop submission
     │
     ├─ API Success ─→ toast.profileUpdated()
     │                └─ Update UI
     │
     └─ API Failure ─→ Determine error
                      ├─ Network ─→ toast.networkError(submitFn)
                      ├─ Auth ─→ toast.authError()
                      └─ Other ─→ toast.error('Failed to save', 7000, {
                                  label: 'Retry',
                                  callback: submitFn
                                })
```

### 3. Delete Operation

```
Delete Item
     │
     ├─ Optimistic Update ─→ Remove from UI
     │                      └─ Store backup
     │
     ├─ API Success ─→ toast.warning('Item deleted', 5000, {
     │                  label: 'Undo',
     │                  callback: async () => {
     │                    await restore(backup);
     │                    toast.success('Restored');
     │                  }
     │                })
     │
     └─ API Failure ─→ Restore UI
                      └─ toast.error('Failed to delete', 7000, {
                          label: 'Retry',
                          callback: deleteFn
                        })
```

## Performance Considerations

### Memory Management

```
Add Toast
     │
     ├─ Check queue size
     │  └─ If > MAX_TOASTS (3):
     │     ├─ Remove oldest toast
     │     └─ Clear its timeout
     │
     ├─ Create new timeout
     │  └─ Store in timeouts Map
     │
     └─ Add to toasts array

Remove Toast
     │
     ├─ Get timeout from Map
     ├─ clearTimeout(timeout)
     ├─ Delete from Map
     └─ Filter from array

Clear All
     │
     ├─ Iterate timeouts Map
     ├─ clearTimeout for each
     ├─ Clear Map
     └─ Empty toasts array
```

### Rendering Optimization

```
Store Update
     │
     │ Svelte reactivity triggers
     ▼
Component Re-render
     │
     ├─ Use `each` with key (id) ─→ Only render new/changed
     ├─ Limit to toasts.slice(-3) ─→ Only render last 3
     └─ CSS animations ─→ GPU-accelerated
```

## Accessibility Tree

```
Toast Container [role="region"][aria-live="polite"]
└── Toast Item [role="alert"][aria-atomic="true"]
    ├── Icon (decorative, aria-hidden)
    ├── Message (text content, read by screen reader)
    ├── Action Button [aria-label="Retry operation"]
    └── Dismiss Button [aria-label="Dismiss notification"]
```

## Browser Events

```
User Interactions:
  • Click dismiss button ─→ handleDismiss(id)
  • Click action button ─→ handleAction(id, callback)
  • Press Escape ─→ (future: dismiss focused toast)
  • Tab navigation ─→ Focus action/dismiss buttons

System Events:
  • setTimeout ─→ Auto-dismiss
  • window.focus ─→ (future: re-check auth status)
  • online/offline ─→ (future: queue toasts)
```

## CSS Architecture

```
Toast Container
  • position: fixed
  • top: 1rem
  • right: 1rem
  • z-index: 50
  • display: flex
  • flex-direction: column
  • gap: 0.75rem
  • max-height: 90vh
  • overflow-y: auto

Toast Item
  • backdrop-filter: blur(12px)
  • border: 2px solid
  • border-radius: 0.5rem
  • padding: 1rem
  • box-shadow: 0 10px 25px rgba(0,0,0,0.1)
  • animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)

Progress Bar
  • position: absolute
  • bottom: 0
  • left: 0
  • height: 4px
  • animation: progress linear forwards
```

## Testing Strategy

```
Unit Tests (toast.ts)
  ├─ addToast() creates correct object
  ├─ Queue limit enforced (max 3)
  ├─ remove() clears timeout
  ├─ Auto-dismiss after duration
  ├─ Helper methods create correct toasts
  └─ clear() removes all toasts

Component Tests (Toast.svelte)
  ├─ Renders correct icon for type
  ├─ Progress bar animates
  ├─ Dismiss button works
  ├─ Action button executes callback
  ├─ Transitions work correctly
  └─ ARIA attributes present

Integration Tests
  ├─ Toast appears on user action
  ├─ Error handling shows correct toast
  ├─ Retry button re-attempts operation
  └─ Undo button restores state

Accessibility Tests
  ├─ Screen reader announces
  ├─ Keyboard navigation works
  ├─ Focus management correct
  └─ Color contrast sufficient
```

## Future Architecture Considerations

### Potential Enhancements

1. **Toast Groups**
   ```
   ToastGroup
   └── Multiple related toasts
       ├─ Collapse/expand
       └─ Batch actions
   ```

2. **Toast Queue**
   ```
   Online: Show immediately
   Offline: Queue for later
   ├─ Store in localStorage
   └─ Replay when online
   ```

3. **Toast History**
   ```
   ToastHistory
   ├─ View dismissed toasts
   ├─ Re-trigger actions
   └─ Search/filter
   ```

4. **Custom Positions**
   ```
   User Preference
   ├─ Top-right (default)
   ├─ Top-left
   ├─ Bottom-right
   └─ Bottom-left
   ```

---

This architecture provides a solid foundation for the toast notification system with clear separation of concerns, efficient state management, and room for future enhancements.
