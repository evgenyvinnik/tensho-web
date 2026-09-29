import { expect, test, type Page, type Locator } from '@playwright/test'
import es from '../src/i18n/locales/es.json' with { type: 'json' }

async function activate(locator: Locator, touch: boolean) {
  if (touch) await locator.tap()
  else await locator.click()
}

async function saved(page: Page) {
  await expect(page.locator('[data-classic-save-status="saved"]')).toBeVisible()
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
  )
}

async function offer(page: Page, phoenix: boolean) {
  await page.addInitScript(() =>
    localStorage.setItem('tensho_tutorial_completed', 'true')
  )
  await page.goto('/es/play')
  await saved(page)
  await page.evaluate(async (phoenix) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const persistencePath = '/src/game/classicPersistenceApp.ts'
    const decreePath = '/src/systems/DecreeSystem.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { initializeClassicPersistence } = await import(persistencePath)
    const { ALL_DECREES, DecreeSystem } = await import(decreePath)
    const service = initializeClassicPersistence()
    const raw = service.getSnapshot().disk.raw
    game.startNewRun(7)
    const state = game.getState()
    state.decreeSystem = new DecreeSystem()
    state.roundManager.skipRound() // Fixture: the Small round has already ended.
    Object.assign(state, {
      phase: 'shop',
      gold: 100,
      lastCompletedRoundType: 'Small',
    })
    game.shop.open()
    const definition = ALL_DECREES.find(
      (d: { id: string }) =>
        d.id === (phoenix ? 'decree-phoenix' : 'decree-tax-collector')
    )
    Object.assign(game.shop.state.itemOfferings[0], {
      itemType: 'Decree',
      item: {
        ...definition,
        stickers: [{ type: 'Perishable', roundsRemaining: 1 }],
      },
      baseCost: 6,
      finalCost: 6,
      editionCost: 0,
      edition: undefined,
    })
    if (!(await service.saveNewRun(raw))) throw new Error('Fixture save failed')
  }, phoenix)
  await page.goto('/es/shop')
  await saved(page)
}

async function preparePlay(page: Page, phoenix: boolean) {
  await page.evaluate(async (phoenix) => {
    const gamePath = '/src/game/GameOrchestrator.ts'
    const persistencePath = '/src/game/classicPersistenceApp.ts'
    const { gameOrchestrator: game } = await import(gamePath)
    const { initializeClassicPersistence } = await import(persistencePath)
    const service = initializeClassicPersistence()
    const raw = service.getSnapshot().disk.raw
    const state = game.getState()
    state.flowerSystem.clear()
    state.seasonSystem.clear()
    state.mandateEffectSystem.deactivateMandate()
    state.roundManager.getCurrentRound().bossMandate = undefined
    state.targetScore = phoenix ? 1e9 : 1
    state.roundManager.getCurrentRound().scoreTarget = state.targetScore
    state.handsRemaining = 1
    if (!(await service.saveNewRun(raw)))
      throw new Error('Play fixture save failed')
  }, phoenix)
  await page.reload()
  await saved(page)
}

for (const phoenix of [false, true]) {
  test(
    phoenix
      ? 'Phoenix portrait follows purchase, last-round rescue and exact reload'
      : 'one-round Perishable survives a skip, pays once, then expires after the actual play',
    async ({ page, isMobile }, testInfo) => {
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await offer(page, phoenix)
      const id = phoenix ? 'decree-phoenix' : 'decree-tax-collector'
      const name = es.decrees.items[id].name
      const card = page
        .locator('[data-shop-item]')
        .filter({ has: page.getByRole('heading', { name, exact: true }) })
        .first()
      if (phoenix) {
        const image = card.locator('img[src$="decrees/phoenix.webp"]')
        await expect(image).toBeVisible()
        expect(
          await image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth === 512
          )
        ).toBe(true)
      }
      await activate(card.getByRole('button'), isMobile)
      expect((await saved(page)).state.gold).toBe(94)
      await activate(
        page.getByRole('button', { name: es.shop.ui.nextRound, exact: true }),
        isMobile
      )
      await expect(page).toHaveURL(/\/es\/play$/)
      expect(
        (await saved(page)).state.decreeSystem.ownedDecrees[0].stickers[0]
          .roundsRemaining
      ).toBe(1)
      if (!phoenix) {
        await activate(
          page.getByRole('button', { name: 'Saltar', exact: true }),
          isMobile
        )
        await expect
          .poll(async () => (await saved(page)).state.currentRound)
          .toBe(3)
        expect(
          (await saved(page)).state.decreeSystem.ownedDecrees[0].stickers[0]
            .roundsRemaining
        ).toBe(1)
      }
      await activate(page.locator('[data-decree-instance]').first(), isMobile)
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(
        es.decreeModifiers.remaining.replace('{{remaining}}', '1')
      )
      await expect(dialog).toContainText(
        es.decreeModifiers.perishableDescription
      )
      if (phoenix)
        await expect(
          dialog.locator('img[src$="decrees/phoenix.webp"]')
        ).toBeVisible()
      await page.screenshot({
        path: testInfo.outputPath(
          phoenix ? 'phoenix-last-round.png' : 'preserved-clock.png'
        ),
      })
      await page.keyboard.press('Escape')
      await preparePlay(page, phoenix)
      for (let i = 0; i < 2; i++)
        await activate(
          page.locator('[data-play-zone="hand"] [data-play-tile]').last(),
          isMobile
        )
      await activate(page.locator('[data-game-action="play"]'), isMobile)
      await expect(page).toHaveURL(/\/es\/shop$/)
      // The round-end checkpoint precedes the route effect that opens and
      // saves the new shop. Compare reloads only after that visit is durable.
      await expect.poll(async () => (await saved(page)).shop.opened).toBe(true)
      const settled = await saved(page)
      expect(settled.state.handsPlayedThisRun).toBe(1)
      if (phoenix)
        expect(settled.state.decreeSystem.ownedDecrees).toHaveLength(0)
      else {
        expect(settled.state.decreeSystem.ownedDecrees[0]).toMatchObject({
          isDebuffed: true,
          stickers: [{ type: 'Perishable', roundsRemaining: 0 }],
        })
        expect(settled.state.lastRoundSummary.decreeGold).toBe(4)
      }
      await page.reload()
      expect(await saved(page)).toEqual(settled)
      expect(errors).toEqual([])
    }
  )
}
