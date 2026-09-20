import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`illustrated Wealth Engine is bought, inspected and paid with copying (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${language}/play`)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    await page
      .getByRole('button', { name: "Don't show tips", exact: true })
      .click()
    const offerInfo = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts',
        decreePath = '/src/systems/DecreeSystem.ts',
        eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { ALL_DECREES } = await import(decreePath)
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      state.decreeSystem.acquireDecree(
        ALL_DECREES.find((d: { id: string }) => d.id === 'decree-blueprint')
      )
      Object.assign(state, {
        phase: 'shop',
        gold: 20,
        lastCompletedRoundType: 'Small',
      })
      game.shop.open()
      // Controlled offer and starter build; acquisition below uses the paid shop transaction.
      const item = ALL_DECREES.find(
        (d: { id: string }) => d.id === 'decree-wealth-engine'
      )
      const offer = game.shop.state.itemOfferings[0]
      Object.assign(offer, {
        itemType: 'Decree',
        item,
        baseCost: item.cost,
        editionCost: 0,
        finalCost: item.cost,
        sellValue: item.sellValue,
        edition: undefined,
        sticker: undefined,
        isPurchased: false,
        isLocked: false,
      })
      eventBus.emit('shopUpdated', { isOpen: true })
      return { id: offer.id, cost: item.cost }
    })
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    const card = page.locator(`[data-shop-item="${offerInfo.id}"]`)
    const art = card.locator('img[src$="wealth-engine.png"]')
    expect(
      await art.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBeGreaterThan(0)
    await expect(card.getByRole('heading')).toHaveText(
      copy.decrees.items['decree-wealth-engine'].name
    )
    await card.screenshot({ path: testInfo.outputPath('wealth-shop.png') })
    if (isMobile) await card.getByRole('button').tap()
    else await card.getByRole('button').click()
    expect(
      await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return {
          gold: game.getState().gold,
          ids: game
            .getState()
            .decreeSystem.getOwnedDecrees()
            .map((d: { id: string }) => d.id),
        }
      })
    ).toEqual({
      gold: 20 - offerInfo.cost,
      ids: ['decree-blueprint', 'decree-wealth-engine'],
    })
    await page
      .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
    const before = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts',
        tilePath = '/src/core/Tile.ts',
        eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { eventBus } = await import(eventPath)
      const state = game.getState()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.seasonSystem.forceSetSeason('Winter', true)
      state.handTiles = [
        ...[4, 5, 6].map((n) => new Tile(TileSuit.Souzu, n, `wealth-${n}`)),
        ...Array.from(
          { length: 11 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `rack-${i}`)
        ),
      ]
      state.targetScore = 1
      state.roundManager.getCurrentRound().scoreTarget = 1
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Wealth fixture',
      })
      return state.gold
    })
    const owned = page.getByRole('button', {
      name: copy.decrees.items['decree-wealth-engine'].name,
      exact: true,
    })
    if (isMobile) await owned.tap()
    else await owned.focus()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(
      copy.decrees.items['decree-wealth-engine'].description
    )
    await expect(dialog.locator('img[src$="wealth-engine.png"]')).toBeVisible()
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await dialog.screenshot({
      path: testInfo.outputPath('wealth-inspector.png'),
    })
    await page.keyboard.press('Escape')
    for (const rank of [4, 5, 6]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="wealth-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    await page.locator('[data-game-action="play"]').click()
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    const receipt = await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.getState().lastRoundSummary
    })
    expect(receipt.decreeGold).toBe(2) // 2 owned × (Wealth + Blueprint) × Frostbite .5.
    expect(receipt.goldBefore).toBe(before)
    expect(receipt.goldAfter).toBe(
      before + receipt.baseReward + receipt.interest + 2
    )
    await expect(page.getByTestId('round-cash-out')).toContainText(
      `${copy.shop.payout.decrees} +2G`
    )
    await page
      .getByTestId('round-cash-out')
      .screenshot({ path: testInfo.outputPath('wealth-paid.png') })
  })
}
