/**
 * Does the Table Loop shop do what E04 asks?
 *
 * The experiments document sets two tests for it: a purchase should regularly
 * change the next draw the player wants, and an early shop should keep at
 * least two viable directions open. Neither was ever measured — the shop was
 * built to spec and left there.
 *
 *   bun scripts/tableloop-shop.mts [runs]
 */

import { TableLoopEngine } from '../src/tableloop/TableLoopEngine.ts'
import { enumerateRackGroups } from '../src/tableloop/groupRules.ts'
import { TABLE_DECREES, getTableDecree } from '../src/tableloop/content.ts'
import { TileSuit } from '../src/core/Tile.ts'
import { MeldType } from '../src/core/Meld.ts'
import type { TableDecreeId } from '../src/tableloop/types.ts'

const RUNS = Number(process.argv[2] ?? 300)

interface ShopVisit {
  gold: number
  offers: number
  affordable: number
}

interface Placement {
  type: MeldType
  suit: TileSuit
}

/** Best legal move, priced by the engine's own forecast. */
function bestMove(engine: TableLoopEngine) {
  const state = engine.getState()
  let best: {
    tileIds: string[]
    slot: number
    total: number
    type: MeldType
    suit: TileSuit
  } | null = null

  const groupOptions = { allowGap: state.gapBridgesRemaining > 0 }
  for (const group of enumerateRackGroups(state.rack, groupOptions)) {
    const tileIds = group.map((tile) => tile.id)
    const same = group.every(
      (tile) => tile.suit === group[0].suit && tile.rank === group[0].rank
    )
    const type =
      group.length === 2
        ? MeldType.Pair
        : same
          ? group.length === 4
            ? MeldType.Quad
            : MeldType.Triplet
          : MeldType.Sequence
    for (const slot of state.slots) {
      const forecast = engine.previewPlacement(tileIds, slot.index)
      if (!forecast) continue
      if (!best || forecast.total > best.total) {
        best = {
          tileIds,
          slot: slot.index,
          total: forecast.total,
          type,
          suit: group[0].suit,
        }
      }
    }
  }
  return best
}

function playRun(
  seed: number,
  starter: TableDecreeId,
  buy: boolean,
  extra?: TableDecreeId
): { visits: ShopVisit[]; placements: Placement[]; owned: TableDecreeId[] } {
  const engine = new TableLoopEngine(seed)
  engine.chooseStarter(starter)
  if (extra) {
    // Not a starter, so grant it directly to isolate what it changes.
    const granted = engine.getState()
    TableLoopEngine.fromState({
      ...granted,
      ownedDecrees: [...granted.ownedDecrees, extra],
    })
    engine.grantForMeasurement(extra)
  }

  const visits: ShopVisit[] = []
  const placements: Placement[] = []

  for (let guard = 0; guard < 400; guard += 1) {
    const state = engine.getState()
    if (state.phase === 'runFailed' || state.phase === 'runComplete') break

    if (state.phase === 'roundCleared') {
      engine.openShop()
      const shop = engine.getState()
      const affordable = shop.shopOffers.filter(
        (id) => getTableDecree(id).cost <= shop.gold
      )
      visits.push({
        gold: shop.gold,
        offers: shop.shopOffers.length,
        affordable: affordable.length,
      })
      if (buy && affordable.length > 0) {
        // Cheapest first, so "could afford two" is what limits the choice.
        const pick = affordable
          .map((id) => getTableDecree(id))
          .sort((a, b) => a.cost - b.cost)[0]
        engine.buyDecree(pick.id)
      }
      engine.nextRound()
      continue
    }

    if (state.phase !== 'playing') break

    const move = bestMove(engine)
    if (!move || move.total <= 0) {
      const loose = state.rack.slice(0, 3).map((tile) => tile.id)
      if (!engine.redraw(loose).success) break
      continue
    }
    const occupied = state.slots[move.slot].group !== null
    if (occupied) engine.revise(move.tileIds, move.slot)
    else engine.place(move.tileIds, move.slot)
    placements.push({ type: move.type, suit: move.suit })
  }

  return { visits, placements, owned: [...engine.getState().ownedDecrees] }
}

// --- E04's first test: does owning a Decree change what you place? ----------

function placementProfile(starter: TableDecreeId, extra?: TableDecreeId) {
  const counts = { bambooRun: 0, otherRun: 0, set: 0, pair: 0, total: 0 }
  for (let seed = 1; seed <= RUNS; seed += 1) {
    for (const placement of playRun(seed, starter, false, extra).placements) {
      counts.total += 1
      if (placement.type === MeldType.Pair) counts.pair += 1
      else if (placement.type === MeldType.Sequence) {
        if (placement.suit === TileSuit.Souzu) counts.bambooRun += 1
        else counts.otherRun += 1
      } else counts.set += 1
    }
  }
  return counts
}

console.log(`Table Loop shop — ${RUNS} runs\n`)
console.log('E04: does a Decree change what you place?')
const header = ['Bamboo run', 'other run', 'set', 'pair']
console.log(
  `  ${''.padEnd(18)}${header.map((h) => h.padStart(12)).join('')}${'placements'.padStart(9)}`
)
const row = (label: string, starter: TableDecreeId, extra?: TableDecreeId) => {
  const p = placementProfile(starter, extra)
  const pct = (n: number) => `${((n / p.total) * 100).toFixed(1)}%`.padStart(12)
  console.log(
    `  ${label.padEnd(18)}${pct(p.bambooRun)}${pct(p.otherRun)}${pct(p.set)}${pct(p.pair)}` +
      `${String(p.total).padStart(9)}`
  )
}
for (const starter of ['echoing_bamboo', 'watch_fire', 'patient_pair'] as const) {
  row(starter, starter)
}
console.log('  --- with a Decree that acts on the rack, not the score ---')
row('+ wide_rack', 'echoing_bamboo', 'wide_rack')
row('+ gap_bridge', 'echoing_bamboo', 'gap_bridge')

// --- E04's second test: are two directions open in an early shop? ----------

console.log('\nE04: how many offers can be afforded at a shop?')
for (const buy of [false, true]) {
  const visits: ShopVisit[] = []
  for (let seed = 1; seed <= RUNS; seed += 1) {
    visits.push(...playRun(seed, 'echoing_bamboo', buy).visits)
  }
  if (visits.length === 0) {
    console.log(`  ${buy ? 'buying' : 'saving'}: no shop was ever reached`)
    continue
  }
  const share = (n: number) =>
    `${((visits.filter((v) => v.affordable === n).length / visits.length) * 100).toFixed(0)}%`
  const two = (
    (visits.filter((v) => v.affordable >= 2).length / visits.length) *
    100
  ).toFixed(0)
  console.log(
    `  ${(buy ? 'buying' : 'saving').padEnd(8)} visits ${String(visits.length).padStart(4)}` +
      `  ·  median gold ${[...visits].map((v) => v.gold).sort((a, b) => a - b)[Math.floor(visits.length / 2)]}` +
      `  ·  afford 0: ${share(0)}  1: ${share(1)}  2+: ${two}%`
  )
}

console.log(`\nPool: ${TABLE_DECREES.length} Decrees, costs ${TABLE_DECREES.map((d) => d.cost).sort((a, b) => a - b).join('/')}`)
