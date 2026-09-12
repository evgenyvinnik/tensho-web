import { TableLoopEngine } from './TableLoopEngine'
import { TABLE_DECREES } from './content'
import type { TableActionResult, TableDecreeId } from './types'

/** Bump when rules or initial collection order change: replays are rules-specific. */
export const TABLE_SAVE_VERSION = 1
export const TABLE_SAVE_KEY = 'tensho-table-loop-v1'
const MAX_ACTIONS = 256

export type SavedAction =
  | { type: 'chooseStarter' | 'buyDecree'; decree: TableDecreeId }
  | { type: 'place' | 'revise'; tiles: number[]; slot: number }
  | { type: 'redraw'; tiles: number[] }
  | { type: 'recoverFromRiver' | 'claimDraft'; tile: number }
  | {
      type:
        | 'passDraft'
        | 'finishRound'
        | 'openShop'
        | 'nextRound'
        | 'takePracticeDecree'
    }

export interface SavedRun {
  version: typeof TABLE_SAVE_VERSION
  seed: number
  draftEnabled: boolean
  practice: boolean
  actions: SavedAction[]
}

export function newSavedRun(engine: TableLoopEngine): SavedRun {
  const { seed, draftEnabled, practice } = engine.getState()
  return {
    version: TABLE_SAVE_VERSION,
    seed,
    draftEnabled,
    practice,
    actions: [],
  }
}

/** IDs are session-local; collection indices identify the same physical tiles on replay. */
export function tileIndices(
  engine: TableLoopEngine,
  ids: readonly string[]
): number[] {
  return ids.map((id) =>
    engine.getState().collection.findIndex((tile) => tile.id === id)
  )
}

export function applySavedAction(
  engine: TableLoopEngine,
  action: SavedAction
): TableActionResult {
  const collection = engine.getState().collection
  const tileId = (index: number) => collection[index]?.id ?? ''
  switch (action.type) {
    case 'chooseStarter':
      return engine.chooseStarter(action.decree)
    case 'buyDecree':
      return engine.buyDecree(action.decree)
    case 'place':
      return engine.place(action.tiles.map(tileId), action.slot)
    case 'revise':
      return engine.revise(action.tiles.map(tileId), action.slot)
    case 'redraw':
      return engine.redraw(action.tiles.map(tileId))
    case 'recoverFromRiver':
      return engine.recoverFromRiver(tileId(action.tile))
    case 'claimDraft':
      return engine.claimDraft(tileId(action.tile))
    case 'passDraft':
      return engine.passDraft()
    case 'finishRound':
      return engine.finishRound()
    case 'openShop':
      return engine.openShop()
    case 'nextRound':
      return engine.nextRound()
    case 'takePracticeDecree':
      return engine.takePracticeDecree()
  }
}

const isIndex = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value < 136

function isSavedAction(value: unknown): value is SavedAction {
  if (!value || typeof value !== 'object') return false
  const action = value as Record<string, unknown>
  switch (action.type) {
    case 'chooseStarter':
    case 'buyDecree':
      return TABLE_DECREES.some((decree) => decree.id === action.decree)
    case 'place':
    case 'revise':
    case 'redraw':
      return (
        Array.isArray(action.tiles) &&
        action.tiles.length > 0 &&
        action.tiles.length <= 4 &&
        action.tiles.every(isIndex) &&
        new Set(action.tiles).size === action.tiles.length &&
        (action.type === 'redraw' || (isIndex(action.slot) && action.slot < 5))
      )
    case 'recoverFromRiver':
    case 'claimDraft':
      return isIndex(action.tile)
    case 'passDraft':
    case 'finishRound':
    case 'openShop':
    case 'nextRound':
    case 'takePracticeDecree':
      return true
    default:
      return false
  }
}

/** Never hydrate arbitrary scores or Tile-shaped objects from browser storage. */
export function restoreSavedRun(
  raw: string
): { engine: TableLoopEngine; journal: SavedRun } | null {
  try {
    if (raw.length > 100_000) return null
    const value = JSON.parse(raw) as Record<string, unknown> | null
    if (
      !value ||
      value.version !== TABLE_SAVE_VERSION ||
      typeof value.seed !== 'number' ||
      !Number.isSafeInteger(value.seed) ||
      typeof value.draftEnabled !== 'boolean' ||
      typeof value.practice !== 'boolean' ||
      !Array.isArray(value.actions) ||
      value.actions.length > MAX_ACTIONS ||
      !value.actions.every(isSavedAction)
    )
      return null
    const journal: SavedRun = {
      version: TABLE_SAVE_VERSION,
      seed: value.seed,
      draftEnabled: value.draftEnabled,
      practice: value.practice,
      actions: value.actions,
    }
    const engine = new TableLoopEngine(journal.seed, journal)
    for (const action of journal.actions) {
      if (!applySavedAction(engine, action).success) return null
    }
    return { engine, journal }
  } catch {
    return null
  }
}
