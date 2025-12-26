/**
 * Reactions Store
 * Manages reaction state and real-time updates for messages
 */

import { writable, derived, get } from 'svelte/store';
import { authStore } from './auth';
import type { NostrEvent, Filter } from '../../types/nostr';
import { EventKind } from '../../types/nostr';
import {
  createReactionEvent,
  parseReactionEvent,
  groupReactionsByContent,
  hasUserReacted,
  getUserReaction,
  getReactionsForEvent,
  normalizeReactionContent,
  type ReactionData,
} from '$lib/nostr/reactions';
import { ndk, publishEvent, subscribe as ndkSubscribe } from '$lib/nostr/relay';
import { NDKEvent, type NDKFilter, type NDKSubscription } from '@nostr-dev-kit/ndk';

/**
 * Reaction summary for a message
 */
export interface ReactionSummary {
  messageId: string;
  reactions: Map<string, ReactionInfo>;
  totalCount: number;
  userReaction: string | null;
}

/**
 * Information about a specific reaction type
 */
export interface ReactionInfo {
  content: string;
  count: number;
  reactors: string[];
  userReacted: boolean;
}

/**
 * Reaction store state
 */
interface ReactionState {
  // Map of messageId -> array of reactions
  reactionsByMessage: Map<string, ReactionData[]>;
  // Optimistic reactions (pending confirmation)
  optimisticReactions: Map<string, ReactionData>;
  // Loading state
  loading: boolean;
  error: string | null;
  // NDK Subscription tracking
  activeSubscriptions: Map<string, SubscriptionInfo[]>;
}

/**
 * NDK subscription tracking
 */
interface SubscriptionInfo {
  subId: string;
  subscription: NDKSubscription;
}

const initialState: ReactionState = {
  reactionsByMessage: new Map(),
  optimisticReactions: new Map(),
  loading: false,
  error: null,
  activeSubscriptions: new Map(),
};

/**
 * Create the reaction store
 */
function createReactionStore() {
  const { subscribe, set, update } = writable<ReactionState>(initialState);

  /**
   * Convert NostrEvent to NDKEvent
   */
  function nostrEventToNDK(event: NostrEvent): NDKEvent | null {
    const ndkInstance = ndk();
    if (!ndkInstance) {
      console.debug('[Reactions] NDK not initialized, skipping event conversion');
      return null;
    }

    const ndkEvent = new NDKEvent(ndkInstance);
    ndkEvent.id = event.id;
    ndkEvent.pubkey = event.pubkey;
    ndkEvent.created_at = event.created_at;
    ndkEvent.kind = event.kind;
    ndkEvent.tags = event.tags;
    ndkEvent.content = event.content;
    ndkEvent.sig = event.sig;

    return ndkEvent;
  }

  /**
   * Convert NDKEvent to NostrEvent
   */
  function ndkEventToNostr(ndkEvent: NDKEvent): NostrEvent {
    return {
      id: ndkEvent.id,
      pubkey: ndkEvent.pubkey,
      created_at: ndkEvent.created_at || Math.floor(Date.now() / 1000),
      kind: ndkEvent.kind || 0,
      tags: ndkEvent.tags,
      content: ndkEvent.content,
      sig: ndkEvent.sig || ''
    };
  }

  return {
    subscribe,

    /**
     * Fetch reactions for multiple messages
     */
    async fetchReactions(
      messageIds: string[],
      relayUrl: string
    ): Promise<void> {
      if (messageIds.length === 0) return;

      update(state => ({ ...state, loading: true, error: null }));

      try {
        const filter: NDKFilter = {
          kinds: [EventKind.REACTION],
          '#e': messageIds,
        };

        const subscription = ndkSubscribe(filter, { closeOnEose: false });

        subscription.on('event', (ndkEvent: NDKEvent) => {
          const event = ndkEventToNostr(ndkEvent);
          const reactionData = parseReactionEvent(event);
          if (!reactionData) return;

          update(state => {
            const existing = state.reactionsByMessage.get(reactionData.eventId) || [];

            const isDuplicate = existing.some(
              r => r.reactionEventId === reactionData.reactionEventId
            );

            if (!isDuplicate) {
              const updated = [...existing, reactionData];
              const reactionsByMessage = new Map(state.reactionsByMessage);
              reactionsByMessage.set(reactionData.eventId, updated);
              return { ...state, reactionsByMessage, loading: false };
            }

            return { ...state, loading: false };
          });
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch reactions';
        update(state => ({ ...state, error: errorMsg, loading: false }));
      }
    },

    /**
     * Add a reaction to a message
     */
    async addReaction(
      messageId: string,
      emoji: string,
      relayUrl: string,
      authorPubkey?: string
    ): Promise<void> {
      const auth = get(authStore);
      if (!auth.privateKey) {
        throw new Error('No private key available');
      }

      const normalized = normalizeReactionContent(emoji);

      // Create optimistic reaction
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticReaction: ReactionData = {
        eventId: messageId,
        authorPubkey: authorPubkey || '',
        content: normalized,
        reactorPubkey: auth.publicKey || '',
        timestamp: Math.floor(Date.now() / 1000),
        reactionEventId: optimisticId,
      };

      // Add optimistically
      update(state => {
        const existing = state.reactionsByMessage.get(messageId) || [];

        // Remove any existing reaction from this user
        const filtered = existing.filter(
          r => r.reactorPubkey !== optimisticReaction.reactorPubkey
        );

        const reactionsByMessage = new Map(state.reactionsByMessage);
        reactionsByMessage.set(messageId, [...filtered, optimisticReaction]);
        const optimisticReactions = new Map(state.optimisticReactions);
        optimisticReactions.set(optimisticId, optimisticReaction);

        return { ...state, reactionsByMessage, optimisticReactions };
      });

      try {
        // Create and publish reaction event
        const event = createReactionEvent(
          messageId,
          normalized,
          auth.privateKey,
          authorPubkey
        );

        const ndkEvent = nostrEventToNDK(event);
        if (!ndkEvent) {
          throw new Error('NDK not connected');
        }
        await publishEvent(ndkEvent);

        // Replace optimistic with real reaction
        const realReaction: ReactionData = {
          ...optimisticReaction,
          reactionEventId: event.id,
        };

        update(state => {
          const existing = state.reactionsByMessage.get(messageId) || [];
          const withoutOptimistic = existing.filter(
            r => r.reactionEventId !== optimisticId
          );

          const reactionsByMessage = new Map(state.reactionsByMessage);
          reactionsByMessage.set(messageId, [...withoutOptimistic, realReaction]);
          const optimisticReactions = new Map(state.optimisticReactions);
          optimisticReactions.delete(optimisticId);

          return { ...state, reactionsByMessage, optimisticReactions };
        });

      } catch (error) {
        // Remove optimistic reaction on failure
        update(state => {
          const existing = state.reactionsByMessage.get(messageId) || [];
          const filtered = existing.filter(r => r.reactionEventId !== optimisticId);

          const reactionsByMessage = new Map(state.reactionsByMessage);
          reactionsByMessage.set(messageId, filtered);
          const optimisticReactions = new Map(state.optimisticReactions);
          optimisticReactions.delete(optimisticId);

          return {
            ...state,
            reactionsByMessage,
            optimisticReactions,
            error: error instanceof Error ? error.message : 'Failed to add reaction'
          };
        });

        throw error;
      }
    },

    /**
     * Remove user's reaction from a message
     */
    async removeReaction(
      messageId: string,
      relayUrl: string
    ): Promise<void> {
      const auth = get(authStore);
      if (!auth.publicKey) {
        throw new Error('Not authenticated');
      }

      update(state => {
        const existing = state.reactionsByMessage.get(messageId) || [];
        const filtered = existing.filter(r => r.reactorPubkey !== auth.publicKey);

        const reactionsByMessage = new Map(state.reactionsByMessage);
        reactionsByMessage.set(messageId, filtered);

        return { ...state, reactionsByMessage };
      });

      // Note: NIP-25 doesn't specify reaction deletion
      // This is client-side only for now
    },

    /**
     * Subscribe to real-time reaction updates for messages
     */
    async subscribeToReactions(
      messageIds: string[],
      relayUrl: string
    ): Promise<void> {
      if (messageIds.length === 0) return;

      const filter: NDKFilter = {
        kinds: [EventKind.REACTION],
        '#e': messageIds,
        since: Math.floor(Date.now() / 1000),
      };

      const subId = `reactions_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const subscription = ndkSubscribe(filter, {
        closeOnEose: false,
        subId
      });

      subscription.on('event', (ndkEvent: NDKEvent) => {
        const event = ndkEventToNostr(ndkEvent);
        const reactionData = parseReactionEvent(event);
        if (!reactionData) return;

        update(state => {
          const existing = state.reactionsByMessage.get(reactionData.eventId) || [];

          const isDuplicate = existing.some(
            r => r.reactionEventId === reactionData.reactionEventId
          );

          if (!isDuplicate) {
            const updated = [...existing, reactionData];
            const reactionsByMessage = new Map(state.reactionsByMessage);
            reactionsByMessage.set(reactionData.eventId, updated);
            return { ...state, reactionsByMessage };
          }

          return { ...state };
        });
      });

      // Track subscription
      update(state => {
        const subs = state.activeSubscriptions.get(relayUrl) || [];
        const activeSubscriptions = new Map(state.activeSubscriptions);
        activeSubscriptions.set(relayUrl, [
          ...subs,
          { subId, subscription }
        ]);
        return { ...state, activeSubscriptions };
      });
    },

    /**
     * Unsubscribe from reaction updates
     */
    unsubscribe(relayUrl: string): void {
      const state = get({ subscribe });
      const subs = state.activeSubscriptions.get(relayUrl);

      if (subs) {
        subs.forEach(({ subscription }) => {
          subscription.stop();
        });

        update(s => {
          const activeSubscriptions = new Map(s.activeSubscriptions);
          activeSubscriptions.delete(relayUrl);
          return { ...s, activeSubscriptions };
        });
      }
    },

    /**
     * Get reaction summary for a message
     */
    getReactionSummary(messageId: string): ReactionSummary {
      const state = get({ subscribe });
      const reactions = state.reactionsByMessage.get(messageId) || [];
      const auth = get(authStore);

      const grouped = groupReactionsByContent(reactions);
      const reactionMap = new Map<string, ReactionInfo>();

      for (const [content, reactors] of grouped.entries()) {
        reactionMap.set(content, {
          content,
          count: reactors.length,
          reactors,
          userReacted: auth.publicKey ? reactors.includes(auth.publicKey) : false,
        });
      }

      const userReaction = auth.publicKey
        ? getUserReaction(reactions, auth.publicKey)?.content || null
        : null;

      return {
        messageId,
        reactions: reactionMap,
        totalCount: reactions.length,
        userReaction: userReaction ? normalizeReactionContent(userReaction) : null,
      };
    },

    /**
     * Clear error
     */
    clearError(): void {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Clear all reactions
     */
    clear(): void {
      set(initialState);
    },

    /**
     * Disconnect all subscriptions
     */
    disconnectAll(): void {
      const state = get({ subscribe });
      state.activeSubscriptions.forEach(subs => {
        subs.forEach(({ subscription }) => {
          subscription.stop();
        });
      });

      update(s => {
        return { ...s, activeSubscriptions: new Map() };
      });
    }
  };
}

export const reactionStore = createReactionStore();

/**
 * Derived store for reaction summary by message ID
 */
export function getMessageReactions(messageId: string) {
  return derived(
    reactionStore,
    $store => reactionStore.getReactionSummary(messageId)
  );
}

/**
 * Auto-cleanup on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    reactionStore.disconnectAll();
  });
}
