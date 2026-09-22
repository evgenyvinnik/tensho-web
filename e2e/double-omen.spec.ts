import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  for (const kind of ['gold', 'shop'] as const) {
    test(`earned Double Omen delivers ${kind} twice (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.goto(`/${language}/play`)
      const skip = page.locator('[data-game-action="skip"]')
      await expect(skip).toBeVisible()
      await page
        .getByRole('button', { name: "Don't show tips", exact: true })
        .click()
      await page.evaluate(
        async (seed) => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          game.startNewRun(seed)
          const state = game.getState()
          state.gold = 100
          state.wallTemplate = state.wallTemplate.filter(
            (tile: { isSeason: boolean }) => !tile.isSeason
          )
          state.roundManager.getCurrentAct().rounds[2].bossMandate = undefined
        },
        kind === 'gold' ? 459 : 105
      )
      await skip.click()
      const pending = page.getByTestId('pending-omens')
      await expect(pending).toBeVisible()
      await expect(pending).not.toHaveAttribute('open')
      await pending.locator('summary').click()
      await expect(
        pending.getByText(copy.omens.items.double_omen.description)
      ).toBeVisible()
      await expect
        .poll(() =>
          pending
            .locator('img')
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0
            )
        )
        .toBe(true)
      expect(
        await pending.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await pending.screenshot({ path: testInfo.outputPath('double-omen.png') })
      await pending.locator('summary').click()
      await skip.click()
      await expect(skip).toBeDisabled()
      if (kind === 'gold') {
        await expect(pending).toHaveCount(0)
        expect(
          await page.evaluate(async () => {
            const path = '/src/game/GameOrchestrator.ts'
            const { gameOrchestrator: game } = await import(path)
            return {
              gold: game.getState().gold,
              copies: game
                .getState()
                .omenSystem.getOmenHistory()
                .filter(
                  (o: { definitionId: string }) =>
                    o.definitionId === 'speed_omen'
                ).length,
            }
          })
        ).toEqual({ gold: 120, copies: 2 })
        return
      }
      await pending.locator('summary').click()
      await expect(pending.locator('[data-omen-id="decree_omen"]')).toHaveCount(
        2
      )
      await expect(pending.locator('[data-omen-cost]')).toHaveText([
        copy.omens.effects.shopFee.replace('{{amount}}', '5'),
        copy.omens.effects.shopFee.replace('{{amount}}', '5'),
      ])
      await pending.screenshot({
        path: testInfo.outputPath('copied-costs.png'),
      })
      await pending.locator('summary').click()
      // Actual earned Omens; only the winning deal is controlled for settlement.
      await page.evaluate(async () => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit } = await import(tilePath)
        const { eventBus } = await import(eventPath)
        const state = game.getState()
        state.targetScore = 1
        state.roundManager.getCurrentRound().scoreTarget = 1
        state.handTiles = [
          new Tile(TileSuit.Pinzu, 2, 'double-win-a'),
          new Tile(TileSuit.Pinzu, 2, 'double-win-b'),
        ]
        state.selectedTileIds.clear()
        state.faceDownTileIds.clear()
        eventBus.emit('tileDrawn', {
          tileId: 'double-win-a',
          tilesRemaining: state.wall.length - state.drawIndex,
        })
      })
      for (const id of ['double-win-a', 'double-win-b']) {
        const tile = page.locator(
          `[data-play-zone="hand"] [data-play-tile="${id}"]`
        )
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      await page.locator('[data-game-action="play"]').click()
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
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
      const rewards = await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        const state = game.getState()
        return {
          gold: state.gold,
          owned: state.decreeSystem.getOwnedDecrees().length,
          fee: state.lastRoundSummary.goldAfter - state.gold,
          offers: game.shop.state.itemOfferings
            .slice(0, 2)
            .map(
              (offer: {
                id: string
                finalCost: number
                item: { rarity: string }
              }) => ({
                id: offer.id,
                rarity: offer.item.rarity,
                cost: offer.finalCost,
              })
            ),
          copies: state.omenSystem
            .getOmenHistory()
            .filter(
              (o: { definitionId: string }) => o.definitionId === 'decree_omen'
            ).length,
        }
      })
      expect(rewards.fee).toBe(10)
      expect(rewards.copies).toBe(2)
      expect(rewards.offers).toHaveLength(2)
      for (const offer of rewards.offers) {
        expect(['ImperialDecree', 'HeavenlyOrdinance']).toContain(offer.rarity)
        await expect(
          page.locator(`[data-shop-item="${offer.id}"]`)
        ).toBeVisible()
      }
      await page.screenshot({
        path: testInfo.outputPath('copied-shop-rewards.png'),
      })
      for (const offer of rewards.offers) {
        const card = page.locator(`[data-shop-item="${offer.id}"]`)
        await card.getByRole('button').click()
        await expect(card).toHaveCount(0)
      }
      expect(
        await page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          const state = game.getState()
          return {
            gold: state.gold,
            owned: state.decreeSystem.getOwnedDecrees().length,
          }
        })
      ).toEqual({
        gold:
          rewards.gold -
          rewards.offers.reduce((sum, offer) => sum + offer.cost, 0),
        owned: rewards.owned + 2,
      })
    })
  }
}
