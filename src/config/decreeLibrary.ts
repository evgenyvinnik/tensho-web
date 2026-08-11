/**
 * Decree Library Adapter
 *
 * `decreeDefinitions.ts` holds the authored content library; `systems/types.ts`
 * defines the effect vocabulary the live scoring pipeline understands. This
 * module translates the former into the latter so authored Decrees actually
 * reach the shop and the score.
 *
 * A definition is only published when every one of its effects maps to
 * behaviour the engine implements. Effects that would need mechanics the
 * engine does not have yet (tile retriggering, Decree copying, and other
 * bespoke rules) are reported by `UNSUPPORTED_DECREE_IDS` rather than shipped
 * as items that silently do nothing.
 */

import type { DecreeDefinition } from './decreeDefinitions'
import {
  ALL_DECREES as ALL_DECREE_DEFINITIONS,
  DECREE_BASE_COSTS,
} from './decreeDefinitions'
import type { DecreeEffect as LibraryEffect, DecreeRarity as LibraryRarity } from '../stores/decreeStore'
import type {
  Decree,
  DecreeCategory,
  DecreeEffect,
  DecreeRarity,
} from '../systems/types'

/** Library rarities are a five-tier scale; the engine uses four. */
const RARITY_MAP: Record<LibraryRarity, DecreeRarity> = {
  common: 'LocalEdict',
  uncommon: 'RegionalMandate',
  rare: 'ImperialDecree',
  legendary: 'ImperialDecree',
  mythic: 'HeavenlyOrdinance',
}

/** Effect families the engine can honour today. */
const SUPPORTED_EFFECT_TYPES = new Set<LibraryEffect['type']>([
  'additive_chips',
  'additive_mult',
  'multiplicative_mult',
  'gold_gain',
  'hand_size',
  'discard_count',
])

/**
 * Translate one authored effect. Returns null when the engine has no
 * implementation for it, which disqualifies the whole Decree.
 */
function convertEffect(
  effect: LibraryEffect,
  description: string
): DecreeEffect | null {
  switch (effect.type) {
    case 'additive_chips':
      return {
        type: 'additive_score',
        trigger: 'OnScored',
        description,
        basePoints: effect.value,
      }

    case 'additive_mult':
      return {
        type: 'additive_score',
        trigger: 'OnScored',
        description,
        multiplier: effect.value,
      }

    case 'multiplicative_mult':
      return {
        type: 'multiplicative_score',
        trigger: 'Independent',
        description,
        multiplier: effect.value,
      }

    case 'gold_gain':
      return {
        type: 'gold',
        trigger: 'OnRoundEnd',
        description,
        amount: effect.value,
      }

    // Hand size and discard counts are round resources, carried as rule
    // modifications and read back by the orchestrator when a round starts.
    case 'hand_size':
      return {
        type: 'rule_modification',
        trigger: 'Passive',
        description,
        ruleId: 'hand_size',
        modification: { delta: effect.value },
      }

    case 'discard_count':
      return {
        type: 'rule_modification',
        trigger: 'Passive',
        description,
        ruleId: 'discard_count',
        modification: { delta: effect.value },
      }

    default:
      return null
  }
}

/** Category is presentational here; derive it from what the Decree does. */
function deriveCategory(definition: DecreeDefinition): DecreeCategory {
  const types = definition.effects.map((effect) => effect.type)
  if (types.includes('hand_size') || types.includes('discard_count')) {
    return 'Entropy'
  }
  if (types.includes('gold_gain')) return 'Entropy'
  if (types.includes('multiplicative_mult')) return 'Scaling'
  return 'YakuDoctrine'
}

function convertDefinition(definition: DecreeDefinition): Decree | null {
  if (definition.effects.length === 0) return null
  if (definition.effects.some((effect) => !SUPPORTED_EFFECT_TYPES.has(effect.type))) {
    return null
  }

  const converted: DecreeEffect[] = []
  for (const effect of definition.effects) {
    const mapped = convertEffect(effect, definition.description)
    if (!mapped) return null
    converted.push(mapped)
  }

  const [primary, ...extras] = converted

  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    category: deriveCategory(definition),
    rarity: RARITY_MAP[definition.rarity],
    cost: DECREE_BASE_COSTS[definition.rarity],
    sellValue: definition.baseSellValue,
    effect: primary,
    extraEffects: extras.length > 0 ? extras : undefined,
  }
}

/** Authored Decrees the engine can run, in library order. */
export const LIBRARY_DECREES: Decree[] = ALL_DECREE_DEFINITIONS.flatMap(
  (definition) => {
    const converted = convertDefinition(definition)
    return converted ? [converted] : []
  }
)

/**
 * Authored Decrees held back because they need mechanics the engine does not
 * implement yet. Kept exported so the gap stays visible and testable.
 */
export const UNSUPPORTED_DECREE_IDS: string[] = ALL_DECREE_DEFINITIONS.filter(
  (definition) => convertDefinition(definition) === null
).map((definition) => definition.id)
