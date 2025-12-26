import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Load with ?dev parameter
  console.log('Loading http://localhost:5173/?dev');
  await page.goto('http://localhost:5173/?dev', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot
  await page.screenshot({ path: 'tests/e2e/screenshots/dev-mode-test.png', fullPage: true });

  // Check for dev mode card
  const devCard = page.locator('text=Development Mode');
  const hasDevCard = await devCard.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Dev mode card visible:', hasDevCard);

  if (hasDevCard) {
    // Click Login as Admin
    console.log('Clicking Login as Admin...');
    const adminBtn = page.locator('button:has-text("Login as Admin")');
    await adminBtn.click();
    await page.waitForTimeout(3000);

    // Check URL
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'tests/e2e/screenshots/dev-after-admin-login.png' });

    // Check if logged in
    const loggedIn = page.url().includes('/chat');
    console.log('Logged in (redirected to /chat):', loggedIn);
  } else {
    console.log('Dev mode card NOT visible - checking page content');
    const content = await page.content();
    console.log('Has "Development" in page:', content.includes('Development'));
    console.log('Has "showDevMode" in page:', content.includes('showDevMode'));
  }

  await browser.close();
})();
