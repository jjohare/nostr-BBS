/**
 * NIP-16: Event Treatment
 *
 * Ported from JSS (JavaScriptSolidServer) Nostr relay
 * https://github.com/JavaScriptSolidServer/JavaScriptSolidServer
 *
 * Defines how different event kinds should be treated:
 * - Regular events: Stored permanently
 * - Replaceable events: Only latest version kept per pubkey+kind
 * - Ephemeral events: Not stored, only broadcast
 * - Parameterized replaceable: Latest per pubkey+kind+d-tag
 */

import { NostrEvent } from './db';

/**
 * Check if event kind is replaceable (NIP-16)
 * Kinds 0, 3, and 10000-19999 are replaceable
 * Only one event per pubkey+kind is kept (latest wins)
 */
export function isReplaceableKind(kind: number): boolean {
  return (kind >= 10000 && kind < 20000) || kind === 0 || kind === 3;
}

/**
 * Check if event kind is ephemeral (NIP-16)
 * Kinds 20000-29999 are ephemeral
 * These events are broadcast but NOT stored
 */
export function isEphemeralKind(kind: number): boolean {
  return kind >= 20000 && kind < 30000;
}

/**
 * Check if event kind is parameterized replaceable (NIP-33)
 * Kinds 30000-39999 are parameterized replaceable
 * Only one event per pubkey+kind+d-tag is kept
 */
export function isParameterizedReplaceable(kind: number): boolean {
  return kind >= 30000 && kind < 40000;
}

/**
 * Get the 'd' tag value from an event (for parameterized replaceable events)
 */
export function getDTagValue(event: NostrEvent): string | null {
  for (const tag of event.tags) {
    if (tag[0] === 'd') {
      return tag[1] || '';
    }
  }
  return null;
}

/**
 * Determine event treatment type
 */
export type EventTreatment = 'regular' | 'replaceable' | 'ephemeral' | 'parameterized_replaceable';

export function getEventTreatment(kind: number): EventTreatment {
  if (isEphemeralKind(kind)) return 'ephemeral';
  if (isReplaceableKind(kind)) return 'replaceable';
  if (isParameterizedReplaceable(kind)) return 'parameterized_replaceable';
  return 'regular';
}

/**
 * Generate replacement key for deduplication
 * Used to identify which event should be replaced
 */
export function getReplacementKey(event: NostrEvent): string | null {
  const treatment = getEventTreatment(event.kind);

  switch (treatment) {
    case 'replaceable':
      return `${event.pubkey}:${event.kind}`;
    case 'parameterized_replaceable':
      const dTag = getDTagValue(event);
      return `${event.pubkey}:${event.kind}:${dTag || ''}`;
    default:
      return null;
  }
}
