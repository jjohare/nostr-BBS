/**
 * Session Timeout Management
 *
 * Implements automatic session timeout for security.
 * Tracks user activity and auto-logouts after inactivity period.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// Session timeout configuration (milliseconds)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 minutes before timeout
const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

const LAST_ACTIVITY_KEY = 'minimoonoir_last_activity';

interface SessionState {
  isActive: boolean;
  showWarning: boolean;
  remainingMs: number;
}

const initialState: SessionState = {
  isActive: true,
  showWarning: false,
  remainingMs: SESSION_TIMEOUT_MS
};

function createSessionStore() {
  const { subscribe, set, update } = writable<SessionState>(initialState);

  let checkInterval: ReturnType<typeof setInterval> | null = null;
  let onTimeoutCallback: (() => void) | null = null;

  /**
   * Update last activity timestamp
   */
  function touch() {
    if (!browser) return;
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    update(state => ({
      ...state,
      isActive: true,
      showWarning: false,
      remainingMs: SESSION_TIMEOUT_MS
    }));
  }

  /**
   * Get last activity timestamp
   */
  function getLastActivity(): number {
    if (!browser) return Date.now();
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }

  /**
   * Check if session has timed out
   */
  function checkTimeout() {
    if (!browser) return;

    const lastActivity = getLastActivity();
    const elapsed = Date.now() - lastActivity;
    const remaining = SESSION_TIMEOUT_MS - elapsed;

    if (remaining <= 0) {
      // Session timed out
      update(state => ({
        ...state,
        isActive: false,
        showWarning: false,
        remainingMs: 0
      }));

      if (onTimeoutCallback) {
        onTimeoutCallback();
      }
    } else if (remaining <= WARNING_BEFORE_MS) {
      // Show warning
      update(state => ({
        ...state,
        isActive: true,
        showWarning: true,
        remainingMs: remaining
      }));
    } else {
      // Session still active
      update(state => ({
        ...state,
        isActive: true,
        showWarning: false,
        remainingMs: remaining
      }));
    }
  }

  /**
   * Start session monitoring
   */
  function start(onTimeout: () => void) {
    if (!browser) return;

    onTimeoutCallback = onTimeout;

    // Initialize last activity
    touch();

    // Start periodic check
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    checkInterval = setInterval(checkTimeout, CHECK_INTERVAL_MS);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const throttledTouch = throttle(touch, 10000); // Update at most every 10 seconds

    activityEvents.forEach(event => {
      document.addEventListener(event, throttledTouch, { passive: true });
    });

    // Store cleanup function
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledTouch);
      });
    };
  }

  /**
   * Stop session monitoring
   */
  function stop() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    onTimeoutCallback = null;
    set(initialState);
  }

  /**
   * Extend session (user clicked "Stay Logged In")
   */
  function extend() {
    touch();
  }

  return {
    subscribe,
    start,
    stop,
    touch,
    extend,
    checkTimeout
  };
}

/**
 * Throttle function to limit how often a function can be called
 */
function throttle<T extends (...args: unknown[]) => void>(fn: T, limit: number): T {
  let lastRun = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastRun >= limit) {
      lastRun = now;
      fn(...args);
    }
  }) as T;
}

export const sessionStore = createSessionStore();

/**
 * Format remaining time as human-readable string
 */
export function formatRemainingTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Get session timeout configuration
 */
export const SESSION_CONFIG = {
  timeoutMs: SESSION_TIMEOUT_MS,
  warningBeforeMs: WARNING_BEFORE_MS,
  checkIntervalMs: CHECK_INTERVAL_MS
} as const;
