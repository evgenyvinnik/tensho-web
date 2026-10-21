/**
 * Upgrade a saved Classic run to the current rules before validation.
 *
 * Saved rule-bearing items are copies of catalog definitions, checked against
 * the catalog on load. When the catalog changes (new text, a re-targeted
 * Orb, a pack that now picks two), a run saved earlier would no longer match.
 * This module re-reads each saved item from the current catalog by id and
 * keeps only its runtime fields (instance id, edition, stickers, …). The
 * catalog stays the authority: nothing from the save is trusted as rules.
 *
 * Version 3 (the shared Turns budget) also converts an older run's round
 * resources: its remaining hands and redraws become Turns, its remaining
 * discards become free redraws, and the retired Riichi pledge is dropped.
 * Earned scores are never rewritten.
 *
 * Pure: returns a new value and never touches storage. Unknown future
 * versions are returned unchanged so validation rejects them.
 */

import { ALL_DECREES } from '../systems/DecreeSystem'
import { FATE_SEALS } from '../systems/FateSealSystem'
import { CELESTIAL_ORBS } from '../systems/CelestialOrbSystem'
import { VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { ALL_CHARTERS } from '../config/charterDefinitions'
import { ALL_MANDATES } from '../config/mandateDefinitions'
import { ALL_OMENS } from '../config/omenDefinitions'
import { BOSS_MANDATES, SHOWDOWN_MANDATES } from '../systems/RoundManager'
import {
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
} from '../systems/TeaHouseSystem'
import { PACK_SIZE_DEFINITIONS } from '../config/packDefinitions'
import { TURNS_PER_ROUND } from './playRules'

export const CURRENT_SNAPSHOT_VERSION = 3

type Json = Record<string, unknown>

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const DECREE_RUNTIME = new Set([
  'edition',
  'sticker',
  'stickers',
  'isDebuffed',
  'sellValue',
  'instanceId',
  'randomCopyTargetId',
  'acquiredRound',
  'roundsActive',
  'scalingValue',
])
const CONSUMABLE_RUNTIME = new Set([
  'instanceId',
  'isUsed',
  'edition',
  'sellValue',
  'source',
  'currentLevel',
])
const CHARTER_RUNTIME = new Set(['acquiredAct', 'acquiredRound'])
const NO_RUNTIME = new Set<string>()

/** Current definition of `item`, keeping only its runtime fields. */
function refresh(
  item: unknown,
  definitions: readonly { id: string }[],
  runtime: ReadonlySet<string>
): unknown {
  if (!isRecord(item)) return item
  const definition = definitions.find((entry) => entry.id === item.id)
  if (!definition) return item
  const kept = Object.fromEntries(
    Object.entries(item).filter(([key]) => runtime.has(key))
  )
  return { ...structuredClone(definition), ...kept }
}

const consumableCatalogs: Record<string, readonly { id: string }[]> = {
  FateSeal: Object.values(FATE_SEALS),
  CelestialOrb: Object.values(CELESTIAL_ORBS),
  VoidScript: Object.values(VOID_SCRIPTS),
}

function refreshConsumable(item: unknown): unknown {
  if (!isRecord(item) || typeof item.type !== 'string') return item
  const definitions = consumableCatalogs[item.type]
  return definitions ? refresh(item, definitions, CONSUMABLE_RUNTIME) : item
}

function refreshDecree(item: unknown): unknown {
  // The legacy conditional Austerity is accepted as-is by validation.
  if (
    isRecord(item) &&
    item.id === 'closed_hand_austerity' &&
    isRecord(item.effect) &&
    item.effect.type === 'conditional'
  )
    return item
  return refresh(item, ALL_DECREES, DECREE_RUNTIME)
}

/** Extra Arcana Pack choices granted by the saved run's Charters. */
function arcanaChoiceBonus(charterIds: unknown): number {
  if (!Array.isArray(charterIds)) return 0
  return ALL_CHARTERS.filter((charter) => charterIds.includes(charter.id))
    .flatMap((charter) => charter.effects)
    .filter((effect) => effect.type === 'arcana_choices')
    .reduce((sum, effect) => sum + (effect.value as number), 0)
}

function refreshPack(pack: unknown, arcanaBonus: number): unknown {
  if (!isRecord(pack) || typeof pack.size !== 'string') return pack
  const size =
    PACK_SIZE_DEFINITIONS[pack.size as keyof typeof PACK_SIZE_DEFINITIONS]
  if (!size) return pack
  // Keep a Crystal Lens choice the pack already has, up to what the run's
  // Charters grant. A pack stocked before the Lens was bought stays as it was.
  const extra =
    pack.type === 'Arcana' && typeof pack.choiceCount === 'number'
      ? Math.min(Math.max(0, pack.choiceCount - size.choiceCount), arcanaBonus)
      : 0
  // The price paid or quoted stays; only how many rewards it holds changes.
  return {
    ...pack,
    choiceCount: size.choiceCount + extra,
    selectCount: size.selectCount,
  }
}

function refreshReward(reward: unknown): unknown {
  if (!isRecord(reward)) return reward
  if (reward.type === 'Decree')
    return { ...reward, data: refreshDecree(reward.data) }
  if (typeof reward.type === 'string' && reward.type in consumableCatalogs)
    return { ...reward, data: refreshConsumable(reward.data) }
  return reward
}

function refreshOffering(offering: unknown, arcanaBonus: number): unknown {
  if (!isRecord(offering)) return offering
  const item = offering.item
  switch (offering.itemType) {
    case 'Decree':
      return { ...offering, item: refreshDecree(item) }
    case 'FateSeal':
    case 'CelestialOrb':
    case 'VoidScript':
      return { ...offering, item: refreshConsumable(item) }
    case 'BlessingPack':
      return { ...offering, item: refreshPack(item, arcanaBonus) }
    case 'ImperialCharter':
      // Offerings carry the Tea House's own Charter shape, not the catalog's.
      return {
        ...offering,
        item: refresh(
          item,
          [...TEA_HOUSE_BASE_CHARTERS, ...TEA_HOUSE_UPGRADED_CHARTERS],
          NO_RUNTIME
        ),
      }
    default:
      return offering
  }
}

const mapArray = (value: unknown, map: (item: unknown) => unknown) =>
  Array.isArray(value) ? value.map(map) : value

const renameRiichi = (entries: unknown) =>
  mapArray(entries, (entry) =>
    Array.isArray(entry) && entry[0] === 'Riichi' ? ['Pairs', entry[1]] : entry
  )

/** Refresh every saved catalog item to its current definition. */
function refreshContent(snapshot: Json): Json {
  const state = isRecord(snapshot.state) ? { ...snapshot.state } : null
  if (state) {
    if (isRecord(state.decreeSystem))
      state.decreeSystem = {
        ...state.decreeSystem,
        ownedDecrees: mapArray(state.decreeSystem.ownedDecrees, refreshDecree),
      }
    for (const key of ['fateSeals', 'celestialOrbs', 'voidScripts'])
      state[key] = mapArray(state[key], refreshConsumable)
    if (
      isRecord(state.consumableSystem) &&
      isRecord(state.consumableSystem.inventory)
    ) {
      const inventory = { ...state.consumableSystem.inventory }
      for (const key of ['fateSeals', 'celestialOrbs', 'voidScripts'])
        inventory[key] = mapArray(inventory[key], refreshConsumable)
      const system: Json = { ...state.consumableSystem, inventory }
      // Fate Seals and Void Scripts no longer have a per-round use limit.
      for (const key of [
        'sealsUsedThisRound',
        'maxSealsPerRound',
        'scriptsUsedThisRound',
        'maxScriptsPerRound',
      ])
        delete system[key]
      state.consumableSystem = system
    }
    if (isRecord(state.celestialOrbSystem))
      state.celestialOrbSystem = {
        ...state.celestialOrbSystem,
        orbLevels: renameRiichi(state.celestialOrbSystem.orbLevels),
        yakuTriggerCounts: renameRiichi(
          state.celestialOrbSystem.yakuTriggerCounts
        ),
        activeOrbs: mapArray(
          state.celestialOrbSystem.activeOrbs,
          refreshConsumable
        ),
      }
    if (isRecord(state.fateSealSystem))
      state.fateSealSystem = {
        ...state.fateSealSystem,
        lastUsedConsumable: refreshConsumable(
          state.fateSealSystem.lastUsedConsumable
        ),
      }
    if (isRecord(state.omenSystem))
      state.omenSystem = {
        ...state.omenSystem,
        pendingOmens: mapArray(state.omenSystem.pendingOmens, (omen) =>
          refresh(omen, ALL_OMENS, NO_RUNTIME)
        ),
      }
    if (isRecord(state.charterSystem))
      state.charterSystem = {
        ...state.charterSystem,
        ownedCharters: mapArray(state.charterSystem.ownedCharters, (charter) =>
          refresh(charter, ALL_CHARTERS, CHARTER_RUNTIME)
        ),
      }
    if (isRecord(state.roundManager)) {
      const manager = { ...state.roundManager }
      const refreshRound = (round: unknown) =>
        isRecord(round) && round.bossMandate
          ? {
              ...round,
              // Rounds carry the shorter Boss shape, not the full catalog entry.
              bossMandate: refresh(
                round.bossMandate,
                [...BOSS_MANDATES, ...SHOWDOWN_MANDATES],
                NO_RUNTIME
              ),
            }
          : round
      if (isRecord(manager.currentAct))
        manager.currentAct = {
          ...manager.currentAct,
          rounds: mapArray(manager.currentAct.rounds, refreshRound),
        }
      manager.currentRound = refreshRound(manager.currentRound)
      state.roundManager = manager
    }
    if (isRecord(state.mandateEffectSystem)) {
      const system: Json = {
        ...state.mandateEffectSystem,
        // The Mouth once locked a Yaku; it now locks the first play's hand
        // type, and a Yaku names none, so a run saved mid-round starts afresh.
        lockedPatternId: state.mandateEffectSystem.lockedPatternId ?? null,
        activeMandate: refresh(
          state.mandateEffectSystem.activeMandate,
          ALL_MANDATES,
          NO_RUNTIME
        ),
      }
      delete system.firstYakuType
      state.mandateEffectSystem = system
    }
  }

  const shop = isRecord(snapshot.shop) ? { ...snapshot.shop } : null
  if (shop) {
    const bonus = arcanaChoiceBonus(
      isRecord(shop.teaHouse) ? shop.teaHouse.purchasedCharterIds : undefined
    )
    const offering = (item: unknown) => refreshOffering(item, bonus)
    if (isRecord(shop.teaHouse))
      shop.teaHouse = {
        ...shop.teaHouse,
        itemOfferings: mapArray(shop.teaHouse.itemOfferings, offering),
        packOfferings: mapArray(shop.teaHouse.packOfferings, offering),
        charterOffering: offering(shop.teaHouse.charterOffering),
      }
    if (isRecord(shop.packs))
      shop.packs = {
        ...shop.packs,
        currentOfferings: mapArray(shop.packs.currentOfferings, (offer) => {
          if (!isRecord(offer)) return offer
          const pack = refreshPack(offer.pack, bonus)
          return {
            ...offer,
            pack,
            contents: mapArray(offer.contents, refreshReward),
            maxSelections: isRecord(pack)
              ? pack.selectCount
              : offer.maxSelections,
          }
        }),
      }
  }
  return {
    ...snapshot,
    ...(state ? { state } : {}),
    ...(shop ? { shop } : {}),
  }
}

/** Convert a pre-Turns run's round resources (versions 1 and 2). */
function convertToTurns(snapshot: Json): Json {
  const state = isRecord(snapshot.state) ? { ...snapshot.state } : null
  const config = isRecord(snapshot.config) ? snapshot.config : {}
  if (!state) return snapshot
  const number = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0
  const hands = number(state.handsRemaining)
  const allowance = number(state.handsAllowance)
  const redraws = number(state.redrawsRemaining)
  const discards = number(state.discardsRemaining)
  state.playsThisRound = Math.max(0, allowance - hands)
  state.tilesRedrawnThisRound = 0
  // Remaining hands and redraws become Turns; single-tile discards become
  // free redraws. A run between rounds starts its next round fresh anyway.
  state.handsRemaining = hands + redraws
  state.handsAllowance = allowance + number(config.redrawsPerRound)
  state.redrawsRemaining = Math.min(discards, 3)
  state.discardsRemaining = 0
  delete state.riichiStatus
  return {
    ...snapshot,
    state,
    config: {
      ...config,
      handsPerRound: TURNS_PER_ROUND,
      discardsPerRound: 0,
      redrawsPerRound: 0,
    },
  }
}

/** Upgrade any supported saved run to the current version and catalog. */
export function upgradeClassicRunSnapshot(value: unknown): unknown {
  if (!isRecord(value)) return value
  const version = value.version
  if (version !== 1 && version !== 2 && version !== CURRENT_SNAPSHOT_VERSION)
    return value
  const upgraded = refreshContent(
    version === CURRENT_SNAPSHOT_VERSION ? value : convertToTurns(value)
  )
  // Version 1 saves predate the earned Bamboo/Summer flag.
  if (version === 1 && isRecord(upgraded.state))
    upgraded.state = {
      ...upgraded.state,
      bambooSummerProtection: upgraded.state.bambooSummerProtection ?? false,
    }
  return { ...upgraded, version: CURRENT_SNAPSHOT_VERSION }
}
