import { expect, test, type Page } from '@playwright/test'

// Deterministic edge states, followed by real rendered staging and commits.
async function fixture(
  page: Page,
  kind: 'ordinary' | 'locked' | 'bonus-short'
) {
  await page.goto('/en/play')
  await expect(page.locator('[data-game-action="redraw"]')).toBeVisible()
  return page.evaluate(async (kind) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const modifierPath = '/src/core/TileModifier.ts'
    const mandatePath = '/src/systems/MandateEffectSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit, FlowerType } = await import(tilePath)
    const { SealType } = await import(modifierPath)
    const { MandateEffectSystem } = await import(mandatePath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    const state = game.getState()
    state.targetScore = 1e9
    state.roundManager.getCurrentRound()!.scoreTarget = 1e9
    state.redrawsRemaining = 1
    const selected = state.handTiles[0].withSeal(SealType.Purple)
    state.handTiles[0] = selected
    state.wall = [new Tile(TileSuit.Pinzu, 5, 'replacement')]
    state.drawIndex = 0
    state.deadWall = []
    if (kind === 'locked') {
      state.mandateEffectSystem = MandateEffectSystem.fromJSON({
        ...state.mandateEffectSystem.toJSON(),
        lockedTileIds: [selected.id],
      })
    } else if (kind === 'bonus-short') {
      state.wall = [Tile.createFlower(FlowerType.Plum, 'unreplaceable-flower')]
    }
    eventBus.emit('tileDrawn', {
      tileId: selected.id,
      tilesRemaining: state.wall.length,
    })
    return selected.id as string
  }, kind)
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    const state = game.getState()
    return {
      hand: state.handTiles.map((tile: { id: string }) => tile.id),
      wall: state.wall
        .slice(state.drawIndex)
        .map((tile: { id: string }) => tile.id),
      river: state.discards.map((tile: { id: string }) => tile.id),
      gold: state.gold,
      hands: state.handsRemaining,
      discards: state.discardsRemaining,
      redraws: state.redrawsRemaining,
      seals: state.fateSeals.length,
    }
  })
}

test('staged redraw returns a tile, grants its seal once, and disables after exhaustion', async ({
  page,
  isMobile,
}) => {
  const id = await fixture(page, 'ordinary')
  const before = await snapshot(page)
  const action = page.locator('[data-game-action="redraw"]')
  await expect(action).toBeDisabled()
  const tile = page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
  if (isMobile) await tile.tap()
  else await tile.click()
  await expect(
    page.locator(`[data-play-zone="staging"] [data-play-tile="${id}"]`)
  ).toBeVisible()
  expect(await snapshot(page)).toEqual(before)
  await expect(action).toBeEnabled()
  await action.click()
  await expect(
    page.locator('[data-play-zone="staging"] [data-play-tile]')
  ).toHaveCount(0)
  await expect(
    page.locator('[data-play-zone="hand"] [data-play-tile="replacement"]')
  ).toBeVisible()
  const after = await snapshot(page)
  expect(after.hand).toHaveLength(before.hand.length)
  expect(after.hand).not.toContain(id)
  expect(after.wall).toEqual([id])
  expect(after.river).toEqual(before.river)
  expect(after.gold).toBe(before.gold)
  expect(after.hands).toBe(before.hands)
  expect(after.discards).toBe(before.discards)
  expect(after.redraws).toBe(0)
  expect(after.seals).toBe(before.seals + 1)
  const next = page.locator(
    '[data-play-zone="hand"] [data-play-tile="replacement"]'
  )
  if (isMobile) await next.tap()
  else await next.click()
  await expect(action).toBeDisabled()
  expect(await snapshot(page)).toEqual(after)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})

for (const kind of ['locked', 'bonus-short'] as const) {
  test(`redraw stays disabled for ${kind} despite a tile, wall and exchange remaining`, async ({
    page,
    isMobile,
  }) => {
    const id = await fixture(page, kind)
    const before = await snapshot(page)
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    if (isMobile) await tile.tap()
    else await tile.click()
    await expect(
      page.locator(`[data-play-zone="staging"] [data-play-tile="${id}"]`)
    ).toBeVisible()
    await expect(page.locator('[data-game-action="redraw"]')).toBeDisabled()
    expect(await snapshot(page)).toEqual(before)
  })
}
