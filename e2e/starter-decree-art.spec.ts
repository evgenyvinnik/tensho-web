import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import it from '../src/i18n/locales/it.json' with { type: 'json' }

const ids = [
  'river_tax',
  'extended_hand_grant',
  'tanyao_dispensation',
  'moonlit_seal',
  'pure_suit_asceticism',
] as const

for (const [language, copy] of [
  ['en', en],
  ['it', it],
] as const) {
  test(`starter portraits survive paid purchases and localized inspection (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${language}/play`)
    await expect(page.locator('[data-game-action="play"]')).toBeVisible()
    await page
      .getByRole('button', { name: "Don't show tips", exact: true })
      .click()
    const totalCost = await page.evaluate(async () => {
      const gamePath = '/src/game/GameOrchestrator.ts'
      const decreePath = '/src/systems/DecreeSystem.ts'
      const eventPath = '/src/game/EventBus.ts'
      const { gameOrchestrator: game } = await import(gamePath)
      const { STARTER_DECREES } = await import(decreePath)
      const { eventBus } = await import(eventPath)
      game.startNewRun(7)
      const state = game.getState()
      state.decreeSystem
        .getOwnedDecrees()
        .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
      Object.assign(state, {
        phase: 'shop',
        gold: 100,
        lastCompletedRoundType: 'Small',
      })
      game.shop.open()
      eventBus.emit('shopUpdated', { isOpen: true })
      return STARTER_DECREES.reduce(
        (sum: number, item: { cost: number }) => sum + item.cost,
        0
      )
    })
    await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
    for (const id of ids) {
      // Present each controlled offer through the existing live offering object.
      // Shop state returns copied arrays; acquisition still uses the paid UI.
      await page.evaluate(async (id) => {
        const gamePath = '/src/game/GameOrchestrator.ts'
        const decreePath = '/src/systems/DecreeSystem.ts'
        const eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { STARTER_DECREES } = await import(decreePath)
        const { eventBus } = await import(eventPath)
        const item = STARTER_DECREES.find(
          (item: { id: string }) => item.id === id
        )
        Object.assign(game.shop.state.itemOfferings[0], {
          id: `starter-${id}`,
          itemType: 'Decree',
          item,
          baseCost: item.cost,
          editionCost: 0,
          finalCost: item.cost,
          sellValue: Math.floor(item.cost / 2),
          edition: undefined,
          sticker: undefined,
          isPurchased: false,
          isLocked: false,
        })
        eventBus.emit('shopUpdated', { isOpen: true })
      }, id)
      const card = page.locator(`[data-shop-item="starter-${id}"]`)
      const image = card.locator(`img[src$="${id.replaceAll('_', '-')}.webp"]`)
      expect(
        await image.evaluate(async (node: HTMLImageElement) => {
          await node.decode()
          return node.naturalWidth
        })
      ).toBe(512)
      await expect(card.getByRole('heading')).toHaveText(
        copy.decrees.items[id].name
      )
      if (isMobile) await card.getByRole('button').tap()
      else await card.getByRole('button').click()
    }
    expect(
      await page.evaluate(async () => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        return {
          gold: game.getState().gold,
          count: game.getState().decreeSystem.getOwnedDecrees().length,
        }
      })
    ).toEqual({ gold: 100 - totalCost, count: 5 })
    await page
      .getByRole('button', { name: copy.shop.ui.nextRound, exact: true })
      .click()
    for (const id of ids) {
      const button = page.getByRole('button', {
        name: copy.decrees.items[id].name,
        exact: true,
      })
      await expect(button.locator('img')).toHaveAttribute(
        'src',
        new RegExp(`${id.replaceAll('_', '-')}\\.webp$`)
      )
      if (isMobile) await button.tap()
      else await button.focus()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(copy.decrees.items[id].description)
      await expect(
        dialog.locator(`img[src$="${id.replaceAll('_', '-')}.webp"]`)
      ).toBeVisible()
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      if (id === 'extended_hand_grant')
        await dialog.screenshot({
          path: testInfo.outputPath('grant-inspector.png'),
        })
      await page.keyboard.press('Escape')
    }
  })

  test(`starter portraits appear in discovered Archive entries (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${language}/collection`)
    await page.evaluate(async (ids) => {
      const path = '/src/stores/archiveStore.ts'
      const { useArchiveStore } = await import(path)
      // Presentation-only discovery fixture, not an achievement/unlock claim.
      for (const id of ids)
        useArchiveStore.getState().discoverItem('decrees', id, 'purchase')
    }, ids)
    for (const id of ids) {
      const card = page.getByRole('button').filter({
        has: page.getByRole('heading', {
          name: copy.decrees.items[id].name,
          exact: true,
        }),
      })
      const image = card.locator(`img[src$="${id.replaceAll('_', '-')}.webp"]`)
      expect(
        await image.evaluate(async (node: HTMLImageElement) => {
          await node.decode()
          return node.naturalWidth
        })
      ).toBe(512)
      if (isMobile) await card.tap()
      else {
        await card.focus()
        await page.keyboard.press('Enter')
      }
      const dialog = page.getByRole('dialog')
      await expect(dialog).toContainText(copy.decrees.items[id].description)
      await expect(
        dialog.locator(`img[src$="${id.replaceAll('_', '-')}.webp"]`)
      ).toBeVisible()
      await expect(dialog).toHaveAccessibleName(copy.decrees.items[id].name)
      expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true)
      expect(
        await dialog.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1
        )
      ).toBe(true)
      await page.keyboard.press('Tab')
      expect(
        await dialog.evaluate((node) => node.contains(document.activeElement))
      ).toBe(true)
      if (id === 'moonlit_seal')
        await dialog.screenshot({
          path: testInfo.outputPath('moonlit-archive.png'),
        })
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      if (!isMobile) await expect(card).toBeFocused()
    }
  })
}
