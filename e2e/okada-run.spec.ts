import { test, expect, type Page } from '@playwright/test';

const canvasSel = 'canvas[aria-label="Okada Run game"]';

// `data-lane` on the canvas mirrors the engine's target lane (0 = left, 1 = middle, 2 = right).
const lane = async (page: Page) => Number(await page.locator(canvasSel).getAttribute('data-lane'));

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'START' }).click();
  await expect(page.getByTestId('score')).toBeVisible();
  await expect.poll(() => lane(page)).toBe(1);
}

test('loads without console errors', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  await page.goto('/');
  await expect(page.locator(canvasSel)).toBeVisible();
  await expect(page.getByRole('button', { name: 'START' })).toBeVisible();
  await page.waitForTimeout(500);
  expect(problems).toEqual([]);
});

test('START moves from menu to the running canvas game', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /OKADA/ })).toBeVisible();
  await expect(page.getByTestId('score')).toHaveCount(0);

  await page.getByRole('button', { name: 'START' }).click();

  await expect(page.getByRole('button', { name: 'START' })).toHaveCount(0);
  await expect(page.getByTestId('score')).toBeVisible();
  const canvas = page.locator(canvasSel);
  const frame = () => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const first = await frame();
  await expect.poll(frame).not.toBe(first); // render loop is animating
});

test('keyboard A/D and arrow keys switch lanes (clamped to 3 lanes)', async ({ page }) => {
  await startGame(page);
  await page.keyboard.press('a');
  await expect.poll(() => lane(page)).toBe(0);
  await page.keyboard.press('ArrowLeft'); // clamped at the left edge
  await expect.poll(() => lane(page)).toBe(0);
  await page.keyboard.press('d');
  await expect.poll(() => lane(page)).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => lane(page)).toBe(2);
  await page.keyboard.press('D'); // clamped at the right edge
  await expect.poll(() => lane(page)).toBe(2);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => lane(page)).toBe(1);
});

test.describe('touch swipes', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  async function swipe(page: Page, dx: number) {
    const box = (await page.locator(canvasSel).boundingBox())!;
    const y = box.y + box.height * 0.7;
    const x0 = box.x + box.width / 2 - dx / 2;
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: string, x: number | null) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: x === null ? [] : [{ x, y }],
      });
    await touch('touchStart', x0);
    // One move past the 28px threshold = exactly one lane (the hook chains further moves).
    await touch('touchMove', x0 + dx);
    await touch('touchEnd', null);
    await cdp.detach();
  }

  test('swipe left and right change lanes', async ({ page }) => {
    await page.goto('/');
    // Tap START via touch.
    await page.getByRole('button', { name: 'START' }).tap();
    await expect(page.getByTestId('score')).toBeVisible();
    await expect.poll(() => lane(page)).toBe(1);

    await swipe(page, -60);
    await expect.poll(() => lane(page)).toBe(0);
    await swipe(page, 60);
    await expect.poll(() => lane(page)).toBe(1);
    await swipe(page, 60);
    await expect.poll(() => lane(page)).toBe(2);
  });
});
