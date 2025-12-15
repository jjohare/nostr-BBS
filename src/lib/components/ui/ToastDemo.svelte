<script lang="ts">
  import { toast } from '$lib/stores/toast';

  let customMessage = 'This is a custom message';
  let customDuration = 5000;

  function showSuccessExamples() {
    toast.success('Operation completed successfully!');
    setTimeout(() => toast.messageSent(), 500);
    setTimeout(() => toast.profileUpdated(), 1000);
    setTimeout(() => toast.saved(), 1500);
  }

  function showErrorExamples() {
    toast.error('Something went wrong!');
    setTimeout(() => {
      toast.error('Failed to save. Please try again.', 7000, {
        label: 'Retry',
        callback: () => toast.info('Retry clicked!')
      });
    }, 500);
  }

  function showWarningExamples() {
    toast.warning('Please review this action');
    setTimeout(() => {
      toast.warning('Item will be deleted', 5000, {
        label: 'Undo',
        callback: () => toast.success('Deletion cancelled')
      });
    }, 500);
  }

  function showInfoExamples() {
    toast.info('Did you know? You can customize toasts!');
    setTimeout(() => toast.info('This is an informational message', 4000), 500);
  }

  function showErrorTypeExamples() {
    toast.networkError(() => toast.success('Reconnected!'));
    setTimeout(() => toast.rateLimitError(30), 500);
    setTimeout(() => toast.validationError('Please fill in all required fields'), 1000);
  }

  function showPersistent() {
    toast.error('This toast will not auto-dismiss', 0);
  }

  function showCustom() {
    toast.success(customMessage, customDuration);
  }

  function showStacking() {
    toast.info('Toast 1');
    setTimeout(() => toast.info('Toast 2'), 200);
    setTimeout(() => toast.info('Toast 3'), 400);
    setTimeout(() => toast.info('Toast 4 - removes Toast 1'), 600);
  }

  function clearAll() {
    toast.clear();
    setTimeout(() => toast.info('All toasts cleared'), 100);
  }
</script>

<div class="p-6 space-y-6 max-w-4xl mx-auto">
  <div class="text-center space-y-2">
    <h1 class="text-3xl font-bold">Toast Notification Demo</h1>
    <p class="text-base-content/70">
      Explore all the features of the enhanced toast notification system
    </p>
  </div>

  <!-- Basic Types -->
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Basic Types</h2>
      <p class="text-sm text-base-content/70 mb-4">
        Four variants with distinct colors and icons
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button class="btn btn-success" on:click={showSuccessExamples}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Success
        </button>
        <button class="btn btn-error" on:click={showErrorExamples}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Error
        </button>
        <button class="btn btn-warning" on:click={showWarningExamples}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Warning
        </button>
        <button class="btn btn-info" on:click={showInfoExamples}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Info
        </button>
      </div>
    </div>
  </div>

  <!-- Error-Specific Helpers -->
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Error-Specific Helpers</h2>
      <p class="text-sm text-base-content/70 mb-4">
        Pre-configured toasts for common error scenarios
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button class="btn btn-outline" on:click={showErrorTypeExamples}>
          Network & Validation Errors
        </button>
        <button class="btn btn-outline" on:click={() => toast.authError()}>
          Auth Error (with Login)
        </button>
        <button class="btn btn-outline" on:click={() => toast.serverError()}>
          Server Error (with Retry)
        </button>
      </div>
    </div>
  </div>

  <!-- Features -->
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Advanced Features</h2>
      <p class="text-sm text-base-content/70 mb-4">
        Stacking, persistence, and programmatic control
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button class="btn btn-outline" on:click={showStacking}>
          Show Stacking (Max 3)
        </button>
        <button class="btn btn-outline" on:click={showPersistent}>
          Persistent Toast
        </button>
        <button class="btn btn-outline btn-secondary" on:click={clearAll}>
          Clear All Toasts
        </button>
      </div>
    </div>
  </div>

  <!-- Custom Toast -->
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Custom Toast</h2>
      <p class="text-sm text-base-content/70 mb-4">
        Create your own toast with custom message and duration
      </p>
      <div class="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          class="input input-bordered flex-1"
          placeholder="Custom message"
          bind:value={customMessage}
        />
        <input
          type="number"
          class="input input-bordered w-32"
          placeholder="Duration (ms)"
          bind:value={customDuration}
          min="0"
          max="30000"
          step="1000"
        />
        <button class="btn btn-primary" on:click={showCustom}>
          Show Toast
        </button>
      </div>
    </div>
  </div>

  <!-- Features List -->
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Features</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-semibold mb-2">Visual</h3>
          <ul class="space-y-1 text-sm text-base-content/80">
            <li>✓ Frosted glass backdrop blur</li>
            <li>✓ Smooth slide-in animations</li>
            <li>✓ Progress bar showing time remaining</li>
            <li>✓ Type-specific colors and icons</li>
            <li>✓ Responsive design (mobile-optimized)</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Functional</h3>
          <ul class="space-y-1 text-sm text-base-content/80">
            <li>✓ Auto-dismiss with configurable duration</li>
            <li>✓ Action buttons (Retry, Undo, etc.)</li>
            <li>✓ Manual dismiss button</li>
            <li>✓ Queue management (max 3 visible)</li>
            <li>✓ Haptic feedback on mobile</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Accessibility</h3>
          <ul class="space-y-1 text-sm text-base-content/80">
            <li>✓ ARIA live regions</li>
            <li>✓ Semantic roles</li>
            <li>✓ Keyboard navigation</li>
            <li>✓ Screen reader support</li>
            <li>✓ High contrast colors</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-2">Developer</h3>
          <ul class="space-y-1 text-sm text-base-content/80">
            <li>✓ Error-specific helpers</li>
            <li>✓ Success shortcuts</li>
            <li>✓ TypeScript support</li>
            <li>✓ Programmatic control</li>
            <li>✓ Optional sound effects</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- Code Examples -->
  <div class="card bg-base-200 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Code Examples</h2>
      <div class="space-y-4">
        <div>
          <h3 class="font-semibold mb-2 text-sm">Basic Usage:</h3>
          <pre class="bg-base-300 p-3 rounded text-xs overflow-x-auto"><code>import &#123; toast &#125; from '$lib/stores/toast';

toast.success('Operation successful!');
toast.error('Something went wrong');
toast.warning('Please be careful');
toast.info('Here is some info');</code></pre>
        </div>

        <div>
          <h3 class="font-semibold mb-2 text-sm">With Action Button:</h3>
          <pre class="bg-base-300 p-3 rounded text-xs overflow-x-auto"><code>toast.error('Failed to save', 7000, &#123;
  label: 'Retry',
  callback: async () => &#123;
    await saveChanges();
  &#125;
&#125;);</code></pre>
        </div>

        <div>
          <h3 class="font-semibold mb-2 text-sm">Network Error with Retry:</h3>
          <pre class="bg-base-300 p-3 rounded text-xs overflow-x-auto"><code>try &#123;
  await fetch('/api/data');
&#125; catch (error) &#123;
  toast.networkError(fetchData);
&#125;</code></pre>
        </div>
      </div>
    </div>
  </div>

  <!-- Documentation Links -->
  <div class="card bg-primary text-primary-content shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Documentation</h2>
      <div class="space-y-2 text-sm">
        <p>📚 <strong>Usage Guide:</strong> /src/docs/toast-usage-examples.md</p>
        <p>🔄 <strong>Migration Guide:</strong> /src/docs/toast-migration-guide.md</p>
        <p>💻 <strong>Examples:</strong> /src/examples/toast-examples.ts</p>
        <p>🎨 <strong>Component:</strong> /src/lib/components/ui/Toast.svelte</p>
        <p>🗃️ <strong>Store:</strong> /src/lib/stores/toast.ts</p>
      </div>
    </div>
  </div>
</div>

<style>
  code {
    font-family: 'Courier New', monospace;
  }
</style>
