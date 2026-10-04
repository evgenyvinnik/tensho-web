import { expect, test, type Locator } from '@playwright/test'

for (const lang of ['en', 'es'])
  for (const upgraded of [false, true]) {
    test(`discount Charter updates real prices, repairs old quotes and survives paid pack reload (${lang}, ${upgraded ? '50%' : '25%'})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() =>
        localStorage.setItem('tensho_tutorial_completed', 'true')
      )
      const activate = (control: Locator) =>
        isMobile ? control.tap() : control.click()
      const saved = async () => {
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        return page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
        )
      }
      await page.goto(`/${lang}/play`)
      await saved()
      const info = await page.evaluate(
        async ({ lang, upgraded }) => {
          const gamePath = '/src/game/GameOrchestrator.ts',
            shopPath = '/src/systems/TeaHouseSystem.ts',
            roundPath = '/src/systems/RoundManager.ts',
            savePath = '/src/game/classicPersistenceApp.ts',
            validationPath = '/src/game/validateClassicRun.ts'
          const { gameOrchestrator: game } = await import(gamePath)
          const {
            TEA_HOUSE_BASE_CHARTERS: bases,
            TEA_HOUSE_UPGRADED_CHARTERS: upgrades,
          } = await import(shopPath)
          const { BOSS_MANDATES } = await import(roundPath)
          const { initializeClassicPersistence } = await import(savePath)
          const { parseClassicRunSnapshot } = await import(validationPath)
          const locale = await (
            await fetch(`/src/i18n/locales/${lang}.json`)
          ).json()
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          game.setCharterUnlockResolver(() => true)
          if (
            upgraded &&
            !game.addImperialCharter(
              bases.find((c: { id: string }) => c.id === 'discount_sale')
            )
          )
            throw new Error('Base Charter failed')
          game.getState().roundManager.getCurrentAct().rounds[2].bossMandate =
            BOSS_MANDATES.find((m: { id: string }) => m.id === 'the_wall')
          // Controlled easy targets reach the real Boss settlement/shop path.
          // This is a transaction test, not organic progression or unlock evidence.
          for (let round = 0; round < 3; round++) {
            const state = game.getState()
            state.flowerSystem.clear()
            state.seasonSystem.clear()
            state.targetScore = 1
            state.roundManager.getCurrentRound().scoreTarget = 1
            if (
              !game.processAction({
                type: 'play',
                tileIds: state.handTiles
                  .slice(0, 2)
                  .map((t: { id: string }) => t.id),
              }).success
            )
              throw new Error(`Round ${round} play failed`)
            if (!game.shop.open()) throw new Error('Shop failed')
            if (round < 2) game.exitShop()
          }
          const id = upgraded ? 'liquidation_sale' : 'discount_sale'
          const offer = game.shop.state.charterOffering
          if (!offer) throw new Error('Missing Boss Charter offer')
          const cost = upgraded ? 7 : 10
          Object.assign(offer, {
            item: [...bases, ...upgrades].find(
              (c: { id: string }) => c.id === id
            ),
            baseCost: 10,
            editionCost: 0,
            finalCost: cost,
            sellValue: Math.floor(cost / 2),
          })
          const pack = game.shop.state.packOfferings[0]
          const packCost = Math.max(
            1,
            Math.floor(pack.baseCost * (upgraded ? 0.5 : 0.75))
          )
          game.getState().gold = cost + packCost
          parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
          if (!(await service.saveNewRun(raw)))
            throw new Error('Fixture save failed')
          return { id, cost, packId: pack.item.id, packCost, copy: locale }
        },
        { lang, upgraded }
      )
      await expect(page).toHaveURL(new RegExp(`/${lang}/shop$`))
      const before = await saved()
      await testInfo.attach('charter-before', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      const card = page.getByTestId('charter-card')
      await expect(card.getByRole('heading')).toHaveText(
        info.copy.charters.items[info.id].name
      )
      await activate(card.getByRole('button'))
      const confirmation = page.getByRole('dialog', {
        name: info.copy.shop.ui.confirmPurchase,
        exact: true,
      })
      await activate(
        confirmation.getByRole('button', {
          name: info.copy.common.cancel,
          exact: true,
        })
      )
      expect(await saved()).toEqual(before)
      await activate(card.getByRole('button'))
      await activate(
        confirmation.getByRole('button', {
          name: info.copy.shop.buy,
          exact: true,
        })
      )
      await expect(card).toHaveCount(0)
      await expect
        .poll(async () => (await saved()).state.gold)
        .toBe(info.packCost)
      const discounted = await saved()
      expect(discounted.random).toEqual(before.random)
      expect(discounted.shop.packs).toEqual(before.shop.packs)
      expect(discounted.shop.spent).toBe(info.cost)
      expect(discounted.shop.purchases).toBe(1)
      expect(discounted.shop.teaHouse.charterOffering.finalCost).toBe(info.cost)
      for (const key of ['itemOfferings', 'packOfferings']) {
        expect(discounted.shop.teaHouse[key]).toEqual(
          before.shop.teaHouse[key].map(
            (item: {
              baseCost: number
              editionCost: number
              finalCost: number
            }) => {
              const cost =
                item.finalCost === 0
                  ? 0
                  : Math.max(
                      1,
                      Math.floor(
                        (item.baseCost + item.editionCost) *
                          (upgraded ? 0.5 : 0.75)
                      )
                    )
              return {
                ...item,
                finalCost: cost,
                sellValue: Math.floor(cost / 2),
              }
            }
          )
        )
      }
      const buyPack = page.locator(`[data-shop-pack="${info.packId}"]`)
      await expect(buyPack).toBeEnabled()
      await expect(buyPack).toContainText(String(info.packCost))
      await buyPack.scrollIntoViewIfNeeded()
      await page.screenshot({
        path: testInfo.outputPath('discounted-shop.png'),
      })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      const currentRaw = await page.evaluate(
        () => localStorage.getItem('tensho-classic-run-v1')!
      )
      await testInfo.attach('charter-discounted', {
        body: currentRaw,
        contentType: 'application/json',
      })
      await page.reload()
      expect(await saved()).toEqual(discounted)
      // A published old save can own the Charter but retain pre-discount quotes.
      const legacy = JSON.parse(currentRaw)
      legacy.snapshot.shop.teaHouse.itemOfferings =
        before.shop.teaHouse.itemOfferings
      legacy.snapshot.shop.teaHouse.packOfferings =
        before.shop.teaHouse.packOfferings
      await testInfo.attach('charter-legacy', {
        body: JSON.stringify(legacy),
        contentType: 'application/json',
      })
      await page.evaluate(
        (raw) => localStorage.setItem('tensho-classic-run-v1', raw),
        JSON.stringify(legacy)
      )
      await page.reload()
      expect(await saved()).toEqual(discounted)
      await activate(buyPack)
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect.poll(async () => (await saved()).state.gold).toBe(0)
      const pending = await saved()
      expect(pending.shop.spent).toBe(info.cost + info.packCost)
      expect(pending.shop.purchases).toBe(2)
      await page.reload()
      expect(await saved()).toEqual(pending)
      const rewards = page.getByRole('dialog')
      await activate(rewards.locator('[aria-pressed]').first())
      await activate(
        rewards.getByRole('button', {
          name: info.copy.shop.confirmSelection,
          exact: true,
        })
      )
      await expect(rewards).toHaveCount(0)
      expect((await saved()).state.gold).toBe(0)
      await activate(
        page.getByRole('button', {
          name: info.copy.shop.ui.nextRound,
          exact: true,
        })
      )
      await expect(page).toHaveURL(new RegExp(`/${lang}/play$`))
      const round = await saved()
      for (const tile of round.state.handTiles.slice(0, 2))
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${tile.id}"]`)
        )
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(round.state.handsRemaining - 1)
      const after = await saved()
      await page.reload()
      expect(await saved()).toEqual(after)
      expect(errors).toEqual([])
    })
  }
