import { expect, test, type Page, type Locator } from '@playwright/test'

async function activate(control: Locator, touch: boolean) {
  if (touch) await control.tap()
  else await control.click()
}
async function saved(page: Page) {
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
  )
}

for (const negative of [false, true]) {
  test(`shop build supports exact-copy sale, capacity and reload (${negative ? 'Negative / Spanish' : 'ordinary / English'})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({
      reducedMotion: negative ? 'reduce' : 'no-preference',
    })
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    const lang = negative ? 'es' : 'en'
    await page.goto(`/${lang}/play`)
    await saved(page)
    const info = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const persistencePath = '/src/game/classicPersistenceApp.ts'
      const decreePath = '/src/systems/DecreeSystem.ts'
      const validationPath = '/src/game/validateClassicRun.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { initializeClassicPersistence } = await import(persistencePath)
      const { ALL_DECREES, DecreeSystem } = await import(decreePath)
      const { parseClassicRunSnapshot } = await import(validationPath)
      const service = initializeClassicPersistence()
      const raw = service.getSnapshot().disk.raw
      game.startNewRun(7)
      const state = game.getState()
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.targetScore = 1
      state.roundManager.getCurrentRound().scoreTarget = 1
      if (
        !game.processAction({
          type: 'play',
          tileIds: state.handTiles.slice(0, 2).map((t: { id: string }) => t.id),
        }).success
      )
        throw new Error('Play failed')
      if (!game.shop.open()) throw new Error('Shop failed')
      // Controlled inventory/offer fixtures isolate the real transaction path.
      state.decreeSystem = new DecreeSystem(5)
      const stone = ALL_DECREES.find(
        (d: { id: string }) => d.id === 'decree-polished-stone'
      )
      const eternal = state.decreeSystem.acquireDecree({
        ...stone,
        stickers: [{ type: 'Eternal' }],
      })
      const ordinary = state.decreeSystem.acquireDecree(stone)
      for (const id of ['river_tax', 'moonlit_seal', 'tanyao_dispensation']) {
        state.decreeSystem.acquireDecree(
          ALL_DECREES.find((d: { id: string }) => d.id === id)
        )
      }
      const extra = state.decreeSystem.acquireDecree({
        ...ALL_DECREES.find(
          (d: { id: string }) => d.id === 'extended_hand_grant'
        ),
        edition: 'Negative',
        sellValue: 6,
      })
      state.gold = 10
      const offer = game.shop.state.itemOfferings[0]
      Object.assign(offer, {
        itemType: 'Decree',
        item: ALL_DECREES.find(
          (d: { id: string }) => d.id === 'decree-jade-tablet'
        ),
        finalCost: 4,
        baseCost: 4,
        editionCost: 0,
        edition: undefined,
        isPurchased: false,
        isLocked: false,
      })
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
      if (!(await service.saveNewRun(raw)))
        throw new Error(`Save failed: ${service.getSnapshot().status}`)
      return {
        eternal: eternal.instanceId,
        ordinary: ordinary.instanceId,
        negative: extra.instanceId,
        offer: offer.id,
      }
    })
    await expect(page).toHaveURL(new RegExp(`/${lang}/shop$`))
    const panel = page.locator('[data-shop-build]')
    await expect(panel.getByRole('heading')).toHaveText(
      negative ? 'Tu combinación' : 'Your build'
    )
    await expect(panel.locator('[data-build-slots]')).toContainText('6 / 6')
    const before = await saved(page)
    const purchase = page.locator(`[data-shop-item="${info.offer}"] button`)
    await activate(purchase, isMobile)
    await expect(page.getByRole('alert')).toBeVisible()
    expect(
      await page.getByRole('alert').evaluate((node) => {
        const rect = node.getBoundingClientRect()
        return (
          document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          ) === node
        )
      })
    ).toBe(true)
    expect(await saved(page)).toEqual(before)
    const protectedCard = panel.locator(
      `[data-decree-instance="${info.eternal}"]`
    )
    await activate(protectedCard, isMobile)
    await expect(page.locator('[data-decree-sell]')).toBeDisabled()
    await page.keyboard.press('Escape')
    const target = panel.locator(
      `[data-decree-instance="${negative ? info.negative : info.ordinary}"]`
    )
    const stoneImage = protectedCard.locator('img')
    expect(
      await stoneImage.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(512)
    await expect(stoneImage).toHaveAttribute('src', /polished-stone\.webp$/)
    await activate(target, isMobile)
    await activate(page.locator('[data-decree-sell]'), isMobile)
    const confirmation = page.locator('dialog[open]')
    await expect(confirmation).toContainText(negative ? '6 de oro' : '3 gold')
    await activate(
      confirmation.getByRole('button', {
        name: negative ? 'Cancelar' : 'Cancel',
        exact: true,
      }),
      isMobile
    )
    expect(await saved(page)).toEqual(before)
    await expect(panel.getByRole('heading')).toBeFocused()
    await activate(target, isMobile)
    await activate(page.locator('[data-decree-sell]'), isMobile)
    await activate(
      confirmation.getByRole('button', {
        name: negative ? 'Confirmar' : 'Confirm',
        exact: true,
      }),
      isMobile
    )
    await expect(target).toHaveCount(0)
    await expect(panel.getByRole('heading')).toBeFocused()
    await expect(panel.locator('[data-build-slots]')).toContainText(
      negative ? '5 / 5' : '5 / 6'
    )
    const afterSale = await saved(page)
    expect(afterSale.state.gold).toBe(negative ? 16 : 13)
    expect(
      afterSale.state.decreeSystem.ownedDecrees.map(
        (d: { instanceId: string }) => d.instanceId
      )
    ).toContain(info.eternal)
    await activate(purchase, isMobile)
    if (negative) {
      await expect(page.getByRole('alert')).toBeVisible()
      expect(await saved(page)).toEqual(afterSale)
    } else {
      await expect(purchase).toHaveCount(0)
      await expect(panel.locator('[data-build-slots]')).toContainText('6 / 6')
      const afterPurchase = await saved(page)
      expect(afterPurchase.state.gold).toBe(9)
      expect(
        afterPurchase.state.decreeSystem.ownedDecrees.map(
          (d: { id: string }) => d.id
        )
      ).toContain('decree-jade-tablet')
    }
    await panel.scrollIntoViewIfNeeded()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    expect(
      await panel.evaluate((node) =>
        [
          ...node.querySelectorAll<HTMLElement>(
            'h2,p,[data-build-slots],button,img'
          ),
        ]
          .filter((child) => {
            const bounds = child.getBoundingClientRect()
            // Scroll art deliberately extends beyond its button border. Text
            // must fit its box; all controls and artwork must fit the viewport.
            return (
              bounds.left < 0 ||
              bounds.right > innerWidth ||
              (child.matches('h2,p,[data-build-slots]') &&
                child.clientWidth > 0 &&
                child.scrollWidth > child.clientWidth + 1)
            )
          })
          .map((child) => ({
            text: child.textContent,
            width: child.clientWidth,
            scroll: child.scrollWidth,
          }))
      )
    ).toEqual([])
    await page.screenshot({ path: testInfo.outputPath('shop-build.png') })
    const settled = await saved(page)
    await testInfo.attach('settled-shop-save', {
      body: await page.evaluate(
        () => localStorage.getItem('tensho-classic-run-v1')!
      ),
      contentType: 'application/json',
    })
    await page.reload()
    expect(await saved(page)).toEqual(settled)
    await expect(panel.locator('[data-build-slots]')).toContainText(
      negative ? '5 / 5' : '6 / 6'
    )
    const continueButton = page.getByRole('button', {
      name: negative
        ? 'Continuar a la siguiente ronda'
        : 'Continue to Next Round',
      exact: true,
    })
    await expect(continueButton).toBeInViewport()
    await activate(continueButton, isMobile)
    await expect(page).toHaveURL(new RegExp(`/${lang}/play$`))
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    expect(errors).toEqual([])
  })
}
