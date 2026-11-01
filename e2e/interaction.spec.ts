import { test, expect, type Page } from '@playwright/test'
import { clearReveals, parkMouse, settleReveals } from './helpers/table'

test('screen shake stays inside the viewport and stops for system reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  const stage = page.locator('[data-vfx-stage]')
  // Exercise the production animation subscription with a deliberately long,
  // exaggerated effect. This fixture tests geometry, not scoring or balance.
  const sample = await page.evaluate(async () => {
    const path = '/src/systems/VFXSystem.ts'
    const settingsPath = '/src/stores/settingsStore.ts'
    const { vfxSystem } = await import(path)
    const { useSettingsStore } = await import(settingsPath)
    useSettingsStore.setState({ reducedMotion: false })
    const control = document.querySelector<HTMLElement>(
      '[data-game-action="play"]'
    )!
    const node = document.querySelector('[data-vfx-stage]')!
    const frames: { x: number; width: number; viewport: number }[] = []
    vfxSystem.shake({ amplitude: 24, duration: 10000, frequency: 25, decay: 1 })
    for (let index = 0; index < 24; index++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      )
      frames.push({
        x: new DOMMatrix(getComputedStyle(node).transform).m41,
        width: document.documentElement.scrollWidth,
        viewport: innerWidth,
      })
    }
    return {
      frames,
      sameControl:
        control !== null &&
        control === document.querySelector('[data-game-action="play"]'),
    }
  })
  expect(sample.sameControl).toBe(true)
  expect(sample.frames.some((frame) => frame.x > 1)).toBe(true)
  expect(sample.frames.some((frame) => frame.x < -1)).toBe(true)
  expect(sample.frames.every((frame) => frame.width <= frame.viewport)).toBe(
    true
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(stage).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  const offsets = await page.evaluate(async () => {
    const path = '/src/systems/VFXSystem.ts'
    const { vfxSystem } = await import(path)
    vfxSystem.shake('yakuman')
    const result: string[] = []
    for (let index = 0; index < 12; index++) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve())
      )
      result.push(
        getComputedStyle(document.querySelector('[data-vfx-stage]')!).transform
      )
    }
    return result
  })
  expect(
    offsets.every((transform) => transform === 'matrix(1, 0, 0, 1, 0, 0)')
  ).toBe(true)
})

/** Open the Classic table and close the new run's Decree and Flora reveals. */
async function openClassicTable(page: Page) {
  await page.goto('/en/play')
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  await settleReveals(page, 2_000)
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`Classic rack and felt tiles remain individually tappable at ${viewport.width}×${viewport.height}`, async ({
    page,
    isMobile,
  }, testInfo) => {
    test.setTimeout(60000)
    await page.setViewportSize(viewport)
    await openClassicTable(page)
    // Starting bonus draws can expand the rack. Check every authoritative
    // physical tile, including Spring/Orchid extras, rather than only fourteen.
    const ids: string[] = await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('tensho-classic-run-v1')!)
      return saved.snapshot.state.handTiles.map(
        (tile: { id: string }) => tile.id
      )
    })
    expect(ids.length).toBeGreaterThanOrEqual(14)
    expect(new Set(ids).size).toBe(ids.length)
    await expect(
      page.locator('[data-play-zone="hand"] [data-play-tile]')
    ).toHaveCount(ids.length)
    const assertSeparated = async (zone: string) => {
      const rectangles = await page
        .locator(`[data-play-zone="${zone}"] [data-play-tile]`)
        .evaluateAll(async (tiles) => {
          // Measure where tiles land, not mid-flight between rack and felt.
          await Promise.all(
            tiles
              .flatMap((tile) => tile.getAnimations({ subtree: true }))
              .filter(
                (flight) =>
                  flight.effect?.getComputedTiming().endTime !== Infinity
              )
              .map((flight) => flight.finished.catch(() => undefined))
          )
          return tiles.map((tile) => {
            const rect = tile.getBoundingClientRect()
            return {
              x: rect.x,
              y: rect.y,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            }
          })
        })
      for (const [i, rect] of rectangles.entries()) {
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
        expect(rect.x).toBeGreaterThanOrEqual(0)
        expect(rect.right).toBeLessThanOrEqual(viewport.width)
        for (const other of rectangles.slice(i + 1)) {
          expect(
            rect.right <= other.x ||
              other.right <= rect.x ||
              rect.bottom <= other.y ||
              other.bottom <= rect.y
          ).toBe(true)
        }
      }
    }
    await assertSeparated('hand')
    const felt = page.locator('[data-play-zone="felt"] [data-play-tile]')
    for (const [index, id] of ids.entries()) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="${id}"]`
      )
      if (isMobile) await tile.tap()
      else {
        await tile.click()
        // Tiles fly and the board scrolls under a resting pointer; keep it
        // off the hover details of whatever lands beneath it.
        await parkMouse(page)
      }
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(
        page.locator(`[data-play-zone="felt"] [data-play-tile="${id}"]`)
      ).toHaveCount(1)
      await expect(felt).toHaveCount(index + 1)
    }
    await assertSeparated('felt')
    for (const id of ids) {
      const tile = page.locator(
        `[data-play-zone="felt"] [data-play-tile="${id}"]`
      )
      if (isMobile) await tile.tap()
      else {
        await tile.click()
        await parkMouse(page)
      }
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      ).toHaveCount(1)
    }
    await expect(felt).toHaveCount(0)
    await expect(page.locator('[data-game-action="play"]')).toBeDisabled()
    const action = await page.locator('[data-game-action="play"]').boundingBox()
    expect(action!.y).toBeGreaterThanOrEqual(0)
    expect(action!.y + action!.height).toBeLessThanOrEqual(viewport.height)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.locator('[data-gameplay-scroll]').evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    const lastTile = await page
      .locator('[data-play-zone="hand"] [data-play-tile]')
      .last()
      .boundingBox()
    const footer = await page
      .locator('[data-frame-corner-row="bottom"]')
      .boundingBox()
    expect(lastTile!.y + lastTile!.height).toBeLessThanOrEqual(footer!.y)
    await page.screenshot({
      path: testInfo.outputPath('wrapped-classic-rack.png'),
    })
  })
}

test('edge tile details stay inside a short viewport and never replace the selection click', async ({
  page,
  isMobile,
}) => {
  // Rack tiles show their details on mouse hover; touch has no hover.
  test.skip(isMobile, 'Tile details open on mouse hover')
  await page.setViewportSize({ width: 320, height: 568 })
  await openClassicTable(page)
  const ids = await page
    .locator('[data-play-zone="hand"] [data-play-tile]')
    .evaluateAll((tiles) =>
      tiles.map((tile) => tile.getAttribute('data-play-tile')!)
    )
  const details = page.locator('[data-tile-tooltip]')
  for (const id of [ids[0], ids[4]]) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    await tile.scrollIntoViewIfNeeded()
    const before = await tile.boundingBox()
    await page.mouse.move(0, 0)
    await tile.hover()
    await expect(details).toHaveCount(1)
    await expect(details).toBeVisible()
    const bounds = await details.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(11)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(309)
    expect(bounds!.y).toBeGreaterThanOrEqual(11)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(557)
    expect(
      await tile.evaluate((button) =>
        button.querySelector('[data-tile-tooltip]')
      )
    ).toBeNull()
    const after = await tile.boundingBox()
    expect(after!.width).toBe(before!.width)
    expect(after!.height).toBe(before!.height)
    await page.keyboard.press('Escape')
    await expect(details).toHaveCount(0)
    // The details never take the click: it still picks the tile.
    await tile.click()
    const picked = page.locator(
      `[data-play-zone="felt"] [data-play-tile="${id}"]`
    )
    await expect(picked).toHaveCount(1)
    await expect(tile).toHaveCount(0)
    await picked.click()
    await expect(tile).toHaveCount(1)
    await expect(picked).toHaveCount(0)
    await page.mouse.move(0, 0)
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})

test('a native media setter failure cannot swallow the first tile selection', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(
      HTMLMediaElement.prototype,
      'currentTime'
    )!
    let faults = 0
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get: original.get,
      set(value: number) {
        if ((this as HTMLMediaElement).src.endsWith('/tile_select.wav')) {
          document.documentElement.dataset.mediaSetterFaults = String(++faults)
          throw new DOMException(
            'Synthetic media-not-ready regression',
            'InvalidStateError'
          )
        }
        original.set!.call(this, value)
      },
    })
  })
  await openClassicTable(page)
  const id = await page
    .locator('[data-play-zone="hand"] [data-play-tile]')
    .first()
    .getAttribute('data-play-tile')
  await page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`).click()
  await expect(
    page.locator(`[data-play-zone="felt"] [data-play-tile="${id}"]`)
  ).toHaveCount(1)
  await expect(page.locator('html')).toHaveAttribute(
    'data-media-setter-faults',
    /[1-9]\d*/
  )
  expect(pageErrors).toEqual([])
})

test('the Psychic never forecasts a rejected three-tile play and offers a legal five-tile coach choice', async ({
  page,
}) => {
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  const ids = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const mandatePath = '/src/config/mandateDefinitions.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { THE_PSYCHIC } = await import(mandatePath)
    game.startNewRun(7)
    const state = game.getState()
    state.roundManager.getCurrentAct().rounds[2].bossMandate = THE_PSYCHIC
    // Controlled targets; both round clears and transitions are real.
    for (let i = 0; i < 2; i++) {
      state.targetScore = 1
      state.roundManager.getCurrentRound().scoreTarget = 1
      if (
        !game.processAction({
          type: 'play',
          tileIds: state.handTiles.slice(0, 2).map((t: { id: string }) => t.id),
        }).success ||
        !game.shop.open()
      )
        throw new Error('Fixture round failed')
      game.exitShop()
    }
    const selected = game
      .getHandTiles()
      .slice(0, 3)
      .map((tile: { id: string }) => tile.id)
    selected.forEach((id: string) => game.selectTile(id))
    return selected
  })
  // startNewRun queues its starting Decrees for a reveal over the table.
  await clearReveals(page)
  const play = page.locator('[data-game-action="play"]')
  const handScore = page.locator('[data-hand-score]')
  await expect(
    page.locator('[data-play-zone="felt"] [data-play-tile]')
  ).toHaveCount(3)
  await expect(play).toBeDisabled()
  await expect(page.locator('[data-action-reason]')).toHaveText(
    'Play exactly 5 tiles'
  )
  // No forecast for a play the Psychic rejects.
  await expect(handScore).toHaveAttribute('data-hand-score-state', 'empty')
  const result = await page.evaluate(async (selected: string[]) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const coachPath = '/src/gameplay/beginnerCoach.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { buildCoachAdvice } = await import(coachPath)
    const state = game.getState()
    const invalidPreview = game.previewScore(selected)
    const advice = buildCoachAdvice({
      tiles: state.handTiles,
      scoreSelection: (tileIds: string[]) =>
        game.previewScore(tileIds)?.finalScore ?? null,
      remainingToTarget: state.targetScore,
      handsRemaining: state.handsRemaining,
    })
    game.clearSelection()
    advice.best.tileIds.forEach((id: string) => game.selectTile(id))
    return {
      invalidPreview,
      count: advice.best.tileIds.length,
      turns: state.handsRemaining,
    }
  }, ids)
  expect({
    invalidPreview: result.invalidPreview,
    count: result.count,
  }).toEqual({ invalidPreview: null, count: 5 })
  await expect(handScore).toHaveAttribute('data-hand-score-state', 'preview')
  await expect(play).toBeEnabled()
  await play.click()
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return game.getState().handsRemaining
      })
    )
    .toBe(result.turns - 1)
  await expect(page.getByRole('alert')).toHaveCount(0)
})
