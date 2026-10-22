import { test, expect, type Locator } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }
import { itemOffers, openOffer } from './helpers/shop'
import {
  clearReveals,
  handScoreTotal,
  openTable,
  parkMouse,
  settleReveals,
} from './helpers/table'

async function noOverflow(card: Locator) {
  expect(
    await card.evaluate((node) => {
      const bounds = node.getBoundingClientRect()
      return (
        bounds.left >= 0 &&
        bounds.right <= innerWidth &&
        Array.from(
          node.querySelectorAll<HTMLElement>('summary, p, button')
        ).every(
          (el) =>
            el.scrollWidth <= el.clientWidth + 1 &&
            el.getBoundingClientRect().right <= bounds.right
        )
      )
    })
  ).toBe(true)
  for (const button of await card.getByRole('button').all()) {
    const rect = await button.boundingBox()
    expect(rect!.height).toBeGreaterThanOrEqual(44)
    expect(rect!.width).toBeGreaterThanOrEqual(44)
  }
}

async function assertHitTarget(target: Locator) {
  await target.scrollIntoViewIfNeeded()
  await expect(target).toBeInViewport()
  // Moving away from a Decree closes its hover card after a short grace
  // period. Check reachability after that transition, not during its first
  // frame; a panel that stays over this control must still fail the test.
  await expect
    .poll(() =>
      target.evaluate((node) => {
        const r = node.getBoundingClientRect()
        return node.contains(
          document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
        )
      })
    )
    .toBe(true)
}

for (const fixture of [
  {
    language: 'en',
    width: 1280,
    height: 800,
    font: 16,
    motion: 'no-preference',
  },
  { language: 'es', width: 320, height: 568, font: 16, motion: 'reduce' },
  { language: 'ru', width: 390, height: 844, font: 20, motion: 'reduce' },
] as const) {
  test(`Hand Hints leave the score, tiles and play action usable (${fixture.language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const copy = { en, es, ru }[fixture.language]
    await page.setViewportSize(fixture)
    await page.emulateMedia({ reducedMotion: fixture.motion })
    await openTable(page, `/${fixture.language}/play`)
    const play = page.locator('[data-game-action="play"]')
    await page.evaluate(async (font) => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      game.startNewRun(7)
      document.documentElement.style.fontSize = `${font}px`
    }, fixture.font)
    // startNewRun queues its starting Decrees for a reveal over the table.
    await clearReveals(page)
    // The table's guidance is the rack itself: each group its tiles form is
    // bracketed and named, inside the screen, without covering a tile.
    const groups = page.locator(
      '[data-play-zone="hand"] [data-hand-group]:not([data-hand-group="loose"])'
    )
    await expect(groups.first()).toBeVisible()
    for (const group of await groups.all()) {
      await group.scrollIntoViewIfNeeded()
      expect(
        await group.evaluate((node) => {
          const bounds = node.getBoundingClientRect()
          const label = node.querySelector<HTMLElement>(
            '[data-hand-group-label]'
          )!
          return (
            bounds.left >= 0 &&
            bounds.right <= innerWidth &&
            label.scrollWidth <= label.clientWidth + 1
          )
        })
      ).toBe(true)
    }
    await page.screenshot({ path: testInfo.outputPath('hints-in-game.png') })
    // A hinted group can be picked and played as it stands.
    const ids = await groups
      .first()
      .locator('[data-play-tile]')
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-play-tile')!)
      )
    expect(ids.length).toBeGreaterThanOrEqual(2)
    const expected = await page.evaluate(async (ids) => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.previewScore(ids)?.finalScore
    }, ids)
    expect(expected).toBeGreaterThan(0)
    for (const id of ids) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="${id}"]`
      )
      await assertHitTarget(tile)
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    await expect(
      page.locator('[data-play-zone="felt"] [data-play-tile]')
    ).toHaveCount(ids.length)
    await assertHitTarget(play)
    await play.click()
    const result = handScoreTotal(page, 'last')
    await expect(result).toHaveText(expected!.toLocaleString(fixture.language))
    await assertHitTarget(result)
    await page
      .locator('[data-hand-score]')
      .screenshot({ path: testInfo.outputPath('paid-with-hints.png') })

    // Turning Hand Hints off in Settings persists across a real reload.
    await page.goto(`/${fixture.language}/settings`)
    const hints = page.getByRole('switch', {
      name: copy.settings.tileHints,
      exact: true,
    })
    await expect(hints).toHaveAttribute('aria-checked', 'true')
    await hints.click()
    await expect(hints).toHaveAttribute('aria-checked', 'false')
    await openTable(page, `/${fixture.language}/play`)
    await page.reload()
    await expect(play).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-settings')!).state
            .showTileHints
      )
    ).toBe(false)
    await expect(page.locator('[data-hand-group]')).toHaveCount(0)
  })
}

test('the shop hint opens on demand without obstructing purchase or continue', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openTable(page)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts',
      eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    // Presentation fixture: enter an ordinary shop with sufficient purchase funds.
    Object.assign(game.getState(), {
      phase: 'shop',
      lastCompletedRoundType: 'Small',
      gold: 50,
    })
    game.shop.open()
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await expect(page).toHaveURL(/\/en\/shop$/)
  // startNewRun queues its starting Decrees for a reveal over the shop.
  await clearReveals(page)
  const card = page.locator('[data-progressive-hint="shop-intro"]')
  await expect(card).toBeVisible()
  await expect(card.locator('details')).not.toHaveAttribute('open')
  await card.locator('summary').click()
  await expect(card.locator('details')).toHaveAttribute('open')
  await noOverflow(card)
  expect(await card.evaluate((node) => getComputedStyle(node).position)).toBe(
    'static'
  )
  await card.screenshot({ path: testInfo.outputPath('shop-hint.png') })
  const item = itemOffers(page).first()
  const offerId = (await item.getAttribute('data-shop-offer'))!
  await openOffer(page, offerId)
  const buy = page.locator(`[data-shop-buy="${offerId}"]`)
  await assertHitTarget(buy)
  const before = await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    return game.getState().gold
  })
  await buy.click()
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return game.getState().gold
      })
    )
    .toBeLessThan(before)
  // A bought Decree is revealed over the shop.
  await settleReveals(page)
  await parkMouse(page)
  const next = page.getByRole('button', {
    name: en.shop.ui.nextRound,
    exact: true,
  })
  await assertHitTarget(next)
  await next.click()
  await expect(page).toHaveURL(/\/en\/play$/)
})
