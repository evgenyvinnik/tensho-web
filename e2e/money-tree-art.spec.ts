import { expect, test } from '@playwright/test'

test('Money Tree portrait survives a localized mobile purchase and raises the interest cap', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/es/play')
  await expect(page.locator('[data-game-action="play"]')).toBeVisible()
  await page.evaluate(async () => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const shopPath = '/src/systems/TeaHouseSystem.ts'
    const eventPath = '/src/game/EventBus.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { TEA_HOUSE_BASE_CHARTERS, TEA_HOUSE_UPGRADED_CHARTERS } =
      await import(shopPath)
    const { eventBus } = await import(eventPath)
    game.startNewRun(7)
    game.addImperialCharter(
      TEA_HOUSE_BASE_CHARTERS.find(
        (item: { id: string }) => item.id === 'seed_pouch'
      )
    )
    Object.assign(game.getState(), {
      phase: 'shop',
      lastCompletedRoundType: 'Boss',
      gold: 100,
    })
    game.shop.open()
    // Offer fixture: this verifies a real paid purchase, not achievement eligibility.
    game.shop.state.charterOffering.item = TEA_HOUSE_UPGRADED_CHARTERS.find(
      (item: { id: string }) => item.id === 'money_tree'
    )
    game.shop.state.charterOffering.finalCost = 10
    eventBus.emit('shopUpdated', { isOpen: true })
  })
  await expect(page).toHaveURL(/\/es\/shop$/)
  const card = page.getByTestId('charter-card')
  const art = card.getByRole('img', { name: 'Carta imperial' })
  await expect(art).toHaveAttribute('src', /charters\/money-tree\.png$/)
  expect(
    await art.evaluate(async (node: HTMLImageElement) => {
      await node.decode()
      return node.naturalWidth
    })
  ).toBe(1254)
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByRole('button')).toBeInViewport()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('money-tree-320.png') })
  await card.getByRole('button').click()
  await page
    .getByRole('dialog', { name: 'Confirmar compra', exact: true })
    .getByRole('button', { name: 'Comprar', exact: true })
    .click()
  await expect(card).toHaveCount(0)
  expect(
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      return {
        gold: game.getState().gold,
        owned: game
          .getState()
          .charterSystem.getPurchasedIds()
          .has('money_tree'),
        cap: game.getState().charterSystem.calculateEffects().interestCap,
      }
    })
  ).toEqual({ gold: 90, owned: true, cap: 20 })
})
