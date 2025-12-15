<script lang="ts">
  export let src: string | undefined = undefined;
  export let pubkey: string | undefined = undefined;
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  export let alt = 'Avatar';
  export let online = false;
  export let active = false;

  let imageError = false;

  $: sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  $: statusSize = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  $: gradientColor = pubkey ? generateGradientFromPubkey(pubkey) : 'from-gray-400 to-gray-600';
  $: robohashUrl = pubkey ? `https://robohash.org/${pubkey}?set=set4` : undefined;
  $: displaySrc = !imageError && src ? src : robohashUrl;

  function generateGradientFromPubkey(pk: string): string {
    const hash = pk.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const hue1 = Math.abs(hash % 360);
    const hue2 = Math.abs((hash * 2) % 360);

    return `from-[hsl(${hue1},70%,60%)] to-[hsl(${hue2},70%,60%)]`;
  }

  function handleImageError() {
    imageError = true;
  }

  $: initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
</script>

<div class="avatar-wrapper">
  <div class="avatar">
    <div
      class="rounded-full {sizeClasses[size]} relative"
      class:avatar-glow={active}
    >
      {#if displaySrc}
        <img
          src={displaySrc}
          {alt}
          on:error={handleImageError}
          class="object-cover w-full h-full rounded-full"
        />
      {:else}
        <div
          class="w-full h-full flex items-center justify-center bg-gradient-to-br {gradientColor} text-white font-semibold rounded-full"
          class:text-xs={size === 'xs'}
          class:text-sm={size === 'sm'}
          class:text-base={size === 'md'}
          class:text-lg={size === 'lg'}
        >
          {initials}
        </div>
      {/if}

      {#if online}
        <div class="status-indicator {statusSize[size]}"></div>
      {/if}
    </div>
  </div>
</div>

<style>
  .avatar-wrapper {
    @apply inline-flex relative;
  }

  .avatar {
    @apply inline-flex;
  }

  img {
    @apply transition-all duration-300;
  }

  img:hover {
    @apply opacity-90 transform scale-105;
  }

  .status-indicator {
    @apply absolute bottom-0 right-0 rounded-full border-2 border-base-100;
    background-color: var(--color-success);
    box-shadow: 0 0 0 2px var(--color-success);
  }

  .avatar-glow {
    position: relative;
  }

  .avatar-glow::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: glow-pulse 2s ease-in-out infinite;
  }

  @keyframes glow-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.05);
    }
  }
</style>
