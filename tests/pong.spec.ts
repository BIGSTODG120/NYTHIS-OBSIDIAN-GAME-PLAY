import { test, expect } from '@playwright/test'

test.describe('Pong', () => {
  test('launches from hub, brand strip confirms canonical WIN_SCORE=11, HUB button returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-pong')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Canonical scoring check: brand strip says "OBSIDIAN PONG - FIRST TO 11"
    // This verifies WIN_SCORE === 11 matches Atari 1972 standard.
    await expect(page.getByText(/OBSIDIAN PONG\s*-\s*FIRST TO 11/i)).toBeVisible({ timeout: 5_000 })

    // HUB button returns (works regardless of per-scene ESC wiring)
    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-pong')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Pong session:\n${errors.join('\n')}`).toEqual([])
  })

  test('canvas mounts inside Pong scene', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-pong').click()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })
})
