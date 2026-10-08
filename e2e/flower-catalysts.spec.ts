import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

const replayPath = process.env.CATALYSTS_REPLAY_PATH
for (const language of ['en', 'es'])
  test(`explicit Flower payment, lost slot, cancellation and persistence (${language})`, async ({
    page,
    isMobile,
    baseURL,
  }, testInfo) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = replayPath ? readFileSync(replayPath, 'utf8') : null
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((replay) => {
      localStorage.setItem('tensho_tutorial_completed', 'true')
      localStorage.setItem('tensho_hints_disabled', 'true')
      if (replay && !localStorage.getItem('tensho-classic-run-v1'))
        localStorage.setItem('tensho-classic-run-v1', replay)
    }, replay)
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
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
    await saved()
    if (!replay) {
      await page.evaluate(async () => {
        const loaded = (path: string) => {
          const url = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .reverse()
            .find((url) => new URL(url).pathname === path)
          if (!url) throw Error(`App did not load ${path}`)
          return url
        }
        const { gameOrchestrator: game } = await import(
          loaded('/src/game/GameOrchestrator.ts')
        )
        const { Tile, FlowerType } = await import(loaded('/src/core/Tile.ts'))
        const { FlowerSystem } = await import(
          loaded('/src/systems/FlowerSystem.ts')
        )
        const { DecreeSystem, ALL_DECREES } = await import(
          loaded('/src/systems/DecreeSystem.ts')
        )
        const { initializeClassicPersistence } = await import(
          loaded('/src/game/classicPersistenceApp.ts')
        )
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        state.flowerSystem = new FlowerSystem(true)
        state.decreeSystem = new DecreeSystem()
        state.seasonSystem.clear()
        state.mandateEffectSystem.deactivateMandate()
        state.flowerSystem.addFlower(
          Tile.createFlower(FlowerType.Plum, 'catalyst-plum')
        )
        state.flowerSystem.addFlower(
          Tile.createFlower(FlowerType.Orchid, 'catalyst-orchid')
        )
        state.flowerSystem.addFlower(
          Tile.createFlower(FlowerType.Plum, 'duplicate-plum')
        )
        state.decreeSystem.addSlot()
        for (let i = 0; i < 5; i++)
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === 'moonlit_seal')
          )
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
          throw Error('Fixture winning play failed')
        if (state.phase !== 'shop' || !game.shop.open())
          throw Error('Fixture shop failed')
        state.gold = 0
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        const offer = game.shop.state.itemOfferings[0]
        Object.assign(offer, {
          itemType: 'Decree',
          item: {
            ...ALL_DECREES.find(
              (d: { id: string }) => d.id === 'tanyao_dispensation'
            ),
          },
          baseCost: 6,
          editionCost: 0,
          finalCost: 6,
          isPurchased: false,
          isLocked: false,
        })
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      await testInfo.attach('catalysts-fixture', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
    }
    await expect(page).toHaveURL(/\/shop$/)
    const before = await saved()
    const offerId = before.shop.teaHouse.itemOfferings[0].id
    const offer = page
      .locator('[data-shop-item]')
      .filter({ has: page.locator('[data-offer-flower]') })
      .first()
    await activate(offer.locator('[data-offer-flower]'))
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('button', { name: copy.common.confirm, exact: true })
    ).toBeDisabled()
    await activate(dialog.locator('input[value="catalyst-plum"]'))
    const confirmText = copy.shop.catalyst.confirm.replace(
      '{{flower}}',
      copy.flora.plum
    )
    await expect(
      dialog.getByRole('button', { name: confirmText, exact: true })
    ).toBeDisabled()
    await expect(dialog.getByRole('alert')).toHaveText(
      copy.shop.catalyst.noSpace
    )
    await expect(dialog.locator('[data-catalyst-consequences]')).toContainText(
      copy.shop.catalyst.loss2
    )
    for (const img of await dialog.locator('img').all())
      expect(
        await img.evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          return img.naturalWidth
        })
      ).toBe(512)
    expect(
      await dialog
        .locator('[data-flower-catalyst]')
        .evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath('catalyst-capacity.png'),
    })
    expect(await saved()).toEqual(before)
    await activate(
      dialog.getByRole('button', { name: copy.common.cancel, exact: true })
    )
    expect(await saved()).toEqual(before)

    // Sell one exact copy through the real inventory confirmation, still leaving
    // less than the six gold required for a normal purchase.
    const owned = page
      .locator('[data-shop-build] [data-decree-instance]')
      .first()
    await activate(owned)
    await activate(page.locator('[data-decree-sell]'))
    await activate(
      page
        .getByRole('dialog')
        .getByRole('button', { name: copy.common.confirm, exact: true })
    )
    const afterSale = await saved()
    expect(afterSale.state.gold).toBe(3)
    await activate(offer.locator('[data-offer-flower]'))
    await activate(dialog.locator('input[value="catalyst-plum"]'))
    await expect(
      dialog.getByRole('button', { name: confirmText, exact: true })
    ).toBeEnabled()
    expect(await saved()).toEqual(afterSale)
    await dialog
      .getByRole('button', { name: confirmText, exact: true })
      .scrollIntoViewIfNeeded()
    await page.screenshot({
      path: testInfo.outputPath('catalyst-confirmation.png'),
    })
    await activate(
      dialog.getByRole('button', { name: confirmText, exact: true })
    )
    await expect(page.locator('[data-catalyst-receipt]')).toBeVisible()
    const paid = await saved()
    expect(paid.state.gold).toBe(3)
    expect(paid.shop.spent).toBe(0)
    expect(paid.shop.purchases).toBe(1)
    expect(paid.state.decreeSystem.maxSlots).toBe(5)
    expect(paid.state.decreeSystem.ownedDecrees).toHaveLength(5)
    expect(
      paid.state.decreeSystem.ownedDecrees.find(
        (d: { id: string }) => d.id === 'tanyao_dispensation'
      ).sellValue
    ).toBe(0)
    expect(
      paid.state.flowerSystem.flowers.map((f: { type: string }) => f.type)
    ).toEqual(['Orchid'])
    expect(paid.state.flowerSystem.unlockedMutations).toContain('plum_overlap')
    expect(paid.state.flowerSystem.collectedTypes).toEqual(['Plum', 'Orchid'])
    await page.reload()
    expect(await saved()).toEqual(paid)
    await expect(page.locator(`[data-shop-item="${offerId}"]`)).toHaveCount(0)
    await expect(
      page.locator('[data-shop-build] [data-decree-instance]')
    ).toHaveCount(5)
    await expect(page.locator('[data-build-slots]')).toContainText('5')
    await activate(
      page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
    )
    await expect(page).toHaveURL(/\/play$/)
    const next = await saved()
    expect(next.state.flowerSystem).toEqual(paid.state.flowerSystem)
    expect(errors).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
  })
