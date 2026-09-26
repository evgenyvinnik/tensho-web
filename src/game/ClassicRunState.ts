import { Tile, type TileData } from '../core/Tile'
import { Meld, type MeldType } from '../core/Meld'
import { DecreeSystem } from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { SeasonSystem } from '../systems/SeasonSystem'
import { RoundManager } from '../systems/RoundManager'
import {
  ConsumableSystem,
  type BaseConsumable,
} from '../systems/ConsumableSystem'
import { CelestialOrbSystem } from '../systems/CelestialOrbSystem'
import { FateSealSystem } from '../systems/FateSealSystem'
import { VoidScriptSystem } from '../systems/VoidScriptSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import { CharterSystem } from '../systems/CharterSystem'
import { MandateEffectSystem } from '../systems/MandateEffectSystem'
import { DebuffSystem } from './DebuffSystem'
import type { CharterUnlockResolver } from '../config/charterDefinitions'
import type { OrchestratorState } from './GameOrchestrator'

type SystemStates = {
  decreeSystem: ReturnType<DecreeSystem['toState']>
  flowerSystem: ReturnType<FlowerSystem['toState']>
  seasonSystem: ReturnType<SeasonSystem['toState']>
  roundManager: ReturnType<RoundManager['toState']>
  consumableSystem: ReturnType<ConsumableSystem['toState']>
  celestialOrbSystem: ReturnType<CelestialOrbSystem['toState']>
  fateSealSystem: { lastUsedConsumable: BaseConsumable | null }
  voidScriptSystem: ReturnType<VoidScriptSystem['toState']>
  omenSystem: ReturnType<OmenTagSystem['toState']>
  charterSystem: ReturnType<CharterSystem['toState']>
  debuffSystem: ReturnType<DebuffSystem['toJSON']>
  mandateEffectSystem: ReturnType<MandateEffectSystem['toJSON']>
}

type Collections = {
  handTiles: TileData[]
  wallTemplate: TileData[]
  wall: TileData[]
  summerReserve: TileData[]
  deadWall: TileData[]
  discards: TileData[]
  melds: {
    type: MeldType
    tiles: TileData[]
    isConcealed: boolean
    isCalledKan: boolean
  }[]
  selectedTileIds: string[]
  faceDownTileIds: string[]
  yakuPlayCounts: [string, number][]
  currentRoundYakuIds: string[]
  previousRoundYakuIds: string[]
  lastHandScore: number | null
}

/** Internal codec. The durable-save boundary must validate unknown input first. */
export type ClassicRunState = Omit<
  OrchestratorState,
  keyof SystemStates | keyof Collections
> &
  SystemStates &
  Collections

export function captureClassicState(
  state: Readonly<OrchestratorState>
): ClassicRunState {
  return structuredClone({
    ...state,
    lastHandScore: state.lastHandScore ?? null,
    selectedTileIds: [...state.selectedTileIds],
    faceDownTileIds: [...state.faceDownTileIds],
    yakuPlayCounts: [...state.yakuPlayCounts],
    currentRoundYakuIds: [...state.currentRoundYakuIds],
    previousRoundYakuIds: [...state.previousRoundYakuIds],
    decreeSystem: state.decreeSystem.toState(),
    flowerSystem: state.flowerSystem.toState(),
    seasonSystem: state.seasonSystem.toState(),
    roundManager: state.roundManager.toState(),
    consumableSystem: state.consumableSystem.toState(),
    celestialOrbSystem: state.celestialOrbSystem.toState(),
    fateSealSystem: {
      lastUsedConsumable: state.fateSealSystem.getLastUsedConsumable(),
    },
    voidScriptSystem: state.voidScriptSystem.toState(),
    omenSystem: state.omenSystem.toState(),
    charterSystem: state.charterSystem.toState(),
    debuffSystem: state.debuffSystem.toJSON(),
    mandateEffectSystem: state.mandateEffectSystem.toJSON(),
  })
}

function tiles(saved: TileData[]): Tile[] {
  return saved.map((t) => new Tile(t.suit, t.rank, t.id, t.isRed, t.modifiers))
}

/** Stages new instances without drawing, emitting domain events or changing stores. */
export function restoreClassicState(
  saved: ClassicRunState,
  isCharterUnlocked: CharterUnlockResolver
): OrchestratorState {
  const copy = structuredClone(saved)
  const debuffSystem = DebuffSystem.fromJSON(copy.debuffSystem)
  const mandateEffectSystem = MandateEffectSystem.fromJSON(
    copy.mandateEffectSystem
  )
  mandateEffectSystem.setDebuffSystem(debuffSystem)
  const fateSealSystem = new FateSealSystem()
  if (copy.fateSealSystem.lastUsedConsumable)
    fateSealSystem.setLastUsedConsumable(copy.fateSealSystem.lastUsedConsumable)
  return {
    ...copy,
    tableModifiers: Object.freeze(copy.tableModifiers),
    lastHandScore: copy.lastHandScore ?? undefined,
    handTiles: tiles(copy.handTiles),
    wallTemplate: tiles(copy.wallTemplate),
    wall: tiles(copy.wall),
    summerReserve: tiles(copy.summerReserve),
    deadWall: tiles(copy.deadWall),
    discards: tiles(copy.discards),
    melds: copy.melds.map(
      (m) => new Meld(m.type, tiles(m.tiles), m.isConcealed, m.isCalledKan)
    ),
    selectedTileIds: new Set(copy.selectedTileIds),
    faceDownTileIds: new Set(copy.faceDownTileIds),
    yakuPlayCounts: new Map(copy.yakuPlayCounts),
    currentRoundYakuIds: new Set(copy.currentRoundYakuIds),
    previousRoundYakuIds: new Set(copy.previousRoundYakuIds),
    decreeSystem: DecreeSystem.fromState(copy.decreeSystem),
    flowerSystem: FlowerSystem.fromState(copy.flowerSystem),
    seasonSystem: SeasonSystem.fromState(copy.seasonSystem),
    roundManager: RoundManager.fromState(copy.roundManager),
    consumableSystem: ConsumableSystem.fromState(copy.consumableSystem),
    celestialOrbSystem: CelestialOrbSystem.fromState(copy.celestialOrbSystem),
    fateSealSystem,
    voidScriptSystem: VoidScriptSystem.fromState(copy.voidScriptSystem),
    omenSystem: OmenTagSystem.fromState(copy.omenSystem),
    charterSystem: CharterSystem.fromState(
      copy.charterSystem,
      isCharterUnlocked
    ),
    debuffSystem,
    mandateEffectSystem,
  }
}
