import { test, expect } from '@playwright/test'
import { collectCashOut } from './helpers/shop'
import { openTable, settleReveals } from './helpers/table'
import { chooseStake } from './helpers/stake'
import en from '../src/i18n/locales/en.json' with { type: 'json' }

test('the run header shows the Stake and opens its rules on tap', async ({
  page,
  isMobile,
}, testInfo) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
  await chooseStake(page, 2)
  await openTable(page, '/en/play')
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.getState().stake
    })
  ).toBe(2)

  const badge = page.getByRole('button', {
    name: `${en.stakes.red} · ${en.stakes.rulesTitle}`,
  })
  await expect(badge).toBeVisible()
  await expect(badge).toHaveText('2')
  const box = (await badge.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  // The header still fits beside it.
  expect(
    await page
      .locator('[data-run-header]')
      .evaluate((header) => header.scrollWidth <= header.clientWidth + 1)
  ).toBe(true)

  if (isMobile) await badge.tap()
  else await badge.click()
  const rules = page.getByRole('dialog', { name: en.stakes.red })
  await expect(rules).toBeVisible()
  await expect(rules).toContainText(en.stakes.rules.noSmallRoundReward)
  await expect(rules).toContainText(en.stakes.cumulative)
  const panel = (await rules.boundingBox())!
  const viewport = page.viewportSize()!
  expect(panel.x).toBeGreaterThanOrEqual(0)
  expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width + 1)
  await page.screenshot({ path: testInfo.outputPath('stake-rules.png') })
  await page.keyboard.press('Escape')
  await expect(rules).toBeHidden()
})

test('a Red Stake Small round says why it paid no clear reward', async ({
  page,
  isMobile,
}, testInfo) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await chooseStake(page, 2)
  await openTable(page, '/en/play')
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    // Only the target is lowered; the play and settlement are real.
    state.targetScore = 1
    state.roundManager.getCurrentRound().scoreTarget = 1
  })
  await settleReveals(page)
  const tiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
  for (const index of [0, 1]) {
    if (isMobile) await tiles.nth(index).tap()
    else await tiles.nth(index).click()
  }
  await page.locator('[data-game-action="play"]').click()
  await expect(page).toHaveURL(/\/en\/shop$/)

  const seen = await collectCashOut(page, {
    screenshot: testInfo.outputPath('red-stake-cash-out.png'),
  })
  const clear = seen.get('clear')!
  expect(clear.value).toBe(0)
  expect(clear.text).toContain(en.shop.roundCleared)
  expect(clear.text).toContain(
    en.shop.payout.stakeWithheld
      .replace('{{stake}}', en.stakes.red)
      .replace('{{amount}}', '3')
  )
  expect(clear.fits).toBe(true)
})
