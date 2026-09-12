/**
 * Audio Definitions for Tensho Mahjong Roguelike
 *
 * Defines all sound effects and music tracks used in the game.
 * Sound effects are categorized by type for easy organization.
 */

import { withBasePath } from '../utils/basePath'

// =============================================================================
// SOUND EFFECT CATEGORIES
// =============================================================================

/**
 * Tile-related sound effects
 */
export const TILE_SOUNDS = {
  draw: 'tile_draw',
  discard: 'tile_discard',
  select: 'tile_select',
  deselect: 'tile_deselect',
  slide: 'tile_slide',
  place: 'tile_place',
  flip: 'tile_flip',
} as const

/**
 * UI sound effects
 */
export const UI_SOUNDS = {
  buttonClick: 'ui_button_click',
  buttonHover: 'ui_button_hover',
  menuOpen: 'ui_menu_open',
  menuClose: 'ui_menu_close',
  navigate: 'ui_navigate',
  toggle: 'ui_toggle',
  slider: 'ui_slider',
  tabSwitch: 'ui_tab_switch',
} as const

/**
 * Game state sound effects
 */
export const GAME_SOUNDS = {
  scoreTally: 'game_score_tally',
  scoreChip: 'game_score_chip',
  goldEarned: 'game_gold_earned',
  goldSpent: 'game_gold_spent',
  roundComplete: 'game_round_complete',
  roundFailed: 'game_round_failed',
  actComplete: 'game_act_complete',
  gameOver: 'game_over',
  victory: 'game_victory',
  handPlayed: 'game_hand_played',
} as const

/**
 * Special event sound effects
 */
export const SPECIAL_SOUNDS = {
  yakuScored: 'special_yaku_scored',
  yakumanScored: 'special_yakuman',
  yakumanDramatic: 'special_yakuman_dramatic',
  decreeAcquired: 'special_decree_acquired',
  decreeTriggered: 'special_decree_triggered',
  flowerCollected: 'special_flower_collected',
  seasonActivated: 'special_season_activated',
  packOpening: 'special_pack_opening',
  itemReveal: 'special_item_reveal',
  legendaryReveal: 'special_legendary_reveal',
  charterRedeemed: 'special_charter_redeemed',
} as const

/**
 * Feedback sound effects
 */
export const FEEDBACK_SOUNDS = {
  error: 'feedback_error',
  invalidAction: 'feedback_invalid',
  success: 'feedback_success',
  warning: 'feedback_warning',
  notification: 'feedback_notification',
  confirm: 'feedback_confirm',
  cancel: 'feedback_cancel',
} as const

/**
 * Consumable sound effects
 */
export const CONSUMABLE_SOUNDS = {
  fateSealUsed: 'consumable_fate_seal',
  celestialOrbUsed: 'consumable_celestial_orb',
  voidScriptUsed: 'consumable_void_script',
} as const

/**
 * Shop sound effects
 */
export const SHOP_SOUNDS = {
  shopEnter: 'shop_enter',
  shopExit: 'shop_exit',
  purchase: 'shop_purchase',
  reroll: 'shop_reroll',
  sell: 'shop_sell',
  cantAfford: 'shop_cant_afford',
} as const

/**
 * Ambient sound effects
 */
export const AMBIENT_SOUNDS = {
  windChimes: 'ambient_wind_chimes',
  rain: 'ambient_rain',
  birds: 'ambient_birds',
} as const

// =============================================================================
// SOUND EFFECT TYPE
// =============================================================================

/**
 * All available sound effect IDs
 */
export type SoundEffectId =
  | (typeof TILE_SOUNDS)[keyof typeof TILE_SOUNDS]
  | (typeof UI_SOUNDS)[keyof typeof UI_SOUNDS]
  | (typeof GAME_SOUNDS)[keyof typeof GAME_SOUNDS]
  | (typeof SPECIAL_SOUNDS)[keyof typeof SPECIAL_SOUNDS]
  | (typeof FEEDBACK_SOUNDS)[keyof typeof FEEDBACK_SOUNDS]
  | (typeof CONSUMABLE_SOUNDS)[keyof typeof CONSUMABLE_SOUNDS]
  | (typeof SHOP_SOUNDS)[keyof typeof SHOP_SOUNDS]
  | (typeof AMBIENT_SOUNDS)[keyof typeof AMBIENT_SOUNDS]

/**
 * Sound effect category type
 */
export type SoundCategory =
  | 'tile'
  | 'ui'
  | 'game'
  | 'special'
  | 'feedback'
  | 'consumable'
  | 'shop'
  | 'ambient'

// =============================================================================
// SOUND EFFECT CONFIGURATION
// =============================================================================

/**
 * Configuration for a single sound effect
 */
export interface SoundEffectConfig {
  /** File path to the sound (relative to assets folder) */
  path: string
  /** Base volume (0-1) */
  volume: number
  /** Category for grouping */
  category: SoundCategory
  /** Whether this sound can overlap with itself */
  allowOverlap: boolean
  /** Maximum number of simultaneous instances */
  maxInstances: number
  /** Optional pitch variation range [min, max] */
  pitchVariation?: [number, number]
  /** Priority (higher priority sounds won't be cut off) */
  priority: number
  /** Whether to preload this sound */
  preload: boolean
}

/** Every declared cue has an original generated WAV, rebuilt by scripts/generate-sfx.mjs. */
export const ALL_SOUND_IDS: SoundEffectId[] = [
  ...Object.values(TILE_SOUNDS),
  ...Object.values(UI_SOUNDS),
  ...Object.values(GAME_SOUNDS),
  ...Object.values(SPECIAL_SOUNDS),
  ...Object.values(FEEDBACK_SOUNDS),
  ...Object.values(CONSUMABLE_SOUNDS),
  ...Object.values(SHOP_SOUNDS),
  ...Object.values(AMBIENT_SOUNDS),
]

export const SOUND_EFFECT_CONFIG = Object.fromEntries(
  ALL_SOUND_IDS.map((id) => {
    const category = id.split('_')[0] as SoundCategory
    const dramatic =
      /victory|yakuman|round_complete|act_complete|legendary/.test(id)
    return [
      id,
      {
        path: withBasePath(`assets/sfx/${id}.wav`),
        volume: category === 'ui' ? 0.22 : category === 'tile' ? 0.35 : 0.55,
        category,
        allowOverlap: category === 'tile' || id === GAME_SOUNDS.scoreChip,
        maxInstances: category === 'tile' ? 3 : 1,
        priority: dramatic ? 10 : category === 'ui' ? 2 : 6,
        preload: [
          TILE_SOUNDS.select,
          TILE_SOUNDS.deselect,
          TILE_SOUNDS.draw,
          GAME_SOUNDS.handPlayed,
          UI_SOUNDS.buttonClick,
        ].includes(id as never),
      } satisfies SoundEffectConfig,
    ]
  })
) as Record<SoundEffectId, SoundEffectConfig>

// =============================================================================
// MUSIC DEFINITIONS
// =============================================================================

/**
 * Music context types - which music to play in different game states
 */
export type MusicContext =
  | 'menu'
  | 'gameplay'
  | 'shop'
  | 'gameOver'
  | 'boss'
  | 'victory'

/**
 * Music track configuration
 */
export interface MusicTrackConfig {
  /** File path */
  path: string
  /** Display name */
  name: string
  /** Base volume */
  volume: number
  /** Whether this track loops */
  loop: boolean
  /** Contexts where this track can play */
  contexts: MusicContext[]
  /** BPM for syncing effects (optional) */
  bpm?: number
}

/**
 * Available music tracks
 */
export const MUSIC_CONFIG: MusicTrackConfig[] = [
  {
    path: withBasePath('assets/Dragon Dance.mp3'),
    name: 'Dragon Dance',
    volume: 0.7,
    loop: true,
    contexts: ['gameplay', 'boss'],
    bpm: 120,
  },
  {
    path: withBasePath('assets/JapaneseWinter.mp3'),
    name: 'Japanese Winter',
    volume: 0.7,
    loop: true,
    contexts: ['menu', 'gameplay', 'gameOver'],
    bpm: 90,
  },
  {
    path: withBasePath('assets/Lotus Pond.mp3'),
    name: 'Lotus Pond',
    volume: 0.7,
    loop: true,
    contexts: ['gameplay', 'shop', 'victory'],
    bpm: 80,
  },
  {
    path: withBasePath('assets/TheDojo.mp3'),
    name: 'The Dojo',
    volume: 0.7,
    loop: true,
    contexts: ['gameplay'],
    bpm: 110,
  },
]

/**
 * Get music tracks for a specific context
 */
export function getMusicForContext(context: MusicContext): MusicTrackConfig[] {
  return MUSIC_CONFIG.filter((track) => track.contexts.includes(context))
}

/**
 * Get random music track for a context
 */
export function getRandomMusicForContext(
  context: MusicContext
): MusicTrackConfig | null {
  const tracks = getMusicForContext(context)
  if (tracks.length === 0) return null
  return tracks[Math.floor(Math.random() * tracks.length)]
}

// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all sounds that should be preloaded
 */
export function getPreloadSounds(): SoundEffectId[] {
  return (
    Object.entries(SOUND_EFFECT_CONFIG) as [SoundEffectId, SoundEffectConfig][]
  )
    .filter(([, config]) => config.preload)
    .map(([id]) => id)
}

/**
 * Get sounds by category
 */
export function getSoundsByCategory(category: SoundCategory): SoundEffectId[] {
  return (
    Object.entries(SOUND_EFFECT_CONFIG) as [SoundEffectId, SoundEffectConfig][]
  )
    .filter(([, config]) => config.category === category)
    .map(([id]) => id)
}

/**
 * Get configuration for a specific sound
 */
export function getSoundConfig(
  id: SoundEffectId
): SoundEffectConfig | undefined {
  return SOUND_EFFECT_CONFIG[id]
}

// =============================================================================
// EXPORTS
// =============================================================================

export const AudioDefinitions = {
  TILE_SOUNDS,
  UI_SOUNDS,
  GAME_SOUNDS,
  SPECIAL_SOUNDS,
  FEEDBACK_SOUNDS,
  CONSUMABLE_SOUNDS,
  SHOP_SOUNDS,
  AMBIENT_SOUNDS,
  SOUND_EFFECT_CONFIG,
  MUSIC_CONFIG,
  getMusicForContext,
  getRandomMusicForContext,
  getPreloadSounds,
  getSoundsByCategory,
  getSoundConfig,
} as const

export default AudioDefinitions
