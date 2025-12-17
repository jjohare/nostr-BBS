<script lang="ts">
  import Signup from '$lib/components/auth/Signup.svelte';
  import MnemonicDisplay from '$lib/components/auth/MnemonicDisplay.svelte';
  import KeyBackup from '$lib/components/auth/KeyBackup.svelte';
  import PendingApproval from '$lib/components/auth/PendingApproval.svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { authStore } from '$lib/stores/auth';
  import { checkWhitelistStatus, publishRegistrationRequest } from '$lib/nostr/whitelist';

  type FlowStep = 'signup' | 'mnemonic' | 'backup' | 'pending';
  let step: FlowStep = 'signup';
  let mnemonic = '';
  let publicKey = '';
  let privateKey = '';
  let isApproved = false;

  function handleNext(event: CustomEvent<{ mnemonic: string; publicKey: string; privateKey: string }>) {
    const data = event.detail;
    if (data.mnemonic) {
      mnemonic = data.mnemonic;
      publicKey = data.publicKey;
      privateKey = data.privateKey;
      step = 'mnemonic';
    } else {
      goto(`${base}/login`);
    }
  }

  function handleMnemonicContinue() {
    step = 'backup';
  }

  async function handleBackupContinue() {
    await authStore.setKeys(publicKey, privateKey, mnemonic);
    authStore.confirmMnemonicBackup();

    // Check if user is pre-approved (admin or on whitelist)
    const whitelistStatus = await checkWhitelistStatus(publicKey);
    isApproved = whitelistStatus.isApproved || whitelistStatus.isAdmin;

    if (isApproved) {
      // Skip pending approval for pre-approved users
      goto(`${base}/chat`);
    } else {
      // Publish registration request so admin can see this user
      try {
        const result = await publishRegistrationRequest(privateKey);
        if (!result.success) {
          console.warn('[Signup] Failed to publish registration request:', result.error);
        }
      } catch (error) {
        console.warn('[Signup] Error publishing registration request:', error);
      }

      // Show pending approval screen
      authStore.setPending(true);
      step = 'pending';
    }
  }

  async function handleApproved() {
    authStore.setPending(false);
    goto(`${base}/chat`);
  }
</script>

<svelte:head>
  <title>Sign Up - Nostr BBS</title>
</svelte:head>

{#if step === 'signup'}
  <Signup on:next={handleNext} />
{:else if step === 'mnemonic'}
  <MnemonicDisplay {mnemonic} on:continue={handleMnemonicContinue} />
{:else if step === 'backup'}
  <KeyBackup {publicKey} {mnemonic} on:continue={handleBackupContinue} />
{:else if step === 'pending'}
  <PendingApproval {publicKey} on:approved={handleApproved} />
{/if}
