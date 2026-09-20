import { test, expect, type Locator } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }

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
  expect(
    await target.evaluate((node) => {
      const r = node.getBoundingClientRect()
      return node.contains(
        document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
      )
    })
  ).toBe(true)
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
  test(`guidance leaves the score, tiles and play action usable (${fixture.language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(fixture)
    await page.emulateMedia({ reducedMotion: fixture.motion })
    await page.goto(`/${fixture.language}/play`)
    const play = page.locator('[data-game-action="play"]')
    await expect(play).toBeVisible()
    await page.evaluate(async (font) => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      game.startNewRun(7)
      document.documentElement.style.fontSize = `${font}px`
    }, fixture.font)
    const card = page.locator('[data-progressive-hint="guided-first-move-v2"]')
    await expect(card).toBeVisible()
    await noOverflow(card)
    // Inline geometry is invariant even while the user scrolls the game canvas.
    const layout = await card.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      return {
        position: getComputedStyle(node).position,
        scoreBottom: document
          .querySelector('.game-score-panel')!
          .getBoundingClientRect().bottom,
        playTop: document
          .querySelector('.game-play-area')!
          .getBoundingClientRect().top,
        hintTop: rect.top,
        hintBottom: rect.bottom,
        inCanvas: !!node.closest('[data-gameplay-scroll]'),
      }
    })
    expect(layout.inCanvas).toBe(true)
    expect(layout.position).toBe('static')
    expect(layout.hintTop).toBeGreaterThanOrEqual(layout.scoreBottom)
    expect(layout.hintBottom).toBeLessThanOrEqual(layout.playTop)

    const details = card.locator('details'),
      summary = card.locator('summary')
    if (isMobile) await summary.tap()
    else {
      await summary.focus()
      await page.keyboard.press('Enter')
    }
    await expect(details).not.toHaveAttribute('open')
    await expect(
      card.getByRole('button', { name: "Don't show tips" })
    ).toBeHidden()
    if (isMobile) await summary.tap()
    else await page.keyboard.press('Enter')
    await expect(details).toHaveAttribute('open')
    await card.screenshot({ path: testInfo.outputPath('hint-open.png') })
    await page.screenshot({ path: testInfo.outputPath('hint-in-game.png') })
    // No dismiss/opt-out is needed to play the actual highlighted recommendation.
    const highlighted = page.locator(
      '[data-play-zone="hand"] [data-beginner-highlighted="true"]'
    )
    const ids = await highlighted.evaluateAll((nodes) =>
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
      page.locator('[data-play-zone="staging"] [data-play-tile]')
    ).toHaveCount(ids.length)
    await assertHitTarget(play)
    await play.click()
    await expect(card).toHaveCount(0)
    const scoringHint = page.locator('[data-progressive-hint="yaku-intro"]')
    await expect(scoringHint).toBeAttached()
    const result = page.locator('[data-score-result]')
    await expect(result).toHaveText(expected!.toLocaleString(fixture.language))
    await expect(page.locator('[data-score-popup]')).toHaveCount(0)
    await assertHitTarget(result)
    await page
      .locator('.game-score-panel')
      .screenshot({ path: testInfo.outputPath('paid-with-hint.png') })

    // Opt-out persists across a real route reload; no test-written preferences.
    await scoringHint
      .getByRole('button', { name: "Don't show tips", exact: true })
      .click()
    await expect(page.locator('[data-progressive-hint]')).toHaveCount(0)
    await page.reload()
    await expect(play).toBeVisible()
    expect(
      await page.evaluate(() => localStorage.getItem('tensho_hints_disabled'))
    ).toBe('true')
    await expect(page.locator('[data-progressive-hint]')).toHaveCount(0)
  })
}

test('the shop hint occupies its own row and does not obstruct purchase or continue', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
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
  const card = page.locator('[data-progressive-hint="shop-intro"]')
  await expect(card).toBeVisible()
  await noOverflow(card)
  expect(await card.evaluate((node) => getComputedStyle(node).position)).toBe(
    'static'
  )
  await card.screenshot({ path: testInfo.outputPath('shop-hint.png') })
  const buy = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: /^Items/ }) })
    .getByRole('button')
    .first()
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
  const next = page.getByRole('button', {
    name: en.shop.ui.nextRound,
    exact: true,
  })
  await assertHitTarget(next)
  await next.click()
  await expect(page).toHaveURL(/\/en\/play$/)
})
