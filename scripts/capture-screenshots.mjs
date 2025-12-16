/**
 * Capture screenshots of Nostr BBS for documentation
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './docs/screenshots';

// Ensure screenshot directory exists
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const pages = [
  { path: '/', name: 'homepage', title: 'Homepage' },
  { path: '/login', name: 'login', title: 'Login Page' },
  { path: '/signup', name: 'signup', title: 'Signup Page' },
  { path: '/setup', name: 'setup', title: 'Setup Wizard' },
  { path: '/chat', name: 'chat', title: 'Chat Sections' },
  { path: '/events', name: 'events', title: 'Events Calendar' },
];

async function captureScreenshots() {
  console.log('Launching browser on DISPLAY=' + (process.env.DISPLAY || ':1'));

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: 'dark'
  });

  const page = await context.newPage();

  console.log(`\nCapturing screenshots from ${BASE_URL}...\n`);

  for (const { path, name, title } of pages) {
    const url = `${BASE_URL}${path}`;
    console.log(`📸 Capturing ${title}: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000); // Wait for animations

      const screenshotPath = join(SCREENSHOT_DIR, `${name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`   ✅ Saved: ${screenshotPath}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Capture mobile view of homepage
  console.log('\n📱 Capturing mobile view...');
  await context.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    colorScheme: 'dark',
    isMobile: true
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: join(SCREENSHOT_DIR, 'homepage-mobile.png') });
  console.log(`   ✅ Saved: ${join(SCREENSHOT_DIR, 'homepage-mobile.png')}`);

  await browser.close();
  console.log('\n✨ Screenshot capture complete!\n');
}

captureScreenshots().catch(console.error);
