import { expect, test } from '@playwright/test'
import { offerCard, openOffer } from './helpers/shop'
import { clearReveals, settleReveals } from './helpers/table'

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
  await page.goto('/es/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  const offers = await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const sealPath = '/src/systems/FateSealSystem.ts'
    const busPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { ALL_DECREES, DecreeSystem } = await import(decreePath)
    const { FateSealSystem, FATE_SEALS } = await import(sealPath)
    const { eventBus } = await import(busPath)
    game.startNewRun(7)
    const state = game.getState()
    state.targetScore = 1
    state.roundManager.getCurrentRound().scoreTarget = 1
    if (
      !game.processAction({
        type: 'play',
        tileIds: state.handTiles.slice(0, 2).map((t: { id: string }) => t.id),
      }).success
    )
      throw new Error('Fixture play failed')
    if (!game.shop.open()) throw new Error('Fixture shop failed')
    // Controlled requirements/inventory, not evidence of natural acquisition.
    state.flowerSystem.clear()
    state.decreeSystem = new DecreeSystem(5)
    state.gold = 20
    const seal = () =>
      FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_the_sage)
    state.fateSeals = [seal(), seal(), seal()]
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
  // startNewRun queues its starting Decrees for a reveal over the shop.
  await clearReveals(page)
  const reasons = [
    'Requiere 3 Flores; tienes 0.',
    'Los espacios de consumibles están llenos. Usa un objeto durante el juego antes de comprar más.',
  ]
  // Each offer's details hold its Buy button and the engine's reason.
  for (const [index, id] of offers.slice(0, 2).entries()) {
    const details = await openOffer(page, id)
    await expect(details.locator('[data-purchase-blocked]')).toHaveText(
      reasons[index]
    )
    await expect(details.locator(`[data-shop-buy="${id}"]`)).toBeDisabled()
    expect(
      await details.evaluate((node) =>
        [...node.querySelectorAll<HTMLElement>('h2,p,button')].every(
          (child) => {
            const r = child.getBoundingClientRect()
            return (
              r.left >= 0 &&
              r.right <= innerWidth &&
              child.scrollWidth <= child.clientWidth + 1 &&
              child.scrollHeight <= child.clientHeight + 1
            )
          }
        )
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(
        index === 0 ? 'flowers.png' : 'consumables.png'
      ),
    })
    await page.keyboard.press('Escape')
    await expect(details).toHaveCount(0)
  }
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const tilePath = '/src/core/Tile.ts'
    const busPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { Tile, TileSuit } = await import(tilePath)
    const { eventBus } = await import(busPath)
    for (let rank = 1; rank <= 3; rank++)
      game
        .getState()
        .flowerSystem.addFlower(
          new Tile(TileSuit.Flower, rank, `availability-flower-${rank}`)
        )
    // Fixture release of shared capacity. There is no invented shop-use action.
    game.getState().fateSeals.pop()
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  for (const id of offers.slice(0, 2)) {
    const details = await openOffer(page, id)
    await expect(details.locator('[data-purchase-blocked]')).toHaveCount(0)
    const buy = details.locator(`[data-shop-buy="${id}"]`)
    await expect(buy).toBeEnabled()
    if (isMobile) await buy.tap()
    else await buy.click()
    await expect(offerCard(page, id)).toHaveCount(0)
    // A bought Decree is revealed over the shop.
    await settleReveals(page)
  }
  expect(
    await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        seals: game.getState().fateSeals.length,
        decrees: game.getState().decreeSystem.getOwnedDecrees().length,
      }
    })
  ).toEqual({ gold: 12, seals: 3, decrees: 1 })
  expect(errors).toEqual([])
})
