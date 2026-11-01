import { expect, test, type Locator } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { RunRandom } from '../src/game/RunRandom'
import { offerName } from './helpers/shop'
import { closeOmenReveal, settleReveals } from './helpers/table'

test.use({ serviceWorkers: 'block' })
for (const language of ['en', 'es'])
  test(`shop copy inspection, purchase and next-round RNG (${language})`, async ({
    page,
    baseURL,
    isMobile,
  }, info) => {
    const text = JSON.parse(
      readFileSync(`src/i18n/locales/${language}.json`, 'utf8')
    )
    const replay = process.env.SHOP_COPY_REPLAY_FILE
      ? readFileSync(process.env.SHOP_COPY_REPLAY_FILE, 'utf8')
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
    await page.goto(`${baseURL!.replace(/\/$/, '')}/${language}/play`)
    await saved()
    if (!replay) {
      await page.evaluate(async () => {
        const loaded = (path: string) => {
          const url = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .reverse()
            .find((url) => new URL(url).pathname === path)
          if (!url) throw Error(`Missing native module ${path}`)
          return url
        }
        const { gameOrchestrator: game } = await import(
          loaded('/src/game/GameOrchestrator.ts')
        )
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
        state.targetScore = 1
        state.roundManager.getCurrentRound().scoreTarget = 1
        game.processAction({
          type: 'play',
          tileIds: state.handTiles.slice(0, 2).map((t: { id: string }) => t.id),
        })
        state.gold = 100
        state.decreeSystem = new DecreeSystem()
        state.wallTemplate = state.wallTemplate.filter(
          (t: { isBonus: boolean }) => !t.isBonus
        )
        for (const id of ['decree-ancient-scroll', 'decree-wide-grip'])
          state.decreeSystem.acquireDecree(
            ALL_DECREES.find((d: { id: string }) => d.id === id)
          )
        if (!game.shop.open()) throw Error('Shop did not open')
        Object.assign(game.shop.state.itemOfferings[0], {
          itemType: 'Decree',
          item: ALL_DECREES.find(
            (d: { id: string }) => d.id === 'decree-doppelganger'
          ),
          finalCost: 8,
          isLocked: false,
          isPurchased: false,
        })
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
    await expect(page).toHaveURL(/\/shop\/?$/)
    // The fixture's play cleared the round with Turns to spare: an Omen.
    await closeOmenReveal(page)
    const before = await saved(),
      owned = before.state.decreeSystem.ownedDecrees
    const offer = before.shop.teaHouse.itemOfferings[0]
    const expected = RunRandom.fromState(before.random)
    const target = expected.pick('decreeCopies', owned) as {
      instanceId: string
    }
    for (let i = 0; i < 2; i++) {
      await activate(
        page.locator('[data-shop-build]').getByRole('button', {
          name: text.decrees.items['decree-ancient-scroll'].name,
          exact: true,
        })
      )
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await page.reload()
      expect(await saved()).toEqual(before)
    }
    // Every offer opens its details on tap; Buy is the only purchase step.
    const card = page.locator(`[data-shop-offer="${offer.id}"]`)
    await expect(card).toHaveAccessibleName(
      offerName(text.decrees.items['decree-doppelganger'].name)
    )
    await card.scrollIntoViewIfNeeded()
    await activate(card)
    await activate(page.locator(`[data-shop-buy="${offer.id}"]`))
    await expect(card).toHaveCount(0)
    // A bought Decree is revealed; the player closes it to shop on.
    await settleReveals(page)
    await expect
      .poll(async () => (await saved()).state.decreeSystem.ownedDecrees.length)
      .toBe(3)
    const bought = await saved()
    expect(bought.state.gold).toBe(before.state.gold - 8)
    expect(bought.state.decreeSystem.ownedDecrees[2].randomCopyTargetId).toBe(
      target.instanceId
    )
    expect(bought.random.streams.decreeCopies).toBe(
      expected.toState().streams.decreeCopies
    )
    await page.reload()
    expect(await saved()).toEqual(bought)
    const nextTarget = expected.pick('decreeCopies', owned) as {
      instanceId: string
      id: string
    }
    await activate(
      page.getByRole('button', { name: text.shop.ui.nextRound, exact: true })
    )
    await expect(page).toHaveURL(/\/play\/?$/)
    const next = await saved()
    expect(next.state.decreeSystem.ownedDecrees[2].randomCopyTargetId).toBe(
      nextTarget.instanceId
    )
    expect(next.random.streams.decreeCopies).toBe(
      expected.toState().streams.decreeCopies
    )
    expect(next.state.handTiles).toHaveLength(
      nextTarget.id === 'decree-wide-grip' ? 14 : 11
    )
    await page.reload()
    expect(await saved()).toEqual(next)
    expect(errors).toEqual([])
  })
