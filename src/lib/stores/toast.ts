import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    callback: () => void | Promise<void>;
  };
}

interface ToastStore {
  toasts: Toast[];
}

const MAX_TOASTS = 3;

function createToastStore() {
  const { subscribe, update } = writable<ToastStore>({ toasts: [] });

  let idCounter = 0;
  const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  function addToast(
    message: string,
    variant: Toast['variant'] = 'info',
    duration = 5000,
    dismissible = true,
    action?: Toast['action']
  ): string {
    const id = `toast-${Date.now()}-${idCounter++}`;
    const toast: Toast = { id, message, variant, duration, dismissible, action };

    update(state => {
      // Remove oldest toast if we exceed max
      const newToasts = state.toasts.length >= MAX_TOASTS
        ? state.toasts.slice(-(MAX_TOASTS - 1))
        : state.toasts;

      return {
        toasts: [...newToasts, toast]
      };
    });

    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
        timeouts.delete(id);
      }, duration);
      timeouts.set(id, timeout);
    }

    return id;
  }

  function removeToast(id: string) {
    const timeout = timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.delete(id);
    }

    update(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }

  function clearAll() {
    // Clear all timeouts
    timeouts.forEach(timeout => clearTimeout(timeout));
    timeouts.clear();

    update(() => ({ toasts: [] }));
  }

  // Convenience methods
  function success(message: string, duration = 5000) {
    return addToast(message, 'success', duration);
  }

  function error(message: string, duration = 7000, action?: Toast['action']) {
    return addToast(message, 'error', duration, true, action);
  }

  function info(message: string, duration = 5000) {
    return addToast(message, 'info', duration);
  }

  function warning(message: string, duration = 6000, action?: Toast['action']) {
    return addToast(message, 'warning', duration, true, action);
  }

  // Error-specific helpers
  function networkError(retryCallback?: () => void | Promise<void>) {
    return error(
      'Connection lost. Please check your internet connection.',
      10000,
      retryCallback ? {
        label: 'Retry',
        callback: retryCallback
      } : undefined
    );
  }

  function authError() {
    return error(
      'Your session has expired. Please log in again.',
      0, // Don't auto-dismiss
      {
        label: 'Log In',
        callback: () => {
          window.location.href = '/login';
        }
      }
    );
  }

  function rateLimitError(waitSeconds = 30) {
    return warning(
      `Too many requests. Please wait ${waitSeconds} seconds before trying again.`,
      waitSeconds * 1000
    );
  }

  function serverError(retryCallback?: () => void | Promise<void>) {
    return error(
      'Server error occurred. Please try again later.',
      8000,
      retryCallback ? {
        label: 'Retry',
        callback: retryCallback
      } : undefined
    );
  }

  function permissionError() {
    return error(
      'You do not have permission to perform this action.',
      6000
    );
  }

  function validationError(message: string) {
    return warning(message, 5000);
  }

  // Success-specific helpers
  function messageSent() {
    return success('Message sent successfully!', 3000);
  }

  function profileUpdated() {
    return success('Profile updated successfully!', 3000);
  }

  function saved() {
    return success('Changes saved!', 3000);
  }

  function deleted() {
    return success('Deleted successfully!', 3000);
  }

  function copied() {
    return success('Copied to clipboard!', 2000);
  }

  return {
    subscribe,
    success,
    error,
    info,
    warning,
    remove: removeToast,
    clear: clearAll,
    // Error-specific
    networkError,
    authError,
    rateLimitError,
    serverError,
    permissionError,
    validationError,
    // Success-specific
    messageSent,
    profileUpdated,
    saved,
    deleted,
    copied
  };
}

export const toast = createToastStore();
