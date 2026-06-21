import { test, expect } from '@playwright/test'

test.describe('Sweep', () => {
  test('launches from hub, menu shows STANDARD + DAILY SEED buttons, HUB returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-sweep')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Brand strip is unique: "OBSIDIAN SWEEP - 9 × 9 · 10 MINES" — verifies canonical board+mine count.
    const brand = page.locator('.sweep__brand')
    await expect(brand).toBeVisible({ timeout: 5_000 })
    await expect(brand).toContainText(/OBSIDIAN SWEEP/i)
    await expect(brand).toContainText(/9.*9/i)
    await expect(brand).toContainText(/10 MINES/i)
    await expect(page.getByRole('button', { name: /^STANDARD$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^DAILY SEED$/i })).toBeVisible()

    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-sweep')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Sweep session:\n${errors.join('\n')}`).toEqual([])
  })

  test('Daily Seed mode dismisses menu and shows DAILY YYYY-MM-DD badge in stats bar', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-sweep').click()
    await page.getByRole('button', { name: /^DAILY SEED$/i }).click()

    // After Step 1 patch: clicking DAILY SEED dismisses menu (state → 'playing') and shows stats bar.
    // DAILY badge format: "DAILY YYYY-MM-DD"
    await expect(page.getByText(/DAILY \d{4}-\d{2}-\d{2}/)).toBeVisible({ timeout: 5_000 })

    // Stats bar labels confirm full HUD render
    await expect(page.getByText(/^MINES$/)).toBeVisible()
    await expect(page.getByText(/^TIME$/)).toBeVisible()
    await expect(page.getByText(/^CHORDS$/)).toBeVisible()
    await expect(page.getByText(/^BEST$/)).toBeVisible()
  })

  test('R restart and D daily keyboard shortcuts are wired', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.getByTestId('game-card-sweep').click()
    await page.getByRole('button', { name: /^STANDARD$/i }).click()
    await page.waitForTimeout(300)
    await page.keyboard.press('r')
    await page.waitForTimeout(200)
    await page.keyboard.press('d')
    await page.waitForTimeout(300)

    // After D press: DAILY badge should be visible in stats bar
    await expect(page.getByText(/DAILY \d{4}-\d{2}-\d{2}/)).toBeVisible({ timeout: 5_000 })

    expect(errors, `Console errors during Sweep keyboard exercise:\n${errors.join('\n')}`).toEqual([])
  })
})


