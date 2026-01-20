/**
 * Audio Definitions for Tensho Mahjong Roguelike
 *
 * Defines all sound effects and music tracks used in the game.
 * Sound effects are categorized by type for easy organization.
 */

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
} as const;

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
} as const;

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
} as const;

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
} as const;

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
} as const;

/**
 * Consumable sound effects
 */
export const CONSUMABLE_SOUNDS = {
  fateSealUsed: 'consumable_fate_seal',
  celestialOrbUsed: 'consumable_celestial_orb',
  voidScriptUsed: 'consumable_void_script',
} as const;

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
} as const;

/**
 * Ambient sound effects
 */
export const AMBIENT_SOUNDS = {
  windChimes: 'ambient_wind_chimes',
  rain: 'ambient_rain',
  birds: 'ambient_birds',
} as const;

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
  | (typeof AMBIENT_SOUNDS)[keyof typeof AMBIENT_SOUNDS];

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
  | 'ambient';

// =============================================================================
// SOUND EFFECT CONFIGURATION
// =============================================================================

/**
 * Configuration for a single sound effect
 */
export interface SoundEffectConfig {
  /** File path to the sound (relative to assets folder) */
  path: string;
  /** Base volume (0-1) */
  volume: number;
  /** Category for grouping */
  category: SoundCategory;
  /** Whether this sound can overlap with itself */
  allowOverlap: boolean;
  /** Maximum number of simultaneous instances */
  maxInstances: number;
  /** Optional pitch variation range [min, max] */
  pitchVariation?: [number, number];
  /** Priority (higher priority sounds won't be cut off) */
  priority: number;
  /** Whether to preload this sound */
  preload: boolean;
}

/**
 * Sound effect configuration map
 *
 * Note: Paths are placeholders - actual sound files need to be added to assets
 * In production, these would point to actual audio files
 */
export const SOUND_EFFECT_CONFIG: Partial<Record<SoundEffectId, SoundEffectConfig>> = {
  // Tile sounds - high priority, should be responsive
  [TILE_SOUNDS.draw]: {
    path: '/assets/sfx/tile_draw.mp3',
    volume: 0.6,
    category: 'tile',
    allowOverlap: true,
    maxInstances: 3,
    pitchVariation: [0.95, 1.05],
    priority: 8,
    preload: true,
  },
  [TILE_SOUNDS.discard]: {
    path: '/assets/sfx/tile_discard.mp3',
    volume: 0.5,
    category: 'tile',
    allowOverlap: true,
    maxInstances: 3,
    pitchVariation: [0.95, 1.05],
    priority: 8,
    preload: true,
  },
  [TILE_SOUNDS.select]: {
    path: '/assets/sfx/tile_select.mp3',
    volume: 0.4,
    category: 'tile',
    allowOverlap: true,
    maxInstances: 5,
    pitchVariation: [0.98, 1.02],
    priority: 7,
    preload: true,
  },
  [TILE_SOUNDS.deselect]: {
    path: '/assets/sfx/tile_deselect.mp3',
    volume: 0.3,
    category: 'tile',
    allowOverlap: true,
    maxInstances: 5,
    pitchVariation: [0.98, 1.02],
    priority: 6,
    preload: true,
  },
  [TILE_SOUNDS.slide]: {
    path: '/assets/sfx/tile_slide.mp3',
    volume: 0.3,
    category: 'tile',
    allowOverlap: false,
    maxInstances: 1,
    priority: 5,
    preload: true,
  },

  // UI sounds - medium priority
  [UI_SOUNDS.buttonClick]: {
    path: '/assets/sfx/ui_click.mp3',
    volume: 0.5,
    category: 'ui',
    allowOverlap: false,
    maxInstances: 1,
    priority: 5,
    preload: true,
  },
  [UI_SOUNDS.buttonHover]: {
    path: '/assets/sfx/ui_hover.mp3',
    volume: 0.2,
    category: 'ui',
    allowOverlap: false,
    maxInstances: 1,
    priority: 3,
    preload: true,
  },
  [UI_SOUNDS.menuOpen]: {
    path: '/assets/sfx/ui_menu_open.mp3',
    volume: 0.4,
    category: 'ui',
    allowOverlap: false,
    maxInstances: 1,
    priority: 6,
    preload: true,
  },
  [UI_SOUNDS.menuClose]: {
    path: '/assets/sfx/ui_menu_close.mp3',
    volume: 0.4,
    category: 'ui',
    allowOverlap: false,
    maxInstances: 1,
    priority: 6,
    preload: true,
  },

  // Game sounds - high priority
  [GAME_SOUNDS.scoreTally]: {
    path: '/assets/sfx/score_tally.mp3',
    volume: 0.6,
    category: 'game',
    allowOverlap: false,
    maxInstances: 1,
    priority: 9,
    preload: true,
  },
  [GAME_SOUNDS.scoreChip]: {
    path: '/assets/sfx/score_chip.mp3',
    volume: 0.4,
    category: 'game',
    allowOverlap: true,
    maxInstances: 10,
    pitchVariation: [0.9, 1.1],
    priority: 7,
    preload: true,
  },
  [GAME_SOUNDS.goldEarned]: {
    path: '/assets/sfx/gold_earned.mp3',
    volume: 0.5,
    category: 'game',
    allowOverlap: true,
    maxInstances: 3,
    priority: 7,
    preload: true,
  },
  [GAME_SOUNDS.roundComplete]: {
    path: '/assets/sfx/round_complete.mp3',
    volume: 0.7,
    category: 'game',
    allowOverlap: false,
    maxInstances: 1,
    priority: 10,
    preload: true,
  },
  [GAME_SOUNDS.roundFailed]: {
    path: '/assets/sfx/round_failed.mp3',
    volume: 0.7,
    category: 'game',
    allowOverlap: false,
    maxInstances: 1,
    priority: 10,
    preload: true,
  },

  // Special sounds - highest priority
  [SPECIAL_SOUNDS.yakuScored]: {
    path: '/assets/sfx/yaku_scored.mp3',
    volume: 0.7,
    category: 'special',
    allowOverlap: false,
    maxInstances: 1,
    priority: 9,
    preload: true,
  },
  [SPECIAL_SOUNDS.yakumanScored]: {
    path: '/assets/sfx/yakuman.mp3',
    volume: 0.9,
    category: 'special',
    allowOverlap: false,
    maxInstances: 1,
    priority: 10,
    preload: true,
  },
  [SPECIAL_SOUNDS.decreeAcquired]: {
    path: '/assets/sfx/decree_acquired.mp3',
    volume: 0.6,
    category: 'special',
    allowOverlap: false,
    maxInstances: 1,
    priority: 8,
    preload: true,
  },
  [SPECIAL_SOUNDS.packOpening]: {
    path: '/assets/sfx/pack_opening.mp3',
    volume: 0.7,
    category: 'special',
    allowOverlap: false,
    maxInstances: 1,
    priority: 8,
    preload: false,
  },

  // Feedback sounds - medium priority
  [FEEDBACK_SOUNDS.error]: {
    path: '/assets/sfx/error.mp3',
    volume: 0.5,
    category: 'feedback',
    allowOverlap: false,
    maxInstances: 1,
    priority: 7,
    preload: true,
  },
  [FEEDBACK_SOUNDS.invalidAction]: {
    path: '/assets/sfx/invalid.mp3',
    volume: 0.4,
    category: 'feedback',
    allowOverlap: false,
    maxInstances: 1,
    priority: 6,
    preload: true,
  },
  [FEEDBACK_SOUNDS.success]: {
    path: '/assets/sfx/success.mp3',
    volume: 0.5,
    category: 'feedback',
    allowOverlap: false,
    maxInstances: 1,
    priority: 7,
    preload: true,
  },

  // Shop sounds
  [SHOP_SOUNDS.purchase]: {
    path: '/assets/sfx/shop_purchase.mp3',
    volume: 0.6,
    category: 'shop',
    allowOverlap: false,
    maxInstances: 1,
    priority: 7,
    preload: false,
  },
  [SHOP_SOUNDS.reroll]: {
    path: '/assets/sfx/shop_reroll.mp3',
    volume: 0.5,
    category: 'shop',
    allowOverlap: false,
    maxInstances: 1,
    priority: 6,
    preload: false,
  },
  [SHOP_SOUNDS.cantAfford]: {
    path: '/assets/sfx/cant_afford.mp3',
    volume: 0.4,
    category: 'shop',
    allowOverlap: false,
    maxInstances: 1,
    priority: 6,
    preload: false,
  },
};

// =============================================================================
// MUSIC DEFINITIONS
// =============================================================================

/**
 * Music context types - which music to play in different game states
 */
export type MusicContext = 'menu' | 'gameplay' | 'shop' | 'gameOver' | 'boss' | 'victory';

/**
 * Music track configuration
 */
export interface MusicTrackConfig {
  /** File path */
  path: string;
  /** Display name */
  name: string;
  /** Base volume */
  volume: number;
  /** Whether this track loops */
  loop: boolean;
  /** Contexts where this track can play */
  contexts: MusicContext[];
  /** BPM for syncing effects (optional) */
  bpm?: number;
}

/**
 * Available music tracks
 */
export const MUSIC_CONFIG: MusicTrackConfig[] = [
  {
    path: '/assets/Dragon Dance.mp3',
    name: 'Dragon Dance',
    volume: 0.7,
    loop: true,
    contexts: ['gameplay', 'boss'],
    bpm: 120,
  },
  {
    path: '/assets/JapaneseWinter.mp3',
    name: 'Japanese Winter',
    volume: 0.7,
    loop: true,
    contexts: ['menu', 'gameplay'],
    bpm: 90,
  },
  {
    path: '/assets/Lotus Pond.mp3',
    name: 'Lotus Pond',
    volume: 0.7,
    loop: true,
    contexts: ['gameplay', 'shop'],
    bpm: 80,
  },
  {
    path: '/assets/TheDojo.mp3',
    name: 'The Dojo',
    volume: 0.7,
    loop: true,
    contexts: ['gameplay'],
    bpm: 110,
  },
];

/**
 * Get music tracks for a specific context
 */
export function getMusicForContext(context: MusicContext): MusicTrackConfig[] {
  return MUSIC_CONFIG.filter((track) => track.contexts.includes(context));
}

/**
 * Get random music track for a context
 */
export function getRandomMusicForContext(context: MusicContext): MusicTrackConfig | null {
  const tracks = getMusicForContext(context);
  if (tracks.length === 0) return null;
  return tracks[Math.floor(Math.random() * tracks.length)];
}

// =============================================================================
// AUDIO SPRITE SUPPORT
// =============================================================================

/**
 * Audio sprite definition for efficient sound loading
 * Groups multiple short sounds into a single audio file
 */
export interface AudioSprite {
  /** Source file path */
  src: string;
  /** Sprite definitions with start time and duration in ms */
  sprites: Record<
    string,
    {
      start: number;
      duration: number;
    }
  >;
}

/**
 * Placeholder audio sprite for tile sounds
 * In production, these would be combined into a single file
 */
export const TILE_SPRITE: AudioSprite = {
  src: '/assets/sfx/tiles_sprite.mp3',
  sprites: {
    draw: { start: 0, duration: 200 },
    discard: { start: 200, duration: 250 },
    select: { start: 450, duration: 100 },
    deselect: { start: 550, duration: 100 },
    slide: { start: 650, duration: 300 },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all sounds that should be preloaded
 */
export function getPreloadSounds(): SoundEffectId[] {
  return (Object.entries(SOUND_EFFECT_CONFIG) as [SoundEffectId, SoundEffectConfig][])
    .filter(([, config]) => config.preload)
    .map(([id]) => id);
}

/**
 * Get sounds by category
 */
export function getSoundsByCategory(category: SoundCategory): SoundEffectId[] {
  return (Object.entries(SOUND_EFFECT_CONFIG) as [SoundEffectId, SoundEffectConfig][])
    .filter(([, config]) => config.category === category)
    .map(([id]) => id);
}

/**
 * Get configuration for a specific sound
 */
export function getSoundConfig(id: SoundEffectId): SoundEffectConfig | undefined {
  return SOUND_EFFECT_CONFIG[id];
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
} as const;

export default AudioDefinitions;
