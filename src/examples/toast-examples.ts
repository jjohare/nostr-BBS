/**
 * Toast Notification Examples
 *
 * This file contains comprehensive examples of using the toast notification system
 * across various scenarios in the application.
 */

import { toast } from '$lib/stores/toast';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

export function basicExamples() {
  // Simple success
  toast.success('Operation completed!');

  // Simple error
  toast.error('Something went wrong!');

  // Simple info
  toast.info('Did you know?');

  // Simple warning
  toast.warning('Please verify this action');
}

// ============================================================================
// CUSTOM DURATION EXAMPLES
// ============================================================================

export function durationExamples() {
  // Quick notification (2 seconds)
  toast.success('Copied!', 2000);

  // Standard notification (5 seconds - default)
  toast.info('New message received', 5000);

  // Long notification (10 seconds)
  toast.error('Critical error occurred', 10000);

  // Persistent notification (never auto-dismiss)
  toast.error('Action required - review immediately', 0);
}

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

export async function networkErrorExample() {
  async function fetchUserData() {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      // Shows "Connection lost" with Retry button
      toast.networkError(fetchUserData);
    }
  }

  await fetchUserData();
}

export function authErrorExample() {
  async function protectedAction() {
    const response = await fetch('/api/protected');

    if (response.status === 401) {
      // Shows "Session expired" with Log In button
      toast.authError();
    }
  }

  protectedAction();
}

export function rateLimitExample() {
  async function apiCall() {
    const response = await fetch('/api/data');

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '30');
      // Shows countdown timer
      toast.rateLimitError(retryAfter);
    }
  }

  apiCall();
}

export function validationExample() {
  function validateForm(email: string, password: string) {
    if (!email) {
      toast.validationError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      toast.validationError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      toast.validationError('Password must be at least 8 characters');
      return false;
    }

    return true;
  }

  validateForm('invalid-email', 'short');
}

// ============================================================================
// ACTION BUTTON EXAMPLES
// ============================================================================

export function actionButtonExamples() {
  // Delete with undo
  let deletedMessage: any = null;

  function deleteMessage(messageId: string) {
    deletedMessage = { id: messageId, content: 'Hello world' };

    toast.warning('Message deleted', 5000, {
      label: 'Undo',
      callback: () => {
        // Restore message
        console.log('Restoring message:', deletedMessage);
        toast.success('Message restored');
      }
    });
  }

  // Save with retry
  async function saveDocument() {
    try {
      await fetch('/api/save', { method: 'POST' });
      toast.saved();
    } catch (error) {
      toast.error('Failed to save document', 7000, {
        label: 'Retry',
        callback: saveDocument
      });
    }
  }

  deleteMessage('msg-123');
}

// ============================================================================
// SUCCESS HELPERS EXAMPLES
// ============================================================================

export function successHelpersExamples() {
  // Message sent
  async function sendMessage() {
    await fetch('/api/message', { method: 'POST' });
    toast.messageSent(); // "Message sent successfully!"
  }

  // Profile updated
  async function updateProfile() {
    await fetch('/api/profile', { method: 'PUT' });
    toast.profileUpdated(); // "Profile updated successfully!"
  }

  // Copy to clipboard
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.copied(); // "Copied to clipboard!"
  }

  // Generic save
  async function saveChanges() {
    await fetch('/api/save', { method: 'POST' });
    toast.saved(); // "Changes saved!"
  }

  // Delete action
  async function deleteItem() {
    await fetch('/api/delete', { method: 'DELETE' });
    toast.deleted(); // "Deleted successfully!"
  }
}

// ============================================================================
// COMPLETE FORM SUBMISSION EXAMPLE
// ============================================================================

export async function formSubmissionExample() {
  interface FormData {
    email: string;
    name: string;
    bio: string;
  }

  async function handleSubmit(formData: FormData) {
    // Validation
    if (!formData.email) {
      toast.validationError('Email is required');
      return;
    }

    if (!formData.name) {
      toast.validationError('Name is required');
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      // Handle different error types
      if (response.status === 401) {
        toast.authError();
        return;
      }

      if (response.status === 403) {
        toast.permissionError();
        return;
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        toast.rateLimitError(retryAfter);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Success
      toast.profileUpdated();

    } catch (error) {
      console.error('Submission error:', error);

      // Determine error type
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        // Network error - offer retry
        toast.networkError(() => handleSubmit(formData));
      } else {
        // Generic error - offer retry
        toast.error('Failed to save profile. Please try again.', 7000, {
          label: 'Retry',
          callback: () => handleSubmit(formData)
        });
      }
    }
  }

  // Example usage
  await handleSubmit({
    email: 'user@example.com',
    name: 'John Doe',
    bio: 'Software developer'
  });
}

// ============================================================================
// CHAT MESSAGE SENDING EXAMPLE
// ============================================================================

export async function chatMessageExample() {
  let messageContent = '';

  async function sendChatMessage() {
    if (!messageContent.trim()) {
      toast.validationError('Message cannot be empty');
      return;
    }

    const originalContent = messageContent;
    messageContent = ''; // Clear input optimistically

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: originalContent })
      });

      if (response.status === 401) {
        messageContent = originalContent; // Restore input
        toast.authError();
        return;
      }

      if (response.status === 429) {
        messageContent = originalContent;
        toast.rateLimitError(30);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to send');
      }

      toast.messageSent();

    } catch (error) {
      messageContent = originalContent; // Restore input

      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.networkError(sendChatMessage);
      } else {
        toast.error('Failed to send message', 7000, {
          label: 'Retry',
          callback: sendChatMessage
        });
      }
    }
  }

  messageContent = 'Hello, world!';
  await sendChatMessage();
}

// ============================================================================
// FILE UPLOAD EXAMPLE
// ============================================================================

export async function fileUploadExample() {
  async function uploadFile(file: File) {
    // Validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.validationError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.validationError('Only JPEG, PNG, and GIF images are allowed');
      return;
    }

    // Upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.status === 413) {
        toast.error('File is too large. Maximum size is 10MB.');
        return;
      }

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      toast.success('File uploaded successfully!', 3000);
      return result;

    } catch (error) {
      if (error instanceof TypeError) {
        toast.networkError(() => uploadFile(file));
      } else {
        toast.error('Failed to upload file', 7000, {
          label: 'Retry',
          callback: () => uploadFile(file)
        });
      }
    }
  }

  // Example usage
  const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
  await uploadFile(mockFile);
}

// ============================================================================
// BULK OPERATIONS EXAMPLE
// ============================================================================

export async function bulkOperationExample() {
  async function deleteMultipleMessages(messageIds: string[]) {
    if (messageIds.length === 0) {
      toast.validationError('Please select at least one message');
      return;
    }

    const count = messageIds.length;
    const deletedMessages = [...messageIds]; // Backup for undo

    try {
      const response = await fetch('/api/messages/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: messageIds })
      });

      if (!response.ok) {
        throw new Error('Bulk delete failed');
      }

      toast.success(`${count} message${count > 1 ? 's' : ''} deleted`, 5000);

      // Offer undo for 5 seconds
      toast.warning('Undo available', 5000, {
        label: 'Undo',
        callback: async () => {
          await fetch('/api/messages/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: deletedMessages })
          });
          toast.success('Messages restored');
        }
      });

    } catch (error) {
      toast.error(`Failed to delete ${count} message${count > 1 ? 's' : ''}`, 7000, {
        label: 'Retry',
        callback: () => deleteMultipleMessages(deletedMessages)
      });
    }
  }

  await deleteMultipleMessages(['msg-1', 'msg-2', 'msg-3']);
}

// ============================================================================
// PROGRAMMATIC CONTROL EXAMPLE
// ============================================================================

export function programmaticControlExample() {
  // Show loading toast, then update it
  function longRunningOperation() {
    const loadingToastId = toast.info('Processing...', 0); // Persistent

    setTimeout(() => {
      // Remove loading toast
      toast.remove(loadingToastId);

      // Show success
      toast.success('Processing complete!');
    }, 3000);
  }

  // Clear all toasts
  function clearAllNotifications() {
    toast.clear();
    toast.info('All notifications cleared');
  }

  longRunningOperation();
}

// ============================================================================
// REAL-TIME UPDATES EXAMPLE
// ============================================================================

export function realTimeUpdatesExample() {
  // WebSocket connection status
  function handleWebSocketStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
    switch (status) {
      case 'connected':
        toast.success('Connected to server', 2000);
        break;

      case 'disconnected':
        toast.error('Connection lost. Attempting to reconnect...', 0); // Persistent
        break;

      case 'reconnecting':
        toast.info('Reconnecting...', 0); // Persistent
        break;
    }
  }

  // Simulate connection lifecycle
  handleWebSocketStatus('connected');
  setTimeout(() => handleWebSocketStatus('disconnected'), 2000);
  setTimeout(() => handleWebSocketStatus('reconnecting'), 3000);
  setTimeout(() => handleWebSocketStatus('connected'), 5000);
}
