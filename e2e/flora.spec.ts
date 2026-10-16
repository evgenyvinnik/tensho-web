import { test, expect, type Page } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import {
  clearReveals,
  continueToNextRound,
  handScoreTotal,
  settleReveals,
  swiftClear,
} from './helpers/table'

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
  // The fixture's new run and Season would be revealed over the table.
  await clearReveals(page)
}

/** A Flower's or Season's own token on the item rail, and its panel. */
function floraToken(page: Page, selector: string, name: string) {
  return {
    token: page.locator(selector),
    panel: page.getByRole('dialog', { name }),
  }
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
  await clearReveals(page)
  const before = await snapshot(page)
  const { token: trigger, panel: dialog } = floraToken(
    page,
    '[data-flora-season]',
    en.flora.details.monsoonName
  )
  if (isMobile) await trigger.tap()
  else await trigger.click()
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
  // No free redraws: the REDRAW spent a Turn.
  expect(after.redraws).toBe(before.redraws)
  expect(after.hands).toBe(before.hands - 1)
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
  // The drawn Summer is revealed over the table.
  await settleReveals(page, 2_000)
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
        river: state.discards.some((t: { id: string }) => t.id === 'hand-0'),
      }
    })
  ).toEqual({
    // 16 retained − 1 dead-wall replenishment; REDRAW sends the exchanged
    // tile to the river, not back into the wall.
    remaining: 15,
    reserve: ['wall-16', 'wall-17', 'wall-18', 'wall-19'],
    multiplier: 1.3,
    returned: false,
    river: true,
  })
  const after = await snapshot(page)
  expect(after.redraws).toBe(before.redraws)
  expect(after.hands).toBe(before.hands - 1)
  expect(after.hand.length).toBe(before.hand.length)
  expect(after.gold).toBe(before.gold)
  expect(after.score).toBe(before.score)
  const { token: trigger, panel: dialog } = floraToken(
    page,
    '[data-flora-season]',
    en.flora.summer
  )
  if (isMobile) await trigger.tap()
  else await trigger.click()
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

test('a third Flower collected through redraw unlocks shop eligibility and counts the set on its panel', async ({
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
  // The drawn Flower is revealed over the table.
  await settleReveals(page, 2_000)
  await expect(
    page.locator(
      '[data-play-zone="hand"] [data-play-tile="flower-replacement"]'
    )
  ).toBeVisible()
  expect(await eligible()).toBe(7)
  const before = await snapshot(page)
  // The drawn Flower's own panel counts the set it completes.
  const { token: trigger, panel: dialog } = floraToken(
    page,
    '[data-flora-flower="Chrysanthemum"]',
    en.flora.chrysanthemum
  )
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const rule = dialog.getByText(
    en.flora.setProgress.replace('{{count}}', '3'),
    { exact: false }
  )
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
    await clearReveals(page)
    const give = page.locator(
      '[data-play-zone="hand"] [data-play-tile="hand-0"]'
    )
    if (isMobile) await give.tap()
    else await give.click()
    await page.locator('[data-game-action="redraw"]').click()
    // The drawn Chrysanthemum is revealed over the table.
    await settleReveals(page, 2_000)
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
    await expect(handScoreTotal(page, 'preview')).toHaveText('47')
    const before = await snapshot(page)
    const copy = language === 'es' ? es : en
    const winters = page.locator('[data-flora-season]')
    await expect(winters).toHaveCount(2)
    const { token: trigger, panel: dialog } = floraToken(
      page,
      '[data-flora-flower="Chrysanthemum"]',
      copy.flora.chrysanthemum
    )
    if (isMobile) await trigger.tap()
    else await trigger.click()
    await expect(dialog).toBeVisible()
    await expect
      .poll(() =>
        page
          .locator('[data-collectible-token] img')
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
    await expect(dialog).toHaveCount(0)
    expect(await snapshot(page)).toEqual(before)
    await expect(handScoreTotal(page, 'preview')).toHaveText('47')
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

test('a Spanish item rail keeps the full ordered Season stack readable and never spends the selection', async ({
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
  const felt = page.locator('[data-play-zone="felt"] [data-play-tile]')
  await expect(felt).toHaveCount(2)
  const before = await snapshot(page)
  // Each Season is its own token on the item rail, in draw order, named for
  // what it does now.
  const seasons = page.locator('[data-flora-season]')
  await expect(seasons).toHaveCount(9)
  expect(
    await seasons.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-flora-season'))
    )
  ).toEqual(Array.from({ length: 9 }, (_, i) => 'season-' + i))
  await expect(seasons.nth(0)).toHaveAttribute('aria-label', es.flora.spring)
  await expect(seasons.nth(1)).toHaveAttribute(
    'aria-label',
    es.flora.details.decayName
  )
  const trigger = seasons.nth(2)
  await expect(trigger).toHaveAttribute(
    'aria-label',
    es.flora.details.droughtName
  )
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', {
    name: es.flora.details.droughtName,
  })
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', { name: es.common.close })
  await expect(close).toBeFocused()
  await expect(dialog).toContainText(es.flora.details.drought)
  await expect(dialog).not.toContainText(es.flora.details.summer)
  for (const size of [
    { width: 320, height: 568 },
    { width: 568, height: 320 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(size)
    // Mobile viewport changes settle asynchronously. Read all geometry in one
    // browser turn so a portrait frame cannot be compared with landscape text.
    await expect(async () => {
      const geometry = await dialog.evaluate((node) => ({
        viewport: { width: innerWidth, height: innerHeight },
        frame: node.getBoundingClientRect().toJSON(),
        close: node.querySelector('button')!.getBoundingClientRect().toJSON(),
      }))
      const { frame, close } = geometry
      expect(geometry.viewport).toEqual(size)
      // The panel stays fully on screen beside its token; its close control
      // sits at its top edge.
      expect(frame.x).toBeGreaterThanOrEqual(12)
      expect(frame.right).toBeLessThanOrEqual(size.width - 12)
      expect(frame.y).toBeGreaterThanOrEqual(12)
      expect(frame.bottom).toBeLessThanOrEqual(size.height - 12)
      expect(close.y).toBeGreaterThanOrEqual(frame.y)
      expect(close.bottom).toBeLessThanOrEqual(frame.y + 72)
    }).toPass({ timeout: 5000 })
    expect(
      await dialog.evaluate((node) =>
        Array.from(node.querySelectorAll<HTMLElement>('h2,h3,h4,p')).every(
          (child) => child.scrollWidth <= child.clientWidth + 1
        )
      )
    ).toBe(true)
    // Every Season token can be brought into view on the rail.
    for (const season of await seasons.all()) {
      await season.scrollIntoViewIfNeeded()
      await expect(season).toBeInViewport()
      const bounds = await season.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width)
    }
    await page.screenshot({
      path: testInfo.outputPath('flora-stack-es-' + size.width + '.png'),
    })
  }
  // Focus survives the resizes, and Escape returns it to the token.
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  // Drought's suppression is explained on each Flower it silences.
  const plum = page.locator('[data-flora-flower="Plum"]')
  await plum.focus()
  await page.keyboard.press('Enter')
  const plumPanel = page.getByRole('dialog', { name: es.flora.plum })
  await expect(plumPanel).toContainText(es.flora.details.suppressed)
  await page.keyboard.press('Escape')
  await expect(plumPanel).not.toBeVisible()
  await expect(felt).toHaveCount(2)
  expect(await snapshot(page)).toEqual(before)
})

test('a REDRAW changes the visible Decay penalty and the real scored play, then a new round clears it', async ({
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
  // Decay counts each REDRAW once, however many tiles it sends to the river.
  const source = page.locator(
    '[data-play-zone="hand"] [data-play-tile="hand-2"]'
  )
  if (isMobile) await source.tap()
  else await source.click()
  await page.locator('[data-game-action="redraw"]').click()
  await expect
    .poll(async () => (await snapshot(page)).flora.decayPenalty)
    .toBe(10)
  const { token: trigger, panel: dialog } = floraToken(
    page,
    '[data-flora-season]',
    en.flora.details.decayName
  )
  if (isMobile) await trigger.tap()
  else await trigger.click()
  const penalty = dialog.getByText(
    en.flora.details.decayPenalty.replace('{{points}}', '10')
  )
  await expect(penalty).toHaveText('Decay penalty per play: −10 points.')
  await expect(penalty).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
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
  // Skip is gone: clear the round to reach the next one.
  await swiftClear(page)
  await continueToNextRound(page)
  await expect
    .poll(async () => (await snapshot(page)).flora.seasons.length)
    .toBe(0)
  await expect(page.locator('[data-flora-season]')).toHaveCount(0)
  expect((await snapshot(page)).flora.decayPenalty).toBe(0)
})
