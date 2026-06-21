import { test, expect } from '@playwright/test'

test.describe('Spire (NYTHIS Original)', () => {
  test('launches from hub, brand strip identifies as NYTHIS Original, HUB returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-spire')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Brand strip — class selector avoids strict-mode collision
    const brand = page.locator('.spire__brand')
    await expect(brand).toBeVisible({ timeout: 5_000 })
    await expect(brand).toContainText(/OBSIDIAN SPIRE/i)
    await expect(brand).toContainText(/NYTHIS ORIGINAL/i)

    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-spire')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Spire session:\n${errors.join('\n')}`).toEqual([])
  })

  test('ASCEND transitions to playing state with REWIND and SENSE charge counters visible', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-spire').click()
    await expect(page.locator('.spire-hud__title')).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: /^ASCEND$/i }).click()

    // Stats bar visible with both upgrade charge counters
    await expect(page.getByText(/^LEVEL$/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/^FRAGMENTS$/)).toBeVisible()
    await expect(page.getByText(/^TIME$/)).toBeVisible()
    // Upgrade 1: Rewind counter
    await expect(page.getByText(/^REWIND$/)).toBeVisible()
    // Upgrade 2: Sense counter
    await expect(page.getByText(/^SENSE$/)).toBeVisible()
  })

  test('canvas mounts inside Spire scene', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-spire').click()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
  })
})
