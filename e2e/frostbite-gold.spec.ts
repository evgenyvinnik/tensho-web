import { test, expect } from '@playwright/test'
import { buyOffer, offerCard, collectCashOut } from './helpers/shop'
import { closeOmenReveal, openTable, settleReveals } from './helpers/table'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`Frostbite gold settles once into a spendable localized cash-out (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openTable(page, `/${language}/play`)
    const previewGold = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts',
        tilePath = '/src/core/Tile.ts',
        modifiersPath = '/src/core/TileModifier.ts',
        decreesPath = '/src/systems/DecreeSystem.ts',
        eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { Tile, TileSuit } = await import(tilePath)
      const { EnhancementType, SealType } = await import(modifiersPath)
      const { ALL_DECREES } = await import(decreesPath)
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      // Deliberate economy build/deal; subsequent settlement and shop actions use real controls.
      state.handTiles = [
        ...[4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, `gold-${rank}`)
        ),
        ...Array.from(
          { length: 11 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `hand-${i}`)
        ),
      ]
      state.handTiles[0] = state.handTiles[0].withSeal(SealType.Gold)
      state.handTiles[13] = state.handTiles[13].withEnhancement(
        EnhancementType.Gold
      )
      state.gold = 10
      state.targetScore = 1
      state.roundManager.getCurrentRound().scoreTarget = 1
      for (const id of ['decree-coin-collector', 'decree-philosophers-stone']) {
        const owned = state.decreeSystem.acquireDecree(
          ALL_DECREES.find((d: { id: string }) => d.id === id)
        )
        if (!owned) throw Error('Fixture ownership failed')
        if (id === 'decree-philosophers-stone')
          owned.sticker = { type: 'Rental', goldPerRound: 3 }
      }
      state.seasonSystem.forceSetSeason('Winter', true)
      eventBus.emit('seasonActivated', {
        seasonType: 'Winter',
        effect: 'Frostbite gold fixture',
      })
      return game.previewScore(['gold-4', 'gold-5', 'gold-6']).goldEarned
    })
    expect(previewGold).toBe(4)
    // The new run's Decrees and the fixture's Winter are revealed first.
    await settleReveals(page, 2_000)
    for (const rank of [4, 5, 6]) {
      const tile = page.locator(
        `[data-play-zone="hand"] [data-play-tile="gold-${rank}"]`
      )
      if (isMobile) await tile.tap()
      else await tile.click()
    }
    await page.locator('[data-game-action="play"]').click()
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    // The swift clear's Omen is revealed first; the pay follows it.
    await closeOmenReveal(page)
    // The settlement arrives as toasts: one per source, rentals charged back.
    const seen = await collectCashOut(page, {
      screenshot: testInfo.outputPath('frostbite-cash-out.png'),
    })
    expect(
      [...seen.values()].reduce((sum, toast) => sum + (toast.value ?? 0), 0)
    ).toBe(9)
    expect(seen.get('rentals')).toMatchObject({ value: -3, fits: true })
    expect(seen.get('bonus')!.text).toContain(copy.shop.payout.bonus)
    expect(seen.get('decrees')!.text).toContain(
      `${(0.5).toLocaleString(language)}G`
    )
    expect([...seen.values()].every((toast) => toast.fits)).toBe(true)
    const snapshot = await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        summary: game.getState().lastRoundSummary,
        seasons: game.getState().seasonSystem.getSeasonStack(),
      }
    })
    expect(snapshot).toMatchObject({
      gold: 23,
      summary: {
        goldBefore: 14,
        goldAfter: 23,
        baseReward: 3,
        interest: 2,
        decreeGold: 0.5,
        heldGoldMarkReward: 3,
        rentalCost: 3,
        netGoldChange: 9,
      },
      seasons: [],
    })
    const offer = await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return game.shop.state.itemOfferings.find(
        (o: { isPurchased: boolean; finalCost: number }) =>
          !o.isPurchased && o.finalCost <= game.getState().gold
      )
    })
    expect(offer).toBeTruthy()
    await buyOffer(page, offer.id)
    await expect(offerCard(page, offer.id)).toHaveCount(0)
    // A bought Decree is revealed over the shop.
    await settleReveals(page)
    const after = await page.evaluate(async () => {
      const path = '/src/game/GameOrchestrator.ts'
      const { gameOrchestrator: game } = await import(path)
      return {
        gold: game.getState().gold,
        summary: game.getState().lastRoundSummary,
      }
    })
    expect(after.gold).toBe(23 - offer.finalCost)
    expect(after.summary).toEqual(snapshot.summary)
    await page
      .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
  })
}
