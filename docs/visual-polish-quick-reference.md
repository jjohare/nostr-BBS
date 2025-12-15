# Visual Polish Quick Reference Card

## 🎨 Color Palette

```css
--color-primary: #5568d3
--color-secondary: #764ba2
--color-success: #10b981
--color-error: #ef4444
--color-warning: #f59e0b
--color-info: #3b82f6
```

## 🌈 Gradient Classes

| Class | Use Case | Example |
|-------|----------|---------|
| `.gradient-primary` | Buttons, accents | `<div class="gradient-primary">` |
| `.gradient-mesh` | Login/signup backgrounds | `<div class="gradient-mesh">` |
| `.gradient-hero` | Animated hero sections | `<div class="gradient-hero">` |
| `.gradient-text` | Headings, emphasis | `<h1 class="gradient-text">` |
| `.glassmorphism` | Frosted glass effect | `<div class="glassmorphism">` |

## 🎬 Animation Classes

| Class | Animation | Duration | Use Case |
|-------|-----------|----------|----------|
| `.animate-bounce-in` | Scale bounce | 0.5s | Success states |
| `.animate-slide-up` | Slide + fade | 0.4s | Entry animations |
| `.animate-fade-in` | Opacity fade | 0.3s | Reveals |
| `.animate-shake` | Horizontal shake | 0.5s | Error states |
| `.animate-checkmark` | Checkmark draw | 0.5s | Success icons |

## 🔘 Button Enhancements

```svelte
<!-- Basic button with ripple -->
<Button variant="primary" ripple={true}>
  Click Me
</Button>

<!-- Loading button -->
<Button variant="primary" loading={true}>
  Saving...
</Button>

<!-- Disabled button -->
<Button variant="primary" disabled={true}>
  Disabled
</Button>
```

**Effects:**
- Hover: Scale 105% + shadow
- Press: Scale 95% + ripple
- Duration: 300ms transition

## 👤 Avatar Enhancements

```svelte
<!-- Default avatar -->
<Avatar pubkey={user.pubkey} alt={user.name} size="md" />

<!-- Online indicator -->
<Avatar pubkey={user.pubkey} online={true} />

<!-- Active user glow -->
<Avatar pubkey={user.pubkey} active={true} />

<!-- Combined -->
<Avatar pubkey={user.pubkey} online={true} active={true} />
```

**Sizes:** `xs`, `sm`, `md`, `lg`

## ⌨️ Typing Indicator

```svelte
{#if isTyping}
  <TypingIndicator size="md" />
{/if}
```

**Sizes:** `sm`, `md`, `lg`

## 💀 Skeleton Loader

```svelte
<!-- Text placeholder -->
<SkeletonLoader variant="text" count={3} />

<!-- Avatar placeholder -->
<SkeletonLoader variant="avatar" />

<!-- Card placeholder -->
<SkeletonLoader variant="card" count={2} />
```

**Features:**
- Shimmer animation (2s)
- Reduced motion support

## 🔔 Toast Notifications

```typescript
import { toast } from '$lib/stores/toast';

// Success
toast.success('Changes saved!');

// Error
toast.error('Connection failed');

// Info
toast.info('New message received');

// Warning
toast.warning('Session expiring soon');
```

**Features:**
- Glassmorphism backdrop
- Progress bar
- Sound feedback (optional)
- Haptic feedback (mobile)

## 🎯 Interactive Cards

```svelte
<div class="card card-interactive">
  <div class="card-body">
    <h3>Card Title</h3>
    <p>Card content</p>
  </div>
</div>
```

**Effects:**
- Hover: Scale 102% + enhanced shadow
- Active: Scale 98%

## 📝 Input Focus

All inputs automatically get enhanced focus:
- Colored border (primary)
- 3px shadow with 20% opacity
- 300ms smooth transition

## ♿ Accessibility

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations simplified or disabled */
}
```

**Touch Targets:**
- Minimum: 44x44px
- Spacing: 0.5rem between buttons

**Focus States:**
- 2px outline + 2px offset
- High contrast colors

## 🎪 Demo Page

Visit `/demo/visual-polish` to see all enhancements in action!

## 📦 Component Imports

```svelte
<script>
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import TypingIndicator from '$lib/components/ui/TypingIndicator.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import { toast } from '$lib/stores/toast';
</script>
```

## 🚀 Performance Tips

**Do:**
- ✅ Animate `transform` and `opacity`
- ✅ Use CSS animations over JS
- ✅ Keep animations under 500ms
- ✅ Batch style changes

**Avoid:**
- ❌ Animating `width`, `height`, `margin`, `padding`
- ❌ Heavy animations on scroll
- ❌ Multiple simultaneous animations

## 🌐 Browser Support

| Feature | Support |
|---------|---------|
| Backdrop Filter | Safari 14+, Chrome 76+, Firefox 103+ |
| CSS Gradients | All modern browsers |
| CSS Animations | All modern browsers |
| Haptic Feedback | iOS/Android with navigator.vibrate |

## 📱 Mobile Optimizations

- Touch targets: 44x44px minimum
- Haptic feedback on interactions
- Reduced animation complexity
- Larger tap areas for cards

---

**Quick Links:**
- 📚 [Full Documentation](/docs/visual-polish-showcase.md)
- 🎬 [Demo Page](/demo/visual-polish)
- 📝 [Implementation Summary](/docs/visual-polish-summary.md)

**Last Updated:** 2025-12-15
