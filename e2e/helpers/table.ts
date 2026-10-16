import { expect, type Page } from '@playwright/test'

const REVEALS = '[data-decree-reveal], [data-flora-reveal]'

/**
 * Close every Decree and Flora reveal on screen. A new run reveals its
 * starting Decrees, and any draw can reveal a Flower or Season; each waits
 * for the player before the table can be used.
 */
export async function settleReveals(
  page: Page,
  firstWait = 800
): Promise<void> {
  const reveals = page.locator(REVEALS)
  for (let guard = 0; guard < 24; guard++) {
    try {
      await reveals
        .first()
        .waitFor({ state: 'visible', timeout: guard === 0 ? firstWait : 800 })
    } catch {
      return
    }
    // Only one reveal shows at a time.
    const reveal = reveals.filter({ visible: true }).first()
    if ((await reveal.getAttribute('data-decree-reveal')) !== null) {
      // A Decree first appears as a closed bag: a tap opens it.
      if ((await reveal.getByRole('button').count()) === 0)
        await reveal.click({ position: { x: 4, y: 4 } })
      await reveal.getByRole('button').first().click()
    } else {
      await reveal.getByRole('button').last().click()
    }
  }
  throw new Error('Reveals kept appearing')
}

/** Start a new run from the menu and wait for the table. */
export async function startRun(page: Page, path = '/en'): Promise<void> {
  await page.goto(path)
  await page.getByRole('button', { name: 'New Run', exact: true }).click()
  await expect(page).toHaveURL(/\/play$/)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  // A new run reveals its starting Decrees once the table is up.
  await settleReveals(page, 2_000)
}

/** Open the table directly at /play (starting or resuming a run). */
export async function openTable(page: Page, path = '/en/play'): Promise<void> {
  await page.goto(path)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await settleReveals(page, 2_000)
}

export const rackTiles = (page: Page) =>
  page.locator('[data-play-zone="hand"] [data-play-tile]')

/** Pick the last `count` rack tiles onto the felt, in rack order. */
export async function selectTiles(
  page: Page,
  count: number
): Promise<string[]> {
  const ids = await rackTiles(page).evaluateAll(
    (tiles, n) =>
      tiles.slice(-n).map((tile) => tile.getAttribute('data-play-tile')!),
    count
  )
  for (const id of ids) await page.locator(`[data-play-tile="${id}"]`).click()
  return ids
}

/**
 * The total in the middle of the table: the selection's forecast
 * (`preview`), or the last play once nothing is selected (`last`).
 */
export const handScoreTotal = (page: Page, state: 'preview' | 'last') =>
  page.locator(
    `[data-hand-score][data-hand-score-state="${state}"] [data-hand-score-total]`
  )

/** Turns left and free redraws, as the action bar shows them. */
export async function turnBudget(page: Page) {
  const turns = Number(
    await page.locator('[data-turns-left]').getAttribute('data-turns-left')
  )
  const badge = page.locator('[data-free-redraws]')
  const free = (await badge.count())
    ? Number(await badge.getAttribute('data-free-redraws'))
    : 0
  return { turns, free }
}

/**
 * Empty the reveal queues through the app's own loaded modules. Fixtures that
 * author a run with `startNewRun` would otherwise queue its starting Decrees
 * for a reveal over whatever screen the test is about.
 */
export async function clearReveals(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // HMR can version a module URL; import the exact instance the app uses.
    const loaded = (path: string) =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .reverse()
        .find((url) => new URL(url).pathname === path) ?? path
    const [decrees, flora] = await Promise.all([
      import(loaded('/src/game/decreeRevealQueue.ts')),
      import(loaded('/src/game/floraRevealQueue.ts')),
    ])
    decrees.useDecreeRevealQueue.setState({ queue: [] })
    flora.useFloraRevealQueue.setState({ queue: [] })
  })
  await parkMouse(page)
}

/**
 * Move the mouse off the board. Collectibles and shop offers open their
 * details on hover, so a pointer left over one covers other controls.
 */
export async function parkMouse(page: Page): Promise<void> {
  await page.mouse.move(1, 1)
}

/**
 * Clear the current round with a real play and Turns to spare. Only the deal
 * is controlled: a target of 1 and a Pair on the rack. Clearing a Small or
 * Large round with two Turns left earns its Omen (Skip no longer exists).
 * Resolves once the round's Tea House is open.
 */
export async function swiftClear(page: Page): Promise<void> {
  const ids = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { eventBus } = await import(eventPath)
    const state = game.getState()
    state.targetScore = 1
    state.roundManager.getCurrentRound().scoreTarget = 1
    const round = `${state.currentAct}-${state.currentRound}`
    state.handTiles = [
      new Tile(TileSuit.Pinzu, 2, `swift-a-${round}`),
      new Tile(TileSuit.Pinzu, 2, `swift-b-${round}`),
    ]
    state.selectedTileIds.clear()
    state.faceDownTileIds.clear()
    eventBus.emit('tileDrawn', {
      tileId: state.handTiles[0].id,
      tilesRemaining: state.wall.length - state.drawIndex,
    })
    return state.handTiles.map((tile: { id: string }) => tile.id) as string[]
  })
  for (const id of ids)
    await page
      .locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      .click()
  await page.locator('[data-game-action="play"]').click()
  await expect(page).toHaveURL(/\/shop$/)
  // Route navigation precedes ShopScreen's effect that opens this visit.
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return game.shop.isOpen
      })
    )
    .toBe(true)
}
