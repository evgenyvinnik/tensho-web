import { expect, test, type Locator } from '@playwright/test'
import { clearReveals, openTable, settleReveals } from './helpers/table'

test('Spanish purchase reasons fit a narrow screen and update with actual requirements', async ({
  page,
  isMobile,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() =>
    localStorage.setItem('tensho_tutorial_completed', 'true')
  )
  await openTable(page, '/es/play')
  const offers = await page.evaluate(async () => {
    // HMR can version a module URL; import the exact instance the app uses.
    const loaded = (path: string) =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .reverse()
        .find((url) => new URL(url).pathname === path) ?? path
    const { gameOrchestrator: game } = await import(
      loaded('/src/game/GameOrchestrator.ts')
    )
    const { ALL_DECREES, DecreeSystem } = await import(
      loaded('/src/systems/DecreeSystem.ts')
    )
    const { FateSealSystem, FATE_SEALS } = await import(
      loaded('/src/systems/FateSealSystem.ts')
    )
    const { eventBus } = await import(loaded('/src/game/EventBus.ts'))
    game.startNewRun(7)
    const state = game.getState()
    Object.assign(state, { phase: 'shop', lastCompletedRoundType: 'Small' })
    if (!game.shop.open()) throw new Error('Fixture shop failed')
    // Controlled requirements/inventory, not evidence of natural acquisition.
    state.flowerSystem.clear()
    state.decreeSystem = new DecreeSystem(5)
    state.gold = 20
    const seal = () =>
      FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_sage)
    const decree = ALL_DECREES.find(
      (d: { flowerRequirement?: number }) => d.flowerRequirement === 3
    )
    if (!decree) throw new Error('Missing Flower-gated Decree')
    const items = game.shop.state.itemOfferings
    for (const [index, itemType, item] of [
      [0, 'Decree', decree],
      [1, 'FateSeal', seal()],
    ] as const) {
      Object.assign(items[index], {
        itemType,
        item,
        finalCost: 4,
        baseCost: 4,
        editionCost: 0,
        edition: undefined,
        isPurchased: false,
        isLocked: false,
      })
    }
    eventBus.emit('shopUpdated', { isOpen: true })
    return items.map((o: { id: string }) => o.id)
  })
  await expect(page).toHaveURL(/\/es\/shop$/)
  await clearReveals(page)
  // Every offer opens its details on tap; Buy is the only purchase step.
  const card = (id: string) => page.locator(`[data-shop-offer="${id}"]`)
  const details = (id: string) =>
    page.locator(`[data-shop-offer-details="${id}"]`)
  const buy = (id: string) => page.locator(`[data-shop-buy="${id}"]`)
  // The reason sits in the panel's pinned footer, beside Buy.
  const blocked = (id: string) =>
    page
      .getByRole('dialog')
      .filter({ has: details(id) })
      .locator('[data-purchase-blocked]')
  const press = (target: Locator) => (isMobile ? target.tap() : target.click())
  const openDetails = async (id: string) => {
    await card(id).scrollIntoViewIfNeeded()
    await press(card(id))
    await expect(details(id)).toBeVisible()
  }
  const [flower, seal] = offers

  await openDetails(flower)
  await expect(blocked(flower)).toHaveText('Requiere 3 Flores; tienes 0.')
  await expect(buy(flower)).toBeDisabled()
  const panel = page.getByRole('dialog').filter({ has: details(flower) })
  expect(
    await panel.evaluate((node) =>
      [node, ...node.querySelectorAll<HTMLElement>('h2,p,button')].every(
        (child) => {
          const r = child.getBoundingClientRect()
          return (
            r.left >= 0 &&
            r.right <= innerWidth &&
            child.scrollWidth <= child.clientWidth + 1 &&
            (child === node || child.scrollHeight <= child.clientHeight + 1)
          )
        }
      )
    )
  ).toBe(true)
  await buy(flower).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath('flowers.png') })
  await page.keyboard.press('Escape')
  await expect(details(flower)).toHaveCount(0)

  // Only Decrees have slots: nothing limits a Seal, used as it is bought.
  await openDetails(seal)
  await expect(blocked(seal)).toHaveCount(0)
  await expect(buy(seal)).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(details(seal)).toHaveCount(0)

  await page.evaluate(async () => {
    // HMR can version a module URL; import the exact instance the app uses.
    const loaded = (path: string) =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .reverse()
        .find((url) => new URL(url).pathname === path) ?? path
    const { gameOrchestrator: game } = await import(
      loaded('/src/game/GameOrchestrator.ts')
    )
    const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
    const { eventBus } = await import(loaded('/src/game/EventBus.ts'))
    for (let rank = 1; rank <= 3; rank++)
      game
        .getState()
        .flowerSystem.addFlower(
          new Tile(TileSuit.Flower, rank, `availability-flower-${rank}`)
        )
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await clearReveals(page)
  for (const id of [flower, seal]) {
    await openDetails(id)
    await expect(blocked(id)).toHaveCount(0)
    await expect(buy(id)).toBeEnabled()
    await press(buy(id))
    if (id === seal) {
      // A Seal is used at once: it first asks which wall tiles it marks.
      const picker = page.locator('[data-seal-wall-dialog]')
      const tiles = picker.locator('[data-seal-wall-tile]:not([disabled])')
      await press(tiles.nth(0))
      await press(tiles.nth(1))
      await press(picker.locator('[data-seal-wall-confirm]'))
      await expect(picker).toHaveCount(0)
    }
    await expect(card(id)).toHaveCount(0)
    // A bought Decree is revealed; the player closes it to shop on.
    await settleReveals(page)
  }
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(
        performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .reverse()
          .find((url) => new URL(url).pathname === path) ?? path
      )
      return {
        gold: game.getState().gold,
        seals: game.getState().fateSeals.length,
        decrees: game.getState().decreeSystem.getOwnedDecrees().length,
      }
    })
  ).toEqual({ gold: 12, seals: 0, decrees: 1 })
  expect(errors).toEqual([])
})
