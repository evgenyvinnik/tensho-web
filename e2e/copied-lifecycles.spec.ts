import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es'])
  test(`copied Phoenix costs, two rescues and exact recovery (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const text = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = process.env.COPY_LIFECYCLE_REPLAY_FILE
      ? readFileSync(process.env.COPY_LIFECYCLE_REPLAY_FILE, 'utf8')
      : null
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
    const activate = (locator: Locator) =>
      isMobile ? locator.tap() : locator.click()
    const saved = async () => {
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      return page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    }
    const openedShop = async () => {
      await expect.poll(async () => (await saved()).shop.opened).toBe(true)
      return saved()
    }
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
    await saved()
    if (!replay) {
      await page.evaluate(async () => {
        const loaded = (path: string) => {
          const url = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .find((url) => new URL(url).pathname === path)
          if (!url) throw Error(`Missing native module ${path}`)
          return url
        }
        const { gameOrchestrator: game } = await import(
          loaded('/src/game/GameOrchestrator.ts')
        )
        const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
        const { ALL_DECREES, DecreeSystem } = await import(
          loaded('/src/systems/DecreeSystem.ts')
        )
        const { initializeClassicPersistence } = await import(
          loaded('/src/game/classicPersistenceApp.ts')
        )
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        const state = game.getState()
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.mandateEffectSystem.deactivateMandate()
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        state.decreeSystem = new DecreeSystem()
        for (const id of ['decree-blueprint', 'decree-phoenix'])
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === id)
          )
        const tiles = Array.from(
          { length: 110 },
          (_, i) => new Tile(TileSuit.Manzu, 1, `rescue-${i}`)
        )
        state.handTiles = tiles.slice(0, 14)
        state.wall = tiles.slice(14)
        state.wallTemplate = tiles
        state.drawIndex = 0
        state.summerReserve = []
        state.handsRemaining = 1
        state.targetScore = 1e9
        state.roundManager.getCurrentRound().scoreTarget = 1e9
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      })
      writeFileSync(
        info.outputPath('fixture.json'),
        await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        )
      )
      await page.reload()
    }
    const before = await saved()
    const [copy, source] = before.state.decreeSystem.ownedDecrees
    await activate(
      page
        .locator('[data-tutorial="decrees"]')
        .getByRole('button', {
          name: text.decrees.items['decree-blueprint'].name,
          exact: true,
        })
    )
    const dialog = page.getByRole('dialog')
    const details = dialog.locator('[data-copy-cost-details]')
    await expect(details).not.toHaveAttribute('open', '')
    await activate(details.locator('summary'))
    await expect(details).toHaveAttribute('open', '')
    for (const key of ['rescue', 'risk', 'limits'])
      await expect(details).toContainText(text.copyCosts[key])
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await dialog.screenshot({ path: info.outputPath('copy-costs.png') })
    await page.keyboard.press('Escape')
    const playPair = async () => {
      const tiles = page.locator('[data-play-zone="hand"] [data-play-tile]')
      await activate(tiles.nth(0))
      await activate(tiles.nth(1))
      await activate(page.locator('[data-game-action="play"]'))
    }
    await playPair()
    await expect(page).toHaveURL(/\/shop\/?$/)
    const first = await openedShop()
    expect(
      first.state.decreeSystem.ownedDecrees.map(
        (d: { instanceId: string }) => d.instanceId
      )
    ).toEqual([source.instanceId])
    expect(
      first.state.decreeSystem.ownedDecrees.some(
        (d: { instanceId: string }) => d.instanceId === copy.instanceId
      )
    ).toBe(false)
    await page.reload()
    expect(await saved()).toEqual(first)
    await activate(
      page.getByRole('button', { name: text.shop.ui.nextRound, exact: true })
    )
    await expect(page).toHaveURL(/\/play\/?$/)
    const next = await saved()
    for (let i = 0; i < next.state.handsRemaining; i++) {
      await playPair()
      if (i < next.state.handsRemaining - 1) {
        const current = await saved()
        expect(current.state.handsRemaining).toBe(
          next.state.handsRemaining - i - 1
        )
        expect(current.state.score).toBeLessThan(current.state.targetScore)
      }
    }
    await expect(page).toHaveURL(/\/shop\/?$/)
    const second = await openedShop()
    expect(second.state.decreeSystem.ownedDecrees).toEqual([])
    await page.reload()
    expect(await saved()).toEqual(second)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
    expect(errors).toEqual([])
  })
