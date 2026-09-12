import { test, expect, type Page } from '@playwright/test'

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

async function startTableLoop(page: Page) {
  await page.goto('/en/table-loop?seed=7')
  await page.locator('[data-testid^="table-decree-"]').first().click()
  await expect(page.getByTestId('table-loop-rack')).toBeVisible()
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`Classic rack and staged tiles remain individually tappable at ${viewport.width}×${viewport.height}`, async ({
    page,
    isMobile,
  }, testInfo) => {
    test.setTimeout(60000)
    await page.setViewportSize(viewport)
    await page.goto('/en/play')
    await expect(
      page.locator('[data-play-zone="hand"] [data-play-tile]')
    ).toHaveCount(14)
    const ids = await page
      .locator('[data-play-zone="hand"] [data-play-tile]')
      .evaluateAll((tiles) =>
        tiles.map((tile) => tile.getAttribute('data-play-tile')!)
      )
    const assertSeparated = async (zone: string) => {
      const rectangles = await page
        .locator(`[data-play-zone="${zone}"] [data-play-tile]`)
        .evaluateAll((tiles) =>
          tiles.map((tile) => {
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
        )
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
    for (const [index, id] of ids.entries()) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="${id}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(
        page.locator(`[data-play-zone="staging"] [data-play-tile="${id}"]`)
      ).toHaveCount(1)
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(index + 1)
    }
    await assertSeparated('staging')
    for (const id of ids) {
      const tile = page.locator(
        `[data-play-zone="staging"] [data-play-tile="${id}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      ).toHaveCount(1)
    }
    await expect(
      page.locator('[data-play-zone="staging"] [data-play-tile]')
    ).toHaveCount(0)
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

test('Classic pointer dragging uses the rendered zones and ignores an outside drop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/en/play')
  const hand = page.locator('[data-play-zone="hand"]')
  const staging = page.locator('[data-play-zone="staging"]')
  const id = await hand
    .locator('[data-play-tile]')
    .first()
    .getAttribute('data-play-tile')
  const tile = page.locator(`[data-play-tile="${id}"]`)
  await tile.dragTo(staging, { targetPosition: { x: 15, y: 15 } })
  await expect(staging.locator(`[data-play-tile="${id}"]`)).toHaveCount(1)
  await tile.dragTo(page.locator('[data-table-content]'), {
    targetPosition: { x: 0, y: 0 },
  })
  await expect(staging.locator(`[data-play-tile="${id}"]`)).toHaveCount(1)
  await tile.dragTo(hand, { targetPosition: { x: 15, y: 15 } })
  await expect(hand.locator(`[data-play-tile="${id}"]`)).toHaveCount(1)
  await expect(staging.locator('[data-play-tile]')).toHaveCount(0)
})

test('edge tile details stay inside a short viewport and never replace the selection click', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await startTableLoop(page)
  const tiles = page.locator('[data-testid^="rack-tile-"]')
  for (const tile of [tiles.first(), tiles.nth(4)]) {
    await tile.scrollIntoViewIfNeeded()
    const before = await tile.boundingBox()
    await tile.focus()
    const id = await tile.getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    const tooltip = page.locator(`[id="${id}"]`)
    await expect(tooltip).toBeVisible()
    await expect(page.locator('[data-tile-tooltip]')).toHaveCount(1)
    const bounds = await tooltip.boundingBox()
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
    await tile.click()
    await expect(tile).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    try {
      await expect(page.locator('[data-tile-tooltip]')).toHaveCount(0)
    } catch (error) {
      const diagnostic = JSON.stringify(
        await page.evaluate(() => ({
          focused: document.activeElement?.outerHTML,
          tooltips: [...document.querySelectorAll('[data-tile-tooltip]')].map(
            (node) => ({ id: node.id, text: node.textContent })
          ),
        }))
      )
      console.info('tooltip-escape-ownership', diagnostic)
      await testInfo.attach('tooltip-escape-ownership', {
        body: diagnostic,
        contentType: 'application/json',
      })
      throw error
    }
    await page.mouse.move(0, 0)
    await tile.hover()
    await expect(page.locator('[data-tile-tooltip]')).toHaveCount(0)
    await tile.click()
    await expect(tile).toHaveAttribute('aria-pressed', 'false')
    await tile.evaluate((button: HTMLElement) => button.blur())
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
  await startTableLoop(page)
  const tile = page.locator('[data-testid^="rack-tile-"]').first()
  await tile.click()
  await expect(tile).toHaveAttribute('aria-pressed', 'true')
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
    game.processAction({ type: 'skip' })
    game.getState().roundManager.getCurrentAct().rounds[2].bossMandate =
      THE_PSYCHIC
    game.processAction({ type: 'skip' })
    const selected = game
      .getHandTiles()
      .slice(0, 3)
      .map((tile: { id: string }) => tile.id)
    selected.forEach((id: string) => game.selectTile(id))
    return selected
  })
  const play = page.locator('[data-game-action="play"]')
  await expect(play).toBeDisabled()
  await expect(page.locator('[data-game-action-score]')).toHaveCount(0)
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
    return { invalidPreview, count: advice.best.tileIds.length }
  }, ids)
  expect(result).toEqual({ invalidPreview: null, count: 5 })
  await expect(play).toBeEnabled()
  await play.click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
