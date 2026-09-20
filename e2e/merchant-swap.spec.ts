import { expect, test, type Page } from '@playwright/test'
import en from '../src/i18n/locales/en.json' with { type: 'json' }
import es from '../src/i18n/locales/es.json' with { type: 'json' }

async function stateOf(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/stores/tableLoopStore.ts'
    const { useTableLoopStore } = await import(path)
    const { state, selectedTileIds } = useTableLoopStore.getState()
    const indices = (tiles: { id: string }[]) =>
      tiles.map((tile) =>
        state.collection.findIndex(
          (candidate: { id: string }) => candidate.id === tile.id
        )
      )
    return {
      rack: indices(state.rack),
      river: indices(state.river),
      wall: indices(state.wall),
      selected: selectedTileIds.length,
      actions: state.placementActionsRemaining,
      redraws: state.redrawsRemaining,
      gold: state.gold,
      score: state.score,
      swaps: state.riverRecoveriesRemaining,
      saved: localStorage.getItem('tensho-table-loop-v1'),
    }
  })
}

for (const [language, copy] of [
  ['en', en],
  ['es', es],
] as const) {
  test(`buys, swaps, and reloads Merchant without extra resources (${language})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 320, height: 740 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${language}/table-loop?seed=12`)
    await expect(page.getByTestId('table-decree-echoing_bamboo')).toBeVisible()
    // Setup uses real seeded placements and paid shop offers through the store,
    // never grants or score overrides. Full UI-only runs live in table-loop-run.
    await page.evaluate(async () => {
      const storePath = '/src/stores/tableLoopStore.ts'
      const rulesPath = '/src/tableloop/groupRules.ts'
      const contentPath = '/src/tableloop/content.ts'
      const { useTableLoopStore } = await import(storePath)
      const { enumerateRackGroups } = await import(rulesPath)
      const { getTableDecree } = await import(contentPath)
      useTableLoopStore.getState().restart(12)
      useTableLoopStore.getState().chooseStarter('echoing_bamboo')
      for (let step = 0; step < 100; step++) {
        const store = useTableLoopStore.getState(),
          { state, engine } = store
        if (
          state.phase === 'playing' &&
          state.ownedDecrees.includes('river_merchant')
        )
          return
        if (state.phase === 'roundCleared') store.openShop()
        else if (state.phase === 'shop') {
          const offer = state.shopOffers.find(
            (id: string) => getTableDecree(id).cost <= state.gold
          )
          if (offer) store.buyDecree(offer)
          else store.nextRound()
        } else if (state.phase === 'playing') {
          if (state.score >= state.round.target) {
            store.finishRound()
            continue
          }
          const groups: import('../src/core/Tile').Tile[][] =
            enumerateRackGroups(state.rack, {
              allowGap: state.gapBridgesRemaining > 0,
            })
          const candidate = groups
            .flatMap((tiles) =>
              state.slots.map((slot: { index: number }) => ({
                tiles,
                slot: slot.index,
                total:
                  engine.previewPlacement(
                    tiles.map((tile) => tile.id),
                    slot.index
                  )?.total ?? -1,
              }))
            )
            .filter((item) => item.total >= 0)
            .sort((a, b) => b.total - a.total)[0]
          if (candidate) {
            candidate.tiles.forEach((tile: { id: string }) =>
              store.toggleTile(tile.id)
            )
            if (state.slots[candidate.slot].group) store.revise(candidate.slot)
            else store.place(candidate.slot)
          } else {
            state.rack
              .slice(0, 3)
              .forEach((tile: { id: string }) => store.toggleTile(tile.id))
            store.redraw()
          }
        } else throw new Error(`Fixture ended early: ${state.phase}`)
        if (useTableLoopStore.getState().state.lastError)
          throw new Error(useTableLoopStore.getState().state.lastError)
      }
      throw new Error('Seed never acquired Merchant')
    })
    await expect(page.getByTestId('owned-scroll-river_merchant')).toBeVisible()
    const activate = async (locator: ReturnType<Page['getByTestId']>) => {
      if (isMobile) await locator.tap()
      else {
        await locator.focus()
        await page.keyboard.press('Enter')
      }
    }
    await activate(page.locator('[data-testid^="rack-tile-"]').first())
    await activate(page.getByTestId('table-loop-exchange'))
    const before = await stateOf(page)
    const river = page.locator('[data-testid^="river-tile-"]').first()
    await expect(river).toBeDisabled()
    const instruction = page.getByTestId('river-swap-instruction')
    await expect(instruction).toHaveText(copy.tableLoop.river.choose)
    const given = page.locator('[data-testid^="rack-tile-"]').nth(1)
    await activate(given)
    await expect(river).toBeEnabled()
    await expect(river).toHaveAccessibleName(
      new RegExp(language === 'es' ? '^Cambiar ' : '^Swap ')
    )
    // Two selected tiles are not an implicit choice of which tile to lose.
    const extra = page.locator('[data-testid^="rack-tile-"]').nth(2)
    await activate(extra)
    await expect(river).toBeDisabled()
    await activate(extra)
    await expect(river).toBeEnabled()
    await expect(instruction).toBeVisible()
    if (isMobile)
      await expect(page.locator('[data-tile-tooltip]')).toHaveCount(0)
    await page.screenshot({
      path: testInfo.outputPath(`merchant-${language}-ready.png`),
    })
    await activate(river)
    const after = await stateOf(page)
    expect(after.rack).toEqual(
      before.rack.map((tile: number, index: number) =>
        index === 1 ? before.river[0] : tile
      )
    )
    expect(after.river).toEqual([before.rack[1]])
    expect(after.wall).toEqual(before.wall)
    expect(after.actions).toBe(before.actions)
    expect(after.redraws).toBe(before.redraws)
    expect(after.gold).toBe(before.gold)
    expect(after.score).toBe(before.score)
    expect(after.swaps).toBe(0)
    expect(after.selected).toBe(0)
    await expect(instruction).toHaveText(copy.tableLoop.river.used)
    await expect(instruction).toBeFocused()
    await expect(
      page.locator('[data-testid^="river-tile-"]').first()
    ).toBeDisabled()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`merchant-${language}-used.png`),
    })
    await page.reload()
    await expect(page.getByTestId('river-swap-instruction')).toHaveText(
      copy.tableLoop.river.used
    )
    expect(await stateOf(page)).toEqual(after)
  })
}
