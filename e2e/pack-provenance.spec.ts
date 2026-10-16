import { expect, test } from '@playwright/test'
import { buyOffer, packModal } from './helpers/shop'
import { clearReveals, openTable, settleReveals } from './helpers/table'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  for (const kind of ['seal', 'orb'] as const) {
    test(`a purchased pack's ${kind} earns its unlock only when used (${language})`, async ({
      page,
      isMobile,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(
        isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
      )
      await openTable(page, `/${language}/play`)
      const fixture = await page.evaluate(async (kind) => {
        const gamePath = '/src/game/GameOrchestrator.ts'
        const sealPath = '/src/systems/FateSealSystem.ts'
        const orbPath = '/src/systems/CelestialOrbSystem.ts'
        const charterPath = '/src/systems/TeaHouseSystem.ts'
        const progressionPath = '/src/stores/progressionStore.ts'
        const archivePath = '/src/stores/archiveStore.ts'
        const eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { FateSealSystem, FATE_SEALS } = await import(sealPath)
        const { CelestialOrbSystem, CELESTIAL_ORBS } = await import(orbPath)
        const { TEA_HOUSE_BASE_CHARTERS } = await import(charterPath)
        const { useProgressionStore } = await import(progressionPath)
        const { useArchiveStore } = await import(archivePath)
        const { eventBus } = await import(eventPath)
        useProgressionStore.getState().resetProgression()
        useArchiveStore.getState().resetArchive()
        game.startNewRun(7)
        const base = kind === 'seal' ? 'crystal_lens' : 'star_chart'
        game.addImperialCharter(
          TEA_HOUSE_BASE_CHARTERS.find(
            (charter: { id: string }) => charter.id === base
          )
        )
        // Isolate the threshold and deal; payment, reward claim and use stay real.
        useProgressionStore.getState().updateStats({
          totalFateSealsUsed: 99,
          totalCelestialOrbsUsed: 99,
          packFateSealsUsed: 24,
          packCelestialOrbsUsed: 24,
        })
        Object.assign(game.getState(), {
          phase: 'shop',
          lastCompletedRoundType: 'Small',
          gold: 100,
        })
        game.shop.open()
        const offer = game.shop.state.packOfferings[0]
        const pack = game.shop.packOfferings.find(
          (p: { pack: { id: string } }) => p.pack.id === offer.item.id
        )
        Object.assign(offer.item, {
          type: kind === 'seal' ? 'Arcana' : 'Celestial',
          size: 'Normal',
          choiceCount: 1,
          selectCount: 1,
        })
        Object.assign(pack.pack, offer.item)
        const reward =
          kind === 'seal'
            ? FateSealSystem.createFateSealInstance(
                FATE_SEALS.seal_of_the_hermit
              )
            : CelestialOrbSystem.createCelestialOrbInstance(
                CELESTIAL_ORBS.pluto_orb
              )
        pack.contents = [
          {
            id: reward.instanceId,
            type: reward.type,
            name: reward.name,
            description: reward.description,
            rarity: 'common',
            data: reward,
          },
        ]
        pack.maxSelections = 1
        offer.finalCost = 4
        eventBus.emit('shopUpdated', { isOpen: true })
        return { offerId: offer.id as string, itemId: reward.instanceId }
      }, kind)
      // startNewRun queues its starting Decrees for a reveal over the shop.
      await clearReveals(page)
      const progress = () =>
        page.evaluate(async (kind) => {
          const progressionPath = '/src/stores/progressionStore.ts'
          const archivePath = '/src/stores/archiveStore.ts'
          const { useProgressionStore } = await import(progressionPath)
          const { useArchiveStore } = await import(archivePath)
          const store = useProgressionStore.getState()
          const upgrade = kind === 'seal' ? 'omen_lens' : 'observatory'
          return {
            count:
              kind === 'seal'
                ? store.stats.packFateSealsUsed
                : store.stats.packCelestialOrbsUsed,
            unlocked: store.isItemUnlocked(upgrade),
            archiveUnlocked: useArchiveStore
              .getState()
              .getEntry('charters', upgrade).isUnlocked,
          }
        }, kind)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      await buyOffer(page, fixture.offerId)
      const packDialog = packModal(page)
      await packDialog.locator('[role="button"][aria-pressed]').click()
      await packDialog
        .getByRole('button', { name: copy.shop.confirmSelection, exact: true })
        .click()
      await expect(packDialog).not.toBeVisible()
      expect(await progress()).toEqual({
        count: 24,
        unlocked: false,
        archiveUnlocked: false,
      })
      expect(
        await page.evaluate(async () => {
          const path = '/src/game/GameOrchestrator.ts'
          const { gameOrchestrator: game } = await import(path)
          return game.getState().gold
        })
      ).toBe(96)
      await page
        .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
        .click()
      await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      // The new round can open on Flower and Season reveals.
      await settleReveals(page, 2_000)
      // The reward waits on the item rail; its details hold the Use step.
      const token = page.locator(
        `[data-consumable-instance="${fixture.itemId}"]`
      )
      await token.click()
      const use = page.locator(`[data-use-item="${fixture.itemId}"]`)
      await expect(use).toBeEnabled()
      expect(await progress()).toEqual({
        count: 24,
        unlocked: false,
        archiveUnlocked: false,
      })
      await use.click()
      await expect(token).toHaveCount(0)
      expect(await progress()).toEqual({
        count: 25,
        unlocked: true,
        archiveUnlocked: true,
      })
      await page.reload()
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      expect(await progress()).toEqual({
        count: 25,
        unlocked: true,
        archiveUnlocked: true,
      })
    })
  }
}
