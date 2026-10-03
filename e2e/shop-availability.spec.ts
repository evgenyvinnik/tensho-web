import { expect, test } from '@playwright/test'

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
  const flower = page.locator(`[data-shop-item="${offers[0]}"]`)
  const seal = page.locator(`[data-shop-item="${offers[1]}"]`)
  await expect(flower.locator('[data-purchase-blocked]')).toHaveText(
    'Requiere 3 Flores; tienes 0.'
  )
  await expect(seal.locator('[data-purchase-blocked]')).toHaveText(
    'Los espacios de consumibles están llenos. Usa un objeto durante el juego antes de comprar más.'
  )
  for (const card of [flower, seal]) {
    await expect(card.getByRole('button')).toBeDisabled()
    await card.scrollIntoViewIfNeeded()
    if (isMobile) await card.getByRole('heading').tap()
    else await card.getByRole('heading').click()
    await expect(card).toContainText('No disponible')
    expect(
      await card.evaluate((node) =>
        [...node.querySelectorAll<HTMLElement>('h3,p,button')].every(
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
        card === flower ? 'flowers.png' : 'consumables.png'
      ),
    })
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
  for (const card of [flower, seal]) {
    await expect(card.getByRole('button')).toBeEnabled()
    await expect(card.locator('[data-purchase-blocked]')).toHaveCount(0)
    if (isMobile) await card.getByRole('button').tap()
    else await card.getByRole('button').click()
    await expect(card).toHaveCount(0)
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
