import { expect, test, type Page } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import {
  clearReveals,
  closeOmenReveal,
  expectTeaHouse,
  handScoreTotal,
  openTable,
  rackTiles,
} from './helpers/table'

/**
 * Deal 1-2-3 4-5-6 of Characters, 2-3-4 of Circles, 6-7 of Bamboo, an East
 * pair, an 8 of Characters and two unmatched Dragons. As a Wild tile the 8
 * fills 6-7-8 of Bamboo and the rack holds a complete hand; as a plain tile
 * it does not. The round's target is raised far above anything the hand
 * scores. Returns the complete hand the engine finds, if any.
 */
async function deal(page: Page, wild: boolean): Promise<string[] | null> {
  const ids = await page.evaluate(async (wild) => {
    const gamePath = '/src/game/GameOrchestrator.ts',
      tilePath = '/src/core/Tile.ts',
      editionPath = '/src/core/TileModifier.ts',
      eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { EnhancementType } = await import(editionPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    for (const decree of state.decreeSystem.getOwnedDecrees())
      state.decreeSystem.removeDecree(decree.id)
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    // Controlled deal: the hint is about the rack's shape, not the draw.
    const make = (suit: string, ranks: number[], key: string) =>
      ranks.map((rank, i) => new Tile(TileSuit[suit], rank, `${key}-${i}`))
    const eight = new Tile(TileSuit.Manzu, 8, 'eight')
    state.handTiles = [
      ...make('Manzu', [1, 2, 3, 4, 5, 6], 'characters'),
      ...make('Pinzu', [2, 3, 4], 'circles'),
      ...make('Souzu', [6, 7], 'bamboo'),
      wild ? eight.withEnhancement(EnhancementType.Wild) : eight,
      ...make('Wind', [1, 1], 'east'),
      new Tile(TileSuit.Dragon, 2, 'spare-a'),
      new Tile(TileSuit.Dragon, 1, 'spare-b'),
    ]
    state.wall = Array.from(
      { length: 60 },
      (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
    )
    state.drawIndex = 0
    state.selectedTileIds.clear()
    state.faceDownTileIds.clear()
    state.targetScore = 1e9
    state.roundManager.getCurrentRound().scoreTarget = 1e9
    eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
    return game.findCompleteHandSelection() as string[] | null
  }, wild)
  // startNewRun queues its starting Decrees for a reveal over the table.
  await clearReveals(page)
  // The rack shows the deal, 8 of Characters included.
  await expect(rackTiles(page)).toHaveCount(16)
  await expect(
    page.locator('[data-play-zone="hand"] [data-play-tile="eight"]')
  ).toBeVisible()
  return ids
}

const hint = (page: Page) => page.locator('[data-complete-hand-hint]')
const feltTiles = (page: Page) =>
  page.locator('[data-play-zone="felt"] [data-play-tile]')
const tileIds = (tiles: ReturnType<typeof feltTiles>) =>
  tiles.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-play-tile')!).sort()
  )

test.beforeEach(async ({ page, isMobile }) => {
  await page.setViewportSize(
    isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openTable(page, 'en/play')
})

test('a Wild tile completes the rack: the hint selects it and Mahjong clears the round below its target', async ({
  page,
  isMobile,
}, testInfo) => {
  const ids = await deal(page, true)
  expect(ids).toHaveLength(14)
  expect(ids).toContain('eight')
  expect(ids).not.toContain('spare-a')
  expect(ids).not.toContain('spare-b')
  await expect(hint(page)).toBeVisible()
  await expect(hint(page)).toContainText(en.gameplay.mahjongHint)
  // A spare picked first is put back: the hint selects the hand alone.
  const spare = page.locator(
    '[data-play-zone="hand"] [data-play-tile="spare-a"]'
  )
  if (isMobile) await spare.tap()
  else await spare.click()
  await expect(feltTiles(page)).toHaveCount(1)
  const select = hint(page).getByRole('button', {
    name: en.gameplay.mahjongHintSelect,
    exact: true,
  })
  await expect(select).toHaveAttribute('data-select-complete-hand')
  await page.screenshot({ path: testInfo.outputPath('hint.png') })
  if (isMobile) await select.tap()
  else await select.click()

  // Exactly the fourteen tiles go to the felt; the spares stay on the rack.
  await expect(feltTiles(page)).toHaveCount(14)
  expect(await tileIds(feltTiles(page))).toEqual([...ids!].sort())
  expect(await tileIds(rackTiles(page))).toEqual(['spare-a', 'spare-b'])
  // Selected, the hint keeps its message but has nothing left to select.
  await expect(hint(page)).toContainText(en.gameplay.mahjongHint)
  await expect(page.locator('[data-select-complete-hand]')).toHaveCount(0)
  await expect(
    page.locator('[data-hand-score] [data-hand-score-pattern]')
  ).toHaveText(en.patterns.mahjong.name)
  const forecast = await page.evaluate(async (ids) => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    return game.previewScore(ids).finalScore as number
  }, ids!)
  expect(forecast).toBeGreaterThan(0)
  expect(forecast).toBeLessThan(1e9)
  await expect(handScoreTotal(page, 'preview')).toHaveAttribute(
    'title',
    forecast.toLocaleString('en')
  )

  const play = page.locator('[data-game-action="play"]')
  if (isMobile) await play.tap()
  else await play.click()
  const toast = page.locator('[data-play-toast="mahjong"]')
  await expect(toast).toHaveAttribute('data-play-toast-clears', 'true')
  await expect(toast).toContainText(en.gameplay.mahjongClearsRound)
  await page.screenshot({ path: testInfo.outputPath('cleared.png') })

  // The round is cleared at its real score, far below the target.
  await expectTeaHouse(page)
  const state = await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const { phase, score, lastRoundSummary } = game.getState()
    return { phase, score, summary: lastRoundSummary }
  })
  expect(state).toMatchObject({
    phase: 'shop',
    score: forecast,
    summary: {
      roundType: 'Small',
      score: forecast,
      target: 1e9,
      clearedByCompleteHand: true,
    },
  })
  // Cleared on the first Turn, it is also a swift clear: its Omen reveal
  // comes before the pay.
  await closeOmenReveal(page)
  await expect(page.locator('[data-cash-out-toast="clear"]')).toContainText(
    en.shop.roundClearedByMahjong
  )
})

test('no hint without a complete hand, or with Hand Hints off', async ({
  page,
}) => {
  // A plain 8 of Characters leaves the rack one group short.
  expect(await deal(page, false)).toBeNull()
  await expect(page.locator('[data-hand-group]').first()).toBeVisible()
  await expect(hint(page)).toHaveCount(0)

  expect(await deal(page, true)).toHaveLength(14)
  await expect(hint(page)).toBeVisible()
  const setHints = (show: boolean) =>
    page.evaluate(async (show) => {
      const path = '/src/stores/settingsStore.ts'
      const { useSettingsStore } = await import(path)
      useSettingsStore.getState().setShowTileHints(show)
    }, show)
  // Hand Hints off: the complete rack goes unmarked, like its groups.
  await setHints(false)
  await expect(page.locator('[data-hand-group]')).toHaveCount(0)
  await expect(hint(page)).toHaveCount(0)
  await setHints(true)
  await expect(hint(page)).toBeVisible()
})
