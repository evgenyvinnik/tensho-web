/**
 * Decree Library Adapter
 *
 * `decreeDefinitions.ts` holds the authored content library; `systems/types.ts`
 * defines the effect vocabulary the live scoring pipeline understands. This
 * module translates the former into the latter so authored Decrees actually
 * reach the shop and the score.
 *
 * A definition is only published when every one of its effects maps to
 * behaviour the engine implements, so a Decree that reaches the shop always
 * does what its text says. Every authored Decree currently qualifies and
 * `UNSUPPORTED_DECREE_IDS` is empty; it stays here as the guard rail for new
 * content, which lands unpublished until its mechanic exists.
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
  GateCondition,
  RetriggerTarget,
  ScalingSource,
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
  'retrigger',
  'tile_transform',
  'special',
])

/**
 * Author conditions that mean "once per X", mapped to the run quantity they
 * scale with. A Decree reading "+10 Mult per Flower" pays 10 for each Flower
 * held rather than a flat 10.
 */
const SCALING_CONDITIONS: Record<string, ScalingSource> = {
  'per Flower': 'flower_count',
  'per Season': 'season_count',
  'per active Season': 'season_count',
}

/**
 * Author conditions that gate an effect, mapped to the requirement the engine
 * checks. A gated Decree pays nothing unless its requirement holds, which is
 * the difference between a conditional reward and an unconditional one.
 */
const GATE_CONDITIONS: Record<string, GateCondition> = {
  // Tile composition
  'if all Manzu': 'all_manzu',
  'if all Pinzu': 'all_pinzu',
  'if all Souzu': 'all_souzu',
  'if hand contains Manzu': 'contains_manzu',
  'if hand contains Pinzu': 'contains_pinzu',
  'if hand contains Souzu': 'contains_souzu',
  'if hand contains Wind': 'contains_wind',
  'if hand contains Dragon': 'contains_dragon',
  'if hand is half Manzu': 'half_manzu',
  'if hand is half Pinzu': 'half_pinzu',
  'if hand is half Souzu': 'half_souzu',
  'if single suit': 'single_suit',
  'if all 3 suits': 'all_three_suits',
  'if all Honors': 'all_honors',
  'if 3+ Honors': 'three_plus_honors',
  'if 4+ Terminals': 'four_plus_terminals',
  'if no Simples': 'no_simples',
  'if has 1 and 9': 'has_one_and_nine',
  'if Wind and Dragon': 'wind_and_dragon',
  // Hand structure
  'if hand contains pair': 'contains_pair',
  'if hand contains sequence': 'contains_sequence',
  'if hand contains triplet': 'contains_triplet',
  'if 2+ triplets': 'two_plus_triplets',
  'if 3 sequences': 'three_sequences',
  // Round state
  'during Boss rounds': 'boss_round',
  'if no discards used': 'no_discards_used',
  'if first hand wins': 'first_hand',
  'if last hand was 0': 'last_hand_scored_zero',
  'if 2x over target': 'double_target',
  // Yaku scored
  'when scoring Riichi': 'yaku_riichi',
  'when scoring Tanyao': 'yaku_tanyao',
  'when scoring Pinfu': 'yaku_pinfu',
  'when scoring Yakuhai': 'yaku_yakuhai',
  'when scoring Ittsu': 'yaku_ittsu',
  'when scoring Toitoi': 'yaku_toitoi',
  'when scoring Sanshoku': 'yaku_sanshoku',
  'when scoring Honitsu': 'yaku_honitsu',
  'when scoring Chinitsu': 'yaku_chinitsu',
  'when scoring Chanta': 'yaku_chanta',
  'when scoring Yakuman': 'yaku_yakuman',
}

/**
 * Retrigger conditions the library authors wrote, mapped to engine targets.
 * A condition absent from this table has no engine meaning and disqualifies
 * its Decree rather than silently retriggering nothing.
 */
const RETRIGGER_TARGETS: Record<string, RetriggerTarget> = {
  'all scoring tiles': 'all',
  'first scoring tile': 'first',
  'last scoring tile': 'last',
  'all Dragon tiles': 'dragon',
  'Dragon tiles': 'dragon',
  'all Wind tiles': 'wind',
  'Wind tiles': 'wind',
  'Honor tiles': 'honor',
  'Terminal tiles': 'terminal',
}

/**
 * Bespoke `special` effects, keyed by the author's condition text. Each entry
 * returns the engine effect that implements it; anything not listed here is
 * still withheld from the pool.
 */
const SPECIAL_EFFECTS: Record<
  string,
  (value: number, description: string) => DecreeEffect
> = {
  'all Yaku ×1.5': (value, description) => ({
    type: 'yaku_modifier',
    trigger: 'Independent',
    description,
    multiplier: value,
  }),
  '+1 Yaku tier': (value, description) => ({
    type: 'yaku_modifier',
    trigger: 'Independent',
    description,
    tierBonus: value,
  }),
  'double retriggers': (value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'retrigger_amplifier',
    modification: { factor: value },
  }),
  'double gold gain': (value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'gold_multiplier',
    modification: { factor: value },
  }),
  'extra hand': (value, description) => ({
    type: 'draw',
    trigger: 'Passive',
    description,
    additionalDraws: value,
  }),
  'extra hands': (value, description) => ({
    type: 'draw',
    trigger: 'Passive',
    description,
    additionalDraws: value,
  }),
  'copies Decree to right': (_value, description) => ({
    type: 'copy_decree',
    trigger: 'Independent',
    description,
    source: 'right',
  }),
  'copies leftmost Decree': (_value, description) => ({
    type: 'copy_decree',
    trigger: 'Independent',
    description,
    source: 'left',
  }),
  'copies random Decree': (_value, description) => ({
    type: 'copy_decree',
    trigger: 'Independent',
    description,
    source: 'random',
  }),
  'copies all Decrees': (_value, description) => ({
    type: 'copy_decree',
    trigger: 'Independent',
    description,
    source: 'all',
  }),
  'suits match for sequences': (_value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'suits_match',
    modification: { suitsMatch: true },
  }),
  'tiles are wild': (_value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'all_wild',
    modification: { allWild: true },
  }),
  'Flowers protected': (_value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'flowers_protected',
    modification: { protected: true },
  }),
  'prevents one loss': (_value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'prevent_loss',
    modification: { consumedOnUse: true },
  }),
  'cannot lose': (_value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'prevent_loss',
    modification: { consumedOnUse: false, scorePenalty: 0.5 },
  }),
  'destroyed on boss loss': (_value, description) => ({
    type: 'rule_modification',
    trigger: 'Passive',
    description,
    ruleId: 'destroy_on_boss_loss',
    modification: { destroy: true },
  }),
}

/** The run quantity an author condition scales with, if any. */
function scalingFor(condition: string | undefined): ScalingSource | undefined {
  return condition ? SCALING_CONDITIONS[condition] : undefined
}

/** The requirement an author condition gates on, if any. */
function gateFor(condition: string | undefined): GateCondition | undefined {
  return condition ? GATE_CONDITIONS[condition] : undefined
}

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
        scaleBy: scalingFor(effect.condition),
        requires: gateFor(effect.condition),
      }

    case 'additive_mult':
      return {
        type: 'additive_score',
        trigger: 'OnScored',
        description,
        multiplier: effect.value,
        scaleBy: scalingFor(effect.condition),
        requires: gateFor(effect.condition),
      }

    case 'multiplicative_mult':
      return {
        type: 'multiplicative_score',
        trigger: 'Independent',
        description,
        multiplier: effect.value,
        scaleBy: scalingFor(effect.condition),
        requires: gateFor(effect.condition),
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

    case 'retrigger': {
      const target = effect.condition ? RETRIGGER_TARGETS[effect.condition] : undefined
      if (!target) return null
      return {
        type: 'retrigger',
        trigger: 'OnScored',
        description,
        target,
        times: effect.value,
      }
    }

    // The one authored transform rewrites what tiles are worth when scored.
    case 'tile_transform':
      if (effect.condition !== 'Simples become Terminals') return null
      return {
        type: 'rule_modification',
        trigger: 'Passive',
        description,
        ruleId: 'simples_as_terminals',
        modification: { transform: true },
      }

    case 'special': {
      const build = effect.condition ? SPECIAL_EFFECTS[effect.condition] : undefined
      return build ? build(effect.value, description) : null
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
