import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { settleReveals } from './helpers/table'

/**
 * What this exact Frostbite Echo play pays; the fixture's target is set to it.
 * Three faces (15) and their Sequence (30), plus the Echo's half-strength
 * repeat of the Gold-Sealed first tile (2.5).
 */
const ECHO_SCORE = 47

const replayPath = process.env.ECHO_REPLAY_PATH
for (const language of ['en', 'es'])
  test(`Echo portrait, fractional reward, Treasure settlement and restore (${language})`, async ({
    page,
    isMobile,
    baseURL,
  }, info) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = replayPath ? readFileSync(replayPath, 'utf8') : null
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
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
    const number = (value: number) => value.toLocaleString(language)
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
    await saved()
    if (!replay) {
      await page.evaluate(async (target) => {
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
        const { Tile, TileSuit } = await import(loaded('/src/core/Tile.ts'))
        const { SealType } = await import(loaded('/src/core/TileModifier.ts'))
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
        state.decreeSystem = new DecreeSystem()
        for (const id of ['decree-echo-stone', 'decree-treasure-hunter'])
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === id)
          )
        state.flowerSystem.clear()
        state.seasonSystem.clear()
        state.seasonSystem.forceSetSeason('Winter', true)
        state.mandateEffectSystem.deactivateMandate()
        state.faceDownTileIds.clear()
        state.selectedTileIds.clear()
        state.handTiles = [4, 5, 6].map(
          (rank) => new Tile(TileSuit.Souzu, rank, `echo-${rank}`)
        )
        state.handTiles[0] = state.handTiles[0].withSeal(SealType.Gold)
        state.handTiles.push(
          ...[
            TileSuit.Manzu,
            TileSuit.Pinzu,
            TileSuit.Souzu,
            TileSuit.Wind,
            TileSuit.Dragon,
          ].map((suit, i) => new Tile(suit, 1, `held-${i}`))
        )
        state.wall = Array.from(
          { length: 70 },
          (_, i) => new Tile(TileSuit.Pinzu, (i % 9) + 1, `tail-${i}`)
        )
        state.drawIndex = 0
        state.summerReserve = []
        state.bambooSummerProtection = false
        state.targetScore = target
        state.roundManager.getCurrentRound().scoreTarget = target
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        if (!(await service.saveNewRun(raw))) throw Error('Fixture save failed')
      }, ECHO_SCORE)
      await info.attach('echo-fixture', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await page.reload()
    }
    // The fixture was saved from a fresh run, whose starting reveals may
    // still be queued.
    await settleReveals(page)
    const before = await saved()
    await activate(page.locator('[data-decree-instance]').first())
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(
      copy.decrees.items['decree-echo-stone'].description
    )
    const portrait = dialog.locator('img[src$="echo-stone.webp"]')
    expect(
      await portrait.evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(512)
    await page.screenshot({ path: info.outputPath('echo-portrait.png') })
    // A details popover legitimately covers the mat on short phones. Dismiss
    // through a visible, inert point outside it, not a control underneath it.
    await activate(page.locator('[data-tutorial="gold"]'))
    await expect(dialog).toHaveCount(0)
    await activate(page.locator('[data-decree-instance]').nth(1))
    await expect(dialog).toContainText(
      copy.decrees.items['decree-treasure-hunter'].description
    )
    await activate(page.locator('[data-tutorial="gold"]'))
    await expect(dialog).toHaveCount(0)
    // The Season's own token explains Frostbite.
    await activate(page.locator('[data-flora-season]'))
    await expect(dialog).toContainText(copy.flora.details.frostbite)
    await expect(dialog).not.toContainText(copy.flora.details.partial)
    expect(
      await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    await page.screenshot({ path: info.outputPath('frostbite-rule.png') })
    await activate(
      dialog.getByRole('button', { name: copy.common.close, exact: true })
    )
    await expect(dialog).toHaveCount(0)
    expect(await saved()).toEqual(before)
    for (const id of ['echo-4', 'echo-5', 'echo-6'])
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
      )
    await expect(page.locator('[data-hand-score-total]')).toHaveText(
      number(ECHO_SCORE)
    )
    await page.screenshot({ path: info.outputPath('fractional-forecast.png') })
    await activate(page.locator('[data-game-action="play"]'))
    await expect.poll(async () => (await saved()).state.phase).toBe('shop')
    await expect(page).toHaveURL(/\/shop\/?$/)
    const paid = await saved()
    expect(paid.state.score - before.state.score).toBe(ECHO_SCORE)
    // Treasure Hunter's 5 gold, halved by Frostbite, settles as 2.5.
    expect(paid.state.lastRoundSummary.decreeGold).toBe(2.5)
    expect(
      paid.state.gold -
        before.state.gold -
        paid.state.lastRoundSummary.netGoldChange
    ).toBe(4)
    expect(paid.state.handTiles.map((t: { id: string }) => t.id)).toEqual([
      'held-0',
      'held-1',
      'held-2',
      'held-3',
      'held-4',
    ])
    await page.reload()
    expect(await saved()).toEqual(paid)
    expect(errors).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      )
    ).toBe(true)
  })
