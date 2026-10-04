import { expect, test, type Locator } from '@playwright/test'

for (const lang of ['en', 'es'])
  for (const upgraded of [false, true])
    test(`stock Charter immediately supplies a saved purchasable offer (${lang}, ${upgraded ? 'four' : 'three'})`, async ({
      page,
      isMobile,
    }, testInfo) => {
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
      const attach = async (name: string) =>
        testInfo.attach(name, {
          body: await page.evaluate(
            () => localStorage.getItem('tensho-classic-run-v1')!
          ),
          contentType: 'application/json',
        })
      await page.goto(`/${lang}/play`)
      await saved()
      const copy = await page.evaluate(
        async ({ lang, upgraded }) => {
          const gamePath = '/src/game/GameOrchestrator.ts',
            shopPath = '/src/systems/TeaHouseSystem.ts',
            savePath = '/src/game/classicPersistenceApp.ts',
            roundPath = '/src/systems/RoundManager.ts'
          const { gameOrchestrator: game } = await import(gamePath)
          const {
            TEA_HOUSE_BASE_CHARTERS: bases,
            TEA_HOUSE_UPGRADED_CHARTERS: upgrades,
          } = await import(shopPath)
          const { initializeClassicPersistence } = await import(savePath)
          const { BOSS_MANDATES } = await import(roundPath)
          const locale = await (
            await fetch(`/src/i18n/locales/${lang}.json`)
          ).json()
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          game.setCharterUnlockResolver(() => true)
          game.addImperialCharter(
            bases.find((c: { id: string }) => c.id === 'discount_sale')
          )
          if (upgraded)
            game.addImperialCharter(
              bases.find((c: { id: string }) => c.id === 'abundant_stock')
            )
          game.getState().roundManager.getCurrentAct().rounds[2].bossMandate =
            BOSS_MANDATES.find((m: { id: string }) => m.id === 'the_wall')
          // Controlled target, budget and earned-upgrade eligibility; real settlements.
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
              }).success
            )
              throw new Error('Fixture play failed')
            if (!game.shop.open()) throw new Error('Shop failed')
            if (i < 2) game.exitShop()
          }
          Object.assign(game.shop.state.charterOffering, {
            item: [...bases, ...upgrades].find(
              (c: { id: string }) =>
                c.id === (upgraded ? 'plentiful_stock' : 'abundant_stock')
            ),
          })
          if (!(await service.saveNewRun(raw))) throw new Error('Save failed')
          return locale
        },
        { lang, upgraded }
      )
      await expect(page).toHaveURL(new RegExp(`/${lang}/shop$`))
      const initial = await saved()
      await activate(
        page.locator(
          `[data-shop-item="${initial.shop.teaHouse.itemOfferings[0].id}"] button`
        )
      )
      await expect(
        page.locator(
          `[data-shop-item="${initial.shop.teaHouse.itemOfferings[0].id}"]`
        )
      ).toHaveCount(0)
      const before = await saved()
      await attach('stock-before')
      const card = page.getByTestId('charter-card')
      const art = card.getByRole('img')
      await expect(art).toHaveAttribute(
        'src',
        new RegExp(upgraded ? 'plentiful-stock.png$' : 'abundant-stock.webp$')
      )
      expect(
        await art.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
        )
      ).toBe(true)
      await card.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('stock-charter.png') })
      await activate(card.getByRole('button'))
      const dialog = page.getByRole('dialog', {
        name: copy.shop.ui.confirmPurchase,
        exact: true,
      })
      await activate(
        dialog.getByRole('button', { name: copy.common.cancel, exact: true })
      )
      expect(await saved()).toEqual(before)
      await activate(card.getByRole('button'))
      await activate(
        dialog.getByRole('button', { name: copy.shop.buy, exact: true })
      )
      await expect(card).toHaveCount(0)
      await expect(page.locator('[data-shop-item]')).toHaveCount(
        upgraded ? 3 : 2
      )
      const after = await saved()
      expect(after.shop.teaHouse.itemSlotCount).toBe(upgraded ? 4 : 3)
      expect(after.shop.teaHouse.itemOfferings.slice(0, -1)).toEqual(
        before.shop.teaHouse.itemOfferings
      )
      expect(after.shop.packs).toEqual(before.shop.packs)
      expect(after.shop.teaHouse.packOfferings).toEqual(
        before.shop.teaHouse.packOfferings
      )
      expect(after.state.gold).toBe(
        before.state.gold - before.shop.teaHouse.charterOffering.finalCost
      )
      expect(after.shop.spent).toBe(
        before.shop.spent + before.shop.teaHouse.charterOffering.finalCost
      )
      expect(after.shop.purchases).toBe(before.shop.purchases + 1)
      expect(after.shop.teaHouse.rerollsThisVisit).toBe(0)
      await attach('stock-after')
      await page.reload()
      expect(await saved()).toEqual(after)
      const added =
        after.shop.teaHouse.itemOfferings[
          after.shop.teaHouse.itemOfferings.length - 1
        ]
      const buy = page.locator(`[data-shop-item="${added.id}"] button`)
      await expect(buy).toBeEnabled()
      await buy.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('extra-offer.png') })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await activate(buy)
      await expect(buy).toHaveCount(0)
      expect((await saved()).state.gold).toBe(
        after.state.gold - added.finalCost
      )
      await activate(
        page.getByRole('button', { name: copy.shop.reroll, exact: true })
      )
      await expect(page.locator('[data-shop-item]')).toHaveCount(
        upgraded ? 4 : 3
      )
      const rerolled = await saved()
      await page.reload()
      expect(await saved()).toEqual(rerolled)
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      const round = await saved()
      for (const tile of round.state.handTiles.slice(0, 2))
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${tile.id}"]`)
        )
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(round.state.handsRemaining - 1)
      const played = await saved()
      await page.reload()
      expect(await saved()).toEqual(played)
      expect(errors).toEqual([])
    })
