import { test, expect } from '@playwright/test';

test('canvas renders and responds to input', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  const canvas = page.locator('canvas[aria-label="Okada Run game"]');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(100);
  expect(box!.height).toBeGreaterThan(100);

  // Start the game from the menu, then steer.
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('score')).toBeVisible();
  const size = () => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL().length);
  const before = await size();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  // Canvas pixels changed, so the render loop is alive and non-blank.
  expect(await size()).not.toBe(before);
  expect(errors).toEqual([]);
});
