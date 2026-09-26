import type { ClassicRunState } from './ClassicRunState'
import type { RunRandomState } from './RunRandom'
import type { ShopSessionState } from './ShopSession'
import type { RunMetaSnapshot } from './RunMetaContext'
import { useOmenStore, type OmenState } from '../stores/omenStore'

export interface ClassicRoundConfig {
  handsPerRound: number
  discardsPerRound: number
  redrawsPerRound: number
  startingHandSize: number
}

type OmenDataKey = {
  [K in keyof OmenState]: OmenState[K] extends (...args: never[]) => unknown
    ? never
    : K
}[keyof OmenState]
export type OmenRunSnapshot = Pick<OmenState, OmenDataKey>

const OMEN_DATA_KEYS = [
  'activeTags',
  'consumedTags',
  'pendingShopTags',
  'pendingBossTags',
  'roundsSkippedThisRun',
  'handsPlayedThisRun',
  'unusedDiscardsThisRun',
  'hasDoubleOmenActive',
  'lockedSeason',
  'noInterestRounds',
  'unlockedTagIds',
  'currentAct',
  'currentRound',
  'omenHistory',
] as const satisfies readonly OmenDataKey[]

export function captureOmenRunState(): OmenRunSnapshot {
  const store = useOmenStore.getState()
  return structuredClone(
    Object.fromEntries(OMEN_DATA_KEYS.map((key) => [key, store[key]]))
  ) as OmenRunSnapshot
}

/** Complete internal snapshot; storage accepts it only through its validation boundary. */
export interface ClassicRunSnapshot {
  version: 1
  state: ClassicRunState
  config: ClassicRoundConfig
  shop: ShopSessionState
  random: RunRandomState
  omens: OmenRunSnapshot
  meta: RunMetaSnapshot
  runtimeItemCounter: number
  tileIdCounter: number
  consumableInstanceCounter: number
}
