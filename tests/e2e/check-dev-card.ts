import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take full page screenshot
  await page.screenshot({
    path: '/home/devuser/workspace/project/tests/e2e/screenshots/dev-fullpage.png',
    fullPage: true
  });

  // Check page content for dev mode
  const pageContent = await page.content();
  console.log('Has "Development Mode" in page:', pageContent.includes('Development Mode'));
  console.log('Has "Login as Admin" in page:', pageContent.includes('Login as Admin'));
  console.log('Has DEV_MODE variable:', pageContent.includes('DEV_MODE'));

  // Check if DEV is true in Vite
  const devCheck = await page.evaluate(() => {
    // @ts-ignore
    return typeof import.meta !== 'undefined' ? 'import.meta exists' : 'no import.meta';
  });
  console.log('Dev check:', devCheck);

  await browser.close();
})();
