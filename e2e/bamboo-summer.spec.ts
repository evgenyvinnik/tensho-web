import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { CURRENT_SNAPSHOT_VERSION } from '../src/game/migrateClassicSnapshot'
import { settleReveals, turnBudget } from './helpers/table'

/** What each shape's sheltering play pays under Summer. */
const PAYMENT = { quad: 491, complete: 3090 }
/**
 * One point above that payment, so the sheltering play leaves the round open
 * and any later scoring play clears it.
 */
const TARGET = { quad: PAYMENT.quad + 1, complete: PAYMENT.complete + 1 }

// Replay mode loads native captured legacy envelopes; production has no source imports.
const fixtureDir = process.env.BAMBOO_REPLAY_DIR
for (const language of ['en', 'es'])
  for (const shape of ['quad', 'complete'])
    test(`Bamboo shelters Summer through ${shape}, reload and next round (${language})`, async ({
      page,
      isMobile,
      baseURL,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const fixture = fixtureDir
        ? readFileSync(`${fixtureDir}/${shape}.json`, 'utf8')
        : null
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript((fixture) => {
        const events: unknown[] = []
        ;(window as unknown as { initialGesture: unknown[] }).initialGesture =
          events
        for (const type of ['pointerdown', 'pointerup', 'pointercancel'])
          document.addEventListener(
            type,
            (raw) => {
              const event = raw as PointerEvent
              events.push({
                type,
                x: event.clientX,
                y: event.clientY,
                tile: (event.target as Element)
                  ?.closest?.('[data-play-tile]')
                  ?.getAttribute('data-play-tile'),
                hit: document
                  .elementFromPoint(event.clientX, event.clientY)
                  ?.closest('[data-play-tile], [data-play-zone]')
                  ?.outerHTML.slice(0, 300),
              })
            },
            { capture: true }
          )
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
        if (fixture && !localStorage.getItem('tensho-classic-run-v1'))
          localStorage.setItem('tensho-classic-run-v1', fixture)
      }, fixture)
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
      if (!fixture) {
        await page.evaluate(async ({ shape, target }) => {
          const loadedModule = (path: string) => {
            const url = performance
              .getEntriesByType('resource')
              .map((e) => e.name)
              .reverse()
              .find((url) => new URL(url).pathname === path)
            if (!url) throw Error(`App did not load ${path}`)
            return url
          }
          const { gameOrchestrator: game } = await import(
            loadedModule('/src/game/GameOrchestrator.ts')
          )
          const { Tile, TileSuit, SeasonType, FlowerType } = await import(
            loadedModule('/src/core/Tile.ts')
          )
          const { initializeClassicPersistence } = await import(
            loadedModule('/src/game/classicPersistenceApp.ts')
          )
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          const state = game.getState()
          for (const decree of state.decreeSystem.getOwnedDecrees())
            state.decreeSystem.removeDecree(decree.id)
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          state.seasonSystem.setAct(1)
          state.bambooSummerProtection = false
          state.summerReserve = []
          state.handTiles =
            shape === 'quad'
              ? [
                  ...Array.from(
                    { length: 4 },
                    (_, i) => new Tile(TileSuit.Manzu, 1, `terminal-${i}`)
                  ),
                  ...Array.from(
                    { length: 10 },
                    (_, i) => new Tile(TileSuit.Pinzu, (i % 7) + 2, `hand-${i}`)
                  ),
                ]
              : [
                  ...[1, 1, 1, 9, 9, 9].map(
                    (rank, i) => new Tile(TileSuit.Manzu, rank, `terminal-${i}`)
                  ),
                  ...[2, 3, 4, 6, 7, 8].map(
                    (rank, i) => new Tile(TileSuit.Pinzu, rank, `sequence-${i}`)
                  ),
                  new Tile(TileSuit.Wind, 1, 'eye-0'),
                  new Tile(TileSuit.Wind, 1, 'hand-9'),
                ]
          state.wall = [
            Tile.createSeason(SeasonType.Summer, 'summer'),
            ...Array.from(
              { length: 40 },
              (_, i) => new Tile(TileSuit.Souzu, (i % 9) + 1, `wall-${i}`)
            ),
          ]
          state.wall.splice(
            1 + (shape === 'quad' ? 4 : 14),
            0,
            Tile.createSeason(SeasonType.Summer, 'later-summer')
          )
          state.deadWall = [
            Tile.createFlower(FlowerType.Bamboo, 'bamboo'),
            new Tile(TileSuit.Wind, 1, 'dead'),
          ]
          state.drawIndex = 0
          state.wallTemplate = state.wallTemplate.filter(
            (t: { isBonus: boolean }) => !t.isBonus
          )
          state.targetScore = target
          state.roundManager.getCurrentRound().scoreTarget = target
          state.selectedTileIds.clear()
          state.faceDownTileIds.clear()
          if (!(await service.saveNewRun(raw)))
            throw Error('Fixture save failed')
          // A real legacy checkpoint, not a fabricated current save missing progress.
          const old = JSON.parse(localStorage.getItem('tensho-classic-run-v1')!)
          old.snapshot.version = 1
          delete old.snapshot.state.bambooSummerProtection
          localStorage.setItem('tensho-classic-run-v1', JSON.stringify(old))
        }, { shape, target: TARGET[shape as keyof typeof TARGET] })
        await testInfo.attach(`legacy-${shape}`, {
          body: await page.evaluate(
            () => localStorage.getItem('tensho-classic-run-v1')!
          ),
          contentType: 'application/json',
        })
        await page.reload()
      }
      const legacy = await saved()
      expect(legacy.state.bambooSummerProtection ?? false).toBe(false)
      // Starting reveals of the fixture's fresh run may still be queued.
      await settleReveals(page)
      const play = page.locator('[data-game-action="play"]')
      const select = async (ids: string[]) => {
        for (const id of ids)
          await activate(
            page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`)
          )
      }
      // REDRAW refills from the live wall in order, so a one-tile REDRAW
      // draws exactly the next wall tile: the Summer placed there.
      const turnsBefore = await turnBudget(page)
      await select(['hand-9'])
      await activate(page.locator('[data-game-action="redraw"]'))
      await expect
        .poll(async () => (await saved()).state.summerReserve.length)
        .toBe(9)
      await settleReveals(page)
      const drawn = await saved()
      const turnsAfter = await turnBudget(page)
      expect(turnsAfter.turns + turnsAfter.free).toBe(
        turnsBefore.turns + turnsBefore.free - 1
      )
      expect(drawn.version).toBe(CURRENT_SNAPSHOT_VERSION)
      expect(drawn.state.bambooSummerProtection).toBe(false)
      expect(drawn.state.flowerSystem.flowers).toHaveLength(1)
      const reserved = drawn.state.summerReserve.map(
        (t: { id: string }) => t.id
      )
      const liveBefore = drawn.state.wall.length - drawn.state.drawIndex
      // The Summer's own token pictures it and explains the set-aside wall.
      const summer = page.locator('[data-flora-season]')
      await expect(summer).toHaveCount(1)
      const art = summer.locator('img[src*="summer-fan.webp"]')
      await expect
        .poll(() =>
          art.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth === 512
          )
        )
        .toBe(true)
      await activate(summer)
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(copy.flora.details.summer)
      expect(await saved()).toEqual(drawn)
      await activate(
        dialog.getByRole('button', { name: copy.common.close, exact: true })
      )
      await expect(dialog).toHaveCount(0)
      const staging: string[] = drawn.state.handTiles
        .map((t: { id: string }) => t.id)
        .filter(
          (id: string) => shape === 'complete' || id.startsWith('terminal-')
        )
      await select(staging)
      // Every tapped tile is on the felt, and the preview prices them all.
      await expect(
        page.locator('[data-play-zone="felt"] [data-play-tile]')
      ).toHaveCount(staging.length)
      await expect(page.locator('[data-hand-score]')).toHaveAttribute(
        'data-hand-score-state',
        'preview'
      )
      const forecast = Number(
        (await page.locator('[data-hand-score-total]').textContent())!.replace(
          /\D/g,
          ''
        )
      )
      expect(forecast).toBe(PAYMENT[shape as keyof typeof PAYMENT])
      const staged = await saved()
      expect(staged.state.bambooSummerProtection).toBe(false)
      expect(staged.state.summerReserve).toEqual(drawn.state.summerReserve)
      expect(staged.state.handsRemaining).toBe(drawn.state.handsRemaining)
      await activate(play)
      await expect
        .poll(async () => (await saved()).state.bambooSummerProtection)
        .toBe(true)
      const paid = await saved()
      expect(paid.state.summerReserve).toEqual([])
      expect(paid.state.score - drawn.state.score).toBe(forecast)
      expect(paid.state.handsRemaining).toBe(drawn.state.handsRemaining - 1)
      expect(paid.state.wall.length - paid.state.drawIndex).toBe(
        liveBefore + 9 - (shape === 'quad' ? 4 : 14)
      )
      for (const id of reserved)
        expect(paid.state.wall.some((t: { id: string }) => t.id === id)).toBe(
          true
        )
      await page.reload()
      expect(await saved()).toEqual(paid)
      // The next Summer is deliberately in the live draw path, not invoked by test code.
      const first = await page
        .locator('[data-play-zone="hand"] [data-play-tile]')
        .first()
        .getAttribute('data-play-tile')
      await select([first!])
      await activate(page.locator('[data-game-action="redraw"]'))
      await expect
        .poll(async () => (await saved()).state.seasonSystem.seasonStack.length)
        .toBe(2)
      await settleReveals(page)
      const later = await saved()
      expect(later.state.summerReserve).toEqual([])
      expect(later.state.bambooSummerProtection).toBe(true)
      await expect(summer).toHaveCount(2)
      for (const token of await summer.all()) {
        await activate(token)
        await expect(dialog).toContainText(copy.flora.details.summerSheltered)
        await activate(
          dialog.getByRole('button', { name: copy.common.close, exact: true })
        )
        await expect(dialog).toHaveCount(0)
      }
      await page.screenshot({
        path: testInfo.outputPath('summer-sheltered.png'),
      })
      expect(await saved()).toEqual(later)
      await page.reload()
      expect(await saved()).toEqual(later)
      // Any scoring play now clears the round: the target sits one point
      // above the first play's payment.
      await select(
        later.state.handTiles.slice(0, 2).map((t: { id: string }) => t.id)
      )
      await activate(play)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop/?$`))
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page).toHaveURL(new RegExp(`/${language}/play/?$`))
      await expect.poll(async () => (await saved()).state.currentRound).toBe(2)
      const next = await saved()
      expect(next.state.bambooSummerProtection).toBe(false)
      expect(next.state.seasonSystem.seasonStack).toEqual([])
      await page.reload()
      expect(await saved()).toEqual(next)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
