import { test, expect } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import ru from '../src/i18n/locales/ru.json' with { type: 'json' }
import ja from '../src/i18n/locales/ja.json' with { type: 'json' }

for (const fixture of [
  { language: 'es', text: es, width: 320, height: 740, font: 20 },
  { language: 'es', text: es, width: 320, height: 568, font: 16 },
  { language: 'ru', text: ru, width: 390, height: 844, font: 20 },
  { language: 'ja', text: ja, width: 1280, height: 800, font: 16 },
]) {
  test(`forecast and translated play controls fit ${fixture.language} ${fixture.width}×${fixture.height} at ${fixture.font}px`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const largeMultiplier = fixture.font === 20
    await page.setViewportSize(fixture)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${fixture.language}/play`)
    const play = page.locator('[data-game-action="play"]')
    await expect(play).toBeVisible()
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
    // Dismiss the optional hint through its actual control, not CSS or storage.
    await page
      .getByRole('button', { name: "Don't show tips", exact: true })
      .click()

    for (const rank of [4, 5, 6]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="forecast-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    const total = page.getByTestId('score-preview-total')
    const exact = new Intl.NumberFormat(fixture.language).format(45_000_000_000)
    const compact = new Intl.NumberFormat(fixture.language, {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(45_000_000_000)
    await expect(total).toHaveText(`+${compact}`)
    await expect(total).toHaveAttribute('aria-label', exact)
    const multiplier = new Intl.NumberFormat(fixture.language, {
      notation: largeMultiplier ? 'compact' : 'standard',
      minimumFractionDigits: largeMultiplier ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(largeMultiplier ? 1e9 : 1)
    await expect(page.locator('[data-score-preview-mult]')).toHaveText(
      multiplier
    )
    await expect(page.locator('[data-score-preview-mult]')).toHaveAttribute(
      'aria-label',
      new Intl.NumberFormat(fixture.language).format(largeMultiplier ? 1e9 : 1)
    )
    const area = page.locator('.game-play-area')
    await area.scrollIntoViewIfNeeded()
    await expect(async () => {
      const layout = await area.evaluate((node) => {
        const total = node.querySelector<HTMLElement>(
          '[data-testid="score-preview-total"]'
        )!
        const pace = node.querySelector<HTMLElement>('.game-forecast-pace')!
        const formula = node.querySelector('strong')!.parentElement!
        return {
          bounds: node.getBoundingClientRect().toJSON(),
          score: total.getBoundingClientRect().toJSON(),
          formula: formula.getBoundingClientRect().toJSON(),
          pace: pace.getBoundingClientRect().toJSON(),
          paceVisible: getComputedStyle(pace).display !== 'none',
          overflow: [node, total, formula, pace].some(
            (el) => el.scrollWidth > el.clientWidth + 1
          ),
          clipped: node.scrollHeight > node.clientHeight + 1,
        }
      })
      expect(layout.overflow).toBe(false)
      expect(layout.clipped).toBe(false)
      expect(layout.score.right).toBeLessThanOrEqual(layout.bounds.right)
      expect(layout.score.bottom).toBeLessThanOrEqual(layout.bounds.bottom)
      expect(layout.formula.right).toBeLessThanOrEqual(layout.score.left)
      if (layout.paceVisible) {
        expect(layout.pace.top).toBeGreaterThanOrEqual(
          Math.max(layout.score.bottom, layout.formula.bottom)
        )
        expect(layout.pace.bottom).toBeLessThanOrEqual(layout.bounds.bottom)
      }
    }).toPass({ timeout: 5000 })
    await expect(async () => {
      const panel = page.locator('.game-score-panel')
      expect(
        await panel.evaluate((node) => {
          const bounds = node.getBoundingClientRect()
          return Array.from(
            node.querySelectorAll<HTMLElement>(
              '[data-tutorial], [data-score-equation], [data-score-equation] span, .game-score-remaining'
            )
          ).every((el) => {
            if (getComputedStyle(el).display === 'none') return true
            const rect = el.getBoundingClientRect()
            return (
              el.scrollWidth <= el.clientWidth + 1 &&
              rect.left >= bounds.left &&
              rect.right <= bounds.right
            )
          })
        })
      ).toBe(true)
    }).toPass({ timeout: 5000 })
    await area.screenshot({ path: testInfo.outputPath('forecast.png') })
    const details = area.locator('[data-exact-score-details]')
    const summary = details.locator('summary')
    await expect(summary).toHaveText(fixture.text.scoring.exactValues)
    if (isMobile) await summary.tap()
    else {
      await summary.focus()
      await page.keyboard.press('Enter')
    }
    await expect(details).toHaveAttribute('open', '')
    await expect(
      details.getByText(exact, { exact: true }).first()
    ).toBeVisible()
    if (isMobile) await summary.tap()
    else await page.keyboard.press('Enter')
    await expect(details).not.toHaveAttribute('open', '')
    await expect(
      page.locator('[data-play-zone="staging"] [data-play-tile]')
    ).toHaveCount(3)
    await expect(total).toHaveText(`+${compact}`)

    // One translated label is used at every size, not an English mobile override.
    await expect(play).toContainText(
      fixture.text.gameplay.playCount.replace('{{count}}', '3')
    )
    for (const button of await page
      .locator('[data-frame-corner-row="bottom"] button')
      .all()) {
      expect(
        await button.evaluate((node) => ({
          fits: node.scrollWidth <= node.clientWidth + 1,
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
        }))
      ).toMatchObject({
        fits: true,
        width: expect.any(Number),
        height: expect.any(Number),
      })
      const bounds = await button.boundingBox()
      expect(bounds!.width).toBeGreaterThanOrEqual(44)
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
    }
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
    const panel = page.locator('.game-score-panel')
    await panel.scrollIntoViewIfNeeded()
    // Let the actual transient popup finish; do not mask it for screenshots.
    await expect(panel.locator('[data-score-popup]')).toHaveCount(0)
    await expect(page.locator('[data-tutorial="current-score"]')).toHaveText(
      compact
    )
    await expect(
      page.locator('[data-tutorial="current-score"]')
    ).toHaveAttribute('aria-label', exact)
    await expect(panel.locator('[data-score-mult]')).toHaveText(multiplier)
    const remaining = 1e15 - 45_000_000_000
    const remainingExact = new Intl.NumberFormat(fixture.language).format(
      remaining
    )
    const remainingCompact = new Intl.NumberFormat(fixture.language, {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(remaining)
    await expect(panel.locator('.game-score-remaining')).toHaveText(
      fixture.text.gameplay.pointsToClear.replace(
        '{{formattedCount}}',
        remainingCompact
      )
    )
    await expect(panel.locator('.game-score-remaining')).toHaveAttribute(
      'aria-label',
      fixture.text.gameplay.pointsToClear.replace(
        '{{formattedCount}}',
        remainingExact
      )
    )
    await expect(
      panel.getByRole('progressbar', { name: fixture.text.gameplay.score })
    ).toHaveAttribute(
      'aria-valuetext',
      `${fixture.text.gameplay.score}: ${exact}; ${fixture.text.gameplay.target}: ${new Intl.NumberFormat(fixture.language).format(1e15)}`
    )
    await expect(async () => {
      expect(
        await panel.evaluate((node) => {
          const bounds = node.getBoundingClientRect()
          return Array.from(
            node.querySelectorAll<HTMLElement>(
              '[data-score-equation] span, [data-tutorial]'
            )
          ).every((el) => {
            if (getComputedStyle(el).display === 'none') return true
            const rect = el.getBoundingClientRect()
            return (
              el.scrollWidth <= el.clientWidth + 1 &&
              rect.left >= bounds.left &&
              rect.right <= bounds.right
            )
          })
        })
      ).toBe(true)
    }).toPass({ timeout: 5000 })
    await panel.screenshot({ path: testInfo.outputPath('score-paid.png') })
    const paidDetails = panel.locator('[data-exact-score-details]')
    await paidDetails.locator('summary').click()
    await expect(
      paidDetails
        .locator('dl > div')
        .filter({
          has: page.getByText(fixture.text.gameplay.score, { exact: true }),
        })
        .locator('dd')
    ).toHaveText(exact)
  })
}
