import { test, expect, type Page } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }
import ja from '../src/i18n/locales/ja.json' with { type: 'json' }
import { clearReveals, handScoreTotal, openTable } from './helpers/table'

type Fixture = {
  language: string
  text: {
    gameplay: { playHand: string; score: string; scoreOfTarget: string }
  }
  width: number
  height: number
  font: number
}

/**
 * A late-run table at the fixture's size and root font, with a 4–5–6 picked
 * onto the felt that pays 45 billion: through the points (16px) or through
 * the Mult (20px).
 */
async function pickLateScore(page: Page, fixture: Fixture, isMobile: boolean) {
  const largeMultiplier = fixture.font === 20
  await page.setViewportSize(fixture)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openTable(page, `/${fixture.language}/play`)
  await page.evaluate(
    async ({ font, largeMultiplier }) => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      state.handTiles = [
        ...[4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, `forecast-${rank}`)
        ),
        ...Array.from(
          { length: 11 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `filler-${i}`)
        ),
      ]
      state.wall = Array.from(
        { length: 40 },
        (_, i) => new Tile(TileSuit.Manzu, (i % 9) + 1, `wall-${i}`)
      )
      state.drawIndex = 0
      state.targetScore = 1e15
      state.roundManager.getCurrentRound().scoreTarget = 1e15
      // Deliberate late-score geometry fixture, not a naturally acquired build.
      state.tableModifiers = {
        ...state.tableModifiers,
        baseScoreMultiplier: largeMultiplier ? 1 : 1e9,
      }
      if (largeMultiplier) {
        // Independently exercise the multiplier column, not a table bonus that
        // multiplies base points. Both fixture equations still pay 45 billion.
        state.decreeSystem.acquireDecree({
          id: 'geometry-multiplier',
          name: 'Geometry fixture',
          description: 'Controlled multiplier for layout verification',
          category: 'Scaling',
          rarity: 'RegionalMandate',
          cost: 0,
          effect: {
            type: 'multiplicative_score',
            trigger: 'Independent',
            description: 'Geometry fixture',
            multiplier: 1e9,
          },
        })
      }
      document.documentElement.style.fontSize = `${font}px`
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Forecast geometry fixture',
      })
    },
    { font: fixture.font, largeMultiplier }
  )
  // The fixture's new run and Season would be revealed over the table.
  await clearReveals(page)

  for (const rank of [4, 5, 6]) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="forecast-${rank}"]`
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  await expect(
    page.locator('[data-play-zone="felt"] [data-play-tile]')
  ).toHaveCount(3)
  return largeMultiplier
}

const fixtures: Fixture[] = [
  { language: 'es', text: es, width: 320, height: 740, font: 20 },
  { language: 'es', text: es, width: 320, height: 568, font: 16 },
  { language: 'ru', text: ru, width: 390, height: 844, font: 20 },
  { language: 'ja', text: ja, width: 1280, height: 800, font: 16 },
]

for (const fixture of fixtures) {
  const size = `${fixture.language} ${fixture.width}×${fixture.height} at ${fixture.font}px`
  test(`forecast and payment fit ${size}`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const largeMultiplier = await pickLateScore(page, fixture, isMobile)
    const play = page.locator('[data-game-action="play"]')
    const equation = await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.previewScore(['forecast-4', 'forecast-5', 'forecast-6'])
        .equation
    })
    expect(equation.total).toBe(45_000_000_000)
    // Large scores read compact, with the exact value on hover.
    const formatExact = new Intl.NumberFormat(fixture.language, {
      maximumFractionDigits: 3,
    }).format
    const formatCompact = (value: number) =>
      new Intl.NumberFormat(fixture.language, {
        notation: 'compact',
        maximumFractionDigits: 1,
      })
        .format(value)
        .replace(/[\u00a0\u202f]/g, ' ')
    const exact = formatExact(45_000_000_000)
    const compact = formatCompact(45_000_000_000)
    const handScore = page.locator('[data-hand-score]')
    const total = handScoreTotal(page, 'preview')
    await expect(total).toHaveText(compact)
    await expect(total).toHaveAttribute('title', exact)
    await expect(handScore.locator('[data-hand-score-points]')).toHaveText(
      equation.points >= 1_000_000
        ? formatCompact(equation.points)
        : formatExact(equation.points)
    )
    // The multiplier column reads like the points: compact from a million.
    expect(equation.multiplier).toBe(largeMultiplier ? 1e9 : 1)
    const shownMultiplier = largeMultiplier
      ? formatCompact(equation.multiplier)
      : formatExact(equation.multiplier)
    await expect(handScore.locator('[data-hand-score-mult]')).toHaveText(
      shownMultiplier
    )
    /** Everything inside `selector` that is clipped or sticks out of it. */
    const overflowing = (selector: string) =>
      page.locator(selector).evaluate((node) => {
        const bounds = node.getBoundingClientRect()
        return (
          Array.from(node.querySelectorAll<HTMLElement>('*'))
            .filter((el) => el.getClientRects().length > 0)
            .filter((el) => !el.closest('[aria-hidden="true"], canvas'))
            // Screen-reader-only text is a deliberately clipped 1px box.
            .filter((el) => el.getBoundingClientRect().width > 1)
            // Text styled to truncate with an ellipsis is meant to.
            .filter((el) => getComputedStyle(el).textOverflow !== 'ellipsis')
            .filter((el) => {
              const rect = el.getBoundingClientRect()
              return (
                el.scrollWidth > el.clientWidth + 1 ||
                rect.left < bounds.left - 1 ||
                rect.right > bounds.right + 1
              )
            })
            .map((el) => el.outerHTML.slice(0, 160))
        )
      })
    await handScore.scrollIntoViewIfNeeded()
    await expect.poll(() => overflowing('[data-hand-score]')).toEqual([])
    await handScore.screenshot({ path: testInfo.outputPath('forecast.png') })

    await play.click()
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return game.getState().score
        })
      )
      .toBe(45_000_000_000)
    const last = handScoreTotal(page, 'last')
    await expect(last).toHaveText(compact)
    await expect(last).toHaveAttribute('title', exact)
    await expect(handScore.locator('[data-hand-score-mult]')).toHaveText(
      shownMultiplier
    )
    // The run total and target sit in the header, compact with exact labels.
    const header = page.locator('[data-run-header]')
    const scoreOfTarget = fixture.text.gameplay.scoreOfTarget
      .replace('{{score}}', exact)
      .replace('{{target}}', formatExact(1e15))
    await expect(header.locator('[data-tutorial="current-score"]')).toHaveText(
      compact
    )
    // Past what compact units can name, the target reads 1E15.
    await expect(header.locator('[data-tutorial="score-target"]')).toHaveText(
      new Intl.NumberFormat(fixture.language, {
        notation: 'scientific',
        maximumFractionDigits: 1,
      }).format(1e15)
    )
    await expect(header.locator('[data-run-header-score]')).toHaveAttribute(
      'aria-label',
      scoreOfTarget
    )
    const progress = header.getByRole('progressbar', {
      name: fixture.text.gameplay.score,
      includeHidden: true,
    })
    await expect(progress).toHaveAttribute('aria-valuetext', scoreOfTarget)
    // Below 360px the redundant bar is hidden; the score line keeps the label.
    if (fixture.width < 360) await expect(progress).toBeHidden()
    else await expect(progress).toBeVisible()
    await expect.poll(() => overflowing('[data-hand-score]')).toEqual([])
    await expect.poll(() => overflowing('[data-run-header]')).toEqual([])
    await handScore.screenshot({ path: testInfo.outputPath('score-paid.png') })
    await header.screenshot({ path: testInfo.outputPath('header-paid.png') })
  })

  test(`translated play controls fit ${size}`, async ({ page, isMobile }) => {
    await pickLateScore(page, fixture, isMobile)
    const play = page.locator('[data-game-action="play"]')
    // One translated label is used at every size, not an English mobile override.
    await expect(play).toHaveText(fixture.text.gameplay.playHand)
    for (const button of await page
      .locator('[data-frame-corner-row="bottom"] button')
      .all()) {
      expect(
        await button.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      const bounds = await button.boundingBox()
      expect(bounds!.width).toBeGreaterThanOrEqual(44)
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
    }
  })
}
