/**
 * E2E Tests: Section Access Workflows
 *
 * Tests the section (area) access control system:
 * - Viewing section previews and stats
 * - Requesting access to restricted sections
 * - Admin approval workflow
 * - Accessing sections after approval
 * - Section-based channel visibility
 */

import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  signupNewUser,
  loginAsUser,
  navigateToSection,
  requestSectionAccess,
  approvePendingRequest,
  getCurrentUserPubkey,
  logout
} from './fixtures/test-helpers';

test.describe('Section Preview and Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('unauthenticated user can see section cards on homepage', async ({ page }) => {
    await page.goto('/');

    // Should see all three sections
    await expect(page.getByText(/fairfield guests/i)).toBeVisible();
    await expect(page.getByText(/minimoonoir|minimoo noir/i)).toBeVisible();
    await expect(page.getByText(/dreamlab|dream lab/i)).toBeVisible();
  });

  test('authenticated user can view all section stats', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Should see stats for all sections
    const sectionCards = page.locator('.card, [data-section-card]');
    const count = await sectionCards.count();

    expect(count).toBeGreaterThanOrEqual(3);

    // Check for stat indicators (channels, members, activity)
    const hasStats = await page.getByText(/channels|members|activity/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasStats).toBe(true);
  });

  test('section cards show approval status badges', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Fairfield Guests should show as accessible (no approval needed)
    const fairfieldCard = page.locator('text=/fairfield guests/i').locator('..');

    // MiniMooNoir and DreamLab should show request access or pending
    const minimooCard = page.locator('text=/minimoonoir/i').locator('..');
    const dreamlabCard = page.locator('text=/dreamlab/i').locator('..');

    // Check for status indicators
    const hasRequestButton = await minimooCard.getByRole('button', { name: /request access/i }).isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRequestButton).toBe(true);
  });
});

test.describe('Fairfield Guests Section (Auto-Approved)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('new user has immediate access to Fairfield Guests', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Should see "Enter Section" button for Fairfield Guests
    const fairfieldCard = page.locator('text=/fairfield guests/i').locator('..');
    const enterButton = fairfieldCard.getByRole('button', { name: /enter|view/i });

    await expect(enterButton).toBeVisible({ timeout: 3000 });
  });

  test('user can enter Fairfield Guests without approval', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Click on Fairfield Guests section
    await navigateToSection(page, 'fairfield-guests');

    // Should see public channels
    await page.waitForTimeout(1000);

    // Should not see "request access" message
    const needsApproval = await page.getByText(/request access|pending approval/i).isVisible({ timeout: 2000 }).catch(() => false);
    expect(needsApproval).toBe(false);
  });

  test('Fairfield Guests channels are visible to all authenticated users', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Navigate to Fairfield Guests
    await navigateToSection(page, 'fairfield-guests');

    await page.waitForTimeout(1500);

    // Should see channel list or "no channels yet" message
    const hasChannels = await page.getByText(/channel|room|chat/i).count();
    const noChannels = await page.getByText(/no channels|create channel/i).isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasChannels > 0 || noChannels).toBe(true);
  });
});

test.describe('MiniMooNoir Section (Requires Approval)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('new user cannot access MiniMooNoir without approval', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // MiniMooNoir should show "Request Access" button
    const minimooCard = page.locator('text=/minimoonoir/i').locator('..');
    const requestButton = minimooCard.getByRole('button', { name: /request access/i });

    await expect(requestButton).toBeVisible({ timeout: 3000 });
  });

  test('user can request access to MiniMooNoir', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Click request access on MiniMooNoir card
    const minimooCard = page.locator('text=/minimoonoir/i').locator('..');
    const requestButton = minimooCard.getByRole('button', { name: /request access/i });
    await requestButton.click();

    // Should see confirmation or modal
    await page.waitForTimeout(1000);

    // Check for pending status
    const isPending = await page.getByText(/pending|request sent/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(isPending).toBe(true);
  });

  test('pending request shows pending badge', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Request access
    await requestSectionAccess(page, 'minimoonoir-rooms');

    // Reload to refresh state
    await page.reload();
    await page.waitForTimeout(1000);

    // Should show pending badge
    const pendingBadge = await page.getByText(/pending/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(pendingBadge).toBe(true);
  });

  test('user cannot request access multiple times', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Request access first time
    await requestSectionAccess(page, 'minimoonoir-rooms');

    // Try to request again
    await page.reload();
    await page.waitForTimeout(1000);

    // Request button should be disabled or replaced with "Pending"
    const canRequestAgain = await page.getByRole('button', { name: /^request access$/i }).isEnabled({ timeout: 2000 }).catch(() => false);

    expect(canRequestAgain).toBe(false);
  });
});

test.describe('DreamLab Section (Requires Approval)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('new user cannot access DreamLab without approval', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // DreamLab should show "Request Access" button
    const dreamlabCard = page.locator('text=/dreamlab/i').locator('..');
    const requestButton = dreamlabCard.getByRole('button', { name: /request access/i });

    await expect(requestButton).toBeVisible({ timeout: 3000 });
  });

  test('user can request access to DreamLab', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Request access
    const dreamlabCard = page.locator('text=/dreamlab/i').locator('..');
    const requestButton = dreamlabCard.getByRole('button', { name: /request access/i });
    await requestButton.click();

    await page.waitForTimeout(1000);

    // Check for confirmation
    const isPending = await page.getByText(/pending|request sent/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(isPending).toBe(true);
  });

  test('DreamLab request with optional message', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Click request button
    const dreamlabCard = page.locator('text=/dreamlab/i').locator('..');
    const requestButton = dreamlabCard.getByRole('button', { name: /request access/i });
    await requestButton.click();

    // Look for message input
    const messageInput = page.getByPlaceholder(/message|reason|note/i);

    if (await messageInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await messageInput.fill('I would like to join the creative projects');

      const submitButton = page.getByRole('button', { name: /send|submit|request/i });
      await submitButton.click();
    }

    await page.waitForTimeout(1000);

    // Should show pending status
    const isPending = await page.getByText(/pending/i).isVisible({ timeout: 2000 }).catch(() => false);
    expect(isPending).toBe(true);
  });
});

test.describe('Section Access After Approval', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('approved user can access MiniMooNoir channels', async ({ page, context }) => {
    // Create new user and request access
    await signupNewUser(page);
    const userPubkey = await getCurrentUserPubkey(page);

    await requestSectionAccess(page, 'minimoonoir-rooms');

    // Open admin in new tab
    const adminPage = await context.newPage();
    await adminPage.goto('/');
    await adminPage.evaluate(() => localStorage.clear());

    await loginAsAdmin(adminPage);

    // Approve request
    await approvePendingRequest(adminPage, userPubkey!);

    await adminPage.close();

    // Back to user page - reload to see approval
    await page.reload();
    await page.waitForTimeout(1500);

    // Should now see "Enter Section" instead of "Request Access"
    const minimooCard = page.locator('text=/minimoonoir/i').locator('..');
    const enterButton = minimooCard.getByRole('button', { name: /enter|view/i });

    await expect(enterButton).toBeVisible({ timeout: 3000 });
  });

  test('approved user can see public channels in section', async ({ page, context }) => {
    // Setup: Create user, request access, get approval
    await signupNewUser(page);
    const userPubkey = await getCurrentUserPubkey(page);

    await requestSectionAccess(page, 'minimoonoir-rooms');

    // Admin approves
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await approvePendingRequest(adminPage, userPubkey!);
    await adminPage.close();

    // User can now access
    await page.reload();
    await page.waitForTimeout(1500);

    await navigateToSection(page, 'minimoonoir-rooms');

    await page.waitForTimeout(1000);

    // Should see channels or "no channels" message
    const hasAccess = await page.getByText(/channel|room|no channels yet/i).isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasAccess).toBe(true);
  });

  test('approval persists across sessions', async ({ page, context }) => {
    // Get user approved
    const mnemonic = await signupNewUser(page);
    const userPubkey = await getCurrentUserPubkey(page);

    await requestSectionAccess(page, 'minimoonoir-rooms');

    // Admin approves
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await approvePendingRequest(adminPage, userPubkey!);
    await adminPage.close();

    // User logs out
    await logout(page);

    // User logs back in
    await loginAsUser(page, mnemonic);

    await page.goto('/chat');
    await page.waitForTimeout(1500);

    // Should still have access
    const minimooCard = page.locator('text=/minimoonoir/i').locator('..');
    const hasAccess = await minimooCard.getByRole('button', { name: /enter|view/i }).isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasAccess).toBe(true);
  });
});

test.describe('Multi-Section Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('user can request access to multiple sections', async ({ page }) => {
    await signupNewUser(page);

    await page.goto('/chat');

    // Request MiniMooNoir
    await requestSectionAccess(page, 'minimoonoir-rooms');

    await page.reload();
    await page.waitForTimeout(1000);

    // Request DreamLab
    await requestSectionAccess(page, 'dreamlab');

    await page.reload();
    await page.waitForTimeout(1000);

    // Both should show pending
    const pendingCount = await page.getByText(/pending/i).count();
    expect(pendingCount).toBeGreaterThanOrEqual(2);
  });

  test('approval for one section does not grant access to others', async ({ page, context }) => {
    // Create user and request multiple sections
    await signupNewUser(page);
    const userPubkey = await getCurrentUserPubkey(page);

    await requestSectionAccess(page, 'minimoonoir-rooms');
    await requestSectionAccess(page, 'dreamlab');

    // Admin approves only MiniMooNoir
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await approvePendingRequest(adminPage, userPubkey!);
    await adminPage.close();

    await page.reload();
    await page.waitForTimeout(1500);

    // MiniMooNoir should be accessible
    const minimooCard = page.locator('text=/minimoonoir/i').locator('..');
    const hasMinimooAccess = await minimooCard.getByRole('button', { name: /enter/i }).isVisible({ timeout: 2000 }).catch(() => false);

    // DreamLab should still be pending
    const dreamlabCard = page.locator('text=/dreamlab/i').locator('..');
    const dreamlabPending = await dreamlabCard.getByText(/pending/i).isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasMinimooAccess).toBe(true);
    expect(dreamlabPending).toBe(true);
  });
});
