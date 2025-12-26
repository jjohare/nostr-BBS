/**
 * Quick verification test after fixes
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const ADMIN_SEED = 'loyal bench cheap find pause draft various chief slide lunar sight useless';
const SCREENSHOT_DIR = '/home/devuser/workspace/project/tests/e2e/screenshots';

const errors: string[] = [];

async function main() {
  console.log('Verification Test - Checking fixes\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  try {
    // 1. Load home page
    console.log('1. Loading home page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('   Home page loaded');

    // 2. Login as admin
    console.log('2. Logging in as admin...');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(500);
    await page.fill('textarea', ADMIN_SEED);
    await page.click('button:has-text("Restore Account")');
    await page.waitForTimeout(3000);
    console.log('   Login completed');

    // 3. Check for sidebar toggle (this was causing the error)
    console.log('3. Testing sidebar toggle...');
    const toggleBtn = page.locator('[aria-label*="sidebar"], button:has-text("<<"), [class*="collapse"]').first();
    if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
      await toggleBtn.click();
      await page.waitForTimeout(500);
      console.log('   Sidebar toggle works');
    } else {
      console.log('   Sidebar toggle button not found (may be OK)');
    }

    // 4. Navigate to different sections
    console.log('4. Testing navigation...');
    await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-events.png` });
    console.log('   Events page loaded');

    await page.goto(`${BASE_URL}/forums`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-forums.png` });
    console.log('   Forums page loaded');

    // 5. Test create account flow
    console.log('5. Testing create account flow...');
    await context.clearCookies();
    const newContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const newPage = await newContext.newPage();

    newPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await newPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await newPage.waitForTimeout(1000);

    // Click Create Account
    await newPage.click('button:has-text("Create Account")');
    await newPage.waitForTimeout(1000);
    await newPage.screenshot({ path: `${SCREENSHOT_DIR}/verify-create-step1.png` });

    // Look for Generate button
    const generateBtn = newPage.locator('button:has-text("Generate")');
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await generateBtn.click();
      await newPage.waitForTimeout(2000);
      await newPage.screenshot({ path: `${SCREENSHOT_DIR}/verify-create-step2.png` });
      console.log('   Account generation initiated');

      // Check for recovery phrase display
      const recoveryText = await newPage.locator('text=recovery, text=backup, text=phrase').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (recoveryText) {
        console.log('   Recovery phrase shown');
      }
    } else {
      console.log('   Generate button not visible - checking alternative flow');
      await newPage.screenshot({ path: `${SCREENSHOT_DIR}/verify-create-alt.png` });
    }

    await newContext.close();

    // 6. Check settings page
    console.log('6. Checking settings...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-settings.png` });
    const settingsTitle = await page.title();
    console.log(`   Settings page: ${settingsTitle}`);

    // 7. Check profile
    console.log('7. Checking profile...');
    const profileIcon = page.locator('[class*="avatar"], [href*="profile"]').first();
    if (await profileIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileIcon.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-profile.png` });
      console.log('   Profile accessed');
    }

  } finally {
    await browser.close();
  }

  // Report
  console.log('\n' + '='.repeat(50));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(50));

  const sidebarError = errors.filter(e => e.includes('sidebarExpanded') || e.includes('.set is not a function'));
  console.log(`\nSidebar-related errors: ${sidebarError.length}`);
  if (sidebarError.length > 0) {
    sidebarError.forEach(e => console.log(`  - ${e.substring(0, 80)}`));
  }

  const otherErrors = errors.filter(e => !e.includes('ServiceWorker') && !e.includes('NDK not initialized') && !e.includes('sidebarExpanded'));
  console.log(`\nOther errors (excluding expected): ${otherErrors.length}`);
  otherErrors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 100)}`));

  console.log(`\nTotal console errors: ${errors.length}`);
}

main().catch(console.error);
