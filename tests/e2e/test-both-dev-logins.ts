import { chromium } from 'playwright';

const SCREENSHOT_DIR = '/home/devuser/workspace/project/tests/e2e/screenshots';

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  const errors: string[] = [];

  console.log('=== Testing Dev Mode Login Buttons ===\n');

  // Test 1: Login as Admin
  console.log('TEST 1: Login as Admin');
  const ctx1 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page1 = await ctx1.newPage();
  page1.on('console', msg => { if (msg.type() === 'error') errors.push(`[Admin] ${msg.text()}`); });

  await page1.goto('http://localhost:5173/?dev', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(1500);

  const adminBtn = page1.locator('button:has-text("Login as Admin")');
  if (await adminBtn.isVisible()) {
    await adminBtn.click();
    await page1.waitForTimeout(3000);
    console.log('  URL after login:', page1.url());
    console.log('  Success:', page1.url().includes('/chat'));
    await page1.screenshot({ path: `${SCREENSHOT_DIR}/final-admin-login.png` });

    // Explore as admin
    await page1.goto('http://localhost:5173/forums', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(1000);
    await page1.screenshot({ path: `${SCREENSHOT_DIR}/final-admin-forums.png` });

    await page1.goto('http://localhost:5173/events', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(1000);
    await page1.screenshot({ path: `${SCREENSHOT_DIR}/final-admin-events.png` });

    await page1.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' });
    await page1.waitForTimeout(1000);
    await page1.screenshot({ path: `${SCREENSHOT_DIR}/final-admin-settings.png` });
  }
  await ctx1.close();

  // Test 2: Login as Test User
  console.log('\nTEST 2: Login as Test User');
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page2 = await ctx2.newPage();
  page2.on('console', msg => { if (msg.type() === 'error') errors.push(`[TestUser] ${msg.text()}`); });

  await page2.goto('http://localhost:5173/?dev', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1500);

  const testUserBtn = page2.locator('button:has-text("Login as Test User")');
  if (await testUserBtn.isVisible()) {
    await testUserBtn.click();
    await page2.waitForTimeout(3000);
    console.log('  URL after login:', page2.url());
    console.log('  Success:', page2.url().includes('/chat'));
    await page2.screenshot({ path: `${SCREENSHOT_DIR}/final-testuser-login.png` });

    // Explore as test user
    await page2.goto('http://localhost:5173/forums', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(1000);
    await page2.screenshot({ path: `${SCREENSHOT_DIR}/final-testuser-forums.png` });

    await page2.goto('http://localhost:5173/messages', { waitUntil: 'networkidle' });
    await page2.waitForTimeout(1000);
    await page2.screenshot({ path: `${SCREENSHOT_DIR}/final-testuser-messages.png` });
  }
  await ctx2.close();

  await browser.close();

  // Report
  console.log('\n' + '='.repeat(50));
  console.log('FINAL TEST REPORT');
  console.log('='.repeat(50));

  const sidebarErrors = errors.filter(e => e.includes('sidebarExpanded') || e.includes('.set is not a function'));
  console.log(`\nSidebar errors: ${sidebarErrors.length}`);

  const significantErrors = errors.filter(e =>
    !e.includes('ServiceWorker') &&
    !e.includes('NDK not initialized') &&
    !e.includes('sidebarExpanded') &&
    !e.includes('nosflare')
  );
  console.log(`Significant errors: ${significantErrors.length}`);
  significantErrors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 100)}`));

  console.log(`\nTotal console errors: ${errors.length}`);
})();
