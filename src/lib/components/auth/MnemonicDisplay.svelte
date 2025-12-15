<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import InfoTooltip from '$lib/components/ui/InfoTooltip.svelte';
  import SecurityTooltip from '$lib/components/ui/SecurityTooltip.svelte';

  export let mnemonic: string;

  const dispatch = createEventDispatcher<{ continue: void }>();

  let hasSaved = false;
  let hasAcknowledged = false;
  let copied = false;
  let showMnemonic = false;

  const words = mnemonic.split(' ');

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(mnemonic);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function handleContinue() {
    if (hasSaved) {
      dispatch('continue');
    }
  }

  function revealMnemonic() {
    showMnemonic = true;
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4 bg-base-200">
  <div class="card w-full max-w-2xl bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="flex items-center justify-center gap-2 mb-4">
        <h2 class="card-title text-2xl">Your Recovery Phrase</h2>
        <SecurityTooltip type="backup" position="bottom" />
      </div>

      <!-- CRITICAL WARNING - Moved ABOVE reveal button -->
      <div class="alert bg-error/10 border-2 border-error mb-6 animate-pulse-slow">
        <div class="flex-1">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-error shrink-0 h-8 w-8 mt-1" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <p class="font-bold text-error text-lg mb-2">CRITICAL: Your Private Key</p>
              <ul class="text-sm space-y-1 text-base-content">
                <li class="flex items-start gap-2">
                  <span class="text-error font-bold">•</span>
                  <span>This is the ONLY way to recover your account</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-error font-bold">•</span>
                  <span>Anyone with this phrase can access your account</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-error font-bold">•</span>
                  <span>Fairfield University cannot recover lost recovery phrases</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-error font-bold">•</span>
                  <span>Write it on paper and store it in a secure location</span>
                </li>
              </ul>

              <div class="form-control mt-3">
                <label class="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg p-3">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-error"
                    bind:checked={hasAcknowledged}
                  />
                  <span class="label-text font-medium">I understand this is my only way to recover my account</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {#if !showMnemonic}
        <!-- Reveal Button -->
        <div class="flex justify-center mb-4">
          <button
            class="btn btn-warning btn-lg gap-2"
            on:click={revealMnemonic}
            disabled={!hasAcknowledged}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Reveal Recovery Phrase
          </button>
        </div>
      {:else}
        <!-- Mnemonic Display with Security Indicator -->
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="badge badge-error badge-lg gap-1 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private - Keep Secret
            </div>
            <SecurityTooltip type="private-key" position="bottom" inline />
          </div>

          <div class="bg-base-200 rounded-lg p-6 mb-4 border-2 border-error/20">
            <div class="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {#each words as word, i}
                <div class="flex items-center gap-2 bg-base-100 rounded px-3 py-2 shadow">
                  <span class="text-xs text-base-content/50 font-mono">{i + 1}.</span>
                  <span class="font-medium font-mono">{word}</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="flex justify-center mb-4">
            <button
              class="btn btn-outline btn-sm gap-2"
              on:click={copyToClipboard}
            >
              {#if copied}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy to Clipboard
              {/if}
            </button>
          </div>

          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-center gap-3">
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                bind:checked={hasSaved}
              />
              <span class="label-text text-base">I have saved my recovery phrase in a secure location</span>
            </label>
          </div>
        </div>
      {/if}

      {#if showMnemonic}
        <div class="card-actions justify-center">
          <button
            class="btn btn-primary btn-lg w-full sm:w-auto px-8"
            on:click={handleContinue}
            disabled={!hasSaved}
          >
            Continue
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
  }

  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
</style>
