import { expect, test } from '@playwright/test'
import { clearReveals, settleReveals } from './helpers/table'

for (const width of [320, 390, 1280]) {
  test(`eight flora tiles fit without horizontal scrolling at ${width}px`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 740 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const response = await page.goto('/en/play')
    expect(response?.status()).toBe(200)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible({
      timeout: 20_000,
    })
    await settleReveals(page, 2_000)
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const tilePath = '/src/core/Tile.ts'
      const seasonPath = '/src/systems/SeasonSystem.ts'
      const orbPath = '/src/systems/CelestialOrbSystem.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { SeasonSystem } = await import(seasonPath)
      const { CelestialOrbSystem, getCelestialOrbByYaku } = await import(
        orbPath
      )
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.flowerSystem.clear()
      for (const rank of [1, 2, 3, 4])
        state.flowerSystem.addFlower(
          new Tile(TileSuit.Flower, rank, `layout-flower-${rank}`)
        )
      const source = new SeasonSystem()
      const stack = ['Spring', 'Summer', 'Autumn', 'Winter'].map(
        (type, index) => {
          source.forceSetSeason(type)
          return { ...source.getSeasonStack()[0], id: `layout-season-${index}` }
        }
      )
      state.seasonSystem = SeasonSystem.fromState({
        activeSeason: stack[0],
        seasonStack: stack,
        currentAct: 1,
        discardCount: 0,
      })
      // Full build presentation fixture: existing upgrades must not consume
      // any of the table's eight Flower/Season positions.
      state.celestialOrbSystem.useOrb(
        CelestialOrbSystem.createCelestialOrbInstance(
          getCelestialOrbByYaku('All')
        )
      )
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Collectible layout fixture',
      })
    })
    await clearReveals(page)

    const rail = page.locator('[data-collectible-rail]')
    const tiles = rail.locator('[data-collectible-token]')
    await expect(tiles).toHaveCount(8)
    await expect(page.locator('[data-yaku-upgrade]')).toHaveCount(0)
    await expect(rail.locator('[data-wall-chip]')).toHaveCount(0)

    const assertAllTilesFit = async () => {
      await expect(async () => {
        const geometry = await rail.evaluate((node) => {
          const rail = node.getBoundingClientRect()
          return {
            viewport: innerWidth,
            pageWidth: document.documentElement.scrollWidth,
            scrollWidth: node.scrollWidth,
            clientWidth: node.clientWidth,
            scrollLeft: node.scrollLeft,
            rail: rail.toJSON(),
            tiles: Array.from(
              node.querySelectorAll('[data-collectible-token]')
            ).map((tile) => tile.getBoundingClientRect().toJSON()),
          }
        })
        expect(geometry.viewport).toBe(width)
        expect(geometry.pageWidth).toBeLessThanOrEqual(width + 1)
        expect(geometry.scrollWidth).toBeLessThanOrEqual(
          geometry.clientWidth + 1
        )
        expect(geometry.scrollLeft).toBe(0)
        for (const tile of geometry.tiles) {
          expect(tile.width).toBeGreaterThanOrEqual(44)
          expect(tile.height).toBeGreaterThanOrEqual(44)
          expect(tile.left).toBeGreaterThanOrEqual(geometry.rail.left)
          expect(tile.right).toBeLessThanOrEqual(geometry.rail.right + 1)
          expect(tile.top).toBeGreaterThanOrEqual(geometry.rail.top)
          expect(tile.bottom).toBeLessThanOrEqual(geometry.rail.bottom + 1)
        }
        if (width === 320)
          expect(
            new Set(geometry.tiles.map((tile) => tile.top)).size
          ).toBeGreaterThan(1)
        if (width === 390 && geometry.tiles.length === 8)
          expect(new Set(geometry.tiles.map((tile) => tile.top)).size).toBe(1)
      }).toPass({ timeout: 5_000 })
      for (const tile of await tiles.all()) await expect(tile).toBeInViewport()
    }
    await assertAllTilesFit()
    await page.screenshot({ path: testInfo.outputPath('eight-flora.png') })

    // The Wall is a reachable control adjacent to Turns in the bottom bar.
    const actionBar = page.locator('[data-action-bar]')
    const wall = actionBar.locator('[data-wall-chip]')
    await expect(wall).toBeVisible()
    await expect(wall).toBeInViewport()
    const bottom = await actionBar.evaluate((bar) => {
      const wall = bar
        .querySelector('[data-wall-chip]')!
        .getBoundingClientRect()
      const turns = bar
        .querySelector('[data-turns-left]')!
        .getBoundingClientRect()
      return { wall: wall.toJSON(), turns: turns.toJSON() }
    })
    expect(bottom.wall.width).toBeGreaterThanOrEqual(44)
    expect(bottom.wall.height).toBeGreaterThanOrEqual(44)
    expect(bottom.wall.left).toBeGreaterThanOrEqual(bottom.turns.right)
    expect(bottom.wall.left - bottom.turns.right).toBeLessThanOrEqual(16)
    expect(
      Math.abs(
        bottom.wall.top +
          bottom.wall.height / 2 -
          (bottom.turns.top + bottom.turns.height / 2)
      )
    ).toBeLessThanOrEqual(1)
    if (isMobile) await wall.tap()
    else await wall.click()
    await expect(
      page.getByRole('dialog', { name: 'Tiles in wall' })
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await page.mouse.move(1, 1)

    // Older saves can still hold consumables. They remain usable and wrap
    // with the full flora collection instead of creating another scroll row.
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const orbPath = '/src/systems/CelestialOrbSystem.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { CelestialOrbSystem, getCelestialOrbByYaku } = await import(
        orbPath
      )
      game.setConsumableUnlockResolver(() => true)
      // Pluto, Planet X and Venus.
      for (const family of ['Pairs', 'ThreePairs', 'Sequence']) {
        const orb = CelestialOrbSystem.createCelestialOrbInstance(
          getCelestialOrbByYaku(family)
        )
        if (!game.addCelestialOrb(orb))
          throw new Error('Held Orb fixture failed')
      }
    })
    await clearReveals(page)
    await expect(tiles).toHaveCount(11)
    await assertAllTilesFit()
    await page.screenshot({
      path: testInfo.outputPath('collectible-layout.png'),
    })
    expect(errors).toEqual([])
  })
}
