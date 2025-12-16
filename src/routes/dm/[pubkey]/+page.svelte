<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { authStore } from '$lib/stores/auth';
  import { dmStore } from '$lib/stores/dm';
  import { toast } from '$lib/stores/toast';
  import { hexToBytes } from '@noble/hashes/utils.js';

  $: recipientPubkey = $page.params.pubkey;
  $: messages = $dmStore.messages;

  let messageInput = '';
  let loading = true;
  let sending = false;
  let messagesContainer: HTMLDivElement;
  let unsubscribe: (() => void) | null = null;

  onMount(async () => {
    // Wait for auth store to be ready before checking authentication
    await authStore.waitForReady();

    if (!$authStore.isAuthenticated || !$authStore.privateKey) {
      goto(`${base}/`);
      return;
    }

    // Load or start conversation
    if (!$dmStore.conversations.has(recipientPubkey)) {
      dmStore.startConversation(recipientPubkey);
    } else {
      dmStore.selectConversation(recipientPubkey);
    }

    // Subscribe to real-time DMs
    try {
      const privkeyBytes = hexToBytes($authStore.privateKey);
      unsubscribe = await dmStore.subscribeToIncoming(privkeyBytes);
    } catch (err) {
      console.error('Failed to subscribe to DMs:', err);
    }

    loading = false;
  });

  onDestroy(() => {
    // Unsubscribe when leaving the page
    if (unsubscribe) {
      unsubscribe();
    }
  });

  afterUpdate(() => {
    // Scroll to bottom when new messages arrive
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  async function sendMessage() {
    if (!messageInput.trim() || sending || !$authStore.privateKey) return;

    sending = true;
    const content = messageInput;
    messageInput = '';

    try {
      // Convert hex private key to Uint8Array
      const privkeyBytes = hexToBytes($authStore.privateKey);

      // Dummy relay object - actual relay calls happen via NDK inside dmStore
      const dummyRelay = {
        publish: async () => {}
      };

      await dmStore.sendDM(content, dummyRelay, privkeyBytes);
      toast.messageSent();
    } catch (error) {
      console.error('Error sending DM:', error);
      messageInput = content;

      // Determine error type and show appropriate toast
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        toast.networkError(sendMessage);
      } else if (errorMessage.includes('auth') || errorMessage.includes('session')) {
        toast.authError();
      } else {
        toast.error('Failed to send message. Please try again.', 7000, {
          label: 'Retry',
          callback: sendMessage
        });
      }
    } finally {
      sending = false;
    }
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPubkey(pubkey: string): string {
    return pubkey.slice(0, 12) + '...' + pubkey.slice(-8);
  }
</script>

<svelte:head>
  <title>DM with {formatPubkey(recipientPubkey)} - Fairfield</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center h-[calc(100vh-64px)]">
    <div class="loading loading-spinner loading-lg text-primary"></div>
  </div>
{:else}
  <div class="flex flex-col h-[calc(100vh-64px)]">
    <div class="bg-base-200 border-b border-base-300 p-4">
      <div class="container mx-auto max-w-2xl">
        <button class="btn btn-ghost btn-sm mb-2" on:click={() => goto(`${base}/dm`)}>
          ← Back to Messages
        </button>
        <div class="flex items-center gap-3">
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-10">
              <span>{recipientPubkey.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <h1 class="text-xl font-bold">{formatPubkey(recipientPubkey)}</h1>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 bg-base-100" bind:this={messagesContainer}>
      <div class="container mx-auto max-w-2xl">
        {#if messages.length === 0}
          <div class="flex items-center justify-center h-full text-base-content/50">
            <p>No messages yet. Start the conversation!</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each messages as message (message.id)}
              <div class="chat {message.senderPubkey === $authStore.publicKey ? 'chat-end' : 'chat-start'}">
                <div class="chat-bubble">
                  {message.content}
                </div>
                <div class="chat-footer opacity-50 text-xs">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="bg-base-200 border-t border-base-300 p-4">
      <div class="container mx-auto max-w-2xl">
        <form on:submit|preventDefault={sendMessage} class="flex gap-2">
          <input
            type="text"
            class="input input-bordered flex-1"
            placeholder="Type a message..."
            bind:value={messageInput}
            disabled={sending}
          />
          <button
            type="submit"
            class="btn btn-primary"
            disabled={sending || !messageInput.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}
