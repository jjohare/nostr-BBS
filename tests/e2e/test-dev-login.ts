/**
 * Test dev mode login buttons
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/home/devuser/workspace/project/tests/e2e/screenshots';

async function main() {
  console.log('Testing Dev Mode Login Buttons\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));

  try {
    // 1. Load home page
    console.log('1. Loading home page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-01-home.png` });

    // 2. Check for dev mode card
    console.log('2. Looking for dev mode card...');
    const devCard = page.locator('text=Development Mode');
    const hasDevCard = await devCard.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   Dev mode card visible: ${hasDevCard}`);

    if (hasDevCard) {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-02-devcard.png` });

      // 3. Click "Login as Admin"
      console.log('3. Clicking "Login as Admin"...');
      const adminBtn = page.locator('button:has-text("Login as Admin")');
      await adminBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-03-after-admin-login.png` });

      // 4. Check if we're on chat page (logged in)
      const currentUrl = page.url();
      console.log(`   Current URL: ${currentUrl}`);
      const loggedIn = currentUrl.includes('/chat') || await page.locator('text=Welcome back').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`   Logged in: ${loggedIn}`);

      if (loggedIn) {
        // 5. Explore the app as admin
        console.log('4. Exploring app as admin...');

        // Check for admin indicator
        const isAdmin = await page.locator('text=Administrator, text=Admin').first().isVisible({ timeout: 2000 }).catch(() => false);
        console.log(`   Admin indicator visible: ${isAdmin}`);

        // Navigate to forums
        await page.goto(`${BASE_URL}/forums`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-04-forums.png` });

        // Navigate to events
        await page.goto(`${BASE_URL}/events`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-05-events.png` });

        // Check settings
        await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-06-settings.png` });

        // Logout
        console.log('5. Testing logout...');
        const logoutBtn = page.locator('text=Logout, button:has-text("Logout")').first();
        if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutBtn.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-07-after-logout.png` });
        }
      }

      // 6. Test "Login as Test User"
      console.log('6. Testing "Login as Test User"...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const testUserBtn = page.locator('button:has-text("Login as Test User")');
      if (await testUserBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await testUserBtn.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/dev-08-test-user.png` });
        console.log(`   Test user login URL: ${page.url()}`);
      }
    } else {
      console.log('   Dev mode card not found - might not be in dev mode');
    }

  } finally {
    await browser.close();
  }

  // Report
  console.log('\n' + '='.repeat(50));
  console.log('DEV LOGIN TEST COMPLETE');
  console.log('='.repeat(50));

  const sidebarErrors = errors.filter(e => e.includes('sidebarExpanded') || e.includes('.set is not a function'));
  console.log(`\nSidebar errors (should be 0): ${sidebarErrors.length}`);

  const otherErrors = errors.filter(e =>
    !e.includes('ServiceWorker') &&
    !e.includes('NDK not initialized') &&
    !e.includes('sidebarExpanded') &&
    !e.includes('nosflare')
  );
  console.log(`Other significant errors: ${otherErrors.length}`);
  otherErrors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 80)}`));
}

main().catch(console.error);
