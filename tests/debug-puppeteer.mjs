import puppeteer from 'puppeteer';

const APP_URL = 'https://jjohare.github.io/nostr-BBS/';

async function debugAdmin() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[Console ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[Page Error]:', err.message);
  });

  // Monitor network for relay traffic
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('relay') || url.includes('9021')) {
      console.log('[Response]:', url.slice(0, 100));
    }
  });

  console.log('Navigating to:', APP_URL);
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('Page title:', await page.title());

  // Wait for any loading to complete
  await new Promise(r => setTimeout(r, 5000));

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/01-home.png', fullPage: true });
  console.log('Screenshot saved: /tmp/01-home.png');

  // Check localStorage for auth data
  const authData = await page.evaluate(() => {
    return localStorage.getItem('nostr_bbs_keys');
  });
  console.log('Auth data:', authData ? 'Present' : 'Not present');
  if (authData) {
    const parsed = JSON.parse(authData);
    console.log('  PublicKey:', parsed.publicKey);
  }

  // Look for admin link
  const adminVisible = await page.evaluate(() => {
    const elements = document.querySelectorAll('a, button');
    for (const el of elements) {
      if (el.textContent?.toLowerCase().includes('admin')) {
        return el.outerHTML;
      }
    }
    return null;
  });
  console.log('Admin element:', adminVisible || 'Not found');

  // Try navigating to admin page directly
  console.log('Navigating to admin page...');
  await page.goto(APP_URL + 'admin', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: '/tmp/02-admin.png', fullPage: true });
  console.log('Screenshot saved: /tmp/02-admin.png');

  // Check what's on the page
  const pageContent = await page.evaluate(() => {
    return {
      title: document.title,
      bodyText: document.body?.innerText?.slice(0, 2000),
      hasRequests: document.body?.innerHTML?.includes('request'),
      hasPending: document.body?.innerHTML?.includes('pending'),
      hasJoin: document.body?.innerHTML?.includes('join'),
    };
  });
  console.log('Admin page info:', pageContent);

  // Check console for any relay errors
  console.log('Waiting 10 more seconds to observe...');
  await new Promise(r => setTimeout(r, 10000));

  await page.screenshot({ path: '/tmp/03-final.png', fullPage: true });
  console.log('Screenshot saved: /tmp/03-final.png');

  await browser.close();
  console.log('Done!');
}

debugAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
