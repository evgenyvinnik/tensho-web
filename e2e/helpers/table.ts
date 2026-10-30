import { expect, type Page } from '@playwright/test'

const REVEALS = '[data-wall-draw], [data-decree-reveal], [data-orb-reveal]'

/**
 * Close every wall draw, Decree and Orb reveal on screen. Each round opens
 * with its deal from the Wall and any draw can fly a Flower or Season to the
 * collection (both end by themselves; a tap skips them), a new run reveals
 * its starting Decrees, and an Orb taken in the Tea House reveals the family
 * it raised; the reveals wait for the player before the screen can be used.
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
    const wallDraw = page.locator('[data-wall-draw]')
    if (await wallDraw.isVisible()) {
      // A tap anywhere skips the draw; it may already have ended by itself.
      await wallDraw
        .dispatchEvent('pointerdown', undefined, { timeout: 1_000 })
        .catch(() => undefined)
      await wallDraw.waitFor({ state: 'detached', timeout: 3_000 })
      continue
    }
    // Only one reveal shows at a time.
    const reveal = reveals.filter({ visible: true }).first()
    if ((await reveal.count()) === 0) continue
    // Staged reveals advance to a result automatically. Await its real button
    // rather than clicking the overlay while its stage/contents are changing.
    await reveal.getByRole('button').last().click()
  }
  throw new Error('Reveals kept appearing')
}

/**
 * Start a new run from the menu and wait for the table. Default paths have no
 * leading slash so they resolve against baseURL, whatever the deployment base.
 */
export async function startRun(page: Page, path = 'en'): Promise<void> {
  await page.goto(path)
  await page.getByRole('button', { name: 'New Run', exact: true }).click()
  await expect(page).toHaveURL(/\/play$/)
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  // A new run reveals its starting Decrees once the table is up.
  await settleReveals(page, 2_000)
}

/** Leave the Tea House for the next round's table and settle its reveals. */
export async function continueToNextRound(page: Page): Promise<void> {
  await page.locator('[data-shop-continue]').click()
  await expect(page).toHaveURL(/\/play$/)
  // The new round can open on Flower and Season reveals.
  await settleReveals(page, 2_000)
}

/** Open the table directly at /play (starting or resuming a run). */
export async function openTable(page: Page, path = 'en/play'): Promise<void> {
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
 * Pick the complete Mahjong hand the engine finds on the rack onto the felt,
 * one tile at a time in the engine's order (`tap` on touch layouts).
 */
export async function selectCompleteHand(
  page: Page,
  tap = false
): Promise<string[]> {
  const ids: string[] | null = await page.evaluate(async () => {
    const path = '/src/game/GameOrchestrator.ts'
    const { gameOrchestrator: game } = await import(path)
    return game.findCompleteHandSelection()
  })
  if (!ids) throw new Error('No complete hand on the rack')
  for (const id of ids) {
    const tile = page.locator(
      `[data-play-zone="hand"] [data-play-tile="${id}"]`
    )
    await (tap ? tile.tap() : tile.click())
  }
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
    const [decrees, flora, orbs] = await Promise.all([
      import(loaded('/src/game/decreeRevealQueue.ts')),
      import(loaded('/src/game/floraRevealQueue.ts')),
      import(loaded('/src/game/orbRevealQueue.ts')),
    ])
    decrees.useDecreeRevealQueue.setState({ queue: [] })
    flora.useFloraRevealQueue.setState({ queue: [] })
    orbs.useOrbRevealQueue.setState({ queue: [] })
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
