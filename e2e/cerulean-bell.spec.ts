import { expect, test, type Locator } from '@playwright/test'

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
      game.processAction({ type: 'skip' })
      game.getState().roundManager.getCurrentAct().rounds[2].bossMandate =
        SHOWDOWN_MANDATES.find((m: { id: string }) => m.id === 'cerulean_bell')
      game.processAction({ type: 'skip' })
      parseClassicRunSnapshot(JSON.parse(JSON.stringify(game.captureRun())))
      if (!(await service.saveNewRun(raw)))
        throw new Error(`Fixture save failed: ${service.getSnapshot().status}`)
    })
    const title = {
      en: 'Cerulean Bell',
      es: 'Campana Cerúlea',
      ru: 'Лазурный колокол',
    }[lang]!
    const control = page.locator('[data-mandate-details="cerulean_bell"]')
    await expect(control).toHaveAccessibleName(title)
    await activate(control)
    const dialog = page.getByRole('dialog', { name: title, exact: true })
    await expect(dialog).toBeVisible()
    expect(
      await dialog.locator('img').evaluate(async (img: HTMLImageElement) => {
        await img.decode()
        return img.naturalWidth
      })
    ).toBe(512)
    expect(
      await dialog
        .locator('p')
        .evaluate((node) => node.scrollWidth <= node.clientWidth + 1)
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('bell-rules.png') })
    await page.keyboard.press('Escape')
    await expect(control).toBeFocused()
    for (let i = 0; i < 6; i++) {
      const before = await saved()
      const locks = before.state.mandateEffectSystem.lockedTileIds
      expect(locks).toHaveLength(1)
      const tile = before.state.handTiles.find(
        (t: { id: string }) => !locks.includes(t.id)
      )
      const tileControl = page.locator(
        `[data-play-zone="hand"] [data-play-tile="${tile.id}"]`
      )
      if (i < 3) {
        // Discard uses the rack's drag target, not an ActionBar button.
        await tileControl.scrollIntoViewIfNeeded()
        const source = (await tileControl.boundingBox())!
        const target = (await page
          .locator('[data-play-zone="discard"]')
          .boundingBox())!
        const start = {
          x: source.x + source.width / 2,
          y: source.y + source.height / 2,
        }
        const end = {
          x: target.x + target.width / 2,
          y: target.y + target.height / 2,
        }
        if (isMobile) {
          const cdp = await page.context().newCDPSession(page)
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [start],
          })
          for (let step = 1; step <= 8; step++)
            await cdp.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: [
                {
                  x: start.x + ((end.x - start.x) * step) / 8,
                  y: start.y + ((end.y - start.y) * step) / 8,
                },
              ],
            })
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          })
          await cdp.detach()
        } else {
          await page.mouse.move(start.x, start.y)
          await page.mouse.down()
          await page.mouse.move(end.x, end.y, { steps: 8 })
          await page.mouse.up()
        }
        await expect
          .poll(async () => (await saved()).state.discardsRemaining)
          .toBe(before.state.discardsRemaining - 1)
      } else {
        await activate(tileControl)
        const action = page.locator('[data-game-action="redraw"]')
        await expect(action).toBeEnabled()
        await activate(action)
      }
      await expect(
        page.locator('[data-play-zone="staging"] [data-play-tile]')
      ).toHaveCount(0)
      expect(
        (await saved()).state.mandateEffectSystem.lockedTileIds
      ).toHaveLength(1)
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
    await activate(play)
    await expect(
      page.locator('[data-play-zone="staging"] [data-play-tile]')
    ).toHaveCount(0)
    expect((await saved()).state.handsRemaining).toBe(
      after.state.handsRemaining - 1
    )
    expect(errors).toEqual([])
  })
