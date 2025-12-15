<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let loading = false;
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';

  let ripples: Array<{ x: number; y: number; id: number }> = [];
  let rippleId = 0;

  $: variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-error'
  };

  $: sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  $: classes = `btn ${variantClasses[variant]} ${sizeClasses[size]} ${loading ? 'loading' : ''} btn-ripple`;

  function handleRipple(event: MouseEvent | TouchEvent) {
    if (disabled || loading) return;

    const button = event.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();

    let x: number;
    let y: number;

    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    }

    const id = rippleId++;
    ripples = [...ripples, { x, y, id }];

    // Remove ripple after animation
    setTimeout(() => {
      ripples = ripples.filter(r => r.id !== id);
    }, 600);
  }
</script>

<button
  {type}
  class={classes}
  disabled={disabled || loading}
  on:click
  on:mousedown={handleRipple}
  on:touchstart={handleRipple}
  {...$$restProps}
>
  {#if loading}
    <span class="loading loading-spinner"></span>
  {/if}
  <slot />

  <!-- Ripple effects -->
  {#each ripples as ripple (ripple.id)}
    <span
      class="ripple"
      style="left: {ripple.x}px; top: {ripple.y}px;"
    ></span>
  {/each}
</button>

<style>
  button {
    @apply transition-all duration-200;
    position: relative;
    overflow: hidden;
    /* Ensure minimum touch target size */
    min-height: 44px;
    min-width: 44px;
  }

  button:not(:disabled):hover {
    @apply transform scale-105;
  }

  button:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  /* Touch ripple effect */
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: ripple-animation 0.6s ease-out;
  }

  @keyframes ripple-animation {
    0% {
      width: 0;
      height: 0;
      opacity: 0.5;
    }
    100% {
      width: 200px;
      height: 200px;
      opacity: 0;
    }
  }

  /* Enhanced touch feedback */
  button:active:not(:disabled) {
    @apply scale-95;
    transition: transform 0.1s;
  }

  /* Increase spacing between adjacent buttons */
  button + button {
    margin-left: 0.5rem;
  }

  /* Small icon buttons get extra padding */
  button.btn-sm {
    min-height: 40px;
    min-width: 40px;
    padding: 0.5rem;
  }

  /* Extra padding for icon-only buttons */
  button:has(svg:only-child),
  button:has(.loading:only-child) {
    padding: 0.75rem;
  }
</style>
