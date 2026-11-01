import { expect, test } from '@playwright/test'
import { buyOffer, offerCard } from './helpers/shop'
import { clearReveals, handScoreTotal, settleReveals } from './helpers/table'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  // Turns are one shared budget: Sacrifice's lost redraw now costs a Turn,
  // and Blueprint copies it.
  for (const [id, rackSize, turns, score] of [
    ['decree-wide-grip', 16, 6, 45],
    ['decree-ancient-scroll', 10, 6, 345],
    ['decree-sacrifice', 14, 4, 405],
  ] as const) {
    test(`paid ${id} carries copied benefits and costs (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      await page.setViewportSize(
        isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/${language}/play`)
      const play = page.locator('[data-game-action="play"]')
      await expect(play).toBeVisible()
      await settleReveals(page, 2_000)
      const offerInfo = await page.evaluate(async (id) => {
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
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        // Isolate copied round resources: newly drawn Autumn/Spring are tested
        // separately and must not alter this fixture's expected base allowances.
        state.wallTemplate = state.wallTemplate.filter(
          (tile: { isBonus: boolean }) => !tile.isBonus
        )
        Object.assign(state, {
          phase: 'shop',
          gold: 40,
          lastCompletedRoundType: 'Small',
        })
        game.shop.open()
        // Isolate the offer; purchase, round entry, staging and payment remain UI-driven.
        const item = ALL_DECREES.find((d: { id: string }) => d.id === id)
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
      }, id)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      // startNewRun queues its starting Decrees for a reveal over the shop.
      await clearReveals(page)
      const card = offerCard(page, offerInfo.id)
      // The card shows the art and price; its name is in the label.
      const name = copy.decrees.items[id].name
      await expect(card).toHaveAccessibleName(
        new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      )
      await buyOffer(page, offerInfo.id)
      await expect(card).toHaveCount(0)
      // The bought Decree is revealed over the shop.
      await settleReveals(page)
      await page
        .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
        .click()
      await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
      // The new round can open on Flower and Season reveals.
      await settleReveals(page, 2_000)
      const resources = await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        const state = game.getState()
        return {
          rack: state.handTiles.length,
          redraws: state.redrawsRemaining,
          turns: state.handsRemaining,
          gold: state.gold,
          decrees: state.decreeSystem
            .getOwnedDecrees()
            .map((d: { id: string }) => d.id),
        }
      })
      expect(resources).toEqual({
        rack: rackSize,
        redraws: 0,
        turns,
        gold: 40 - offerInfo.cost,
        decrees: ['decree-blueprint', id],
      })
      await expect(
        page.locator('[data-play-zone="hand"] [data-play-tile]')
      ).toHaveCount(rackSize)
      const owned = page.getByRole('button', {
        name: copy.decrees.items[id].name,
        exact: true,
      })
      if (isMobile) await owned.tap()
      else await owned.focus()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(copy.decrees.items[id].description)
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await dialog.screenshot({ path: testInfo.outputPath('copied-rule.png') })
      await page.keyboard.press('Escape')
      // Keep the actual round's rack capacity but provide a reproducible three-tile play.
      await page.evaluate(async () => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          tilePath = '/src/core/Tile.ts',
          eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { Tile, TileSuit } = await import(tilePath)
        const { eventBus } = await import(eventPath)
        const state = game.getState()
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.handTiles = [
          ...[4, 5, 6].map(
            (rank) => new Tile(TileSuit.Souzu, rank, `copy-${rank}`)
          ),
          ...Array.from(
            { length: state.handTiles.length - 3 },
            (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `other-${i}`)
          ),
        ]
        state.wall = Array.from(
          { length: 40 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `wall-${i}`)
        )
        state.drawIndex = 0
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        eventBus.emit('tileSelected', { tileId: '', selectedCount: 0 })
      })
      for (const rank of [4, 5, 6]) {
        const tile = page.locator(
          `[data-play-zone="hand"] [data-play-tile="copy-${rank}"]`
        )
        if (isMobile) await tile.tap()
        else await tile.click()
      }
      // The forecast and the settled play share the middle of the table.
      await expect(handScoreTotal(page, 'preview')).toHaveText(String(score))
      await play.click()
      await expect(handScoreTotal(page, 'last')).toHaveText(String(score))
      expect(
        await page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          const state = game.getState()
          return {
            score: state.score,
            rack: state.handTiles.length,
            redraws: state.redrawsRemaining,
            turns: state.handsRemaining,
          }
        })
      ).toEqual({ score, rack: rackSize, redraws: 0, turns: turns - 1 })
      await page
        .locator('[data-hand-score]')
        .screenshot({ path: testInfo.outputPath('copy-paid.png') })
    })
  }
}
