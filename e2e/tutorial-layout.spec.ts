import { test, expect, type Locator } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }

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
    // From tablet width the tip floats over the board; phones keep it at the
    // top of the board's scroll so it cannot cover staged tiles. Either way
    // it sits below the score bar and never over the rack or the actions.
    // Short phones open the board on the hand, so the tip is a swipe away.
    if (fixture.width < 640) await card.scrollIntoViewIfNeeded()
    const layout = await card.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      return {
        position: getComputedStyle(node.closest('[data-hint-slot]')!).position,
        scoreBottom: document
          .querySelector('.game-score-panel')!
          .getBoundingClientRect().bottom,
        rackTop: document
          .querySelector('[data-play-zone="hand"]')!
          .getBoundingClientRect().top,
        hintTop: rect.top,
        hintBottom: rect.bottom,
        inSurface: !!node.closest('[data-gameplay-surface]'),
      }
    })
    expect(layout.inSurface).toBe(true)
    expect(layout.position).toBe(fixture.width >= 640 ? 'absolute' : 'static')
    expect(layout.hintTop).toBeGreaterThanOrEqual(layout.scoreBottom)
    if (fixture.width >= 640)
      expect(layout.hintBottom).toBeLessThanOrEqual(layout.rackTop + 1)
    else
      // Phones: in the board's scroll, so a tall tip can start beneath the
      // pinned rack, but each control scrolls clear of it and takes taps.
      for (const name of ['dontShow', 'gotIt'] as const)
        await assertHitTarget(
          card.getByRole('button', {
            name: { en, es, ru }[fixture.language].progressiveHints[name],
            exact: true,
          })
        )

    const details = card.locator('details'),
      summary = card.locator('summary')
    if (isMobile) await summary.tap()
    else {
      await summary.focus()
      await page.keyboard.press('Enter')
    }
    await expect(details).not.toHaveAttribute('open')
    await expect(
      card.getByRole('button', {
        name: { en, es, ru }[fixture.language].progressiveHints.dontShow,
      })
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
      .getByRole('button', {
        name: { en, es, ru }[fixture.language].progressiveHints.dontShow,
        exact: true,
      })
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

test('the shop hint opens on demand without obstructing purchase or continue', async ({
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
  await expect(card.locator('details')).not.toHaveAttribute('open')
  await card.locator('summary').click()
  await expect(card.locator('details')).toHaveAttribute('open')
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
