import { chromium } from 'playwright';

const SCREENSHOT_DIR = '/home/devuser/workspace/project/tests/e2e/screenshots';

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  const errors: string[] = [];

  console.log('=== Verifying Relay Connection Fix ===\n');

  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(text);
    }
    // Log relay-related messages
    if (text.toLowerCase().includes('relay') || text.toLowerCase().includes('connect') || text.toLowerCase().includes('ndk')) {
      console.log(`  [Console] ${text.substring(0, 120)}`);
    }
  });

  // 1. Login as admin via dev mode
  console.log('1. Loading app with dev mode...');
  await page.goto('http://localhost:5173/?dev', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('2. Clicking Login as Admin...');
  const adminBtn = page.locator('button:has-text("Login as Admin")');
  await adminBtn.click();
  await page.waitForTimeout(4000);

  const currentUrl = page.url();
  console.log(`  Current URL: ${currentUrl}`);

  if (currentUrl.includes('/chat')) {
    console.log('3. Successfully logged in! Checking relay connection...');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/relay-fix-chat.png` });

    // Wait for potential relay messages
    await page.waitForTimeout(3000);

    // Navigate to forums to trigger more relay activity
    console.log('4. Navigating to forums...');
    await page.goto('http://localhost:5173/forums', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/relay-fix-forums.png` });

    // Check for relay connection errors
    const relayErrors = errors.filter(e =>
      e.toLowerCase().includes('relay') ||
      e.toLowerCase().includes('websocket') ||
      e.toLowerCase().includes('connection')
    );

    console.log(`\n5. Relay-related errors: ${relayErrors.length}`);
    relayErrors.forEach(e => console.log(`  - ${e.substring(0, 100)}`));
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('RELAY FIX VERIFICATION COMPLETE');
  console.log('='.repeat(50));

  const nosflareErrors = errors.filter(e => e.includes('nosflare') || e.includes('404'));
  console.log(`\nNosflare/404 errors (should be 0): ${nosflareErrors.length}`);

  const connectionErrors = errors.filter(e =>
    (e.includes('WebSocket') || e.includes('connection')) &&
    !e.includes('ServiceWorker')
  );
  console.log(`Connection errors: ${connectionErrors.length}`);
  connectionErrors.slice(0, 3).forEach(e => console.log(`  - ${e.substring(0, 100)}`));

  console.log(`\nTotal errors: ${errors.length}`);
})();
