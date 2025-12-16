<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { encodePubkey } from '$lib/nostr/keys';
  import SecurityTooltip from '$lib/components/ui/SecurityTooltip.svelte';

  export let publicKey: string;
  export let mnemonic: string | null = null;

  const dispatch = createEventDispatcher<{ continue: void }>();

  let copiedPubkey = false;
  let copiedMnemonic = false;
  let currentStep = 1;
  let verificationWords: string[] = [];
  let userInputs: string[] = ['', '', ''];
  let verificationPassed = false;
  let finalConfirmation = false;

  const npub = encodePubkey(publicKey);
  const mnemonicWords = mnemonic ? mnemonic.split(' ') : [];

  // Select 3 random word indices for verification
  if (mnemonic && verificationWords.length === 0) {
    const indices = new Set<number>();
    while (indices.size < 3) {
      indices.add(Math.floor(Math.random() * mnemonicWords.length));
    }
    verificationWords = Array.from(indices).sort((a, b) => a - b).map(String);
  }

  async function copyPubkey() {
    try {
      await navigator.clipboard.writeText(npub);
      copiedPubkey = true;
      setTimeout(() => { copiedPubkey = false; }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  async function copyMnemonic() {
    if (!mnemonic) return;
    try {
      await navigator.clipboard.writeText(mnemonic);
      copiedMnemonic = true;
      setTimeout(() => { copiedMnemonic = false; }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function nextStep() {
    if (currentStep < 3) {
      currentStep++;
    }
  }

  function verifyWords() {
    verificationPassed = verificationWords.every((wordIndex, i) => {
      return userInputs[i].trim().toLowerCase() === mnemonicWords[Number(wordIndex)].toLowerCase();
    });

    if (verificationPassed) {
      nextStep();
    }
  }

  function handleContinue() {
    if (finalConfirmation) {
      dispatch('continue');
    }
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4 bg-base-200">
  <div class="card w-full max-w-lg bg-base-100 shadow-xl">
    <div class="card-body">
      <!-- Progress Indicator -->
      {#if mnemonic}
        <div class="flex justify-center gap-2 mb-6">
          {#each [1, 2, 3] as step}
            <div class="flex items-center">
              <div class="step-indicator {currentStep >= step ? 'step-active' : 'step-inactive'}">
                {#if currentStep > step}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                {:else}
                  {step}
                {/if}
              </div>
              {#if step < 3}
                <div class="step-line {currentStep > step ? 'step-line-active' : ''}"></div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <h2 class="card-title text-2xl justify-center mb-2">
        {#if !mnemonic}
          Your Public Key
        {:else if currentStep === 1}
          Step 1: Save Your Recovery Phrase
        {:else if currentStep === 2}
          Step 2: Verify Your Backup
        {:else}
          Step 3: Final Confirmation
        {/if}
      </h2>

      <!-- Step 1: Display Mnemonic -->
      {#if mnemonic && currentStep === 1}
        <div class="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="text-sm">
            <p class="font-bold">Write this down on paper!</p>
            <p>Store it somewhere safe. This is the ONLY way to recover your account.</p>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-center gap-2 mb-3">
            <h3 class="font-semibold">Recovery Phrase</h3>
            <SecurityTooltip type="backup" position="bottom" inline />
          </div>
          <div class="bg-base-200 rounded-lg p-4 mb-2">
            <div class="grid grid-cols-3 gap-2">
              {#each mnemonicWords as word, i}
                <div class="flex items-center gap-1 text-sm">
                  <span class="text-xs text-base-content/50">{i + 1}.</span>
                  <span class="font-mono font-medium">{word}</span>
                </div>
              {/each}
            </div>
          </div>
          <button
            class="btn btn-outline btn-sm btn-block gap-2"
            on:click={copyMnemonic}
          >
            {#if copiedMnemonic}
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

        <div class="card-actions justify-center mt-4">
          <button
            class="btn btn-primary btn-lg w-full"
            on:click={nextStep}
          >
            I've Written It Down
          </button>
        </div>
      {/if}

      <!-- Step 2: Verify Words -->
      {#if mnemonic && currentStep === 2}
        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-sm">
            <p class="font-bold">Verify your backup</p>
            <p>Enter the words at these positions to confirm you saved them correctly.</p>
          </div>
        </div>

        <div class="space-y-4 mb-4">
          {#each verificationWords as wordIndex, i}
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Word #{Number(wordIndex) + 1}</span>
              </label>
              <input
                type="text"
                placeholder="Enter word"
                class="input input-bordered w-full"
                bind:value={userInputs[i]}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
              />
            </div>
          {/each}
        </div>

        {#if verificationPassed === false && userInputs.some(input => input.length > 0)}
          <div class="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Words don't match. Please check your backup and try again.</span>
          </div>
        {/if}

        <div class="card-actions justify-center mt-4">
          <button
            class="btn btn-primary btn-lg w-full"
            on:click={verifyWords}
            disabled={userInputs.some(input => input.trim().length === 0)}
          >
            Verify Words
          </button>
        </div>
      {/if}

      <!-- Step 3: Final Confirmation -->
      {#if mnemonic && currentStep === 3}
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-sm">
            <p class="font-bold">Backup verified!</p>
            <p>Your recovery phrase is safely stored.</p>
          </div>
        </div>

        <div class="bg-base-200 rounded-lg p-4 mb-4">
          <h3 class="font-semibold mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Important Reminders
          </h3>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Keep your recovery phrase stored securely offline</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Never share it with anyone - including Fairfield staff</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-success">✓</span>
              <span>Consider making multiple copies stored in different locations</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-error">✗</span>
              <span>Don't store it digitally (screenshots, cloud storage, etc.)</span>
            </li>
          </ul>
        </div>

        <div class="form-control mb-4">
          <label class="label cursor-pointer justify-start gap-3 bg-base-100 rounded-lg p-3 border border-base-300">
            <input
              type="checkbox"
              class="checkbox checkbox-primary"
              bind:checked={finalConfirmation}
            />
            <span class="label-text">I understand and accept responsibility for securing my recovery phrase</span>
          </label>
        </div>

        <div class="card-actions justify-center mt-4">
          <button
            class="btn btn-primary btn-lg w-full"
            on:click={handleContinue}
            disabled={!finalConfirmation}
          >
            Complete Setup
          </button>
        </div>
      {/if}

      <!-- Public Key Section (always shown if no mnemonic, or after step 3) -->
      {#if !mnemonic || currentStep === 3}
        <div class="divider"></div>

        <div class="mb-4">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-semibold">Your Public Key</h3>
            <SecurityTooltip type="public-key" position="bottom" inline />
          </div>
          <p class="text-sm text-base-content/70 mb-2 flex items-center gap-1">
            <span class="badge badge-success badge-sm gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Safe to share
            </span>
            Share this with others to receive messages
          </p>
          <div class="bg-base-200 rounded-lg p-4 mb-2">
            <p class="font-mono text-sm break-all">{npub}</p>
          </div>
          <button
            class="btn btn-outline btn-sm btn-block gap-2"
            on:click={copyPubkey}
          >
            {#if copiedPubkey}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Public Key
            {/if}
          </button>
        </div>

        {#if !mnemonic}
          <div class="card-actions justify-center mt-4">
            <button
              class="btn btn-primary btn-lg w-full"
              on:click={() => dispatch('continue')}
            >
              Continue
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .step-indicator {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .step-active {
    background-color: hsl(var(--p));
    color: hsl(var(--pc));
  }

  .step-inactive {
    background-color: hsl(var(--b3));
    color: hsl(var(--bc) / 0.5);
  }

  .step-line {
    width: 40px;
    height: 3px;
    background-color: hsl(var(--b3));
    transition: background-color 0.3s ease;
  }

  .step-line-active {
    background-color: hsl(var(--p));
  }
</style>
