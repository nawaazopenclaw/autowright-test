/**
 * Autowright Multi-Bug E2E Test — books.toscrape.com
 *
 * 3-step scraping flow with 3 intentional bugs:
 *   Bug 1: Wrong selector for book title on listing page
 *   Bug 2: Wrong selector for "Add to basket" on detail page
 *   Bug 3: Wrong selector for availability text
 *
 * Each run hits one bug. Merge the fix PR, re-run, hit the next bug.
 * Three cycles to full healing.
 */

import { chromium } from '@autowright/browser';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    autowright: {
      scriptId: 'books-scraper',
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
    // ── Step 1: Homepage — get first book title ──────────────
    await page.goto('https://books.toscrape.com/', { timeout: 15000 });
    console.log('Homepage loaded');

    // BUG 1 fixed: use the actual anchor inside h3 within article.product_pod
    const bookTitle = await page.textContent('article.product_pod h3 a', { timeout: 5000 });
    console.log(`First book: ${bookTitle}`);

    // ── Step 2: Click into the book detail page ──────────────
    await page.click('article.product_pod h3 a', { timeout: 5000 });
    console.log('Navigated to book detail');

    // ── Step 3: Extract availability ─────────────────────────
    // Extract the book price from the detail page
    const price = await page.textContent('.price_color', { timeout: 5000 });
    console.log(`Price: ${price?.trim()}`);

    // Extract availability
    const availability = await page.textContent('.instock', { timeout: 5000 });
    console.log(`Availability: ${availability?.trim()}`);

    console.log('Scraper completed successfully!');
  } catch (err) {
    console.error('Scraper failed:', (err as Error).message);
    process.exitCode = 1;
  } finally {
    await page.close();
    await browser.close();
  }
}

main();
