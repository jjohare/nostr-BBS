import { chromium } from 'playwright';

const APP_URL = 'https://jjohare.github.io/nostr-BBS/';

async function debugAdmin() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[Browser Error]:', err.message);
  });

  // Listen to network requests for join requests (kind 9021)
  page.on('request', req => {
    if (req.url().includes('relay') || req.postData()?.includes('9021')) {
      console.log('[Network Request]:', req.url(), req.postData()?.slice(0, 200));
    }
  });

  page.on('response', async res => {
    if (res.url().includes('relay')) {
      try {
        const text = await res.text();
        if (text.includes('9021') || text.includes('kind')) {
          console.log('[Network Response]:', res.url(), text.slice(0, 500));
        }
      } catch {}
    }
  });

  console.log('Navigating to:', APP_URL);
  await page.goto(APP_URL, { waitUntil: 'networkidle' });

  console.log('Page title:', await page.title());

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/playwright-screenshots/01-home.png', fullPage: true });
  console.log('Screenshot saved: 01-home.png');

  // Check localStorage for auth data
  const authData = await page.evaluate(() => {
    return localStorage.getItem('nostr_bbs_keys');
  });
  console.log('Auth data in localStorage:', authData ? 'Present' : 'Not present');
  if (authData) {
    const parsed = JSON.parse(authData);
    console.log('  PublicKey:', parsed.publicKey);
  }

  // Try to find admin link or button
  const adminLink = await page.locator('[href*="admin"], button:has-text("Admin"), a:has-text("Admin")').first();
  if (await adminLink.count() > 0) {
    console.log('Found admin link, clicking...');
    await adminLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/playwright-screenshots/02-admin.png', fullPage: true });
    console.log('Screenshot saved: 02-admin.png');
  } else {
    console.log('No admin link found on page');
  }

  // Check for any pending requests elements
  const pendingSection = await page.locator('text=/pending|request|join/i').all();
  console.log('Found', pendingSection.length, 'elements with pending/request/join text');

  // Get page content for debugging
  const html = await page.content();
  console.log('Page contains "pending":', html.toLowerCase().includes('pending'));
  console.log('Page contains "join":', html.toLowerCase().includes('join'));
  console.log('Page contains "9021":', html.includes('9021'));

  // Wait a bit to observe
  await page.waitForTimeout(5000);

  // Final screenshot
  await page.screenshot({ path: '/tmp/playwright-screenshots/03-final.png', fullPage: true });
  console.log('Screenshot saved: 03-final.png');

  await browser.close();
}

debugAdmin().catch(console.error);
