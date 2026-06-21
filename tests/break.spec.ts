import { test, expect } from '@playwright/test'

test.describe('Break', () => {
  test('launches from hub, scene mounts, HUB button returns to hub, no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    const card = page.getByTestId('game-card-break')
    await expect(card).toBeVisible({ timeout: 10_000 })
    await expect(card).toContainText('PLAY')

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Canvas confirms scene rendered
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })

    // HUB button is the canonical UX path on every scene
    await page.getByRole('button', { name: /HUB/i }).click()
    await expect(page.getByTestId('game-card-break')).toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(500)
    expect(errors, `Console errors during Break session:\n${errors.join('\n')}`).toEqual([])
  })

  test('ESC key returns to hub (BreakInput escJustPressed polled in useFrame)', async ({ page }) => {
    await page.goto('/')
    const card = page.getByTestId('game-card-break')
    await expect(card).toBeVisible({ timeout: 10_000 })

    await card.click()
    await expect(card).toBeHidden({ timeout: 5_000 })

    // Canvas must be focused for window-level keyboard listeners to reliably fire
    // under Playwright. The Break input handler attaches to window, but Playwright's
    // page.keyboard.press only routes to elements that have focus.
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 5_000 })
    await canvas.click() // Force focus onto the canvas/page

    // Give Break one frame to register before pressing ESC
    await page.waitForTimeout(120)

    // Press Escape — BreakInput's keydown listener sets keys["escape"] = true.
    // GameLoop.useFrame polls escJustPressed() and calls setActiveScene("hub").
    await page.keyboard.press('Escape')

    // ESC must return the hub within reasonable time (one or two useFrame ticks)
    await expect(page.getByTestId('game-card-break')).toBeVisible({ timeout: 5_000 })
  })
})
