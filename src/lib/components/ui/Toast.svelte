<script lang="ts">
  import { toast } from '$lib/stores/toast';
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { onMount } from 'svelte';

  $: toasts = $toast.toasts;

  $: variantClasses = {
    success: 'bg-success/10 border-success text-success backdrop-blur-md',
    error: 'bg-error/10 border-error text-error backdrop-blur-md',
    info: 'bg-info/10 border-info text-info backdrop-blur-md',
    warning: 'bg-warning/10 border-warning text-warning backdrop-blur-md'
  };

  // SVG icons for better visual consistency
  const iconPaths = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  };

  let soundEnabled = false;

  onMount(() => {
    // Check user preference for sound
    soundEnabled = localStorage.getItem('toastSoundEnabled') === 'true';
  });

  interface WindowWithWebkitAudioContext extends Window {
    webkitAudioContext?: typeof AudioContext;
  }

  function playSound(variant: string) {
    if (!soundEnabled) return;

    // Simple beep using Web Audio API
    try {
      const AudioContextConstructor = window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!AudioContextConstructor) return;

      const audioContext = new AudioContextConstructor();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different types
      const frequencies = {
        success: 523.25, // C5
        error: 329.63,   // E4
        warning: 440,    // A4
        info: 392        // G4
      };

      oscillator.frequency.value = frequencies[variant as keyof typeof frequencies] || 440;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silently fail if audio not supported
    }
  }

  function handleDismiss(id: string) {
    toast.remove(id);
  }

  async function handleAction(id: string, callback: () => void | Promise<void>) {
    toast.remove(id);
    await callback();
  }

  function triggerHaptic() {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }

  // Play sound when new toast appears
  $: if (toasts.length > 0) {
    const latestToast = toasts[toasts.length - 1];
    playSound(latestToast.variant);
  }
</script>

<div
  class="toast toast-top toast-end z-50 max-h-[90vh] overflow-y-auto"
  role="region"
  aria-live="polite"
  aria-label="Notifications"
>
  {#each toasts.slice(-3) as toastItem (toastItem.id)}
    <div
      class="alert border-2 shadow-2xl min-w-[300px] max-w-md relative overflow-hidden {variantClasses[toastItem.variant]}"
      transition:fly={{ x: 300, duration: 300, opacity: 0 }}
      animate:flip={{ duration: 200 }}
      role="alert"
      aria-atomic="true"
    >
      <!-- Progress bar -->
      {#if toastItem.duration && toastItem.duration > 0}
        <div class="absolute bottom-0 left-0 h-1 bg-current opacity-30 progress-bar"
             style="animation-duration: {toastItem.duration}ms"></div>
      {/if}

      <div class="flex items-start gap-3 w-full">
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <svg class="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d={iconPaths[toastItem.variant]} />
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col gap-2 min-w-0">
          <span class="text-sm font-medium break-words leading-relaxed">
            {toastItem.message}
          </span>

          {#if toastItem.action}
            <button
              class="btn btn-xs btn-outline border-current text-current hover:bg-current hover:text-base-100 self-start"
              on:click={() => {
                triggerHaptic();
                handleAction(toastItem.id, toastItem.action.callback);
              }}
            >
              {toastItem.action.label}
            </button>
          {/if}
        </div>

        <!-- Dismiss button -->
        {#if toastItem.dismissible}
          <button
            class="btn btn-ghost btn-xs btn-circle flex-shrink-0 hover:bg-current/20"
            on:click={() => {
              triggerHaptic();
              handleDismiss(toastItem.id);
            }}
            aria-label="Dismiss notification"
          >
            <svg class="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .toast {
    @apply fixed top-4 right-4 flex flex-col gap-3;
  }

  .alert {
    @apply animate-slide-in;
  }

  @keyframes slide-in {
    from {
      transform: translateX(110%) translateY(-10px);
      opacity: 0;
    }
    to {
      transform: translateX(0) translateY(0);
      opacity: 1;
    }
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .progress-bar {
    animation: progress linear forwards;
  }

  /* Frosted glass effect */
  .alert {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .toast {
      @apply left-4 right-4 top-4;
    }

    .alert {
      @apply min-w-0 w-full;
    }
  }

  /* Smooth scrollbar for toast container */
  .toast::-webkit-scrollbar {
    width: 4px;
  }

  .toast::-webkit-scrollbar-track {
    background: transparent;
  }

  .toast::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  .toast::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>
