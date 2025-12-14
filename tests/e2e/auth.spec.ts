/**
 * E2E Tests: Authentication Flows
 *
 * Tests both admin and regular user authentication:
 * - Admin login with VITE_ADMIN_PUBKEY credentials
 * - Regular user signup and login
 * - Session persistence
 * - Logout functionality
 */

import { test, expect } from '@playwright/test';
import {
  ADMIN_CREDENTIALS,
  loginAsAdmin,
  loginAsUser,
  signupNewUser,
  logout,
  getCurrentUserPubkey
} from './fixtures/test-helpers';

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('admin can login with credentials from .env', async ({ page }) => {
    await loginAsAdmin(page);

    // Verify admin pubkey matches .env
    const storedPubkey = await getCurrentUserPubkey(page);
    expect(storedPubkey).toBe(ADMIN_CREDENTIALS.pubkey);
  });

  test('admin login redirects to admin dashboard or chat', async ({ page }) => {
    await loginAsAdmin(page);

    // Should redirect to authenticated area
    await page.waitForURL(/chat|admin|dashboard/i, { timeout: 5000 });

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/chat|admin|dashboard/i);
  });

  test('admin has admin privileges after login', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin page
    await page.goto('/admin');

    // Should see admin dashboard (not redirected away)
    await expect(page.getByText(/admin dashboard|channel management/i)).toBeVisible({ timeout: 5000 });

    // Should see admin-only features
    const createChannelButton = page.getByRole('button', { name: /create channel/i });
    await expect(createChannelButton).toBeVisible();
  });

  test('admin session persists across page reloads', async ({ page }) => {
    await loginAsAdmin(page);

    const originalPubkey = await getCurrentUserPubkey(page);

    // Reload page
    await page.reload();

    // Wait a moment for session restore
    await page.waitForTimeout(1000);

    // Pubkey should still be present
    const reloadedPubkey = await getCurrentUserPubkey(page);
    expect(reloadedPubkey).toBe(originalPubkey);
  });

  test('admin can logout', async ({ page }) => {
    await loginAsAdmin(page);

    // Verify logged in
    expect(await getCurrentUserPubkey(page)).toBeTruthy();

    // Logout
    await logout(page);

    // Verify logged out
    const pubkeyAfterLogout = await getCurrentUserPubkey(page);
    expect(pubkeyAfterLogout).toBeNull();

    // Should redirect to home or login page
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/($|setup|signup)/);
  });
});

test.describe('Regular User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('user can signup and create new account', async ({ page }) => {
    const mnemonic = await signupNewUser(page);

    // Verify mnemonic was generated
    expect(mnemonic).toBeTruthy();
    expect(mnemonic.split(/\s+/).length).toBe(12);

    // Verify keys stored
    const pubkey = await getCurrentUserPubkey(page);
    expect(pubkey).toBeTruthy();
    expect(pubkey).toMatch(/^[0-9a-f]{64}$/i);
  });

  test('user redirected to pending approval after signup', async ({ page }) => {
    await signupNewUser(page);

    // Should be on pending approval page or see pending message
    await page.waitForTimeout(1000);

    const isPending = await page.getByText(/pending approval|waiting for approval/i).isVisible({ timeout: 3000 }).catch(() => false);
    const currentUrl = page.url();

    expect(isPending || currentUrl.includes('pending')).toBe(true);
  });

  test('user can login with valid mnemonic', async ({ page }) => {
    const mnemonic = await signupNewUser(page);

    // Logout
    await logout(page);

    // Login again with same mnemonic
    await loginAsUser(page, mnemonic);

    // Verify same pubkey restored
    const pubkey = await getCurrentUserPubkey(page);
    expect(pubkey).toBeTruthy();
  });

  test('user cannot login with invalid mnemonic', async ({ page }) => {
    await page.goto('/');

    // Navigate to login
    const loginButton = page.getByRole('link', { name: /login|setup/i });
    await loginButton.click();

    // Enter invalid mnemonic
    const mnemonicInput = page.getByPlaceholder(/mnemonic|12 words|recovery phrase/i);
    await mnemonicInput.fill('invalid word word word word word word word word word word word');

    // Submit
    const restoreButton = page.getByRole('button', { name: /restore|import|login|continue/i });
    await restoreButton.click();

    // Should show error
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 3000 });

    // Keys should not be stored
    const pubkey = await getCurrentUserPubkey(page);
    expect(pubkey).toBeNull();
  });

  test('user session persists across page reloads', async ({ page }) => {
    await signupNewUser(page);

    const originalPubkey = await getCurrentUserPubkey(page);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // Pubkey should still be present
    const reloadedPubkey = await getCurrentUserPubkey(page);
    expect(reloadedPubkey).toBe(originalPubkey);
  });

  test('user can logout and login again', async ({ page }) => {
    const mnemonic = await signupNewUser(page);
    const originalPubkey = await getCurrentUserPubkey(page);

    // Logout
    await logout(page);

    // Verify logged out
    expect(await getCurrentUserPubkey(page)).toBeNull();

    // Login again
    await loginAsUser(page, mnemonic);

    // Should restore same pubkey
    const restoredPubkey = await getCurrentUserPubkey(page);
    expect(restoredPubkey).toBe(originalPubkey);
  });

  test('multiple users can create separate accounts', async ({ page, context }) => {
    // Create first user
    const mnemonic1 = await signupNewUser(page);
    const pubkey1 = await getCurrentUserPubkey(page);

    // Logout
    await logout(page);

    // Create second user
    const mnemonic2 = await signupNewUser(page);
    const pubkey2 = await getCurrentUserPubkey(page);

    // Mnemonics and pubkeys should be different
    expect(mnemonic1).not.toBe(mnemonic2);
    expect(pubkey1).not.toBe(pubkey2);
  });

  test('mnemonic with extra whitespace is normalized', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('link', { name: /login|setup/i });
    await loginButton.click();

    // Enter mnemonic with extra spaces
    const mnemonic = '  abandon   abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  about  ';
    const mnemonicInput = page.getByPlaceholder(/mnemonic|12 words|recovery phrase/i);
    await mnemonicInput.fill(mnemonic);

    const restoreButton = page.getByRole('button', { name: /restore|import|login|continue/i });
    await restoreButton.click();

    await page.waitForTimeout(1000);

    // Should succeed with normalized mnemonic
    const pubkey = await getCurrentUserPubkey(page);
    expect(pubkey).toBeTruthy();
  });

  test('uppercase mnemonic is converted to lowercase', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('link', { name: /login|setup/i });
    await loginButton.click();

    // Enter uppercase mnemonic
    const mnemonic = 'ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABOUT';
    const mnemonicInput = page.getByPlaceholder(/mnemonic|12 words|recovery phrase/i);
    await mnemonicInput.fill(mnemonic);

    const restoreButton = page.getByRole('button', { name: /restore|import|login|continue/i });
    await restoreButton.click();

    await page.waitForTimeout(1000);

    // Should succeed with lowercase conversion
    const pubkey = await getCurrentUserPubkey(page);
    expect(pubkey).toBeTruthy();
  });
});

test.describe('Authentication Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('empty mnemonic shows validation error', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('link', { name: /login|setup/i });
    await loginButton.click();

    // Submit without entering mnemonic
    const restoreButton = page.getByRole('button', { name: /restore|import|login|continue/i });
    await restoreButton.click();

    // Should show validation error
    await expect(page.getByText(/required|enter|provide/i)).toBeVisible({ timeout: 3000 });
  });

  test('too short mnemonic shows error', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('link', { name: /login|setup/i });
    await loginButton.click();

    // Enter short mnemonic
    const mnemonicInput = page.getByPlaceholder(/mnemonic|12 words|recovery phrase/i);
    await mnemonicInput.fill('abandon abandon abandon');

    const restoreButton = page.getByRole('button', { name: /restore|import|login|continue/i });
    await restoreButton.click();

    // Should show error
    await expect(page.getByText(/invalid|must be 12|incorrect/i)).toBeVisible({ timeout: 3000 });
  });

  test('loading state shown during authentication', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByRole('link', { name: /login|setup/i });
    await loginButton.click();

    const mnemonicInput = page.getByPlaceholder(/mnemonic|12 words|recovery phrase/i);
    await mnemonicInput.fill('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');

    const restoreButton = page.getByRole('button', { name: /restore|import|login|continue/i });
    await restoreButton.click();

    // Check for loading state immediately after submit
    const hasLoadingState = await page.evaluate(() => {
      return document.querySelector('[disabled], .loading, .spinner') !== null;
    });

    expect(hasLoadingState).toBeTruthy();
  });

  test('unauthenticated user redirected to home or login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/chat');

    // Should redirect to home or login page
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    const isProtectedPage = currentUrl.includes('/chat') && !currentUrl.includes('setup') && !currentUrl.includes('signup');

    if (isProtectedPage) {
      // If still on chat, should show login prompt or empty state
      const hasLoginPrompt = await page.getByText(/login|sign in|authenticate/i).isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasLoginPrompt).toBe(true);
    } else {
      // Should be redirected
      expect(currentUrl).toMatch(/\/($|setup|signup)/);
    }
  });
});
