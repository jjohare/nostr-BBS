---
title: Mention Functionality Patch for MessageItem
description: Patch implementation for adding user mention functionality to message components
last_updated: 2025-12-23
category: reference
tags: [development, features, messages]
---

# Mention Functionality Patch for MessageItem.svelte

## Overview

Add these imports to the top of the <script> section:

  import { parseMentions, formatPubkey } from '$lib/utils/mentions';

Add these reactive declarations after the existing ones:

  $: isMentioned = $authStore.publicKey && displayContent.includes(`@${$authStore.publicKey}`);
  $: formattedContent = formatMessageContent(displayContent);

Add these functions before the closing </script> tag:

  interface ContentPart {
    type: 'text' | 'mention';
    content: string;
    pubkey?: string;
  }

  function formatMessageContent(content: string): ContentPart[] {
    const mentions = parseMentions(content);

    if (mentions.length === 0) {
      return [{ type: 'text', content }];
    }

    const parts: ContentPart[] = [];
    let lastIndex = 0;

    for (const mention of mentions) {
      if (mention.startIndex > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, mention.startIndex)
        });
      }

      parts.push({
        type: 'mention',
        content: formatPubkey(mention.pubkey),
        pubkey: mention.pubkey
      });

      lastIndex = mention.endIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts;
  }

  function handleMentionClick(pubkey: string) {
    // Navigate to user profile page
    goto(`/profile/${pubkey}`);
  }

Update the main div class attribute to include mention highlight:

  class="flex gap-3 group {isMentioned ? 'mention-highlight' : ''}"

Replace the message content paragraph (around line 160):

  <p class="whitespace-pre-wrap">{displayContent}</p>

With this:

  <p class="whitespace-pre-wrap">
    {#each formattedContent as part}
      {#if part.type === 'text'}
        {part.content}
      {:else if part.type === 'mention'}
        <button
          class="mention-link font-medium {part.pubkey === $authStore.publicKey ? 'mention-self' : ''}"
          on:click={() => handleMentionClick(part.pubkey || '')}
          title={part.pubkey}
        >
          @{part.content}
        </button>
      {/if}
    {/each}
  </p>

Add these styles at the end of the file:

<style>
  .mention-link {
    color: hsl(var(--p));
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0.25rem;
    padding: 0 0.25rem;
    display: inline-block;
  }

  .mention-link:hover {
    background-color: hsl(var(--p) / 0.1);
    text-decoration: underline;
  }

  .mention-self {
    background-color: hsl(var(--p) / 0.15);
    font-weight: 600;
  }

  .mention-highlight {
    position: relative;
  }

  .mention-highlight::before {
    content: '';
    position: absolute;
    left: -0.5rem;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: hsl(var(--p));
    border-radius: 9999px;
  }
</style>

---

## Related Documentation

### Feature Guides
- [PWA Quick Start](pwa-quick-start.md) - Progressive Web App installation
- [Search Implementation](search-implementation.md) - Semantic search features
- [Threading Implementation](threading-implementation.md) - Conversation threading
- [DM Implementation](dm-implementation.md) - Direct messaging system

### Architecture
- [System Architecture](../architecture/02-architecture.md) - Overall system design
- [NIP Protocol Reference](../reference/nip-protocol-reference.md) - Nostr protocol specs

### User Guides
- [Getting Started](../INDEX.md#getting-started) - Quick start guides for new users
- [Features Overview](../INDEX.md#features) - Complete feature documentation

---

[← Back to Features Documentation](../INDEX.md#features) | [← Back to Documentation Hub](../INDEX.md)
