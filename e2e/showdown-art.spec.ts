import { expect, test, type Locator } from '@playwright/test'

const bosses = [
  ['amber_acorn', 'amber-acorn'],
  ['verdant_leaf', 'verdant-leaf'],
  ['violet_vessel', 'violet-vessel'],
  ['crimson_heart', 'crimson-heart'],
] as const

for (const lang of ['en', 'ru'])
  for (const [id, file] of bosses)
    test(`${id} has illustrated read-only localized rules (${lang})`, async ({
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
          game.processAction({ type: 'skip' })
          const act = game.getState().roundManager.getCurrentAct()
          act.rounds[2].bossMandate = SHOWDOWN_MANDATES.find(
            (m: { id: string }) => m.id === id
          )
          act.rounds[2].scoreTarget =
            act.rounds[0].scoreTarget * (id === 'violet_vessel' ? 6 : 2)
          game.processAction({ type: 'skip' })
          parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
          if (!(await service.saveNewRun(raw)))
            throw new Error('Fixture was not saved')
          return locale.mandates.items[id]
        },
        { id, lang }
      )
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
      await expect(opener).toHaveAccessibleName(copy.name)
      await expect(opener.locator('img')).toHaveAttribute(
        'src',
        new RegExp(`${file}\\.webp$`)
      )
      await activate(opener)
      const dialog = page.getByRole('dialog', { name: copy.name, exact: true })
      await expect(dialog).toHaveAccessibleDescription(copy.description)
      expect(
        await dialog.locator('img').evaluate(async (img: HTMLImageElement) => {
          await img.decode()
          return img.naturalWidth
        })
      ).toBe(512)
      expect(
        await dialog
          .locator('p')
          .evaluate((p) => p.scrollWidth <= p.clientWidth + 1)
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
      await expect(
        page.locator(
          `[data-play-zone="staging"] [data-play-tile="${firstTile}"]`
        )
      ).toBeVisible()
      expect(await saved()).toEqual(staged)
      await page.reload()
      // Engine selection is saved; temporary board staging is not restored.
      await expect.poll(saved).toEqual(staged)
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(0)
      await testInfo.attach('showdown-save', {
        body: await page.evaluate(
          () => localStorage.getItem('tensho-classic-run-v1')!
        ),
        contentType: 'application/json',
      })
      await expect(opener).toHaveAccessibleName(copy.name)
      expect(errors).toEqual([])
    })
