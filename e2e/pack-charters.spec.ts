import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

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
      const card = page.getByTestId('charter-card')
      if (charterId === 'star_chart') {
        await expect(card.getByRole('img')).toHaveAttribute(
          'src',
          /charters\/star-chart.webp$/
        )
        await expect
          .poll(() =>
            card
              .getByRole('img')
              .evaluate(
                (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
              )
          )
          .toBe(true)
      }
      await card.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('charter.png') })
      await activate(card.getByRole('button'))
      const confirmation = page.getByRole('dialog', {
        name: copy.shop.ui.confirmPurchase,
        exact: true,
      })
      await activate(
        confirmation.getByRole('button', {
          name: copy.common.cancel,
          exact: true,
        })
      )
      expect(await saved()).toEqual(before)
      await activate(card.getByRole('button'))
      await activate(
        confirmation.getByRole('button', { name: copy.shop.buy, exact: true })
      )
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
      await activate(page.locator(`[data-shop-pack="${pack.pack.id}"]`))
      const packDialog = page.getByRole('dialog')
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
      const claimed = await saved()
      const inventory =
        charterId === 'star_chart'
          ? claimed.state.celestialOrbs
          : claimed.state.voidScripts
      expect(inventory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: choice.data.id,
            instanceId: choice.data.instanceId,
            source: 'pack_open',
          }),
        ])
      )
      await page.reload()
      expect(await saved()).toEqual(claimed)
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      expect(errors).toEqual([])
    })
