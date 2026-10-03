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

for (const kind of ['legacy', 'fallback', 'disabled'] as const) {
  test(`Phoenix respects ${kind} protection through actual play and reload`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    await page.goto('/es/play')
    await saved(page)
    await page.evaluate(async (kind) => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const persistencePath = '/src/game/classicPersistenceApp.ts'
      const decreePath = '/src/systems/DecreeSystem.ts'
      const mandatePath = '/src/config/mandateDefinitions.ts'
      const roundPath = '/src/systems/RoundManager.ts'
      const validationPath = '/src/game/validateClassicRun.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { initializeClassicPersistence } = await import(persistencePath)
      const { ALL_DECREES, DecreeSystem } = await import(decreePath)
      const { CRIMSON_HEART } = await import(mandatePath)
      const { SHOWDOWN_MANDATES } = await import(roundPath)
      const { parseClassicRunSnapshot } = await import(validationPath)
      const service = initializeClassicPersistence()
      const raw = service.getSnapshot().disk.raw
      game.startNewRun(7)
      if (kind === 'disabled') {
        game.processAction({ type: 'skip' })
        game.processAction({ type: 'skip' })
      }
      const state = game.getState()
      state.decreeSystem = new DecreeSystem()
      const definition = ALL_DECREES.find(
        (d: { id: string }) => d.id === 'decree-phoenix'
      )
      state.decreeSystem.acquireDecree({
        ...definition,
        stickers: kind === 'disabled' ? [] : [{ type: 'Eternal' }],
      })
      if (kind === 'fallback')
        state.decreeSystem.acquireDecree({ ...definition, edition: 'Negative' })
      state.mandateEffectSystem.deactivateMandate()
      state.roundManager.getCurrentRound().bossMandate = undefined
      if (kind === 'disabled') {
        // Round metadata uses the compact runtime catalog, not the richer
        // effect-system definition. Force this Showdown for focused coverage.
        state.roundManager.getCurrentRound().bossMandate =
          SHOWDOWN_MANDATES.find(
            (mandate: { id: string }) => mandate.id === CRIMSON_HEART.id
          )
        state.mandateEffectSystem.activateMandate(
          CRIMSON_HEART,
          state.handTiles,
          state.decreeSystem.getOwnedDecrees()
        )
      }
      state.flowerSystem.clear()
      state.seasonSystem.clear()
      state.targetScore = 1e9
      state.roundManager.getCurrentRound().scoreTarget = 1e9
      state.handsRemaining = 1
      parseClassicRunSnapshot(game.captureRun())
      if (!(await service.saveNewRun(raw)))
        throw new Error(`Fixture save failed: ${service.getSnapshot().status}`)
    }, kind)
    await page.reload()
    await saved(page)
    await activate(page.locator('[data-decree-instance]').first(), isMobile)
    const dialog = page.getByRole('dialog')
    if (kind !== 'disabled') {
      await expect(dialog).toContainText(
        es.decreeModifiers.eternalConflictDescription
      )
      await expect(dialog.locator('[data-decree-sell]')).toBeDisabled()
      await expect(dialog.locator('[data-decree-sell]')).toHaveText(
        es.decreeModifiers.eternalCannotSell
      )
    } else
      await expect(dialog).not.toContainText(
        es.decreeModifiers.eternalConflictDescription
      )
    await expect(
      dialog.locator('img[src$="decrees/phoenix.webp"]')
    ).toBeVisible()
    await expect(dialog).toHaveCSS('transform', 'none')
    const box = (await dialog.boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({ path: testInfo.outputPath(`${kind}-phoenix.png`) })
    await page.keyboard.press('Escape')
    for (let i = 0; i < 2; i++)
      await activate(
        page.locator('[data-play-zone="hand"] [data-play-tile]').last(),
        isMobile
      )
    await activate(page.locator('[data-game-action="play"]'), isMobile)
    await expect(page).toHaveURL(
      kind === 'fallback' ? /\/es\/shop$/ : /\/es\/game-over$/
    )
    if (kind === 'fallback')
      await expect.poll(async () => (await saved(page)).shop.opened).toBe(true)
    const settled = await saved(page)
    expect(settled.state.phase).toBe(kind === 'fallback' ? 'shop' : 'gameOver')
    expect(settled.state.handsPlayedThisRun).toBe(1)
    expect(settled.state.decreeSystem.ownedDecrees).toHaveLength(1)
    expect(settled.state.decreeSystem.ownedDecrees[0].instanceId).toBe(
      'owned-decree-1'
    )
    expect(settled.state.decreeSystem.maxSlots).toBe(5)
    await page.reload()
    expect(await saved(page)).toEqual(settled)
    expect(errors).toEqual([])
  })
}
