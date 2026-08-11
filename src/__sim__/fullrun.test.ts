/**
 * TEMPORARY diagnostic simulation - not a real test.
 * Drives GameOrchestrator through full runs to find gameplay gaps.
 */
import { describe, it } from 'vitest'
import { GameOrchestrator } from '../game/GameOrchestrator'
import { useShopStore } from '../stores/shopStore'
import type { Decree } from '../systems/types'

interface RunStats {
  seed: number
  plays: number
  partialPlays: number
  fullPlays: number
  hasWon: boolean
  maxAct: number
  errors: string[]
  decreesBought: number
  goldSpent: number
  finalDecrees: number
}

function shopPhase(orch: GameOrchestrator, stats: RunStats): void {
  const shop = useShopStore.getState()
  const state = orch.getState()
  const ownedIds = state.decreeSystem.getOwnedDecrees().map((d) => d.id)

  shop.resetForNewRun()
  shop.openShop(ownedIds, state.lastCompletedRoundType === 'Boss', orch.prepareShopVisit())

  // Buy anything affordable, cheapest first, preferring Decrees.
  for (let pass = 0; pass < 6; pass++) {
    const s = useShopStore.getState()
    const gold = orch.getState().gold
    const affordable = s
      .getAvailableItems()
      .filter((o) => o.finalCost <= gold)
      .sort((a, b) => {
        const aDecree = a.itemType === 'Decree' ? 0 : 1
        const bDecree = b.itemType === 'Decree' ? 0 : 1
        if (aDecree !== bDecree) return aDecree - bDecree
        // Costlier Decrees are the stronger ones; a competent player buys up.
        return b.finalCost - a.finalCost
      })

    const pick = affordable[0]
    if (!pick) break

    const g = orch.getState()
    const result = useShopStore
      .getState()
      .purchaseItem(pick.id, g.gold, g.currentAct, g.currentRound)
    if (!result.success) break

    const charged = orch.purchaseItem(pick.id, result.cost, pick.itemType)
    if (!charged) break
    stats.goldSpent += result.cost

    if (pick.itemType === 'Decree') {
      if (orch.addDecree(pick.item as Decree)) stats.decreesBought++
    }
  }

  useShopStore.getState().closeShop()
  orch.exitShop()
}

function simulateRun(seed: number, buyInShop: boolean): RunStats {
  const orch = new GameOrchestrator()
  const stats: RunStats = {
    seed,
    plays: 0,
    partialPlays: 0,
    fullPlays: 0,
    hasWon: false,
    maxAct: 1,
    errors: [],
    decreesBought: 0,
    goldSpent: 0,
    finalDecrees: 0,
  }

  orch.startNewRun(seed, 1)

  let guard = 0
  while (guard++ < 5000) {
    const s = orch.getState()
    stats.maxAct = Math.max(stats.maxAct, s.currentAct)
    stats.finalDecrees = s.decreeSystem.getOwnedDecrees().length

    if (s.phase === 'gameOver') {
      stats.hasWon = s.hasWonRun
      break
    }

    if (s.phase === 'shop') {
      if (buyInShop) shopPhase(orch, stats)
      else orch.exitShop()
      continue
    }

    if (s.phase !== 'gameplay') {
      stats.errors.push(`Unexpected phase ${s.phase}`)
      break
    }

    const tileIds = s.handTiles.map((t) => t.id)
    if (tileIds.length < 2) {
      stats.errors.push(`Hand too small: ${tileIds.length}`)
      break
    }

    let result = orch.processAction({ type: 'play', tileIds })
    if (!result.success) {
      // A mandate may restrict the selection; try progressively smaller plays.
      for (const size of [5, 4, 3, 2]) {
        result = orch.processAction({ type: 'play', tileIds: tileIds.slice(0, size) })
        if (result.success) break
      }
      if (!result.success) {
        stats.errors.push(`Play blocked: ${result.errors?.join(';')}`)
        break
      }
    }
    stats.plays++

    const scoreEffect = (result.effects ?? []).find((e) => e.type === 'score_added')
    if (scoreEffect) {
      const desc = (scoreEffect as { description: string }).description
      if (desc.includes('partial hand')) stats.partialPlays++
      else stats.fullPlays++
    }
  }

  if (guard >= 5000) stats.errors.push('LOOP GUARD HIT')
  return stats
}

function report(label: string, results: RunStats[]): void {
  const wins = results.filter((r) => r.hasWon).length
  const actDist: Record<number, number> = {}
  for (const r of results) actDist[r.maxAct] = (actDist[r.maxAct] ?? 0) + 1
  const sortedActs = results.map((r) => r.maxAct).sort((a, b) => a - b)

  console.log(`\n--- ${label} ---`)
  console.log(`runs ${results.length} | wins ${wins} (${((wins / results.length) * 100).toFixed(0)}%)`)
  console.log(
    `act reached: median ${sortedActs[Math.floor(results.length / 2)]} max ${sortedActs[sortedActs.length - 1]}`
  )
  console.log('distribution:', JSON.stringify(actDist))
  console.log(
    `avg decrees owned at end: ${(
      results.reduce((s, r) => s + r.finalDecrees, 0) / results.length
    ).toFixed(1)} | avg bought: ${(
      results.reduce((s, r) => s + r.decreesBought, 0) / results.length
    ).toFixed(1)}`
  )
  const errs = [...new Set(results.flatMap((r) => r.errors))]
  if (errs.length) {
    console.log(`errors (${errs.length} distinct):`)
    for (const e of errs.slice(0, 10)) console.log('  - ' + e)
  }
}

describe('full run simulation', () => {
  it('compares progression with and without shop purchases', () => {
    const noShop: RunStats[] = []
    const withShop: RunStats[] = []
    for (let seed = 1; seed <= 30; seed++) {
      try {
        noShop.push(simulateRun(seed, false))
      } catch (err) {
        console.log(`no-shop seed ${seed} THREW: ${(err as Error).message}`)
      }
      try {
        withShop.push(simulateRun(seed, true))
      } catch (err) {
        console.log(`shop seed ${seed} THREW: ${(err as Error).message}\n${(err as Error).stack}`)
      }
    }

    report('NO SHOP PURCHASES', noShop)
    report('BUYING DECREES', withShop)

    const totalPlays = withShop.reduce((s, r) => s + r.plays, 0)
    const partial = withShop.reduce((s, r) => s + r.partialPlays, 0)
    const full = withShop.reduce((s, r) => s + r.fullPlays, 0)
    console.log(
      `\nscoring paths (with shop): partial ${partial} / full ${full} of ${totalPlays} plays`
    )
  }, 300_000)
})
