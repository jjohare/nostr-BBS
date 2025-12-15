<script lang="ts">
  export let variant: 'text' | 'avatar' | 'card' | 'message' | 'channel' = 'text';
  export let count = 1;
  export let width: string = '';

  const variants = {
    text: 'h-4 w-full rounded',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-24 w-full rounded-lg',
    message: 'h-16 w-full rounded-lg',
    channel: 'h-20 w-full rounded-lg'
  };
</script>

<div class="space-y-2" style={width ? `width: ${width}` : ''}>
  {#each Array(count) as _, i}
    <div
      class="skeleton bg-base-300 animate-pulse {variants[variant]}"
      style={variant === 'text' && i % 3 === 2 ? 'width: 60%' : ''}
    ></div>
  {/each}
</div>

<style>
  .skeleton {
    position: relative;
    overflow: hidden;
  }

  .skeleton::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton::after {
      animation: none;
    }

    .animate-pulse {
      animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  }
</style>
