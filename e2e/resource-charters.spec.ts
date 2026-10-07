import { expect, test, type Locator } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es'])
  for (const charterId of ['swift_hand', 'full_palette'])
    test(`resource Charter ${charterId} purchase, play and resume (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const copy = JSON.parse(
        readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
      )
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        localStorage.setItem('tensho_tutorial_completed', 'true')
        localStorage.setItem('tensho_hints_disabled', 'true')
      })
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
      await page.goto(`/${language}/play`)
      await saved()
      await page.evaluate(async (charterId) => {
        const gamePath = '/src/game/GameOrchestrator.ts',
          shopPath = '/src/systems/TeaHouseSystem.ts',
          savePath = '/src/game/classicPersistenceApp.ts',
          roundPath = '/src/systems/RoundManager.ts',
          progressionPath = '/src/stores/progressionStore.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const {
          TEA_HOUSE_BASE_CHARTERS: bases,
          TEA_HOUSE_UPGRADED_CHARTERS: upgrades,
        } = await import(shopPath)
        const { initializeClassicPersistence } = await import(savePath)
        const { BOSS_MANDATES } = await import(roundPath)
        const { useProgressionStore } = await import(progressionPath)
        useProgressionStore.getState().unlockItem(`unlock_${charterId}`, false)
        if (!useProgressionStore.getState().isItemUnlocked(charterId))
          throw new Error('Controlled upgrade eligibility failed')
        const service = initializeClassicPersistence(),
          raw = service.getSnapshot().disk.raw
        game.startNewRun(7)
        for (const decree of game.getState().decreeSystem.getOwnedDecrees())
          game.getState().decreeSystem.removeDecree(decree.id)
        game.addImperialCharter(
          bases.find(
            (c: { id: string }) =>
              c.id ===
              (charterId === 'swift_hand' ? 'steady_hand' : 'brush_stroke')
          )
        )
        const state = game.getState()
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        state.roundManager.getCurrentAct().rounds[2].bossMandate =
          BOSS_MANDATES.find((m: { id: string }) => m.id === 'the_wall')
        // Controlled targets and savings; all round transitions and payments are real.
        for (let i = 0; i < 3; i++) {
          state.flowerSystem.clear()
          state.seasonSystem.clear()
          Object.assign(state, { gold: 100, targetScore: 1 })
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
          if (i < 2) game.exitShop()
        }
        const snapshot = JSON.parse(JSON.stringify(game.captureRun()))
        snapshot.shop.teaHouse.charterOffering.item = upgrades.find(
          (c: { id: string }) => c.id === charterId
        )
        game.restoreRun(snapshot)
        if (!(await service.saveNewRun(raw)))
          throw new Error('Fixture save failed')
      }, charterId)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      const before = await saved()
      await testInfo.attach('before-charter', {
        body: await page.evaluate(() =>
          JSON.stringify({
            run: localStorage.getItem('tensho-classic-run-v1'),
            progression: localStorage.getItem('tensho-progression'),
          })
        ),
        contentType: 'application/json',
      })
      const card = page.getByTestId('charter-card'),
        art = card.getByRole('img')
      await expect(art).toHaveAttribute(
        'src',
        new RegExp(`${charterId.replace('_', '-')}.webp$`)
      )
      await expect
        .poll(() =>
          art.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth === 512
          )
        )
        .toBe(true)
      await card.scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('charter.png') })
      await activate(card.getByRole('button'))
      const dialog = page.getByRole('dialog', {
        name: copy.shop.ui.confirmPurchase,
        exact: true,
      })
      await activate(
        dialog.getByRole('button', { name: copy.common.cancel, exact: true })
      )
      expect(await saved()).toEqual(before)
      await activate(card.getByRole('button'))
      await activate(
        dialog.getByRole('button', { name: copy.shop.buy, exact: true })
      )
      await expect(card).toHaveCount(0)
      const after = await saved()
      expect(after.state.gold).toBe(
        before.state.gold - before.shop.teaHouse.charterOffering.finalCost
      )
      await page.reload()
      expect(await saved()).toEqual(after)
      await activate(
        page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      )
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      const ready = await saved(),
        hands = charterId === 'swift_hand' ? 6 : 4,
        rackSize = charterId === 'full_palette' ? 16 : 14
      expect(ready.state.handsRemaining).toBe(hands)
      expect(ready.state.handTiles).toHaveLength(rackSize)
      await expect(
        page.locator('[data-play-zone="hand"] [data-play-tile]')
      ).toHaveCount(rackSize)
      await expect(
        page.locator('[data-tutorial="hands-remaining"]')
      ).toContainText(String(hands))
      for (const tile of ready.state.handTiles.slice(-2))
        await activate(
          page.locator(`[data-play-zone="hand"] [data-play-tile="${tile.id}"]`)
        )
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(2)
      expect((await saved()).state.handsRemaining).toBe(hands)
      await page.screenshot({ path: testInfo.outputPath('staged.png') })
      await activate(page.locator('[data-game-action="play"]'))
      await expect
        .poll(async () => (await saved()).state.handsRemaining)
        .toBe(hands - 1)
      const played = await saved()
      expect(played.state.handTiles).toHaveLength(rackSize)
      expect(played.state.score).toBeGreaterThan(ready.state.score)
      await page.reload()
      expect(await saved()).toEqual(played)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1
        )
      ).toBe(true)
      expect(errors).toEqual([])
    })
