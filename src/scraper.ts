/**
 * Autowright Real-World E2E Test Scraper
 *
 * This script scrapes quotes from https://quotes.toscrape.com
 * It has an intentionally WRONG selector that will fail, triggering
 * the Autowright error capture → fixer → PR pipeline.
 *
 * The correct selector is '.quote .text' but we use '.quote-text'
 * which doesn't exist. The fixer should read the DOM artifact,
 * find the correct selector, and fix this file.
 */

import { chromium } from '@autowright/browser';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    autowright: {
      scriptId: 'quotes-scraper',
      serviceUrl: process.env.SERVICE_URL || 'http://localhost:4400',
      repoUrl: 'https://github.com/nawaazopenclaw/autowright-test',
      scriptPath: 'src/scraper.ts',
      branch: 'main',
      storage: process.env.STORAGE_ENDPOINT ? {
        provider: 's3' as const,
        endpoint: process.env.STORAGE_ENDPOINT,
        bucket: process.env.STORAGE_BUCKET || 'autowright-artifacts',
        accessKey: process.env.MINIO_ACCESS_KEY || 'autowright',
        secretKey: process.env.MINIO_SECRET_KEY || 'autowright-secret',
        forcePathStyle: true,
      } : undefined,
    },
  });

  const page = await browser.newPage();

  try {
    // Navigate to the quotes site
    await page.goto('https://quotes.toscrape.com/', { timeout: 15000 });
    console.log('Page loaded');

    // Get the page title
    const title = await page.title();
    console.log(`Title: ${title}`);

    // BUG: This selector is WRONG — the correct one is '.quote .text'
    // The fixer should read the DOM, find the right selector, and fix this
    const firstQuote = await page.textContent('.quote .text', { timeout: 5000 });
    console.log(`First quote: ${firstQuote}`);

    console.log('Scraper completed successfully');
  } catch (err) {
    console.error('Scraper failed:', (err as Error).message);
    process.exitCode = 1;
  } finally {
    await page.close();
    await browser.close();
  }
}

main();
