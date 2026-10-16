import { expect, test, type Locator } from '@playwright/test'
import { clearReveals } from './helpers/table'

const bosses = [
  ['amber_acorn', 'amber-acorn'],
  ['verdant_leaf', 'verdant-leaf'],
  ['violet_vessel', 'violet-vessel'],
  ['crimson_heart', 'crimson-heart'],
] as const

for (const [lang, fallbackFonts] of [
  ['en', false],
  ['ru', false],
  ['ru', true],
] as const)
  for (const [id, file] of bosses)
    test(`${id} has illustrated read-only localized rules (${lang}${fallbackFonts ? ', fallback fonts' : ''})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      if (fallbackFonts) await page.route('**/*.ttf', (route) => route.abort())
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() =>
        localStorage.setItem('tensho_tutorial_completed', 'true')
      )
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
      await page.goto(`/${lang}/play`)
      await saved()
      const copy = await page.evaluate(
        async ({ id, lang }) => {
          const gamePath = '/src/game/GameOrchestrator.ts',
            rulesPath = '/src/systems/RoundManager.ts',
            savePath = '/src/game/classicPersistenceApp.ts',
            validationPath = '/src/game/validateClassicRun.ts'
          const { gameOrchestrator: game } = await import(gamePath)
          const { SHOWDOWN_MANDATES } = await import(rulesPath)
          const { initializeClassicPersistence } = await import(savePath)
          const { parseClassicRunSnapshot } = await import(validationPath)
          const locale = await (
            await fetch(`/src/i18n/locales/${lang}.json`)
          ).json()
          const service = initializeClassicPersistence(),
            raw = service.getSnapshot().disk.raw
          game.startNewRun(7)
          const state = game.getState()
          const act = state.roundManager.getCurrentAct()
          act.rounds[2].bossMandate = SHOWDOWN_MANDATES.find(
            (m: { id: string }) => m.id === id
          )
          act.rounds[2].scoreTarget =
            act.rounds[0].scoreTarget * (id === 'violet_vessel' ? 6 : 2)
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
            throw new Error('Fixture was not saved')
          const { effect } = act.rounds[2].bossMandate
          return {
            ...locale.mandates.items[id],
            consequence: locale.mandateConsequence[effect.type].replace(
              '{{value}}',
              String(effect.value ?? 1)
            ),
          }
        },
        { id, lang }
      )
      // startNewRun queues its starting Decrees for a reveal over the table.
      await clearReveals(page)
      const before = await saved()
      const firstTile = before.state.handTiles[0].id
      await activate(
        page.locator(`[data-play-zone="hand"] [data-play-tile="${firstTile}"]`)
      )
      const opener = page.locator(`[data-mandate-details="${id}"]`)
      await expect
        .poll(async () => (await saved()).state.selectedTileIds)
        .toEqual([firstTile])
      const staged = await saved()
      expect(staged).toEqual({
        ...before,
        state: { ...before.state, selectedTileIds: [firstTile] },
      })
      // The header names the Showdown and its consequence; the art and the
      // full rule open on tap.
      const name = `${copy.name}: ${copy.consequence}`
      await expect(opener).toHaveAccessibleName(name)
      await expect(opener.locator('[data-mandate-consequence]')).toHaveText(
        copy.consequence
      )
      await activate(opener)
      const dialog = page.getByRole('dialog', { name: copy.name, exact: true })
      await expect(dialog).toContainText(copy.consequence)
      await expect(dialog).toContainText(copy.description)
      const art = dialog.locator(`img[src$="/${file}.webp"]`)
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
          .evaluateAll((ps) =>
            ps.every((p) => p.scrollWidth <= p.clientWidth + 1)
          )
      ).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath('showdown-rules.png') })
      expect(await saved()).toEqual(staged)
      await page.keyboard.press('Escape')
      await expect(opener).toBeFocused()
      const felt = page.locator('[data-play-zone="felt"] [data-play-tile]')
      await expect(felt).toHaveCount(1)
      await expect(felt).toHaveAttribute('data-play-tile', firstTile)
      expect(await saved()).toEqual(staged)
      await page.reload()
      // The save keeps the selection, but the table opens with nothing picked.
      await expect.poll(saved).toEqual(staged)
      await expect(felt).toHaveCount(0)
      await testInfo.attach('showdown-save', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await expect(opener).toHaveAccessibleName(name)
      expect(errors).toEqual([])
    })
