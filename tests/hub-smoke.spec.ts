import { test, expect } from '@playwright/test'

test('hub renders with 7 game cards, all LIVE', async ({ page }) => {
  await page.goto('/')
  const pongCard = page.getByTestId('game-card-pong')
  await expect(pongCard).toBeVisible({ timeout: 10_000 })

  for (const id of ['pong', 'snake', 'break', 'sweep', 'drift', 'stack', 'spire']) {
    await expect(page.getByTestId(`game-card-${id}`)).toBeVisible()
  }

  // All 7 LIVE — v2.0.0 baseline.
  for (const id of ['pong', 'snake', 'break', 'sweep', 'drift', 'stack', 'spire']) {
    const card = page.getByTestId(`game-card-${id}`)
    await expect(card).toContainText('PLAY')
  }
})

test('hub has no console errors on load', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')
  await expect(page.getByTestId('game-card-pong')).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(800)

  expect(errors, `Console errors at hub load:\n${errors.join('\n')}`).toEqual([])
})
