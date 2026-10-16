import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import { buyOffer, offerCard } from './helpers/shop'
import {
  clearReveals,
  openTable,
  settleReveals,
  swiftClear,
} from './helpers/table'

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
      await openTable(page, `/${language}/play`)
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
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      // Omens are earned by clearing a Small or Large round with Turns to
      // spare; the clears are real plays of a controlled winning deal.
      await swiftClear(page)
      await page
        .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
        .click()
      await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
      // The new round can open on Flower and Season reveals.
      await settleReveals(page, 2_000)
      const pending = page.getByTestId('pending-omens')
      await expect(pending).toBeVisible()
      await expect(pending).not.toHaveAttribute('open')
      await pending.locator('summary').click()
      await expect(
        pending.getByText(copy.omens.items.double_omen.description)
      ).toBeVisible()
      // The summary's Double Omen art and each pending Omen's art load.
      for (const image of await pending.locator('img').all())
        await expect
          .poll(() =>
            image.evaluate(
              (node: HTMLImageElement) => node.complete && node.naturalWidth > 0
            )
          )
          .toBe(true)
      expect(
        await pending.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
      ).toBe(true)
      await pending.screenshot({ path: testInfo.outputPath('double-omen.png') })
      await pending.locator('summary').click()
      // The Large round's Omen arrives twice.
      await swiftClear(page)
      if (kind === 'gold') {
        expect(
          await page.evaluate(async () => {
            const path = '/src/game/GameOrchestrator.ts'
            const { gameOrchestrator: game } = await import(path)
            return {
              // 5 Gold per swift clear so far (two), for each copy.
              omenGold: game.getState().lastRoundSummary.omenGold,
              copies: game
                .getState()
                .omenSystem.getOmenHistory()
                .filter(
                  (o: { definitionId: string }) =>
                    o.definitionId === 'speed_omen'
                ).length,
            }
          })
        ).toEqual({ omenGold: 20, copies: 2 })
        return
      }
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
        await expect(offerCard(page, offer.id)).toBeVisible()
      }
      await page.screenshot({
        path: testInfo.outputPath('copied-shop-rewards.png'),
      })
      for (const offer of rewards.offers) {
        await buyOffer(page, offer.id)
        await expect(offerCard(page, offer.id)).toHaveCount(0)
        // A bought Decree is revealed over the shop.
        await settleReveals(page)
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
