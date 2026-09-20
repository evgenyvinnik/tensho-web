import { test, expect, type Page } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import en from '../src/i18n/locales/en.json' with { type: 'json' }

async function setup(page: Page, lang: string, stacked: boolean) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/' + lang + '/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await page.evaluate(async (stacked) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const seasonPath = '/src/systems/SeasonSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { SeasonSystem } = await import(seasonPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    state.flowerSystem.clear()
    state.decreeSystem
      .getOwnedDecrees()
      .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
    state.handTiles = Array.from(
      { length: 14 },
      (_, i) => new Tile(TileSuit.Souzu, i < 2 ? 1 : (i % 9) + 1, 'hand-' + i)
    )
    state.wall = Array.from(
      { length: 40 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, 'wall-' + i)
    )
    state.drawIndex = 0
    state.targetScore = 1e9
    state.roundManager.getCurrentRound().scoreTarget = 1e9
    state.wallTemplate = state.wallTemplate.filter(
      (tile: { isSeason: boolean }) => !tile.isSeason
    )
    // Deliberate presentation/transaction fixtures, not organic draw-frequency evidence.
    if (stacked) {
      for (const rank of [1, 2, 3, 4])
        state.flowerSystem.addFlower(
          new Tile(TileSuit.Flower, rank, 'flower-' + rank)
        )
      const source = new SeasonSystem()
      const stack = [
        ['Spring', false],
        ['Autumn', true],
        ['Summer', true],
        ['Winter', true],
        ['Spring', true],
        ['Summer', false],
        ['Autumn', false],
        ['Winter', false],
        ['Spring', false],
      ].map(([type, corrupt], index) => {
        source.forceSetSeason(type, corrupt)
        return { ...source.getSeasonStack()[0], id: 'season-' + index }
      })
      state.seasonSystem = SeasonSystem.fromState({
        activeSeason: stack[0],
        seasonStack: stack,
        currentAct: 3,
        discardCount: 0,
      })
    } else state.seasonSystem.forceSetSeason('Autumn', true)
    eventBus.emit('seasonActivated', {
      seasonType: 'Autumn',
      effect: 'Flora fixture',
    })
  }, stacked)
  const disableTips = page.getByRole('button', {
    name: "Don't show tips",
    exact: true,
  })
  // Tips remain optional; tests need unobstructed screenshots, not a tutorial bypass.
  if (await disableTips.isVisible()) await disableTips.click()
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    return {
      hand: state.handTiles.map((tile: { id: string }) => tile.id),
      staged: game.getSelectedTileIds(),
      gold: state.gold,
      score: state.score,
      hands: state.handsRemaining,
      discards: state.discardsRemaining,
      redraws: state.redrawsRemaining,
      flora: game.getFloraState(),
    }
  })
}

test('Monsoon details and availability probes preserve the seeded tile delivered by a real redraw', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await setup(page, 'en', false)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const randomPath = '/src/game/RunRandom.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { runRandom } = await import(randomPath)
    const { eventBus } = await import(eventPath)
    game.getState().seasonSystem.forceSetSeason('Spring', true)
    game.getState().deadWall = []
    runRandom.start(1) // first sample .60277 chooses wall-24 out of 40 tiles
    eventBus.emit('seasonActivated', {
      seasonType: 'Spring',
      effect: 'Monsoon fixture',
    })
  })
  const before = await snapshot(page)
  const trigger = page.getByTestId('flora-details-trigger')
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Flowers · Seasons' })
  const rule = dialog.getByText(en.flora.details.monsoon, { exact: true })
  await rule.scrollIntoViewIfNeeded()
  await expect(rule).toBeVisible()
  await expect(rule).toBeInViewport()
  await expect(
    dialog.getByText(en.flora.details.unwired, { exact: true })
  ).toHaveCount(0)
  expect(await rule.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true
  )
  await page.screenshot({ path: testInfo.outputPath('monsoon-details.png') })
  await page.keyboard.press('Escape')
  expect(await snapshot(page)).toEqual(before)
  await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    for (let i = 0; i < 20; i++) {
      game.getAvailableActions()
      if (!game.canPerformAction({ type: 'redraw', tileIds: ['hand-0'] }))
        throw new Error('Expected a legal redraw')
    }
  })
  const selected = page.locator(
    '[data-play-zone="hand"] [data-play-tile="hand-0"]'
  )
  if (isMobile) await selected.tap()
  else await selected.click()
  const action = page.locator('[data-game-action="redraw"]')
  await expect(action).toBeEnabled()
  await action.click()
  await expect(
    page.locator('[data-play-zone="hand"] [data-play-tile="wall-24"]')
  ).toBeVisible()
  await expect(
    page.locator('[data-play-zone="hand"] [data-play-tile="wall-0"]')
  ).toHaveCount(0)
  const after = await snapshot(page)
  expect(after.redraws).toBe(before.redraws - 1)
  expect(after.hands).toBe(before.hands)
  expect(after.discards).toBe(before.discards)
  expect(after.score).toBe(before.score)
  expect(after.gold).toBe(before.gold)
  expect(after.hand.length).toBe(before.hand.length)
})

test('Summer costs live-wall tiles on a real redraw and describes the round-only tradeoff', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await setup(page, 'en', false)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit, SeasonType } = await import(tilePath)
    const state = game.getState()
    state.seasonSystem.clear()
    state.seasonSystem.setAct(1)
    state.wall = [
      Tile.createSeason(SeasonType.Summer, 'summer'),
      ...state.wall.slice(0, 20),
    ]
    state.deadWall = [new Tile(TileSuit.Pinzu, 8, 'summer-replacement')]
    state.summerReserve = []
  })
  const before = await snapshot(page)
  const tile = page.locator('[data-play-zone="hand"] [data-play-tile="hand-0"]')
  if (isMobile) await tile.tap()
  else await tile.click()
  await page.locator('[data-game-action="redraw"]').click()
  await expect(
    page.locator(
      '[data-play-zone="hand"] [data-play-tile="summer-replacement"]'
    )
  ).toBeVisible()
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      const state = game.getState()
      return {
        remaining: state.wall.length - state.drawIndex,
        reserve: state.summerReserve.map((t: { id: string }) => t.id),
        multiplier: state.seasonSystem.calculateScoreModifier(),
        returned: state.wall
          .slice(state.drawIndex)
          .some((t: { id: string }) => t.id === 'hand-0'),
      }
    })
  ).toEqual({
    // 16 retained − 1 dead-wall replenishment + 1 exchanged tile returned.
    remaining: 16,
    reserve: ['wall-16', 'wall-17', 'wall-18', 'wall-19'],
    multiplier: 1.3,
    returned: true,
  })
  const after = await snapshot(page)
  expect(after.redraws).toBe(before.redraws - 1)
  expect(after.hand.length).toBe(before.hand.length)
  expect(after.gold).toBe(before.gold)
  expect(after.score).toBe(before.score)
  const trigger = page.getByTestId('flora-details-trigger')
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Flowers · Seasons' })
  const rule = dialog.getByText(en.flora.details.summer, { exact: true })
  await rule.scrollIntoViewIfNeeded()
  await expect(rule).toBeInViewport()
  expect(await rule.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true
  )
  await page.screenshot({ path: testInfo.outputPath('summer-details.png') })
  await page.keyboard.press('Escape')
  expect(await snapshot(page)).toEqual(after)
})

test('a third Flower collected through redraw unlocks shop eligibility and explains the set bonus', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await setup(page, 'en', false)
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const state = game.getState()
    state.seasonSystem.clear()
    for (const rank of [1, 2])
      state.flowerSystem.addFlower(
        new Tile(TileSuit.Flower, rank, 'collected-' + rank)
      )
    state.wall.unshift(new Tile(TileSuit.Flower, 3, 'third-flower'))
    state.deadWall = [new Tile(TileSuit.Pinzu, 8, 'flower-replacement')]
  })
  const eligible = () =>
    page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const decreePath = '/src/systems/DecreeSystem.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { DecreeSystem } = await import(decreePath)
      const count = game.getState().flowerSystem.getFlowerCount()
      return DecreeSystem.getShopCandidates([], undefined, count).filter(
        (d: { flowerRequirement?: number }) => d.flowerRequirement === 3
      ).length
    })
  expect(await eligible()).toBe(0)
  const tile = page.locator('[data-play-zone="hand"] [data-play-tile="hand-0"]')
  if (isMobile) await tile.tap()
  else await tile.click()
  await page.locator('[data-game-action="redraw"]').click()
  await expect(
    page.locator(
      '[data-play-zone="hand"] [data-play-tile="flower-replacement"]'
    )
  ).toBeVisible()
  expect(await eligible()).toBe(7)
  const before = await snapshot(page)
  const trigger = page.getByTestId('flora-details-trigger')
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const rule = page.getByRole('dialog').getByTestId('flora-flower-unlock')
  await expect(rule).toHaveText(`✓ ${en.flora.details.setThree}`)
  await rule.scrollIntoViewIfNeeded()
  await expect(rule).toBeInViewport()
  expect(await rule.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true
  )
  await page.screenshot({
    path: testInfo.outputPath('three-flower-unlock.png'),
  })
  await page.keyboard.press('Escape')
  expect(await snapshot(page)).toEqual(before)
})

for (const language of ['en', 'es']) {
  test(`a real Chrysanthemum draw protects the preview and committed score from stacked Winter (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await setup(page, language, false)
    const beforeCollection = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit, SeasonType, FlowerType } = await import(tilePath)
      const { eventBus } = await import(eventPath)
      const state = game.getState()
      state.seasonSystem.clear()
      state.seasonSystem.setAct(1)
      for (let index = 0; index < 2; index++)
        state.seasonSystem.addSeason(
          Tile.createSeason(SeasonType.Winter, 'winter-' + index)
        )
      state.handTiles = [
        ...[4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, 'play-' + rank)
        ),
        ...Array.from(
          { length: 11 },
          (_, index) =>
            new Tile(TileSuit.Pinzu, (index % 9) + 1, 'hand-' + index)
        ),
      ]
      state.wall.unshift(
        new Tile(
          TileSuit.Flower,
          FlowerType.Chrysanthemum,
          'drawn-chrysanthemum'
        )
      )
      state.deadWall = [new Tile(TileSuit.Pinzu, 9, 'winter-replacement')]
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Winter fixture',
      })
      return {
        score: game.previewScore(['play-4', 'play-5', 'play-6']).finalScore,
        hasFlower: state.flowerSystem.hasFlowerType('Chrysanthemum'),
      }
    })
    // A plain 4–5–6 sequence has 45 points: two unprotected Winters leave 25.
    expect(beforeCollection).toEqual({ score: 25, hasFlower: false })
    const give = page.locator(
      '[data-play-zone="hand"] [data-play-tile="hand-0"]'
    )
    if (isMobile) await give.tap()
    else await give.click()
    await page.locator('[data-game-action="redraw"]').click()
    await expect(
      page.locator(
        '[data-play-zone="hand"] [data-play-tile="winter-replacement"]'
      )
    ).toBeVisible()
    expect(
      (await snapshot(page)).flora.flowers.flowers.map(
        (flower: { type: string }) => flower.type
      )
    ).toEqual(['Chrysanthemum'])
    for (const rank of [4, 5, 6]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="play-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    // Chrysanthemum's own 5% bonus remains; normal Winters no longer cut it.
    await expect(page.getByTestId('score-preview-total')).toHaveText('+47')
    const before = await snapshot(page)
    const trigger = page.getByTestId('flora-details-trigger')
    if (isMobile) await trigger.tap()
    else await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('[data-flora-detail-season]')).toHaveCount(2)
    await expect
      .poll(() =>
        dialog
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0
            )
          )
      )
      .toBe(true)
    await page.keyboard.press('Escape')
    expect(await snapshot(page)).toEqual(before)
    await expect(page.getByTestId('score-preview-total')).toHaveText('+47')
    await page.screenshot({
      path: testInfo.outputPath(`winter-chrysanthemum-${language}.png`),
    })
    await page.locator('[data-game-action="play"]').click()
    await expect
      .poll(async () => (await snapshot(page)).score - before.score)
      .toBe(47)
    const after = await snapshot(page)
    expect(after.hands).toBe(before.hands - 1)
    expect(after.flora.seasons).toHaveLength(2)
    expect(after.flora.flowers.flowers).toEqual(before.flora.flowers.flowers)
  })
}

test('a Spanish Flora inspector keeps the full ordered stack readable and never spends the selection', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await setup(page, 'es', true)
  for (const id of ['hand-0', 'hand-1']) {
    const tile = page.locator(
      '[data-play-zone="hand"] [data-play-tile="' + id + '"]'
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile]')
  ).toHaveCount(2)
  const before = await snapshot(page)
  const trigger = page.getByTestId('flora-details-trigger')
  await expect(
    trigger.locator('[data-flora-season="season-0"]')
  ).toHaveAttribute('aria-label', es.flora.spring)
  await expect(
    trigger.locator('[data-flora-season="season-1"]')
  ).toHaveAttribute('aria-label', es.flora.details.decayName)
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', {
    name: es.flora.flowers + ' · ' + es.flora.seasons,
  })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: es.common.close })
  ).toBeFocused()
  await expect(dialog.getByTestId('flora-suppression')).toHaveText(
    es.flora.details.suppressed
  )
  const rows = dialog.locator('[data-flora-detail-season]')
  await expect(rows).toHaveCount(9)
  expect(
    await rows.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-flora-detail-season'))
    )
  ).toEqual(Array.from({ length: 9 }, (_, i) => 'season-' + i))
  await expect(rows.nth(2)).toContainText(es.flora.details.drought)
  await expect(rows.nth(2)).not.toContainText(es.flora.details.summer)
  for (const size of [
    { width: 320, height: 568 },
    { width: 568, height: 320 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size)
    // Mobile viewport changes settle asynchronously. Read all geometry in one
    // browser turn so a portrait frame cannot be compared with landscape text.
    await expect(async () => {
      const geometry = await dialog.evaluate((node) => {
        const rect = (selector: string) =>
          node.querySelector(selector)!.getBoundingClientRect().toJSON()
        return {
          viewport: { width: innerWidth, height: innerHeight },
          frame: rect('[data-popup-frame]'),
          scroll: rect('[data-popup-scroll]'),
          close: rect('button'),
        }
      })
      const { frame, scroll, close } = geometry
      expect(geometry.viewport).toEqual(size)
      // Text remains inside the paper even while scrolled, not underneath
      // either 64px decorative roller or the fixed close control.
      expect(scroll.y).toBeGreaterThanOrEqual(frame.y + 80)
      expect(scroll.bottom).toBeLessThanOrEqual(frame.bottom - 72)
      expect(scroll.y).toBeGreaterThanOrEqual(close.bottom)
      expect(scroll.height).toBeGreaterThanOrEqual(44)
    }).toPass({ timeout: 5000 })
    for (const row of await dialog
      .locator('[data-flora-flower], [data-flora-detail-season]')
      .all()) {
      await row.scrollIntoViewIfNeeded()
      await expect(row).toBeInViewport()
      expect(
        await row.evaluate((node) =>
          Array.from(node.querySelectorAll<HTMLElement>('h4,p')).every(
            (child) => child.scrollWidth <= child.clientWidth + 1
          )
        )
      ).toBe(true)
      const bounds = await row.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(12)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width - 12)
    }
    await rows.nth(2).scrollIntoViewIfNeeded()
    await page.screenshot({
      path: testInfo.outputPath('flora-stack-es-' + size.width + '.png'),
    })
  }
  await page.keyboard.press('Tab')
  await expect(
    dialog.getByRole('button', { name: es.common.close })
  ).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile]')
  ).toHaveCount(2)
  expect(await snapshot(page)).toEqual(before)
})

test('a pointer discard changes the visible Decay penalty and the real scored play, then Skip clears it', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page, 'en', false)
  const baseline = await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    return game.previewScore(['hand-0', 'hand-1']).finalScore
  })
  const source = page.locator(
    '[data-play-zone="hand"] [data-play-tile="hand-2"]'
  )
  const discard = page.locator('[data-play-zone="discard"]')
  await source.scrollIntoViewIfNeeded()
  await expect(source).toBeInViewport()
  await expect(discard).toBeInViewport()
  await source.dragTo(discard)
  await expect
    .poll(async () => (await snapshot(page)).flora.decayPenalty)
    .toBe(10)
  const trigger = page.getByTestId('flora-details-trigger')
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Flowers · Seasons' })
  const penalty = dialog.getByTestId('flora-decay-penalty')
  await penalty.scrollIntoViewIfNeeded()
  await expect(penalty).toHaveText('Decay penalty per play: −10 points.')
  await expect(penalty).toBeInViewport()
  await page.keyboard.press('Escape')
  for (const id of ['hand-0', 'hand-1']) {
    const tile = page.locator(
      '[data-play-zone="hand"] [data-play-tile="' + id + '"]'
    )
    if (isMobile) await tile.tap()
    else await tile.click()
  }
  const before = await snapshot(page)
  await page.locator('[data-game-action="play"]').click()
  await expect
    .poll(async () => (await snapshot(page)).score - before.score)
    .toBe(baseline - 10)
  expect((await snapshot(page)).flora.decayPenalty).toBe(10)
  await page.locator('[data-game-action="skip"]').click()
  await expect
    .poll(async () => (await snapshot(page)).flora.seasons.length)
    .toBe(0)
  await trigger.click()
  await expect(
    page.getByRole('dialog').getByText('No Seasons this round.')
  ).toBeVisible()
  await expect(page.getByTestId('flora-decay-penalty')).toHaveCount(0)
})
