import { expect, test, type Locator } from '@playwright/test'
import { clearReveals } from './helpers/table'

for (const lang of ['en', 'es', 'ru'])
  test(`Bell latest lock, illustrated rules and saved continuation (${lang})`, async ({
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
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts',
        rulesPath = '/src/systems/RoundManager.ts',
        savePath = '/src/game/classicPersistenceApp.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { SHOWDOWN_MANDATES } = await import(rulesPath)
      const { initializeClassicPersistence } = await import(savePath)
      const validationPath = '/src/game/validateClassicRun.ts'
      const { parseClassicRunSnapshot } = await import(validationPath)
      const service = initializeClassicPersistence(),
        raw = service.getSnapshot().disk.raw
      game.startNewRun(7)
      const state = game.getState()
      // No Flowers or Seasons in later deals: every REDRAW draws one tile.
      state.wallTemplate = state.wallTemplate.filter(
        (t: { isBonus: boolean }) => !t.isBonus
      )
      state.roundManager.getCurrentAct().rounds[2].bossMandate =
        SHOWDOWN_MANDATES.find((m: { id: string }) => m.id === 'cerulean_bell')
      // Controlled targets; both round clears and transitions are real.
      for (let i = 0; i < 2; i++) {
        state.targetScore = 1
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
        game.exitShop()
      }
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
      if (!(await service.saveNewRun(raw)))
        throw new Error(`Fixture save failed: ${service.getSnapshot().status}`)
    })
    // startNewRun queues its starting Decrees for a reveal over the table.
    await clearReveals(page)
    const title = {
      en: 'Cerulean Bell',
      es: 'Campana Cerúlea',
      ru: 'Лазурный колокол',
    }[lang]!
    const consequence = {
      en: 'A tile locks each draw',
      es: 'Una ficha se bloquea por robo',
      ru: 'Кость блокируется при доборе',
    }[lang]!
    const control = page.locator('[data-mandate-details="cerulean_bell"]')
    // A phone opens the Bell's rule on tap; wider screens write it inline.
    await expect(control).toHaveAccessibleName(
      isMobile ? `${title}: ${consequence}` : title
    )
    if (isMobile) await activate(control)
    const dialog = isMobile
      ? page.getByRole('dialog', { name: title, exact: true })
      : control
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(consequence)
    const art = dialog.locator('img[src$="/cerulean-bell.webp"]')
    await expect(art).toBeVisible()
    expect(
      await art.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(512)
    expect(
      await dialog
        .locator('p')
        .evaluateAll((nodes) =>
          nodes.every((node) => node.scrollWidth <= node.clientWidth + 1)
        )
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('bell-rules.png') })
    if (isMobile) {
      await page.keyboard.press('Escape')
      await expect(control).toBeFocused()
    }
    const felt = page.locator('[data-play-zone="felt"] [data-play-tile]')
    const redraw = page.locator('[data-game-action="redraw"]')
    for (let i = 0; i < 6; i++) {
      const before = await saved()
      const locks = before.state.mandateEffectSystem.lockedTileIds
      expect(locks).toHaveLength(1)
      const tile = before.state.handTiles.find(
        (t: { id: string }) => !locks.includes(t.id)
      )
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${tile.id}"]`)
      )
      await expect(felt).toHaveCount(1)
      await expect(redraw).toBeEnabled()
      await activate(redraw)
      // One REDRAW: a free redraw while one is left, otherwise a Turn.
      const { handsRemaining: turns, redrawsRemaining: free } = before.state
      await expect
        .poll(async () => {
          const { handsRemaining, redrawsRemaining } = (await saved()).state
          return [handsRemaining, redrawsRemaining]
        })
        .toEqual(free > 0 ? [turns, free - 1] : [turns - 1, free])
      await expect(felt).toHaveCount(0)
      const now = await saved()
      // The tile went to the river and the Bell moved its one lock.
      expect(now.state.discards.map((t: { id: string }) => t.id)).toEqual([
        ...before.state.discards.map((t: { id: string }) => t.id),
        tile.id,
      ])
      expect(now.state.mandateEffectSystem.lockedTileIds).toHaveLength(1)
    }
    const after = await saved()
    await testInfo.attach('bell-save', {
      body: await page.evaluate(
        () => localStorage.getItem('tensho-classic-run-v1')!
      ),
      contentType: 'application/json',
    })
    await page.reload()
    expect(await saved()).toEqual(after)
    const ids = [
      after.state.mandateEffectSystem.lockedTileIds[0],
      after.state.handTiles.find(
        (t: { id: string }) =>
          t.id !== after.state.mandateEffectSystem.lockedTileIds[0]
      ).id,
    ]
    for (const id of ids)
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
    const play = page.locator('[data-game-action="play"]')
    await expect(play).toBeEnabled()
    await expect(felt).toHaveCount(2)
    await activate(play)
    await expect(felt).toHaveCount(0)
    await expect
      .poll(async () => (await saved()).state.handsRemaining)
      .toBe(after.state.handsRemaining - 1)
    expect(errors).toEqual([])
  })
