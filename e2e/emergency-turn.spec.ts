import { test, expect, type Page } from '@playwright/test'
import { openTable, settleReveals } from './helpers/table'
import { chooseStake } from './helpers/stake'
import en from '../src/i18n/locales/en.json' with { type: 'json' }

/** Put the open table on the last Turn of an Act with the given Gold. */
async function lastTurn(page: Page, act: number, gold: number) {
  await page.evaluate(
    async ({ act, gold }) => {
      const gamePath = '/src/game/GameOrchestrator.ts',
        eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { eventBus } = await import(eventPath)
      const state = game.getState()
      // The Act starts through the round manager so the run stays a valid,
      // saveable state; only the Turn count and purse are set by hand. The
      // purchase itself is real.
      if (state.currentAct !== act) {
        state.roundManager.startAct(act)
        state.currentAct = act
        state.currentRound = 1
        state.targetScore = state.roundManager.getCurrentRound().scoreTarget
      }
      state.handsRemaining = 1
      // A free redraw keeps REDRAW in its slot; this is the plain last Turn.
      state.redrawsRemaining = 0
      const previousGold = state.gold
      state.gold = gold
      eventBus.emit('goldChanged', {
        previousGold,
        newGold: gold,
        delta: gold - previousGold,
        reason: 'fixture',
      })
    },
    { act, gold }
  )
}

const label = (cost: number) =>
  en.gameplay.emergencyTurn.label.replace('{{cost}}', String(cost))

test('White Stake never offers an emergency Turn', async ({ page }) => {
  await openTable(page, '/en/play')
  await settleReveals(page)
  await lastTurn(page, 3, 999)
  await expect(page.locator('[data-turns-left="1"]')).toBeVisible()
  await expect(page.locator('[data-emergency-turn]')).toHaveCount(0)
})

test('on Red Stake the last Turn can be extended with Gold from Act 2', async ({
  page,
  isMobile,
}, testInfo) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
  await chooseStake(page, 2)
  await openTable(page, '/en/play')
  await settleReveals(page)

  // Act 1: never offered, even with Gold to spare.
  await lastTurn(page, 1, 99)
  await expect(page.locator('[data-turns-left="1"]')).toBeVisible()
  await expect(page.locator('[data-emergency-turn]')).toHaveCount(0)

  await lastTurn(page, 2, 50)
  const buy = page.getByRole('button', { name: label(10) })
  await expect(buy).toBeVisible()
  await expect(buy).toBeEnabled()
  await expect(buy).toContainText(en.gameplay.emergencyTurn.buy)
  const box = (await buy.boundingBox())!
  const viewport = page.viewportSize()!
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  await page.screenshot({ path: testInfo.outputPath('emergency-turn.png') })

  // It takes REDRAW's slot (unusable on the last Turn), so the bar keeps its
  // height and no rack tile sits under it, even with a larger hand.
  await expect(page.locator('[data-game-action="redraw"]')).toHaveCount(0)
  const covered = await page.evaluate(() => {
    const offer = document
      .querySelector('[data-emergency-turn]')!
      .getBoundingClientRect()
    return [
      ...document.querySelectorAll('[data-play-zone="hand"] [data-play-tile]'),
    ].some((tile) => {
      const r = tile.getBoundingClientRect()
      return (
        r.left < offer.right &&
        r.right > offer.left &&
        r.top < offer.bottom &&
        r.bottom > offer.top
      )
    })
  })
  expect(covered).toBe(false)

  if (isMobile) await buy.tap()
  else await buy.click()
  await expect(page.locator('[data-turns-left="2"]')).toBeVisible()
  await expect(page.locator('[data-emergency-turn]')).toHaveCount(0)
  // REDRAW is back, and with two Turns it can be used again.
  await expect(page.locator('[data-game-action="redraw"]')).toBeVisible()
  // The run with a bought Turn saves cleanly: no invalid-save notice.
  await expect(page.getByRole('button', { name: en.menu.newRun })).toHaveCount(
    0
  )
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      const state = game.getState()
      return {
        gold: state.gold,
        bought: state.emergencyTurnsBoughtThisRound,
      }
    })
  ).toEqual({ gold: 40, bought: 1 })
})

test('a short purse still shows the price, disabled', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 })
  await chooseStake(page, 2)
  await openTable(page, '/en/play')
  await settleReveals(page)
  await lastTurn(page, 3, 4)
  const buy = page.getByRole('button', { name: label(15) })
  await expect(buy).toBeVisible()
  await expect(buy).toBeDisabled()
  await expect(page.locator('[data-turns-left="1"]')).toBeVisible()
})
