/**
 * Live Endpoint E2E Tests
 * Tests against https://dreamlab-ai.github.io/fairfield/
 */

import { test, expect, type Page } from '@playwright/test';

const LIVE_URL = 'https://dreamlab-ai.github.io/fairfield';
const ADMIN_MNEMONIC = 'glimpse marble confirm army sleep imitate lake balance home panic view brand';
const ADMIN_PUBKEY = '11ed64225dd5e2c5e18f61ad43d5ad9272d08739d3a20dd25886197b0738663c';

async function loginWithMnemonic(page: Page, mnemonic: string) {
  // Navigate to login page
  await page.goto(`${LIVE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Look for mnemonic/recovery option
  const recoveryButton = page.getByRole('button', { name: /recover|mnemonic|seed|import/i });
  if (await recoveryButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await recoveryButton.click();
  }

  // Find mnemonic input
  const mnemonicInput = page.locator('textarea, input[type="text"]').filter({ hasText: '' }).first();
  if (await mnemonicInput.isVisible({ timeout: 3000 })) {
    await mnemonicInput.fill(mnemonic);
  }

  // Submit
  const submitButton = page.getByRole('button', { name: /login|submit|continue|recover/i });
  if (await submitButton.isVisible({ timeout: 2000 })) {
    await submitButton.click();
  }

  await page.waitForLoadState('networkidle');
}

test.describe('Live Endpoint Tests', () => {
  test('site loads and shows login/signup options', async ({ page }) => {
    await page.goto(LIVE_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot of landing page
    await page.screenshot({ path: '/tmp/playwright-screenshots/01-landing.png', fullPage: true });

    // Should see Minimoonoir title or login options
    const hasTitle = await page.getByText(/minimoonoir/i).isVisible({ timeout: 5000 }).catch(() => false);
    const hasLogin = await page.getByRole('button', { name: /login|sign.*in/i }).isVisible({ timeout: 3000 }).catch(() => false);
    const hasSignup = await page.getByRole('button', { name: /sign.*up|create|register/i }).isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`Title visible: ${hasTitle}, Login: ${hasLogin}, Signup: ${hasSignup}`);
    expect(hasTitle || hasLogin || hasSignup).toBe(true);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto(`${LIVE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/tmp/playwright-screenshots/02-login-page.png', fullPage: true });

    // Check for login form elements
    const pageContent = await page.content();
    console.log('Login page has mnemonic option:', pageContent.includes('mnemonic') || pageContent.includes('seed') || pageContent.includes('recover'));
  });

  test('admin login with mnemonic', async ({ page }) => {
    await page.goto(`${LIVE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/tmp/playwright-screenshots/03-before-login.png', fullPage: true });

    // Try to login with mnemonic
    await loginWithMnemonic(page, ADMIN_MNEMONIC);

    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/playwright-screenshots/04-after-login.png', fullPage: true });

    // Check if logged in by looking for dashboard elements
    const loggedIn = !page.url().includes('/login');
    console.log(`After login URL: ${page.url()}, Logged in: ${loggedIn}`);
  });

  test('check chat page for nicknames and avatars', async ({ page }) => {
    // First login
    await loginWithMnemonic(page, ADMIN_MNEMONIC);
    await page.waitForTimeout(2000);

    // Navigate to chat
    await page.goto(`${LIVE_URL}/chat`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/playwright-screenshots/05-chat-page.png', fullPage: true });

    // Check for avatar elements
    const avatarElements = await page.locator('img[alt*="avatar"], .avatar, [class*="avatar"]').count();
    console.log(`Avatar elements found: ${avatarElements}`);

    // Check for nickname/display name elements
    const nicknameElements = await page.locator('[class*="name"], [class*="user"], .username, .display-name').count();
    console.log(`Nickname elements found: ${nicknameElements}`);

    // Check for user profile data
    const hasUserDisplay = await page.getByText(/\w+/).first().isVisible();
    console.log(`Has user display: ${hasUserDisplay}`);
  });

  test('check admin dashboard for pending requests', async ({ page }) => {
    // Login as admin
    await loginWithMnemonic(page, ADMIN_MNEMONIC);
    await page.waitForTimeout(2000);

    // Navigate to admin
    await page.goto(`${LIVE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/playwright-screenshots/06-admin-page.png', fullPage: true });

    // Check for pending requests section
    const hasPending = await page.getByText(/pending|request|approval/i).isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`Admin has pending requests section: ${hasPending}`);

    // Check for request count
    const requestCount = await page.locator('[class*="pending"], [class*="request"]').count();
    console.log(`Request elements found: ${requestCount}`);
  });

  test('inspect DOM for profile display issues', async ({ page }) => {
    await loginWithMnemonic(page, ADMIN_MNEMONIC);
    await page.waitForTimeout(2000);

    await page.goto(`${LIVE_URL}/chat`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Get all user-related elements
    const userElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="user"], [class*="profile"], [class*="avatar"], [class*="name"]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        className: el.className,
        innerText: el.textContent?.substring(0, 100)
      }));
    });

    console.log('User-related elements:', JSON.stringify(userElements, null, 2));

    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });
});
