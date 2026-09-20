import { expect, test, type Page } from '@playwright/test'

/** Read public run state and choose from the same forecasts exposed by slots.
 * Never inspect future draws, grant items, or mutate the engine from this probe.
 */
async function inspectRun(page: Page) {
  return page.evaluate(async () => {
    const storePath = '/src/stores/tableLoopStore.ts'
    const rulesPath = '/src/tableloop/groupRules.ts'
    const contentPath = '/src/tableloop/content.ts'
    const { useTableLoopStore } = await import(storePath)
    const { enumerateRackGroups } = await import(rulesPath)
    const { getTableDecree } = await import(contentPath)
    const { engine, state } = useTableLoopStore.getState()
    const groups: import('../src/core/Tile').Tile[][] =
      state.phase === 'playing'
        ? enumerateRackGroups(state.rack, {
            allowGap: state.gapBridgesRemaining > 0,
          })
        : []
    const candidates = groups
      .flatMap((group) =>
        state.slots.map((slot: { index: number }) => ({
          tiles: group.map((tile) => tile.id),
          slot: slot.index,
          score:
            engine.previewPlacement(
              group.map((tile) => tile.id),
              slot.index
            )?.total ?? -1,
        }))
      )
      .filter((candidate) => candidate.score >= 0)
      .sort((a, b) => b.score - a.score)
    return {
      phase: state.phase as string,
      round: state.roundIndex as number,
      score: state.score as number,
      target: state.round.target as number,
      runScore: state.runScore as number,
      gold: state.gold as number,
      redraws: state.redrawsRemaining as number,
      baseRedraws: state.round.redraws as number,
      owned: [...state.ownedDecrees] as string[],
      offers: state.shopOffers.map((id: string) => ({
        id,
        cost: getTableDecree(id).cost as number,
      })) as { id: string; cost: number }[],
      move: candidates[0] ?? null,
      exchange: state.rack
        .slice(0, 3)
        .map((tile: { id: string }) => tile.id) as string[],
      error: state.lastError,
      saved: localStorage.getItem('tensho-table-loop-v1'),
    }
  })
}

for (const [seed, outcome] of [
  [7, 'runFailed'],
  [12, 'runComplete'],
] as const) {
  test(`plays a real seeded run through shops to ${outcome} (${seed})`, async ({
    page,
    isMobile,
  }, testInfo) => {
    test.setTimeout(180_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(
      isMobile ? { width: 320, height: 740 } : { width: 1280, height: 800 }
    )
    await page.goto(`/en/table-loop?seed=${seed}`)
    await page.getByTestId('table-decree-echoing_bamboo').click()
    await expect(page.getByTestId('table-loop-rack')).toBeVisible()

    const visitedRounds = new Set<number>()
    let purchases = 0
    let ledgerPayments = 0
    let checkedLedgerCost = false
    for (let step = 0; step < 100; step++) {
      const before = await inspectRun(page)
      visitedRounds.add(before.round)
      expect(before.error).toBeNull()
      if (before.phase === 'runComplete' || before.phase === 'runFailed') break
      if (before.phase === 'roundCleared') {
        await page
          .getByRole('button', { name: 'Visit the tea house', exact: true })
          .click()
        await expect(
          page.getByRole('heading', { name: 'Tea house', exact: true })
        ).toBeVisible()
      } else if (before.phase === 'shop') {
        const offer = before.offers.find((item) => item.cost <= before.gold)
        if (offer) {
          const card = page.getByTestId(`table-decree-${offer.id}`)
          await expect(card.locator('img')).toHaveJSProperty(
            'naturalWidth',
            1254
          )
          await card.click()
          const after = await inspectRun(page)
          expect(after.gold).toBe(before.gold - offer.cost)
          expect(after.owned).toEqual([...before.owned, offer.id])
          expect(after.offers.map((item) => item.id)).not.toContain(offer.id)
          await expect(card).toHaveCount(0)
          purchases++
          // A paid offer cannot reappear, re-charge, or disappear from ownership
          // when the browser resumes the shop. This uses the real action journal.
          await page.reload()
          await expect(
            page.getByRole('heading', { name: 'Tea house', exact: true })
          ).toBeVisible()
          const resumed = await inspectRun(page)
          expect(resumed.saved).toBe(after.saved)
          expect(resumed.gold).toBe(after.gold)
          expect(resumed.owned).toEqual(after.owned)
          expect(resumed.offers).toEqual(after.offers)
        } else {
          await page
            .getByRole('button', { name: 'Next round', exact: true })
            .click()
          await expect(page.getByTestId('table-loop-rack')).toBeVisible()
          const after = await inspectRun(page)
          expect(after.round).toBe(before.round + 1)
          expect(after.score).toBe(0)
          expect(after.owned).toEqual(before.owned)
          expect(after.redraws).toBe(
            after.baseRedraws - (after.owned.includes('jade_ledger') ? 1 : 0)
          )
          if (after.owned.includes('jade_ledger')) checkedLedgerCost = true
          if (after.round === 2)
            await expect(page.getByTestId('boss-banner')).toBeVisible()
        }
      } else {
        expect(before.phase).toBe('playing')
        if (before.score >= before.target) {
          await page.getByTestId('table-loop-finish').click()
        } else {
          const tiles = before.move?.tiles ?? before.exchange
          for (const id of tiles) {
            const tile = page.getByTestId(`rack-tile-${id}`)
            await tile.click()
            await expect(tile).toHaveAttribute('aria-pressed', 'true')
          }
          if (before.move) {
            const slot = page.getByTestId(`table-slot-${before.move.slot}`)
            await expect(slot).toBeEnabled()
            await expect(slot).toHaveAccessibleName(
              new RegExp(`would score ${before.move.score}(?:,|$)`)
            )
            await slot.click()
            const after = await inspectRun(page)
            expect(after.score).toBe(before.score + before.move.score)
            if (
              before.owned.includes('jade_ledger') &&
              after.phase === 'playing'
            ) {
              expect(after.gold).toBe(before.gold + 2)
              ledgerPayments++
            }
          } else {
            await page.getByTestId('table-loop-exchange').click()
          }
        }
      }
    }

    const ended = await inspectRun(page)
    expect(ended.phase).toBe(outcome)
    expect(purchases).toBeGreaterThan(0)
    if (seed === 7) {
      expect(checkedLedgerCost).toBe(true)
      expect(ledgerPayments).toBeGreaterThan(0)
    } else {
      expect([...visitedRounds]).toEqual([0, 1, 2])
    }
    const title =
      outcome === 'runComplete' ? 'Three rounds, cleared' : 'The table ran out'
    await expect(
      page.getByRole('heading', { name: title, exact: true })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`seed-${seed}-ending.png`),
    })
    await page.reload()
    await expect(
      page.getByRole('heading', { name: title, exact: true })
    ).toBeVisible()
    const resumed = await inspectRun(page)
    expect(resumed.runScore).toBe(ended.runScore)
    expect(resumed.saved).toBe(ended.saved)
    await page.getByRole('button', { name: 'Another run', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Choose how you will play' })
    ).toBeVisible()
    expect(new URL(page.url()).search).toBe('')
    const restarted = await inspectRun(page)
    expect(restarted.owned).toEqual([])
    expect(restarted.round).toBe(0)
    expect(restarted.runScore).toBe(0)
    expect(JSON.parse(restarted.saved!).actions).toEqual([])
  })
}
