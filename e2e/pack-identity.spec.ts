import { expect, test } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  for (const kind of ['Decree', 'Arcana'] as const) {
    test(`paid ${kind} choices remain individually selectable after reload (${language})`, async ({
      page,
      isMobile,
    }, testInfo) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await page.setViewportSize(
        isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/${language}/play`)
      await expect(page.locator('[data-game-action="play"]')).toBeVisible()
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      await page
        .getByRole('button', { name: "Don't show tips", exact: true })
        .click()
      const fixture = await page.evaluate(async (kind) => {
        const gamePath = '/src/game/GameOrchestrator.ts'
        const decreePath = '/src/systems/DecreeSystem.ts'
        const packPath = '/src/systems/BlessingPackSystem.ts'
        const randomPath = '/src/game/RunRandom.ts'
        const eventPath = '/src/game/EventBus.ts'
        const { gameOrchestrator: game } = await import(gamePath)
        const { STARTER_DECREES } = await import(decreePath)
        const { BlessingPackSystem } = await import(packPath)
        const { runRandom } = await import(randomPath)
        const { eventBus } = await import(eventPath)
        const state = game.getState()
        state.decreeSystem
          .getOwnedDecrees()
          .forEach((d: { id: string }) => state.decreeSystem.removeDecree(d.id))
        Object.assign(state, {
          phase: 'shop',
          lastCompletedRoundType: 'Small',
          gold: 100,
        })
        game.shop.open()
        const offer = game.shop.state.packOfferings[0]
        Object.assign(offer.item, {
          type: kind,
          size: 'Mega',
          choiceCount: 5,
          selectCount: 2,
          cost: 8,
        })
        offer.finalCost = 8
        const pack = game.shop.packOfferings.find(
          (p: { pack: { id: string } }) => p.pack.id === offer.item.id
        )
        Object.assign(pack.pack, offer.item)
        pack.maxSelections = 2
        if (kind === 'Decree') {
          // Legacy saves can contain colliding choice keys. Do not rewrite paid rewards.
          pack.contents = STARTER_DECREES.map(
            (data: {
              id: string
              name: string
              description: string
              rarity: string
            }) => ({
              id: 'legacy-collision',
              type: 'Decree',
              name: data.name,
              description: data.description,
              rarity: data.rarity === 'LocalEdict' ? 'common' : 'uncommon',
              data,
            })
          )
        } else {
          // Controlled repeated rolls expose filtering; purchase/claim/save are real.
          const original = runRandom.next.bind(runRandom)
          try {
            runRandom.next = (stream: string) =>
              stream === 'packs' ? 0 : original(stream)
            pack.contents = new BlessingPackSystem().generateOfferingsForPacks([
              pack.pack,
            ])[0].contents
          } finally {
            runRandom.next = original
          }
        }
        eventBus.emit('shopUpdated', { isOpen: true })
        return {
          id: pack.pack.id,
          rewards: pack.contents.map(
            (c: { data: { id: string } }) => c.data.id
          ),
        }
      }, kind)
      if (kind === 'Arcana') expect(new Set(fixture.rewards).size).toBe(5)
      await expect(page).toHaveURL(new RegExp(`/${language}/shop$`))
      await page.locator(`[data-shop-pack="${fixture.id}"]`).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      await page.reload()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const choices = dialog.locator('[role="button"][aria-pressed]')
      await expect(choices).toHaveCount(5)
      if (kind === 'Decree') {
        for (const id of fixture.rewards) {
          const image = dialog.locator(
            `img[src$="${id.replaceAll('_', '-')}.webp"]`
          )
          expect(
            await image.evaluate(async (node: HTMLImageElement) => {
              await node.decode()
              return node.naturalWidth
            })
          ).toBe(512)
        }
      }
      for (const index of [1, 4]) {
        if (isMobile) await choices.nth(index).tap()
        else {
          await choices.nth(index).focus()
          await page.keyboard.press('Enter')
        }
      }
      await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true')
      await expect(choices.nth(4)).toHaveAttribute('aria-pressed', 'true')
      await expect(choices.nth(0)).toHaveAttribute('aria-pressed', 'false')
      await page.screenshot({ path: testInfo.outputPath('selected-pack.png') })
      await dialog
        .getByRole('button', { name: copy.shop.confirmSelection, exact: true })
        .click()
      await expect(dialog).not.toBeVisible()
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      const snapshot = await page.evaluate(async (kind) => {
        const path = '/src/game/GameOrchestrator.ts'
        const { gameOrchestrator: game } = await import(path)
        const state = game.getState()
        return {
          gold: state.gold,
          pending: game.shop.pendingPack,
          ids: (kind === 'Decree'
            ? state.decreeSystem.getOwnedDecrees()
            : state.fateSeals
          ).map((item: { id: string }) => item.id),
        }
      }, kind)
      expect(snapshot).toEqual({
        gold: 92,
        pending: null,
        ids: [fixture.rewards[1], fixture.rewards[4]],
      })
      await page.reload()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('tensho-classic-run-v1')!).snapshot
              .state.gold
        )
      ).toBe(92)
      expect(errors).toEqual([])
    })
  }
}
