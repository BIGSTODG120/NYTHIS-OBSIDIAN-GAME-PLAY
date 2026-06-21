import { test, expect } from '@playwright/test'

test.describe('Drift', () => {
  test('launches from hub, brand strip confirms canonical scoring 20/50/100/+10K, HUB returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-drift')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Brand strip is unique and encodes canonical Atari 1979 scoring:
    // "OBSIDIAN DRIFT - ASTEROID FIELD · LARGE 20 / MED 50 / SMALL 100 / +LIFE 10K"
    const brand = page.locator('.drift__brand')
    await expect(brand).toBeVisible({ timeout: 5_000 })
    await expect(brand).toContainText(/LARGE 20/i)
    await expect(brand).toContainText(/MED 50/i)
    await expect(brand).toContainText(/SMALL 100/i)
    await expect(brand).toContainText(/\+LIFE 10K/i)

    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-drift')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Drift session:\n${errors.join('\n')}`).toEqual([])
  })

  test('START button transitions to playing state (stats bar visible)', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-drift').click()

    // Use HUD title via class selector (avoids brand-strip strict-mode collision)
    await expect(page.locator('.drift-hud__title')).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: /^START$/i }).click()

    // After START: stats bar shows SCORE / LIVES / WAVE / HIGH
    await expect(page.getByText(/^SCORE$/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/^LIVES$/)).toBeVisible()
    await expect(page.getByText(/^WAVE$/)).toBeVisible()
    await expect(page.getByText(/^HIGH$/)).toBeVisible()
  })

  test('canvas mounts inside Drift scene', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-drift').click()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
  })
})
