/** Rule-bearing items are checked against authored catalogs, never trusted as code/data from a save. */
import { TileSuit, type TileData } from '../core/Tile'
import { EditionType, EnhancementType, SealType } from '../core/TileModifier'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { FATE_SEALS } from '../systems/FateSealSystem'
import { CELESTIAL_ORBS } from '../systems/CelestialOrbSystem'
import { VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { FLOWER_BASE_EFFECTS, FLOWER_MUTATIONS } from '../systems/FlowerSystem'
import {
  SEASON_BASE_EFFECTS,
  CORRUPTED_SEASON_EFFECTS,
  CORRUPTED_TO_BASE_SEASON,
} from '../systems/SeasonSystem'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { BOSS_MANDATES, SHOWDOWN_MANDATES } from '../systems/RoundManager'
import {
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
  type SerializedTeaHouseOffering,
} from '../systems/TeaHouseSystem'
import type { BlessingPack, FlowerTile, SeasonTile } from '../systems/types'
import type { PackContent, PackOffering } from '../systems/BlessingPackSystem'
import {
  type Check,
  array,
  bool,
  catalog,
  choice,
  count,
  id,
  integer,
  invalid,
  keyed,
  nonnegative,
  object,
  optional,
  positive,
  record,
  ruleDefinition,
  schema,
  text,
} from './snapshotValidation'

export const stake = choice([1, 2, 3, 4, 5, 6, 7, 8])
export const roundNumber = choice([1, 2, 3])
export const roundType = choice(['Small', 'Large', 'Boss'])
export const seasonType = choice(Object.keys(SEASON_BASE_EFFECTS))
export const flowerType = choice(Object.keys(FLOWER_BASE_EFFECTS))
export const yakuCategory = choice(
  Object.values(CELESTIAL_ORBS).map((orb) => orb.effect.targetYaku)
)
export const edition = choice(Object.values(EditionType))
export const tableStakeEdition = choice([
  'Foil',
  'Holographic',
  'Polychrome',
  'Negative',
])

const tileShape = schema<TileData>({
  suit: choice(Object.values(TileSuit)),
  rank: positive,
  id,
  isRed: bool,
  modifiers: object({
    enhancement: choice(Object.values(EnhancementType)),
    seal: choice(Object.values(SealType)),
    edition,
  }),
})
export const tile: Check = (v, p) => {
  tileShape(v, p)
  const t = v as TileData
  const max = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu].includes(t.suit)
    ? 9
    : t.suit === TileSuit.Dragon
      ? 3
      : 4
  if (t.rank > max) invalid(`${p}.rank`)
  // A red tile can later be transformed in suit/rank by a Seal. Preserve that
  // runtime flag; do not impose the starting-wall red-five constraint here.
}
export const tiles = keyed(tile, 'id')
const decreeRuntime = {
  edition: optional(tableStakeEdition),
  sticker: optional(
    object({
      type: choice(['Eternal', 'Perishable', 'Rental']),
      roundsRemaining: optional(integer),
      goldPerRound: optional(nonnegative),
    })
  ),
  isDebuffed: optional(bool),
  sellValue: optional(nonnegative),
}
export const decree = catalog(ALL_DECREES, decreeRuntime)
export const ownedDecree = catalog(ALL_DECREES, {
  ...decreeRuntime,
  acquiredRound: count,
  roundsActive: count,
  scalingValue: optional(nonnegative),
})
const consumableRuntime = {
  instanceId: id,
  isUsed: bool,
  edition: choice(['Base', 'Foil', 'Holographic', 'Polychrome', 'Negative']),
  sellValue: nonnegative,
  source: optional(choice(['purchase', 'pack_open', 'generated'])),
}
export const seal = catalog(Object.values(FATE_SEALS), consumableRuntime)
export const orb = catalog(Object.values(CELESTIAL_ORBS), {
  ...consumableRuntime,
  currentLevel: positive,
})
export const script = catalog(Object.values(VOID_SCRIPTS), consumableRuntime)
export const consumable: Check = (v, p) => {
  const type = record(v, p).type
  if (type === 'FateSeal') seal(v, p)
  else if (type === 'CelestialOrb') orb(v, p)
  else if (type === 'VoidScript') script(v, p)
  else invalid(`${p}.type`)
}
export const charter = catalog(ALL_CHARTERS, {
  acquiredAct: positive,
  acquiredRound: roundNumber,
})
export const mandate = catalog(ALL_MANDATES)
export const boss = catalog([...BOSS_MANDATES, ...SHOWDOWN_MANDATES])
export const omen = catalog(ALL_OMENS)
export const omenId = choice(ALL_OMENS.map((o) => o.id))
export const charterId = choice(ALL_CHARTERS.map((c) => c.id))
export const omenTrigger = choice([...new Set(ALL_OMENS.map((o) => o.trigger))])

export const flower: Check = (v, p) => {
  const data = record(v, p)
  flowerType(data.type, `${p}.type`)
  const type = data.type as FlowerTile['type']
  schema<FlowerTile>({
    id,
    type: flowerType,
    effect: (effect, path) =>
      ruleDefinition(effect, FLOWER_BASE_EFFECTS[type], path),
    mutation: optional((mutation, path) =>
      ruleDefinition(
        mutation,
        { ...FLOWER_MUTATIONS[type], isUnlocked: true },
        path
      )
    ),
  })(v, p)
}
export const season: Check = (v, p) => {
  const data = record(v, p)
  seasonType(data.type, `${p}.type`)
  const type = data.type as SeasonTile['type']
  const corrupted = data.corruptedType as NonNullable<
    SeasonTile['corruptedType']
  >
  schema<SeasonTile>({
    id,
    type: seasonType,
    isCorrupted: bool,
    effect: (effect, path) =>
      ruleDefinition(effect, SEASON_BASE_EFFECTS[type], path),
    corruptedType: optional(choice(Object.keys(CORRUPTED_SEASON_EFFECTS))),
    corruptedEffect: (effect, path) =>
      ruleDefinition(
        effect,
        data.isCorrupted ? CORRUPTED_SEASON_EFFECTS[corrupted] : undefined,
        path
      ),
  })(v, p)
  if (
    data.isCorrupted
      ? CORRUPTED_TO_BASE_SEASON[corrupted] !== type
      : data.corruptedType !== undefined
  )
    invalid(`${p}.corruptedType`)
}

export const packDefinition = schema<BlessingPack>({
  id,
  type: choice(['Arcana', 'Celestial', 'Tile', 'Decree', 'Void']),
  size: choice(['Normal', 'Jumbo', 'Mega']),
  cost: nonnegative,
  choiceCount: positive,
  selectCount: positive,
})
const rewards: Record<PackContent['type'], Check> = {
  Tile: tile,
  Decree: decree,
  FateSeal: seal,
  CelestialOrb: orb,
  VoidScript: script,
}
const reward: Check = (v, p) => {
  const data = record(v, p)
  choice(Object.keys(rewards))(data.type, `${p}.type`)
  schema<PackContent>({
    id,
    type: choice(Object.keys(rewards)),
    name: text,
    description: text,
    rarity: choice(['common', 'uncommon', 'rare', 'legendary']),
    data: rewards[data.type as PackContent['type']],
  })(v, p)
}
export const pack: Check = (v, p) => {
  // Rewards are addressed by index. Their legacy display IDs can repeat when
  // the same catalog item is generated twice within one millisecond.
  schema<PackOffering>({
    pack: packDefinition,
    contents: array(reward),
    isOpened: bool,
    isResolved: bool,
    selectedIndices: array(count),
    maxSelections: positive,
  })(v, p)
  const data = v as PackOffering
  if (
    data.contents.length > data.pack.choiceCount ||
    data.maxSelections !== data.pack.selectCount ||
    data.maxSelections > data.pack.choiceCount ||
    data.selectedIndices.length > data.maxSelections ||
    new Set(data.selectedIndices).size !== data.selectedIndices.length ||
    data.selectedIndices.some((index) => index >= data.contents.length) ||
    (!data.isOpened && (data.isResolved || data.selectedIndices.length > 0))
  )
    invalid(p)
}
const shopItems: Record<SerializedTeaHouseOffering['itemType'], Check> = {
  ...rewards,
  BlessingPack: packDefinition,
  ImperialCharter: catalog([
    ...TEA_HOUSE_BASE_CHARTERS,
    ...TEA_HOUSE_UPGRADED_CHARTERS,
  ]),
}
export const offering: Check = (v, p) => {
  const data = record(v, p)
  choice(Object.keys(shopItems))(data.itemType, `${p}.itemType`)
  schema<SerializedTeaHouseOffering>({
    id,
    slotIndex: count,
    itemType: choice(Object.keys(shopItems)),
    item: shopItems[data.itemType as SerializedTeaHouseOffering['itemType']],
    baseCost: nonnegative,
    editionCost: nonnegative,
    finalCost: nonnegative,
    sellValue: nonnegative,
    edition: optional(tableStakeEdition),
    isPurchased: bool,
    isLocked: bool,
  })(v, p)
}
