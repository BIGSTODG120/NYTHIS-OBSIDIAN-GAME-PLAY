import { test, expect } from '@playwright/test'

test.describe('Stack', () => {
  test('launches from hub, brand strip confirms canonical Tetris scoring 40/100/300/1200, HUB returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-stack')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Brand strip uses class selector to avoid strict-mode collision.
    // Verifies canonical BPS/Nintendo NES scoring is encoded in copy.
    const brand = page.locator('.stack__brand')
    await expect(brand).toBeVisible({ timeout: 5_000 })
    await expect(brand).toContainText(/OBSIDIAN STACK/i)
    await expect(brand).toContainText(/SINGLE 40/i)
    await expect(brand).toContainText(/DOUBLE 100/i)
    await expect(brand).toContainText(/TRIPLE 300/i)
    await expect(brand).toContainText(/TETRIS 1200/i)

    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-stack')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Stack session:\n${errors.join('\n')}`).toEqual([])
  })

  test('START transitions to playing state with NEXT and HOLD panels visible', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-stack').click()
    await expect(page.locator('.stack-hud__title')).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: /^START$/i }).click()

    // Stats bar
    await expect(page.getByText(/^SCORE$/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/^LINES$/)).toBeVisible()
    await expect(page.getByText(/^LEVEL$/)).toBeVisible()
    await expect(page.getByText(/^HIGH$/)).toBeVisible()

    // NEXT and HOLD side panels (Upgrade 1 evidence — Hold buffer visible from start)
    await expect(page.getByText(/^NEXT$/)).toBeVisible()
    await expect(page.getByText(/^HOLD$/)).toBeVisible()
  })

  test('canvas mounts inside Stack scene', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-stack').click()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
  })
})
