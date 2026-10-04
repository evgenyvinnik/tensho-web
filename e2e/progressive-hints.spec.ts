import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

for (const language of ['en', 'es', 'ru', 'th']) {
  test(`shop guidance is localized, optional and non-mutating (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const copy = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() =>
      localStorage.setItem('tensho_tutorial_completed', 'true')
    )
    await page.goto(`/${language}/play`)
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    // Reach a real settled shop; only its target is controlled for this UI test.
    await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const savePath = '/src/game/classicPersistenceApp.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { initializeClassicPersistence } = await import(savePath)
      const persistence = initializeClassicPersistence()
      const raw = persistence.getSnapshot().disk.raw
      game.startNewRun(7)
      const state = game.getState()
      state.targetScore = 1
      state.roundManager.getCurrentRound().scoreTarget = 1
      const result = game.processAction({
        type: 'play',
        tileIds: state.handTiles
          .slice(0, 2)
          .map((tile: { id: string }) => tile.id),
      })
      if (!result.success || !game.shop.open())
        throw new Error('Shop fixture failed')
      if (!(await persistence.saveNewRun(raw)))
        throw new Error('Fixture save failed')
    })
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    const snapshot = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
      )
    const before = await snapshot()
    await testInfo.attach('shop-save', {
      body: await page.evaluate(
        () => localStorage.getItem('tensho-classic-run-v1')!
      ),
      contentType: 'application/json',
    })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px'
    })
    const hint = page.locator('[data-progressive-hint="shop-intro"]')
    await expect(hint.getByRole('status')).toHaveText(
      copy.progressiveHints.shop.title
    )
    await expect(hint.locator('p')).toHaveText(
      copy.progressiveHints.shop.content
    )
    const summary = hint.locator('summary')
    await summary.click()
    await expect(hint.locator('p')).toBeHidden()
    await summary.click()
    await expect(hint.locator('p')).toBeVisible()
    await hint.scrollIntoViewIfNeeded()
    expect(
      await hint.evaluate((node) => {
        const bounds = node.getBoundingClientRect()
        return (
          bounds.left >= 0 &&
          bounds.right <= innerWidth &&
          Array.from(
            node.querySelectorAll<HTMLElement>('p,summary,button')
          ).every((el) => el.scrollWidth <= el.clientWidth + 1)
        )
      })
    ).toBe(true)
    expect(
      await hint.evaluate((node) => getComputedStyle(node).position)
    ).not.toBe('fixed')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    for (const button of await hint.getByRole('button').all()) {
      await button.scrollIntoViewIfNeeded()
      await expect(button).toBeInViewport()
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    }
    await page.screenshot({ path: testInfo.outputPath('localized-hint.png') })
    const action = hint.getByRole('button', {
      name: isMobile
        ? copy.progressiveHints.dontShow
        : copy.progressiveHints.gotIt,
      exact: true,
    })
    if (isMobile) await action.tap()
    else {
      await action.focus()
      await page.keyboard.press('Enter')
    }
    await expect(hint).toHaveCount(0)
    expect(await snapshot()).toEqual(before)
    if (isMobile)
      expect(
        await page.evaluate(() => localStorage.getItem('tensho_hints_disabled'))
      ).toBe('true')
    else
      expect(
        JSON.parse(
          (await page.evaluate(() =>
            localStorage.getItem('tensho_progressive_hints_shown')
          )) ?? '[]'
        )
      ).toContain('shop-intro')
    await page.reload()
    await expect(
      page.locator('[data-classic-save-status="saved"]')
    ).toBeVisible()
    await expect(hint).toHaveCount(0)
    expect(await snapshot()).toEqual(before)
    await expect(
      page.getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
    ).toBeEnabled()
    expect(errors).toEqual([])
  })
}
