import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { packModal, savedLevel } from './helpers/shop'

for (const language of ['en', 'es'])
  for (const charterId of ['star_chart', 'omen_lens'])
    test(`${charterId} changes unopened shelf rewards on purchase (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() =>
        localStorage.setItem('tensho_tutorial_completed', 'true')
      )
      const activate = (node: Locator) => (isMobile ? node.tap() : node.click())
      const saved = async () => {
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        return page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
        )
      }
      await page.goto(`/${language}/play`)
      await saved()
      const target = await page.evaluate(async (charterId) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          shopPath = '/src/systems/TeaHouseSystem.ts',
          packsPath = '/src/systems/BlessingPackSystem.ts',
          orbPath = '/src/systems/CelestialOrbSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts',
          roundPath = '/src/systems/RoundManager.ts',
          randomPath = '/src/game/RunRandom.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const {
          TEA_HOUSE_BASE_CHARTERS: bases,
          TEA_HOUSE_UPGRADED_CHARTERS: upgrades,
        } = await import(shopPath)
        const { BlessingPackSystem } = await import(packsPath)
        const { getCelestialOrbsByRarity } = await import(orbPath)
        const { BOSS_MANDATES } = await import(roundPath)
        const { runRandom } = await import(randomPath)
        const { initializeClassicPersistence } = await import(savePath)
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        game.setCharterUnlockResolver(() => true)
        if (charterId === 'omen_lens')
          game.addImperialCharter(
            bases.find((c: { id: string }) => c.id === 'crystal_lens')
          )
        game.getState().roundManager.getCurrentAct().rounds[2].bossMandate =
          BOSS_MANDATES.find((m: { id: string }) => m.id === 'the_wall')
        // Controlled wins and budget; real round settlement and shop transitions.
        for (let i = 0; i < 3; i++) {
          const state = game.getState()
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          Object.assign(state, { gold: 100, targetScore: 1 })
          state.roundManager.getCurrentRound().scoreTarget = 1
          if (
            !game.processAction({
              type: 'play',
              tileIds: state.handTiles
                .slice(0, 2)
                .map((t: { id: string }) => t.id),
            }).success ||
            !game.shop.open()
          )
            throw new Error('Fixture round failed')
          if (i < 2) game.exitShop()
        }
        const snapshot = JSON.parse(JSON.stringify(game.captureRun()))
        snapshot.shop.teaHouse.charterOffering.item = [
          ...bases,
          ...upgrades,
        ].find((c: { id: string }) => c.id === charterId)
        for (const offer of snapshot.shop.teaHouse.packOfferings)
          offer.item.type = charterId === 'star_chart' ? 'Celestial' : 'Arcana'
        const packs = new BlessingPackSystem()
        packs.generateOfferingsForPacks(
          snapshot.shop.teaHouse.packOfferings.map(
            (o: { item: unknown }) => o.item
          )
        )
        snapshot.shop.packs = packs.toState()
        // Select a seeded chance-success branch, not a guarantee of organic odds.
        if (charterId === 'omen_lens') {
          let tries = 0
          while (runRandom.fork().next('packs') >= 0.2 && tries++ < 100)
            runRandom.next('packs')
          if (tries >= 100) throw new Error('No seeded Script branch')
        }
        snapshot.random = runRandom.toState()
        snapshot.consumableInstanceCounter =
          game.captureRun().consumableInstanceCounter
        game.restoreRun(snapshot)
        const ids = snapshot.shop.packs.currentOfferings.flatMap(
          (p: { contents: { data: { id: string } }[] }) =>
            p.contents.map((c) => c.data.id)
        )
        const target = getCelestialOrbsByRarity('Common').find(
          (orb: { id: string }) => !ids.includes(orb.id)
        )
        if (charterId === 'star_chart')
          game
            .getState()
            .celestialOrbSystem.onYakuScored(target.effect.targetYaku)
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
        return target?.id
      }, charterId)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      const before = await saved()
      await testInfo.attach('before-charter', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      // The Charter sells from the same offer card as items and packs.
      const charterOffer = before.shop.teaHouse.charterOffering.id
      const card = page.locator(`[data-shop-offer="${charterOffer}"]`)
      await expect(card).toHaveAttribute(
        'data-shop-offer-type',
        'ImperialCharter'
      )
      if (charterId === 'star_chart') {
        const art = card.locator('.shop-offer-art img')
        await expect(art).toHaveAttribute('src', /charters\/star-chart.webp$/)
        await expect
          .poll(() =>
            art.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
            )
          )
          .toBe(true)
      }
      await card.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('charter.png') })
      // Its details hold the only Buy step; closing them buys nothing.
      const details = page.locator(
        `[data-shop-offer-details="${charterOffer}"]`
      )
      await activate(card)
      await expect(details).toBeVisible()
      await activate(
        page
          .getByRole('dialog')
          .filter({ has: details })
          .getByRole('button', { name: copy.common.close, exact: true })
      )
      await expect(details).toHaveCount(0)
      expect(await saved()).toEqual(before)
      await activate(card)
      await activate(page.locator(`[data-shop-buy="${charterOffer}"]`))
      await expect(card).toHaveCount(0)
      const after = await saved()
      expect(after.state.gold).toBe(
        before.state.gold - before.shop.teaHouse.charterOffering.finalCost
      )
      expect(after.shop.teaHouse.packOfferings).toEqual(
        before.shop.teaHouse.packOfferings
      )
      const pack = after.shop.packs.currentOfferings[0]
      const choiceIndex = pack.contents.findIndex(
        (c: { type: string; data: { id: string } }) =>
          charterId === 'star_chart'
            ? c.data.id === target
            : c.type === 'VoidScript'
      )
      expect(choiceIndex).toBeGreaterThanOrEqual(0)
      const choice = pack.contents[choiceIndex]
      await testInfo.attach('after-charter', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      const packOffer = after.shop.teaHouse.packOfferings.find(
        (o: { item: { id: string } }) => o.item.id === pack.pack.id
      ).id
      await activate(page.locator(`[data-shop-offer="${packOffer}"]`))
      await activate(page.locator(`[data-shop-buy="${packOffer}"]`))
      const packDialog = packModal(page)
      await activate(
        packDialog.locator('[role="button"][aria-pressed]').nth(choiceIndex)
      )
      await page.screenshot({ path: testInfo.outputPath('reward.png') })
      await activate(
        packDialog.getByRole('button', {
          name: copy.shop.confirmSelection,
          exact: true,
        })
      )
      await expect(packDialog).toHaveCount(0)
      if (charterId === 'star_chart') {
        // A pack-chosen Orb is used the moment it is claimed: its reveal
        // shows the favored family rising, and nothing waits on the rail.
        const reveal = page.locator(`[data-orb-reveal="${choice.data.id}"]`)
        await expect(reveal).toBeVisible()
        await expect(
          reveal.locator(
            `[data-orb-reveal-level="${choice.data.effect.targetYaku}"]`
          )
        ).toHaveAttribute('data-orb-reveal-to', '2')
        await activate(reveal.getByRole('button').last())
        await expect(reveal).toHaveCount(0)
      }
      const claimed = await saved()
      if (charterId === 'star_chart') {
        expect(claimed.state.celestialOrbs).toEqual([])
        expect(savedLevel(claimed, choice.data.effect.targetYaku)).toBe(2)
        await expect(
          page.locator(
            `[data-shop-build] [data-yaku-upgrade="${choice.data.effect.targetYaku}"]`
          )
        ).toBeVisible()
      } else {
        expect(claimed.state.voidScripts).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: choice.data.id,
              instanceId: choice.data.instanceId,
              source: 'pack_open',
            }),
          ])
        )
      }
      await page.reload()
      expect(await saved()).toEqual(claimed)
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      expect(errors).toEqual([])
    })
