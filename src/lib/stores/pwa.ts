/**
 * PWA state management and utilities
 */

import { writable, derived, get } from 'svelte/store';
import { base } from '$app/paths';

/**
 * Install prompt event store
 */
export const installPrompt = writable<BeforeInstallPromptEvent | null>(null);

/**
 * Update available flag
 */
export const updateAvailable = writable<boolean>(false);

/**
 * Online/offline status
 */
export const isOnline = writable<boolean>(
  typeof navigator !== 'undefined' ? navigator.onLine : true
);

/**
 * Service worker registration
 */
export const swRegistration = writable<ServiceWorkerRegistration | null>(null);

/**
 * PWA installed status
 */
export const isPWAInstalled = writable<boolean>(false);

/**
 * Check if app is running as installed PWA
 */
export function checkIfPWA(): boolean {
  if (typeof window === 'undefined') return false;

  // Check display-mode media query (most reliable)
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;

  // Check iOS Safari standalone mode
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;

  // Check if launched from home screen on Android
  if (document.referrer.includes('android-app://')) return true;

  return false;
}

/**
 * PWA mode storage key
 */
const PWA_MODE_KEY = 'nostr_bbs_pwa_mode';

/**
 * Message queue count
 */
export const queuedMessageCount = writable<number>(0);

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Initialize PWA event listeners
 */
export function initPWA(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Listen for online/offline events
  window.addEventListener('online', () => {
    isOnline.set(true);
    triggerBackgroundSync();
  });

  window.addEventListener('offline', () => {
    isOnline.set(false);
  });

  // Capture install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    installPrompt.set(e as BeforeInstallPromptEvent);
  });

  // Detect if already installed
  window.addEventListener('appinstalled', () => {
    isPWAInstalled.set(true);
    installPrompt.set(null);
    // Persist PWA mode for future sessions
    localStorage.setItem(PWA_MODE_KEY, 'true');
  });

  // Check if running as PWA (current session or previously installed)
  const isPWA = checkIfPWA() || localStorage.getItem(PWA_MODE_KEY) === 'true';
  if (isPWA) {
    isPWAInstalled.set(true);
    localStorage.setItem(PWA_MODE_KEY, 'true');
  }

  // Listen for service worker messages
  navigator.serviceWorker?.addEventListener('message', (event) => {
    const { type, count } = event.data;

    if (type === 'SYNC_COMPLETE') {
      console.log(`[PWA] Background sync completed: ${count} messages`);
      queuedMessageCount.set(0);
    }
  });
}

/**
 * Trigger PWA install prompt
 */
export async function triggerInstall(): Promise<boolean> {
  const prompt = get(installPrompt);

  if (!prompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === 'accepted') {
      isPWAInstalled.set(true);
      installPrompt.set(null);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PWA] Install prompt failed:', error);
    return false;
  }
}

// Update check interval (1 hour for PWA, 4 hours for browser)
const UPDATE_CHECK_INTERVAL_PWA = 60 * 60 * 1000; // 1 hour
const UPDATE_CHECK_INTERVAL_BROWSER = 4 * 60 * 60 * 1000; // 4 hours

let updateCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported');
    return null;
  }

  try {
    const swPath = `${base}/service-worker.js`;
    const swScope = `${base}/`;
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: swScope
    });

    console.log('[PWA] Service worker registered:', registration);
    swRegistration.set(registration);

    // Listen for updatefound event (per MDN spec)
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) {
        return;
      }

      console.log('[PWA] New service worker installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[PWA] New version available');
            updateAvailable.set(true);
          } else {
            // First install
            console.log('[PWA] Service worker installed for the first time');
          }
        }
      });
    });

    // Start periodic update checks
    startUpdateChecks(registration);

    return registration;
  } catch (error) {
    // In dev mode, service worker may fail due to missing Workbox manifest injection
    // This is expected behavior - only log at debug level
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.debug('[PWA] Service worker unavailable in dev mode (expected)');
    } else {
      console.error('[PWA] Service worker registration failed:', error);
    }
    return null;
  }
}

/**
 * Start periodic update checks
 */
function startUpdateChecks(registration: ServiceWorkerRegistration): void {
  // Clear any existing interval
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }

  // Use shorter interval for PWA mode
  const isPWA = checkIfPWA() || localStorage.getItem(PWA_MODE_KEY) === 'true';
  const interval = isPWA ? UPDATE_CHECK_INTERVAL_PWA : UPDATE_CHECK_INTERVAL_BROWSER;

  // Check for updates periodically
  updateCheckInterval = setInterval(() => {
    checkForUpdates(registration);
  }, interval);

  // Also check on visibility change (when user returns to app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates(registration);
    }
  });
}

/**
 * Manually check for service worker updates
 */
export async function checkForUpdates(registration?: ServiceWorkerRegistration): Promise<void> {
  const reg = registration || get(swRegistration);
  if (!reg) return;

  try {
    await reg.update();
    console.log('[PWA] Update check completed');
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
  }
}

/**
 * Update service worker
 */
export async function updateServiceWorker(): Promise<void> {
  const registration = get(swRegistration);

  if (!registration?.waiting) {
    console.warn('[PWA] No waiting service worker');
    return;
  }

  registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

/**
 * Queue a message for background sync
 */
export async function queueMessage(
  event: NostrEvent,
  relayUrls: string[]
): Promise<void> {
  const registration = get(swRegistration);

  if (!registration?.active) {
    throw new Error('Service worker not active');
  }

  const message = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    event,
    relayUrls
  };

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        queuedMessageCount.update(n => n + 1);
        resolve();
      } else {
        reject(new Error(event.data.error));
      }
    };

    registration.active!.postMessage(
      { type: 'QUEUE_MESSAGE', payload: message },
      [messageChannel.port2]
    );
  });
}

/**
 * Get queued message count
 */
export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const registration = get(swRegistration);

  if (!registration?.active) {
    return [];
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.messages) {
        queuedMessageCount.set(event.data.messages.length);
        resolve(event.data.messages);
      } else {
        reject(new Error(event.data.error));
      }
    };

    registration.active!.postMessage(
      { type: 'GET_QUEUE' },
      [messageChannel.port2]
    );
  });
}

/**
 * Clear message queue
 */
export async function clearMessageQueue(): Promise<void> {
  const registration = get(swRegistration);

  if (!registration?.active) {
    return;
  }

  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        queuedMessageCount.set(0);
        resolve();
      } else {
        reject(new Error(event.data.error));
      }
    };

    registration.active!.postMessage(
      { type: 'CLEAR_QUEUE' },
      [messageChannel.port2]
    );
  });
}

/**
 * Trigger background sync
 */
export async function triggerBackgroundSync(): Promise<void> {
  const registration = get(swRegistration);

  if (!registration || !('sync' in registration)) {
    console.warn('[PWA] Background sync not supported');
    return;
  }

  try {
    // Background Sync API types are not in standard TypeScript lib
    // Cast to any to access the sync property
    const syncManager = (registration as { sync?: { register: (tag: string) => Promise<void> } }).sync;
    if (syncManager) {
      await syncManager.register('sync-messages');
      console.log('[PWA] Background sync registered');
    }
  } catch (error) {
    console.error('[PWA] Background sync failed:', error);
  }
}

/**
 * Check if PWA can be installed
 */
export const canInstall = derived(
  [installPrompt, isPWAInstalled],
  ([$installPrompt, $isPWAInstalled]) =>
    $installPrompt !== null && !$isPWAInstalled
);

/**
 * Nostr event interface
 */
interface NostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey: string;
  id?: string;
  sig?: string;
}

/**
 * Queued message interface
 */
interface QueuedMessage {
  id: string;
  timestamp: number;
  event: NostrEvent;
  relayUrls: string[];
}
