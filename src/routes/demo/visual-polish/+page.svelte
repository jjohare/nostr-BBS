<script lang="ts">
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import TypingIndicator from '$lib/components/ui/TypingIndicator.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import { toast } from '$lib/stores/toast';

  let showTyping = false;
  let showSkeleton = true;

  function showSuccessToast() {
    toast.success('Changes saved successfully!');
  }

  function showErrorToast() {
    toast.error('Failed to connect to server');
  }

  function showInfoToast() {
    toast.info('New message received');
  }

  function showWarningToast() {
    toast.warning('Your session will expire in 5 minutes');
  }

  function toggleTyping() {
    showTyping = !showTyping;
  }

  function toggleSkeleton() {
    showSkeleton = !showSkeleton;
  }
</script>

<svelte:head>
  <title>Visual Polish Showcase - Fairfield Nostr</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
  <!-- Hero Section with Gradient -->
  <div class="gradient-hero py-12">
    <div class="container mx-auto px-4">
      <h1 class="text-4xl font-bold text-center mb-2 gradient-text">
        Visual Polish Showcase
      </h1>
      <p class="text-center text-base-content/70 mb-8">
        Explore all the visual enhancements and micro-interactions
      </p>
    </div>
  </div>

  <!-- Main Content -->
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Color Palette Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Color Palette</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="space-y-2">
            <div class="h-20 rounded-lg" style="background-color: #5568d3"></div>
            <p class="text-sm font-semibold">Primary</p>
            <p class="text-xs text-base-content/60">#5568d3</p>
          </div>
          <div class="space-y-2">
            <div class="h-20 rounded-lg" style="background-color: #764ba2"></div>
            <p class="text-sm font-semibold">Secondary</p>
            <p class="text-xs text-base-content/60">#764ba2</p>
          </div>
          <div class="space-y-2">
            <div class="h-20 rounded-lg" style="background-color: #10b981"></div>
            <p class="text-sm font-semibold">Success</p>
            <p class="text-xs text-base-content/60">#10b981</p>
          </div>
          <div class="space-y-2">
            <div class="h-20 rounded-lg" style="background-color: #ef4444"></div>
            <p class="text-sm font-semibold">Error</p>
            <p class="text-xs text-base-content/60">#ef4444</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gradients Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Gradient Backgrounds</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <div class="h-32 rounded-lg gradient-primary flex items-center justify-center text-white font-semibold">
              Primary Gradient
            </div>
            <p class="text-sm">Linear gradient (primary → secondary)</p>
          </div>
          <div class="space-y-2">
            <div class="h-32 rounded-lg gradient-mesh flex items-center justify-center font-semibold">
              Mesh Gradient
            </div>
            <p class="text-sm">Radial gradient mesh</p>
          </div>
          <div class="space-y-2">
            <div class="h-32 rounded-lg gradient-hero flex items-center justify-center font-semibold">
              Animated Hero
            </div>
            <p class="text-sm">15s animated gradient</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Buttons Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Button Interactions</h2>
        <div class="flex flex-wrap gap-4">
          <Button variant="primary" ripple={true}>
            Primary Button
          </Button>
          <Button variant="secondary">
            Secondary Button
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
          <Button variant="danger">
            Danger Button
          </Button>
          <Button variant="primary" loading={true}>
            Loading
          </Button>
        </div>
        <p class="text-sm text-base-content/60 mt-4">
          Try clicking buttons to see the ripple effect!
        </p>
      </div>
    </div>

    <!-- Avatars Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Avatar Enhancements</h2>
        <div class="flex flex-wrap gap-8 items-center">
          <div class="space-y-2">
            <Avatar
              pubkey="npub1example1"
              alt="User 1"
              size="lg"
            />
            <p class="text-sm text-center">Default</p>
          </div>
          <div class="space-y-2">
            <Avatar
              pubkey="npub1example2"
              alt="User 2"
              size="lg"
              online={true}
            />
            <p class="text-sm text-center">Online</p>
          </div>
          <div class="space-y-2">
            <Avatar
              pubkey="npub1example3"
              alt="User 3"
              size="lg"
              active={true}
            />
            <p class="text-sm text-center">Active (Glow)</p>
          </div>
          <div class="space-y-2">
            <Avatar
              pubkey="npub1example4"
              alt="User 4"
              size="lg"
              online={true}
              active={true}
            />
            <p class="text-sm text-center">Online + Active</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Typing Indicator Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Typing Indicator</h2>
        <div class="space-y-4">
          <Button on:click={toggleTyping}>
            Toggle Typing Indicator
          </Button>
          {#if showTyping}
            <div class="flex items-center gap-2 p-4 bg-base-200 rounded-lg">
              <Avatar pubkey="npub1typing" alt="User" size="sm" />
              <span class="text-sm">User is typing</span>
              <TypingIndicator size="md" />
            </div>
          {/if}
          <div class="flex gap-4 items-center">
            <TypingIndicator size="sm" />
            <TypingIndicator size="md" />
            <TypingIndicator size="lg" />
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton Loader Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Skeleton Loader with Shimmer</h2>
        <Button on:click={toggleSkeleton} class="mb-4">
          Toggle Skeleton
        </Button>
        {#if showSkeleton}
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <SkeletonLoader variant="avatar" count={1} />
              <div class="flex-1">
                <SkeletonLoader variant="text" count={2} />
              </div>
            </div>
            <SkeletonLoader variant="card" count={2} />
          </div>
        {:else}
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <Avatar pubkey="npub1loaded" alt="Loaded User" size="md" />
              <div class="flex-1">
                <h3 class="font-semibold">Content Loaded</h3>
                <p class="text-sm text-base-content/60">This content has finished loading</p>
              </div>
            </div>
            <div class="card bg-base-200 p-4">
              <h3 class="font-semibold mb-2">Card Content</h3>
              <p class="text-sm">This is the actual content that replaces the skeleton.</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Toast Notifications Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Toast Notifications</h2>
        <p class="text-sm text-base-content/60 mb-4">
          Click buttons to see toast notifications with glassmorphism and progress bars
        </p>
        <div class="flex flex-wrap gap-4">
          <Button variant="primary" on:click={showSuccessToast}>
            Success Toast
          </Button>
          <Button variant="danger" on:click={showErrorToast}>
            Error Toast
          </Button>
          <Button variant="secondary" on:click={showInfoToast}>
            Info Toast
          </Button>
          <Button variant="ghost" on:click={showWarningToast}>
            Warning Toast
          </Button>
        </div>
      </div>
    </div>

    <!-- Interactive Cards Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Interactive Cards</h2>
        <p class="text-sm text-base-content/60 mb-4">
          Hover over these cards to see the scale and shadow effects
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card bg-base-200 card-interactive">
            <div class="card-body">
              <h3 class="card-title">Card 1</h3>
              <p>Hover to see the effect</p>
            </div>
          </div>
          <div class="card bg-base-200 card-interactive">
            <div class="card-body">
              <h3 class="card-title">Card 2</h3>
              <p>Click for press feedback</p>
            </div>
          </div>
          <div class="card bg-base-200 card-interactive">
            <div class="card-body">
              <h3 class="card-title">Card 3</h3>
              <p>Smooth animations</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Animation Examples Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Animation Classes</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-4">
            <h3 class="font-semibold">Bounce In</h3>
            <div class="animate-bounce-in bg-success text-success-content p-4 rounded-lg">
              Success Animation
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="font-semibold">Slide Up</h3>
            <div class="animate-slide-up bg-info text-info-content p-4 rounded-lg">
              Slide Up Animation
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="font-semibold">Fade In</h3>
            <div class="animate-fade-in bg-warning text-warning-content p-4 rounded-lg">
              Fade In Animation
            </div>
          </div>
          <div class="space-y-4">
            <h3 class="font-semibold">Shake</h3>
            <div class="animate-shake bg-error text-error-content p-4 rounded-lg">
              Error Shake Animation
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Glassmorphism Section -->
    <div class="card bg-base-100 shadow-xl mb-8 relative overflow-hidden">
      <div class="absolute inset-0 gradient-mesh"></div>
      <div class="card-body relative z-10">
        <h2 class="card-title text-2xl mb-4">Glassmorphism</h2>
        <div class="glassmorphism p-6 rounded-lg border border-base-content/10">
          <h3 class="font-semibold mb-2">Frosted Glass Effect</h3>
          <p class="text-sm">
            This card uses backdrop-filter for a modern glassmorphism effect.
            It automatically adapts to light and dark themes.
          </p>
        </div>
      </div>
    </div>

    <!-- Accessibility Section -->
    <div class="card bg-base-100 shadow-xl mb-8">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-4">Accessibility Features</h2>
        <ul class="space-y-2 text-sm">
          <li class="flex items-start gap-2">
            <span class="text-success">✓</span>
            <span><strong>Reduced Motion:</strong> All animations respect prefers-reduced-motion</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-success">✓</span>
            <span><strong>Touch Targets:</strong> Minimum 44x44px for all interactive elements</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-success">✓</span>
            <span><strong>Focus Indicators:</strong> Clear focus rings for keyboard navigation</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-success">✓</span>
            <span><strong>Color Contrast:</strong> WCAG AA compliant color palette</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-success">✓</span>
            <span><strong>Haptic Feedback:</strong> Vibration on mobile for tactile response</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-success">✓</span>
            <span><strong>Dark Mode:</strong> Optimized colors and contrast for dark theme</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Documentation Link -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body text-center">
        <h2 class="card-title text-2xl justify-center mb-4">Full Documentation</h2>
        <p class="text-sm text-base-content/60 mb-4">
          For complete implementation details and code examples, see the visual polish showcase documentation.
        </p>
        <div class="flex justify-center">
          <a href="/docs/visual-polish-showcase.md" class="btn btn-primary">
            View Documentation
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
