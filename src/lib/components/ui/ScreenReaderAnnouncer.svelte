<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { toast } from '$lib/stores/toast';
  import { get } from 'svelte/store';

  // Announcement types
  type Priority = 'polite' | 'assertive';

  interface Announcement {
    message: string;
    priority: Priority;
    timestamp: number;
  }

  let politeAnnouncements: Announcement[] = [];
  let assertiveAnnouncements: Announcement[] = [];
  let toastUnsubscribe: (() => void) | null = null;

  // Public API for programmatic announcements
  export function announce(message: string, priority: Priority = 'polite') {
    const announcement: Announcement = {
      message,
      priority,
      timestamp: Date.now()
    };

    if (priority === 'assertive') {
      assertiveAnnouncements = [...assertiveAnnouncements, announcement];
    } else {
      politeAnnouncements = [...politeAnnouncements, announcement];
    }

    // Clean up old announcements after 5 seconds
    setTimeout(() => {
      if (priority === 'assertive') {
        assertiveAnnouncements = assertiveAnnouncements.filter(a => a.timestamp !== announcement.timestamp);
      } else {
        politeAnnouncements = politeAnnouncements.filter(a => a.timestamp !== announcement.timestamp);
      }
    }, 5000);
  }

  onMount(() => {
    // Subscribe to toast notifications
    toastUnsubscribe = toast.subscribe((state) => {
      const toasts = state.toasts;
      if (toasts.length > 0) {
        const latestToast = toasts[toasts.length - 1];
        const priority = latestToast.variant === 'error' ? 'assertive' : 'polite';
        announce(latestToast.message, priority);
      }
    });

    // Expose the announce function globally for use in other components
    if (typeof window !== 'undefined') {
      (window as any).__announceForScreenReader = announce;
    }
  });

  onDestroy(() => {
    if (toastUnsubscribe) {
      toastUnsubscribe();
    }
    if (typeof window !== 'undefined') {
      delete (window as any).__announceForScreenReader;
    }
  });

  // Helper function to format announcement text
  function formatAnnouncement(announcements: Announcement[]): string {
    return announcements.map(a => a.message).join('. ');
  }
</script>

<!-- Polite announcements (e.g., notifications, status updates) -->
<div
  class="sr-only"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {formatAnnouncement(politeAnnouncements)}
</div>

<!-- Assertive announcements (e.g., errors, urgent messages) -->
<div
  class="sr-only"
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {formatAnnouncement(assertiveAnnouncements)}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
