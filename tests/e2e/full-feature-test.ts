/**
 * Full Feature Exploration Test
 * Completes login flow and explores all app features
 */

import { chromium, Page, BrowserContext } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const ADMIN_SEED = 'loyal bench cheap find pause draft various chief slide lunar sight useless';
const SCREENSHOT_DIR = '/home/devuser/workspace/project/tests/e2e/screenshots';

interface ConsoleLog {
  type: string;
  text: string;
}

const consoleLogs: ConsoleLog[] = [];

async function setupPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    consoleLogs.push({ type: 'pageerror', text: error.message });
  });

  return page;
}

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
  console.log(`  Screenshot: ${name}.png`);
}

async function loginAsAdmin(page: Page): Promise<boolean> {
  console.log('\n=== LOGIN AS ADMIN ===');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click Login button
    const loginBtn = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    await loginBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'admin-01-login-clicked');

    // Enter seed phrase in textarea
    const textarea = page.locator('textarea').first();
    await textarea.fill(ADMIN_SEED);
    await page.waitForTimeout(500);
    await screenshot(page, 'admin-02-seed-entered');

    // Click Restore Account
    const restoreBtn = page.locator('button:has-text("Restore Account")').first();
    await restoreBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, 'admin-03-after-restore');

    // Check if we're logged in (look for profile/logout/dashboard elements)
    const loggedIn = await page.locator('text=/logout|profile|dashboard|settings|home/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Login successful: ${loggedIn}`);

    return loggedIn;
  } catch (e) {
    console.error('  Login failed:', e);
    await screenshot(page, 'admin-error');
    return false;
  }
}

async function exploreNavigation(page: Page): Promise<void> {
  console.log('\n=== EXPLORING NAVIGATION ===');

  // Look for all navigation links
  const navLinks = await page.locator('nav a, [class*="sidebar"] a, [class*="menu"] a, header a').all();
  console.log(`  Found ${navLinks.length} navigation links`);

  for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
    try {
      const link = navLinks[i];
      const text = await link.textContent() || `link-${i}`;
      const href = await link.getAttribute('href') || '';
      console.log(`  Clicking: ${text.trim().substring(0, 30)} (${href})`);

      await link.click();
      await page.waitForTimeout(1500);
      await screenshot(page, `nav-${i}-${text.trim().replace(/[^a-z0-9]/gi, '-').substring(0, 20)}`);

      // Scroll the page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(500);
    } catch (e) {
      // Link might be removed or changed
    }
  }
}

async function exploreSections(page: Page): Promise<void> {
  console.log('\n=== EXPLORING SECTIONS ===');

  const sections = ['general', 'community', 'announcements', 'help', 'events', 'calendar', 'forums', 'channels'];

  for (const section of sections) {
    try {
      // Try direct navigation
      await page.goto(`${BASE_URL}/${section}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1000);

      const title = await page.title();
      console.log(`  Section /${section}: ${title}`);
      await screenshot(page, `section-${section}`);

      // Scroll to check content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
    } catch (e) {
      console.log(`  Section /${section}: not found or error`);
    }
  }
}

async function testCreateAccount(page: Page): Promise<boolean> {
  console.log('\n=== CREATE NEW ACCOUNT ===');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click Create Account
    const createBtn = page.locator('button:has-text("Create Account"), a:has-text("Create Account")').first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
      await createBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'newuser-01-create-clicked');

      // Look for generate or create button
      const generateBtn = page.locator('button:has-text(/generate|create|continue/i)').first();
      if (await generateBtn.isVisible({ timeout: 3000 })) {
        await generateBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, 'newuser-02-generated');

        // Check if recovery phrase is shown
        const hasRecovery = await page.locator('text=/recovery|backup|seed|phrase|words/i').first().isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  Recovery phrase shown: ${hasRecovery}`);

        if (hasRecovery) {
          await screenshot(page, 'newuser-03-recovery-shown');

          // Look for continue/confirm button
          const confirmBtn = page.locator('button:has-text(/continue|confirm|i.ve saved|done/i)').first();
          if (await confirmBtn.isVisible({ timeout: 3000 })) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
            await screenshot(page, 'newuser-04-confirmed');
          }
        }

        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('  Create account failed:', e);
    return false;
  }
}

async function testSettings(page: Page): Promise<void> {
  console.log('\n=== TESTING SETTINGS ===');

  try {
    // Navigate to settings
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings"), [href*="settings"]').first();
    if (await settingsLink.isVisible({ timeout: 3000 })) {
      await settingsLink.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'settings-01-page');

      // Look for settings tabs/sections
      const tabs = await page.locator('[role="tab"], [class*="tab"]').all();
      console.log(`  Found ${tabs.length} settings tabs`);

      for (let i = 0; i < Math.min(tabs.length, 5); i++) {
        try {
          await tabs[i].click();
          await page.waitForTimeout(1000);
          await screenshot(page, `settings-tab-${i}`);
        } catch (e) { }
      }
    } else {
      console.log('  Settings link not found');
    }
  } catch (e) {
    console.error('  Settings test failed:', e);
  }
}

async function testProfile(page: Page): Promise<void> {
  console.log('\n=== TESTING PROFILE ===');

  try {
    const profileLink = page.locator('a:has-text("Profile"), [href*="profile"], [class*="avatar"]').first();
    if (await profileLink.isVisible({ timeout: 3000 })) {
      await profileLink.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'profile-01-page');

      // Check for edit profile button
      const editBtn = page.locator('button:has-text(/edit|update/i)').first();
      if (await editBtn.isVisible({ timeout: 2000 })) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'profile-02-edit');
      }
    }
  } catch (e) {
    console.error('  Profile test failed:', e);
  }
}

async function testMessaging(page: Page): Promise<void> {
  console.log('\n=== TESTING MESSAGING ===');

  try {
    // Look for messaging/chat/DM section
    const msgLink = page.locator('a:has-text(/message|chat|dm|direct/i), [href*="message"], [href*="chat"]').first();
    if (await msgLink.isVisible({ timeout: 3000 })) {
      await msgLink.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'messaging-01-page');

      // Check for compose button
      const composeBtn = page.locator('button:has-text(/new|compose|write/i)').first();
      if (await composeBtn.isVisible({ timeout: 2000 })) {
        await composeBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'messaging-02-compose');
      }
    }
  } catch (e) {
    console.error('  Messaging test failed:', e);
  }
}

async function testForums(page: Page): Promise<void> {
  console.log('\n=== TESTING FORUMS/CHANNELS ===');

  try {
    // Try to find and click on a channel/forum
    const channelLink = page.locator('[class*="channel"], [class*="forum"], a:has-text(/general|community|chat/i)').first();
    if (await channelLink.isVisible({ timeout: 3000 })) {
      await channelLink.click();
      await page.waitForTimeout(1500);
      await screenshot(page, 'forum-01-channel');

      // Check for message input
      const msgInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], [contenteditable="true"]').first();
      if (await msgInput.isVisible({ timeout: 2000 })) {
        console.log('  Message input found');
        await screenshot(page, 'forum-02-input-found');
      }
    }
  } catch (e) {
    console.error('  Forums test failed:', e);
  }
}

async function checkResponsiveness(page: Page): Promise<void> {
  console.log('\n=== CHECKING RESPONSIVENESS ===');

  const viewports = [
    { width: 1920, height: 1080, name: 'desktop-full' },
    { width: 1366, height: 768, name: 'desktop-small' },
    { width: 768, height: 1024, name: 'tablet-portrait' },
    { width: 1024, height: 768, name: 'tablet-landscape' },
    { width: 375, height: 812, name: 'mobile-iphone' },
    { width: 360, height: 740, name: 'mobile-android' },
  ];

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);
    await screenshot(page, `responsive-${vp.name}`);
    console.log(`  ${vp.name}: ${vp.width}x${vp.height}`);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('FULL FEATURE EXPLORATION TEST');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Display: ${process.env.DISPLAY || ':1'}`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await setupPage(context);

  try {
    // Test 1: Login as Admin
    const adminLoggedIn = await loginAsAdmin(page);

    if (adminLoggedIn) {
      // Test 2: Explore navigation
      await exploreNavigation(page);

      // Test 3: Explore sections
      await exploreSections(page);

      // Test 4: Test settings
      await testSettings(page);

      // Test 5: Test profile
      await testProfile(page);

      // Test 6: Test messaging
      await testMessaging(page);

      // Test 7: Test forums
      await testForums(page);
    }

    // Test 8: Check responsiveness
    await checkResponsiveness(page);

    // Test 9: Create new account (in new context)
    const newContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const newPage = await setupPage(newContext);
    await testCreateAccount(newPage);
    await newContext.close();

  } finally {
    await browser.close();
  }

  // Report console errors
  console.log('\n' + '='.repeat(60));
  console.log('CONSOLE LOG SUMMARY');
  console.log('='.repeat(60));

  const errors = consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror');
  const warnings = consoleLogs.filter(l => l.type === 'warning');

  console.log(`\nErrors: ${errors.length}`);
  errors.slice(0, 10).forEach(e => console.log(`  [${e.type}] ${e.text.substring(0, 100)}`));

  console.log(`\nWarnings: ${warnings.length}`);
  warnings.slice(0, 5).forEach(w => console.log(`  [warn] ${w.text.substring(0, 100)}`));

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
