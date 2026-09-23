import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`penalties cannot unlock Plentiful Stock; payment earns its illustrated upgrade (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.goto(`/${language}/play`)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    await page
      .getByRole('button', { name: "Don't show tips", exact: true })
      .click()
    // Controlled prerequisite, hand and Boss-shop fixtures; payment, penalty,
    // unlock, acquisition and persisted reload use the real application.
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const charterPath = '/src/systems/TeaHouseSystem.ts'
      const progressionPath = '/src/stores/progressionStore.ts'
      const tilePath = '/src/core/Tile.ts'
      const mandatePath = '/src/config/mandateDefinitions.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { TEA_HOUSE_BASE_CHARTERS } = await import(charterPath)
      const { useProgressionStore } = await import(progressionPath)
      const { Tile, TileSuit } = await import(tilePath)
      const { THE_TOOTH } = await import(mandatePath)
      const { eventBus } = await import(eventPath)
      useProgressionStore.getState().resetProgression()
      game.startNewRun(7)
      game.addImperialCharter(
        TEA_HOUSE_BASE_CHARTERS.find(
          (c: { id: string }) => c.id === 'abundant_stock'
        )
      )
      useProgressionStore.getState().updateStats({ totalGoldSpent: 2499 })
      const state = game.getState()
      state.seasonSystem.clear()
      state.flowerSystem.clear()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      state.gold = 100
      state.targetScore = 1e9
      state.roundManager.getCurrentRound().scoreTarget = 1e9
      state.handTiles = [2, 3, 4].map(
        (rank) => new Tile(TileSuit.Souzu, rank, `spending-${rank}`)
      )
      state.selectedTileIds.clear()
      state.faceDownTileIds.clear()
      state.mandateEffectSystem.activateMandate(THE_TOOTH, state.handTiles, [])
      eventBus.emit('tileDrawn', {
        tileId: 'spending-2',
        tilesRemaining: state.wall.length - state.drawIndex,
      })
    })
    for (const rank of [2, 3, 4]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="spending-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    await page.locator('[data-game-action="play"]').click()
    const progress = () =>
      page.evaluate(async () => {
        const path = '/src/stores/progressionStore.ts'
        const { useProgressionStore } = await import(path)
        return {
          spent: useProgressionStore.getState().stats.totalGoldSpent,
          unlocked: useProgressionStore
            .getState()
            .isItemUnlocked('plentiful_stock'),
        }
      })
    expect(await progress()).toEqual({ spent: 2499, unlocked: false })
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { eventBus } = await import(eventPath)
      if (game.getState().gold !== 97)
        throw new Error('Tooth penalty did not settle')
      Object.assign(game.getState(), {
        phase: 'shop',
        lastCompletedRoundType: 'Boss',
      })
      game.shop.open()
      game.shop.state.charterOffering.finalCost = 1
      eventBus.emit('shopUpdated', { isOpen: true })
    })
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    const buyCharter = async () => {
      await page.getByTestId('charter-card').getByRole('button').click()
      await page
        .getByRole('dialog', {
          name: copy.shop.ui.confirmPurchase,
          exact: true,
        })
        .getByRole('button', { name: copy.shop.buy, exact: true })
        .click()
    }
    await buyCharter()
    expect(await progress()).toEqual({ spent: 2500, unlocked: true })
    await page
      .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const charterPath = '/src/systems/TeaHouseSystem.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { TEA_HOUSE_UPGRADED_CHARTERS } = await import(charterPath)
      const { eventBus } = await import(eventPath)
      Object.assign(game.getState(), {
        phase: 'shop',
        lastCompletedRoundType: 'Boss',
      })
      game.shop.open()
      game.shop.state.charterOffering.item = TEA_HOUSE_UPGRADED_CHARTERS.find(
        (c: { id: string }) => c.id === 'plentiful_stock'
      )
      game.shop.state.charterOffering.finalCost = 10
      eventBus.emit('shopUpdated', { isOpen: true })
    })
    const card = page.getByTestId('charter-card')
    const art = card.locator('img[src$="plentiful-stock.png"]')
    await expect(art).toBeVisible()
    expect(
      await art.evaluate(async (node: HTMLImageElement) => {
        await node.decode()
        return node.naturalWidth
      })
    ).toBe(1254)
    await card.scrollIntoViewIfNeeded()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('plentiful-stock.png') })
    await buyCharter()
    expect(await progress()).toEqual({ spent: 2510, unlocked: true })
    expect(
      await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return game.getState().charterSystem.calculateEffects().shopSlots
      })
    ).toBe(2) // Two extra slots above the shop's default two.
    await page
      .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
    expect(
      await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        Object.assign(game.getState(), {
          phase: 'shop',
          lastCompletedRoundType: 'Small',
        })
        game.shop.open()
        return game.shop.state.itemOfferings.length
      })
    ).toBe(4)
    await page.reload()
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    expect(await progress()).toEqual({ spent: 2510, unlocked: true })
  })
}
