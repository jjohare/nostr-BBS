<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md';

  $: dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };
</script>

<div class="typing-indicator inline-flex items-center gap-1 opacity-70">
  <span class="dot {dotSize[size]}"></span>
  <span class="dot {dotSize[size]}"></span>
  <span class="dot {dotSize[size]}"></span>
</div>

<style>
  .typing-indicator {
    @apply inline-flex items-center gap-1;
  }

  .dot {
    @apply rounded-full bg-current;
    animation: typing-bounce 1.4s infinite ease-in-out;
  }

  .dot:nth-child(1) {
    animation-delay: 0s;
  }

  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing-bounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.3;
    }
    30% {
      transform: translateY(-8px);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: typing-fade 1.4s infinite ease-in-out;
    }

    @keyframes typing-fade {
      0%, 60%, 100% {
        opacity: 0.3;
      }
      30% {
        opacity: 1;
      }
    }
  }
</style>
