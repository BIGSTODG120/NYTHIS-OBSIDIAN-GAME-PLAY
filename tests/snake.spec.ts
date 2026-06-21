import { test, expect } from '@playwright/test'

test.describe('Snake', () => {
  test('launches from hub, menu shows wraparound toggle, HUB button returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-snake')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Snake menu signals — use .first() since OBSIDIAN SNAKE appears in both HUD title and brand strip
    await expect(page.getByText(/OBSIDIAN SNAKE/i).first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: /WRAPAROUND/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /CLASSIC/i })).toBeVisible()

    // Toggle exercise — store mutation path
    await page.getByRole('button', { name: /CLASSIC/i }).click()
    await page.waitForTimeout(150)
    await page.getByRole('button', { name: /WRAPAROUND/i }).click()
    await page.waitForTimeout(150)

    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-snake')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Snake session:\n${errors.join('\n')}`).toEqual([])
  })

  test('canvas mounts inside Snake scene', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('game-card-snake').click()
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
  })
})
