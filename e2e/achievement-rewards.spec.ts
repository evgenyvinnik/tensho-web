import { expect, test, type Locator, type Page } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }
import { openTable, parkMouse, settleReveals } from './helpers/table'

const decreeIds = [
  'stage_master',
  'flower_pot',
  'satellite',
  'swift_andy',
  'lucky_sixes',
  'the_idol',
  'stuntman',
  'cartomancer',
  'astronomer',
] as const

const walls = [
  { id: 'crimson_wall', tier: 2, suit: 'dragon', mark: 'mult', count: 12 },
  { id: 'obsidian_wall', tier: 4, suit: 'wind', mark: 'bonus', count: 16 },
] as const

declare global {
  interface Window {
    __achievementRewards: {
      game: import('../src/game/GameOrchestrator').GameOrchestrator
      events: typeof import('../src/game/EventBus').eventBus
      decrees: typeof import('../src/systems/DecreeSystem').ALL_DECREES
      progression: typeof import('../src/stores/progressionStore').useProgressionStore
    }
  }
}

async function activate(node: Locator, isMobile: boolean) {
  if (isMobile) await node.tap()
  else await node.click()
}

async function decodedArt(image: Locator, path: string) {
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute(
    'src',
    new RegExp(`${path.replaceAll('.', '\\.')}$`)
  )
  expect(
    await image.evaluate(async (node: HTMLImageElement) => {
      await node.decode()
      return node.naturalWidth > 0 && node.naturalHeight > 0
    })
  ).toBe(true)
}

async function fitsViewport(page: Page, panel: Locator) {
  await expect(panel).toBeVisible()
  expect(
    await panel.evaluate((node) => {
      const rect = node.getBoundingClientRect()
      return {
        inside:
          rect.left >= -1 &&
          rect.top >= -1 &&
          rect.right <= innerWidth + 1 &&
          rect.bottom <= innerHeight + 1,
        noHorizontalOverflow: node.scrollWidth <= node.clientWidth + 1,
        canReadOverflow:
          node.scrollHeight <= node.clientHeight + 1 ||
          ['auto', 'scroll'].includes(getComputedStyle(node).overflowY),
      }
    })
  ).toEqual({ inside: true, noHorizontalOverflow: true, canReadOverflow: true })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1
    )
  ).toBe(true)
}

// Match the exact modules used by the UI after dev-server HMR. Bare URLs may
// instantiate a second, empty engine rather than observe the active game.
async function runtimeUrls(page: Page) {
  return page.evaluate(() => {
    const resources = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .reverse()
    const loaded = (path: string) =>
      resources.find((url) => new URL(url).pathname === path) ?? path
    return {
      game: loaded('/src/game/GameOrchestrator.ts'),
      events: loaded('/src/game/EventBus.ts'),
      decrees: loaded('/src/systems/DecreeSystem.ts'),
      progression: loaded('/src/stores/progressionStore.ts'),
      stakes: loaded('/src/stores/stakeStore.ts'),
    }
  })
}

// As in art-readability.spec.ts, a module script keeps imports alive outside
// Runtime.evaluate (Chromium can otherwise collect their pending promises).
async function bindAcquisitionRuntime(page: Page) {
  const urls = await runtimeUrls(page)
  await page.addScriptTag({
    type: 'module',
    content: `
      import { gameOrchestrator as game } from ${JSON.stringify(urls.game)};
      import { eventBus as events } from ${JSON.stringify(urls.events)};
      import { ALL_DECREES as decrees } from ${JSON.stringify(urls.decrees)};
      import { useProgressionStore as progression } from ${JSON.stringify(urls.progression)};
      window.__achievementRewards = { game, events, decrees, progression };
    `,
  })
  await page.waitForFunction(() => Boolean(window.__achievementRewards))
}

// Same controlled deal as swiftClear, using the live HMR modules. Clearing the
// round, its payout, and entering the Tea House remain real button-driven play.
async function clearRewardRound(page: Page, isMobile: boolean) {
  const ids = await page.evaluate(() => {
    const { game, events: eventBus } = window.__achievementRewards
    const state =
      game.getState() as import('../src/game/GameOrchestrator').OrchestratorState
    state.targetScore = 1
    state.roundManager.getCurrentRound().scoreTarget = 1
    state.handTiles = state.wallTemplate
      .filter(
        (tile: { suit: string; rank: number }) =>
          tile.suit === 'pinzu' && tile.rank === 2
      )
      .slice(0, 2)
    if (state.handTiles.length !== 2) throw new Error('Pair fixture missing')
    state.selectedTileIds.clear()
    state.faceDownTileIds.clear()
    eventBus.emit('tileDrawn', {
      tileId: state.handTiles[0].id,
      tilesRemaining: state.wall.length - state.drawIndex,
    })
    return state.handTiles.map((tile: { id: string }) => tile.id) as string[]
  })
  for (const id of ids)
    await activate(
      page.locator(`[data-play-zone="hand"] [data-play-tile="${id}"]`),
      isMobile
    )
  await activate(page.locator('[data-game-action="play"]'), isMobile)
  await expect(page).toHaveURL(/\/shop$/)
  await expect(page.locator('[data-shop-offer]').first()).toBeVisible()
}

// A recorded, completed victory is supported migration evidence. This does not
// toggle table unlocks, select a table, or activate Full Unlock. Reload lets the
// normal bridge derive achievement rewards from the persisted victory history.
async function recordVictory(page: Page, tier: number) {
  return page.evaluate(
    async ({ tier, urls }) => {
      const { useStakeStore } = await import(urls.stakes)
      const { useProgressionStore } = await import(urls.progression)
      if (useProgressionStore.getState().fullUnlockEnabled)
        throw new Error('Unlock proof cannot use Full Unlock')
      useStakeStore.getState().recordVictory(100_000, 8, 'green_felt', tier)
      return useStakeStore.getState().wallProgress.green_felt.victories.at(-1)
    },
    { tier, urls: await runtimeUrls(page) }
  )
}

async function wallState(page: Page, suit: string, mark: string) {
  return page.evaluate(
    async ({ suit, mark, urls }) => {
      const { gameOrchestrator: game } = await import(urls.game)
      const state = game.getState()
      const permanent = state.wallTemplate
      return {
        table: state.tableStyleId,
        stake: state.stake,
        slotModifier: state.tableModifiers.decreeSlotModifier,
        baseSlots:
          state.decreeSystem.getMaxSlots() -
          state.flowerSystem.getBonusDecreeSlots(),
        size: permanent.length,
        marked: permanent.filter(
          (tile: { enhancement: string }) => tile.enhancement === mark
        ).length,
        correctMarks: permanent.every(
          (tile: { suit: string; enhancement: string }) =>
            tile.enhancement === (tile.suit === suit ? mark : 'none')
        ),
        liveCopiesCorrect: [
          state.wall,
          state.deadWall,
          state.summerReserve,
          state.handTiles,
        ]
          .flat()
          .every(
            (tile: { suit: string; enhancement: string }) =>
              tile.enhancement === (tile.suit === suit ? mark : 'none')
          ),
        permanent: permanent
          .map((tile: { id: string; enhancement: string }) => [
            tile.id,
            tile.enhancement,
          ])
          .sort((a: string[], b: string[]) => a[0].localeCompare(b[0])),
      }
    },
    { suit, mark, urls: await runtimeUrls(page) }
  )
}

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test.describe(`achievement rewards (${language})`, () => {
    test.beforeEach(async ({ page, isMobile }) => {
      // This app loads more than the browser's default 250 resource entries.
      // Retain module URLs so fixtures never fall back to stale HMR imports.
      await page.addInitScript(() =>
        performance.setResourceTimingBufferSize(5_000)
      )
      await page.setViewportSize(
        isMobile ? { width: 320, height: 568 } : { width: 1280, height: 800 }
      )
      await page.emulateMedia({ reducedMotion: 'reduce' })
    })

    test('all nine catalog rewards have named art and readable keyboard/touch details', async ({
      page,
      isMobile,
    }, info) => {
      // Isolated presentation fixture ONLY. Discovery is not proof of earning
      // these rewards; the separate Wall journeys verify progression evidence.
      await page.addInitScript(
        (ids) => {
          if (localStorage.getItem('tensho-archive')) return
          const entries = Object.fromEntries(
            ids.map((itemId) => {
              const key = `decrees:${itemId}`
              return [
                key,
                {
                  key,
                  itemId,
                  category: 'decrees',
                  isUnlocked: true,
                  discoveredAt: Date.UTC(2026, 9, 21),
                  timesUsed: 0,
                  timesWonWith: 0,
                },
              ]
            })
          )
          localStorage.setItem(
            'tensho-archive',
            JSON.stringify({
              version: 1,
              state: { entries, discoveryHistory: [] },
            })
          )
        },
        [...decreeIds]
      )
      await page.goto(`/${language}/collection`)
      await expect(
        page.locator('[data-archive-card="stage_master"]')
      ).toBeVisible()
      const before = await page.evaluate(() =>
        localStorage.getItem('tensho-archive')
      )
      for (const id of decreeIds) {
        const item = copy.decrees.items[id]
        const card = page.locator(`[data-archive-card="${id}"]`)
        await card.scrollIntoViewIfNeeded()
        await expect(card).toHaveAccessibleName(item.name)
        await expect(card).toHaveAttribute('data-known', 'true')
        await expect(card.locator('h3')).toHaveText(item.name)
        await decodedArt(
          card.locator('[data-archive-card-art]'),
          `/assets/illustrations/rewards/${id}.webp`
        )
        if (isMobile) await card.tap()
        else {
          await parkMouse(page)
          await card.focus()
          await card.press('Enter')
        }
        const dialog = page.getByRole('dialog', {
          name: item.name,
          exact: true,
        })
        await expect(dialog.locator('[data-archive-effect]')).toHaveText(
          item.description
        )
        await fitsViewport(page, dialog)
        const effect = dialog.locator('[data-archive-effect]')
        expect(
          await effect.evaluate(
            (node) =>
              node.scrollWidth <= node.clientWidth + 1 &&
              node.scrollHeight <= node.clientHeight + 1 &&
              getComputedStyle(node).webkitLineClamp === 'none'
          )
        ).toBe(true)
        if (id === 'the_idol') {
          // A long effect may scroll vertically, but its final line must be
          // reachable within the on-screen popup, not clipped or line-clamped.
          await dialog.evaluate((node) => {
            const text = node.querySelector('[data-archive-effect]')!
            const range = document.createRange()
            range.selectNodeContents(text)
            const last = Array.from(range.getClientRects()).at(-1)!
            node.scrollTop +=
              last.bottom - node.getBoundingClientRect().bottom + 8
          })
          expect(
            await effect.evaluate((node) => {
              const range = document.createRange()
              range.selectNodeContents(node)
              const last = Array.from(range.getClientRects()).at(-1)!
              const panel = node
                .closest('[role="dialog"]')!
                .getBoundingClientRect()
              return (
                last.bottom <= panel.bottom + 1 && last.top >= panel.top - 1
              )
            })
          ).toBe(true)
          await page.screenshot({
            path: info.outputPath(`idol-${language}.png`),
          })
        }
        if (isMobile) {
          const close = dialog.getByRole('button', {
            name: copy.common.close,
            exact: true,
          })
          await close.scrollIntoViewIfNeeded()
          await close.tap()
        } else {
          await page.keyboard.press('Escape')
          await expect(card).toBeFocused()
        }
        await expect(dialog).toBeHidden()
      }
      expect(
        await page.evaluate(() => localStorage.getItem('tensho-archive'))
      ).toBe(before)
    })

    for (const wall of walls) {
      test(`${wall.id} requires a qualifying victory, persists selection and starts a permanently marked run`, async ({
        page,
        isMobile,
      }, info) => {
        const item = copy.tableStyles.items[wall.id]
        await page.goto(`/${language}/`)
        const opener = page.getByRole('button', {
          name: copy.tableStyle.chooseTable,
          exact: true,
        })
        const dialog = page.getByRole('dialog', {
          name: copy.tableStyle.title,
          exact: true,
        })
        const card = dialog.locator(`[data-table-style-card="${wall.id}"]`)
        await activate(opener, isMobile)
        await expect(card).toBeDisabled()
        await expect(card).toContainText(item.unlock)
        await page.keyboard.press('Escape')

        // A real persisted lower-tier win must not satisfy this Wall's gate.
        await recordVictory(page, wall.tier - 1)
        await page.reload()
        await activate(opener, isMobile)
        await expect(card).toBeDisabled()
        await page.keyboard.press('Escape')
        expect(await recordVictory(page, wall.tier)).toMatchObject({
          wallId: 'green_felt',
          stakeTier: wall.tier,
          actsCompleted: 8,
        })
        await page.reload()
        await activate(opener, isMobile)
        await expect(card).toBeEnabled()
        await card.scrollIntoViewIfNeeded()
        await expect(card).toContainText(item.name)
        await expect(card).toContainText(item.description)
        for (const modifier of Object.values(item.modifiers))
          await expect(card).toContainText(modifier)
        await decodedArt(
          card.locator('img'),
          `/assets/illustrations/tables/${wall.id}.webp`
        )
        if (isMobile) await card.tap()
        else {
          await card.focus()
          await card.press('Enter')
        }
        await expect(card).toHaveAttribute('aria-pressed', 'true')
        await activate(
          dialog.getByRole('button', {
            name: copy.common.confirm,
            exact: true,
          }),
          isMobile
        )
        await expect(dialog).toBeHidden()
        await page.reload()
        await activate(opener, isMobile)
        await expect(card).toHaveAttribute('aria-pressed', 'true')
        await activate(
          dialog.getByRole('button', {
            name: copy.common.confirm,
            exact: true,
          }),
          isMobile
        )
        await activate(
          page.getByRole('button', { name: copy.menu.newRun, exact: true }),
          isMobile
        )
        await expect(page).toHaveURL(new RegExp(`/${language}/play$`))
        await settleReveals(page, 2_000)
        await expect(
          page.locator(`[data-table-style-id="${wall.id}"]`)
        ).toBeVisible()
        const background = page.locator('[data-table-artwork]')
        await expect(background).toHaveCSS(
          'background-image',
          new RegExp(`/tables/${wall.id}\\.webp`)
        )
        expect(
          await background.evaluate(async (node) => {
            const url = getComputedStyle(node).backgroundImage.slice(5, -2)
            const image = new Image()
            image.src = url
            await image.decode()
            return image.naturalWidth > 0
          })
        ).toBe(true)
        const started = await wallState(page, wall.suit, wall.mark)
        expect(started).toMatchObject({
          table: wall.id,
          stake: 1,
          slotModifier: -1,
          baseSlots: 4,
          size: 144,
          marked: wall.count,
          correctMarks: true,
          liveCopiesCorrect: true,
        })
        await expect(
          page.locator('[data-classic-save-status="saved"]')
        ).toBeVisible()
        await page.screenshot({
          path: info.outputPath(`${wall.id}-${language}.png`),
        })
        await page.reload()
        await settleReveals(page, 2_000)
        expect(await wallState(page, wall.suit, wall.mark)).toEqual(started)
        await expect(
          page.locator(`[data-table-style-id="${wall.id}"]`)
        ).toBeVisible()
      })
    }

    test('acquired Astronomer reveals localized art and preserves its free Orb offer on reload', async ({
      page,
      isMobile,
    }, info) => {
      await openTable(page, `/${language}/play`)
      // This is an acquisition/presentation fixture, not an achievement proof:
      // grant only Astronomer's eligibility, then use the game's public acquired
      // item path. Do not write the reveal queue or fabricate a decreeAcquired event.
      await bindAcquisitionRuntime(page)
      const acquired = await page.evaluate(() => {
        const {
          game,
          decrees: ALL_DECREES,
          progression: useProgressionStore,
        } = window.__achievementRewards
        useProgressionStore.getState().unlockItem('unlock_astronomer', false)
        const decree = ALL_DECREES.find(
          (item: { id: string }) => item.id === 'astronomer'
        )
        if (!decree || !game.addDecree(decree, 'generated'))
          throw new Error('Astronomer gameplay acquisition failed')
        return game
          .getState()
          .decreeSystem.getOwnedDecrees()
          .filter((owned: { id: string }) => owned.id === 'astronomer').length
      })
      expect(acquired).toBe(1)
      const item = copy.decrees.items.astronomer
      const reveal = page.locator('[data-decree-reveal="astronomer"]')
      await expect(reveal).toBeVisible()
      await expect(
        reveal.getByRole('heading', { name: item.name, exact: true })
      ).toBeVisible()
      await expect(reveal).toContainText(item.description)
      await decodedArt(
        reveal.locator('img[src$="/astronomer.webp"]'),
        '/assets/illustrations/rewards/astronomer.webp'
      )
      await fitsViewport(page, reveal.locator(':scope > div'))
      await page.screenshot({
        path: info.outputPath(`astronomer-reveal-${language}.png`),
      })
      await activate(reveal.getByRole('button'), isMobile)
      await expect(reveal).toBeHidden()
      const owned = page
        .locator('[data-decree-instance]')
        .filter({ has: page.locator('img[src$="/astronomer.webp"]') })
      await activate(owned, isMobile)
      const details = page.getByRole('dialog', { name: new RegExp(item.name) })
      await expect(details).toContainText(item.description)
      await fitsViewport(page, details)
      await page.keyboard.press('Escape')
      await parkMouse(page)
      await clearRewardRound(page, isMobile)
      const freeOffer = await page.evaluate(() => {
        const { game } = window.__achievementRewards
        const offers = game.shop.state.itemOfferings.filter(
          (offer: { itemType: string; finalCost: number }) =>
            offer.itemType === 'CelestialOrb' && offer.finalCost === 0
        )
        if (offers.length !== 1)
          throw new Error(`Expected one free Orb, got ${offers.length}`)
        return {
          id: offers[0].id,
          itemId: offers[0].item.id,
          cost: offers[0].finalCost,
          gold: game.getState().gold,
        }
      })
      await expect(
        page.locator(`[data-shop-offer="${freeOffer.id}"]`)
      ).toBeVisible()
      await expect
        .poll(() =>
          page.evaluate(() => {
            const saved = JSON.parse(
              localStorage.getItem('tensho-classic-run-v1') ?? 'null'
            )
            return saved?.snapshot?.state?.phase
          })
        )
        .toBe('shop')
      await expect(
        page.locator('[data-classic-save-status="saved"]')
      ).toBeVisible()
      await page.reload()
      await expect(
        page.locator(`[data-shop-offer="${freeOffer.id}"]`)
      ).toBeVisible()
      await bindAcquisitionRuntime(page)
      expect(
        await page.evaluate((id) => {
          const { game } = window.__achievementRewards
          const offer = game.shop.state.itemOfferings.find(
            (item: { id: string }) => item.id === id
          )
          return {
            id: offer.id,
            itemId: offer.item.id,
            cost: offer.finalCost,
            gold: game.getState().gold,
          }
        }, freeOffer.id)
      ).toEqual(freeOffer)
      await expect(
        page.locator('[data-decree-reveal="astronomer"]')
      ).toHaveCount(0)
    })
  })
}
