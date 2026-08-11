/**
 * Asset Path Helpers for Tensho Mahjong Roguelike
 * Provides utilities for accessing game assets (images, audio, fonts)
 */

import { TileSuit } from '../core/Tile'
import type { PackType } from '../systems/types'
import { withBasePath } from './basePath'

// Base paths for assets
const ASSET_BASE = withBasePath('assets')
const MAHJONG_PNG_BASE = `${ASSET_BASE}/Mahjong/file/png`

// ============================================================================
// Tile Image Paths
// ============================================================================

/**
 * Mapping from TileSuit to asset file prefix
 */
const SUIT_TO_FILE_PREFIX: Record<TileSuit, string> = {
  [TileSuit.Manzu]: 'Symbol', // Characters use Symbol files
  [TileSuit.Pinzu]: 'Dots',
  [TileSuit.Souzu]: 'Bamboo',
  [TileSuit.Wind]: 'Winds',
  [TileSuit.Dragon]: 'Dragons',
  [TileSuit.Flower]: 'Flower',
  [TileSuit.Season]: 'Seasons',
}

/**
 * Get the image path for a specific tile
 * @param suit - The tile suit
 * @param rank - The tile rank (1-9 for suited, 1-4 for winds, 1-3 for dragons, 1-4 for flowers/seasons)
 * @returns The path to the tile image
 */
export function getTileImagePath(suit: TileSuit, rank: number): string {
  const prefix = SUIT_TO_FILE_PREFIX[suit]
  return `${MAHJONG_PNG_BASE}/tiles/${prefix} (${rank}).png`
}

/**
 * Get the path for a tile back image
 */
export function getTileBackPath(): string {
  return `${MAHJONG_PNG_BASE}/tiles/Mahjon2g_05.png`
}

// ============================================================================
// UI Asset Paths
// ============================================================================

export const menuAssets = {
  background: `${MAHJONG_PNG_BASE}/menu screen/BG.png`,
  title: `${MAHJONG_PNG_BASE}/menu screen/Title.png`,
  playButton: `${MAHJONG_PNG_BASE}/menu screen/Play Button.png`,
  optionButton: `${MAHJONG_PNG_BASE}/menu screen/Option Button.png`,
  bottom: `${MAHJONG_PNG_BASE}/menu screen/Botom.png`,
} as const

export const gameScreenAssets = {
  background: `${MAHJONG_PNG_BASE}/game screen/BG.png`,
  barTop: `${MAHJONG_PNG_BASE}/game screen/Bar Top.png`,
  barBottom: `${MAHJONG_PNG_BASE}/game screen/Bar Bottom.png`,
  bar1: `${MAHJONG_PNG_BASE}/game screen/Bar (1).png`,
  bar2: `${MAHJONG_PNG_BASE}/game screen/Bar (2).png`,
  button1: `${MAHJONG_PNG_BASE}/game screen/Button (1).png`,
  button2: `${MAHJONG_PNG_BASE}/game screen/Button (2).png`,
  icon1: `${MAHJONG_PNG_BASE}/game screen/Icon (1).png`,
  icon2: `${MAHJONG_PNG_BASE}/game screen/Icon (2).png`,
  icon3: `${MAHJONG_PNG_BASE}/game screen/Icon (3).png`,
  star: `${MAHJONG_PNG_BASE}/game screen/Star.png`,
  textArea: `${MAHJONG_PNG_BASE}/game screen/Text Area.png`,
} as const

export const popupAssets = {
  background: `${MAHJONG_PNG_BASE}/popup/BG.png`,
  button1: `${MAHJONG_PNG_BASE}/popup/Button (1).png`,
  button2: `${MAHJONG_PNG_BASE}/popup/Button (2).png`,
  button3: `${MAHJONG_PNG_BASE}/popup/Button (3).png`,
  button4: `${MAHJONG_PNG_BASE}/popup/Button (4).png`,
  button5: `${MAHJONG_PNG_BASE}/popup/Button (5).png`,
  button6: `${MAHJONG_PNG_BASE}/popup/Button (6).png`,
  checkboxOn: `${MAHJONG_PNG_BASE}/popup/CheckBox ON.png`,
  checkboxOff: `${MAHJONG_PNG_BASE}/popup/CheckBox OFF.png`,
  star: `${MAHJONG_PNG_BASE}/popup/Star.png`,
} as const

/**
 * Generated miniature illustrations used for high-value game concepts.
 *
 * These stay separate from small functional controls, which should continue
 * to use SVG so they remain crisp at every size.
 */
export const illustrationAssets = {
  consumables: {
    fateSeal: `${ASSET_BASE}/illustrations/fate-seal.png`,
    celestialOrb: `${ASSET_BASE}/illustrations/celestial-orb.png`,
    voidScript: `${ASSET_BASE}/illustrations/void-script.png`,
  },
  packs: {
    Arcana: `${ASSET_BASE}/illustrations/packs/arcana-pack.png`,
    Celestial: `${ASSET_BASE}/illustrations/packs/celestial-pack.png`,
    Tile: `${ASSET_BASE}/illustrations/packs/tile-pack.png`,
    Decree: `${ASSET_BASE}/illustrations/packs/decree-pack.png`,
    Void: `${ASSET_BASE}/illustrations/packs/void-pack.png`,
  } satisfies Record<PackType, string>,
  currency: {
    gold: `${ASSET_BASE}/illustrations/currency/tensho-gold.png`,
  },
  codex: {
    archive: `${ASSET_BASE}/illustrations/codex/archive.webp`,
    ascent: `${ASSET_BASE}/illustrations/codex/ascent.webp`,
    decrees: `${ASSET_BASE}/illustrations/codex/decrees.webp`,
    flora: `${ASSET_BASE}/illustrations/codex/flora.webp`,
    strategy: `${ASSET_BASE}/illustrations/codex/strategy.webp`,
  },
  tables: {
    green_felt: `${ASSET_BASE}/illustrations/tables/green_felt.webp`,
    red_lacquer: `${ASSET_BASE}/illustrations/tables/red_lacquer.webp`,
    bamboo_mat: `${ASSET_BASE}/illustrations/tables/bamboo_mat.webp`,
    imperial_gold: `${ASSET_BASE}/illustrations/tables/imperial_gold.webp`,
    night_market: `${ASSET_BASE}/illustrations/tables/night_market.webp`,
    temple_stone: `${ASSET_BASE}/illustrations/tables/temple_stone.webp`,
    ghost_parlor: `${ASSET_BASE}/illustrations/tables/ghost_parlor.webp`,
    dragons_den: `${ASSET_BASE}/illustrations/tables/dragons_den.webp`,
  },
} as const

export type IllustratedTableStyleId = keyof typeof illustrationAssets.tables

/** Return the generated environment art for a table, with Green Felt as fallback. */
export function getTableStyleIllustration(styleId?: string): string {
  if (!styleId || !(styleId in illustrationAssets.tables)) {
    return illustrationAssets.tables.green_felt
  }

  return illustrationAssets.tables[styleId as IllustratedTableStyleId]
}

const CODEX_CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  Introduction: illustrationAssets.codex.archive,
  Tiles: illustrationAssets.tables.temple_stone,
  'Hand Building': illustrationAssets.tables.red_lacquer,
  'How to Play': illustrationAssets.tables.night_market,
  Scoring: illustrationAssets.codex.ascent,
  Progression: illustrationAssets.codex.ascent,
  Decrees: illustrationAssets.codex.decrees,
  Flora: illustrationAssets.codex.flora,
  Economy: `${ASSET_BASE}/backgrounds/shop.webp`,
  Strategy: illustrationAssets.codex.strategy,
  'Ready!': illustrationAssets.codex.archive,
}

/** Return immersive category art for the Codex, with the archive as fallback. */
export function getCodexCategoryIllustration(category?: string): string {
  if (!category) return illustrationAssets.codex.archive
  return (
    CODEX_CATEGORY_ILLUSTRATIONS[category] || illustrationAssets.codex.archive
  )
}

const VOID_SCRIPT_ILLUSTRATION_IDS = new Set([
  'script_of_kinship',
  'script_of_the_grave',
  'script_of_incantation',
  'script_of_immolation',
  'script_of_the_cryptid',
  'script_of_the_gold_seal',
  'script_of_deja_vu',
  'script_of_the_trance',
  'script_of_the_medium',
  'script_of_aura',
  'script_of_ectoplasm',
  'script_of_the_wraith',
  'script_of_the_ankh',
  'script_of_the_hex',
  'script_of_the_sigil',
  'script_of_the_ouija',
  'script_of_the_soul',
  'script_of_the_singularity',
  'script_of_eclipse',
  'script_of_mirrors',
  'script_of_silence',
])

/** Return a script-specific illustration, with the generic scroll as fallback. */
export function getVoidScriptIllustration(scriptId?: string): string {
  if (!scriptId || !VOID_SCRIPT_ILLUSTRATION_IDS.has(scriptId)) {
    return illustrationAssets.consumables.voidScript
  }

  return `${ASSET_BASE}/illustrations/scripts/${scriptId}.png`
}

/** Low-contrast generated environments designed to sit behind live UI. */
export const backgroundAssets = {
  menu: `${ASSET_BASE}/backgrounds/menu.webp`,
  shop: `${ASSET_BASE}/backgrounds/shop.webp`,
  gameplay: `${ASSET_BASE}/backgrounds/gameplay.webp`,
} as const

// ============================================================================
// Audio Asset Paths
// ============================================================================

export const audioAssets = {
  dragonDance: `${ASSET_BASE}/Dragon Dance.mp3`,
  japaneseWinter: `${ASSET_BASE}/JapaneseWinter.mp3`,
  lotusPond: `${ASSET_BASE}/Lotus Pond.mp3`,
  theDojo: `${ASSET_BASE}/TheDojo.mp3`,
} as const

/** Display names for audio tracks */
export const audioTrackDisplayNames: Record<keyof typeof audioAssets, string> =
  {
    dragonDance: 'Dragon Dance',
    japaneseWinter: 'Japanese Winter',
    lotusPond: 'Lotus Pond',
    theDojo: 'The Dojo',
  } as const

/** Array of all music track URLs for random playback */
export const MUSIC_TRACKS = Object.values(audioAssets)

export type AudioTrack = keyof typeof audioAssets

/**
 * Get all available audio tracks
 */
export function getAudioTracks(): AudioTrack[] {
  return Object.keys(audioAssets) as AudioTrack[]
}

/**
 * Get display name for a track
 */
export function getTrackDisplayName(track: AudioTrack): string {
  return audioTrackDisplayNames[track]
}

// ============================================================================
// Font Asset Paths
// ============================================================================

export const fontAssets = {
  longCang: `${ASSET_BASE}/LongCang-Regular.ttf`,
  notoSansJP: `${ASSET_BASE}/NotoSansJP-Regular.ttf`,
  go3v2: `${ASSET_BASE}/go3v2.ttf`,
} as const

// ============================================================================
// Image Preloading Utilities
// ============================================================================

/**
 * Preload a single image and return a promise
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images in parallel
 */
export async function preloadImages(
  sources: string[]
): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(preloadImage))
}

/**
 * Preload all tile images
 */
export async function preloadTileImages(): Promise<void> {
  const tilePaths: string[] = []

  // Suited tiles (1-9)
  const suitedSuits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
  for (const suit of suitedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      tilePaths.push(getTileImagePath(suit, rank))
    }
  }

  // Wind tiles (1-4)
  for (let rank = 1; rank <= 4; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Wind, rank))
  }

  // Dragon tiles (1-3)
  for (let rank = 1; rank <= 3; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Dragon, rank))
  }

  // Flower tiles (1-4)
  for (let rank = 1; rank <= 4; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Flower, rank))
  }

  // Season tiles (1-4)
  for (let rank = 1; rank <= 4; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Season, rank))
  }

  // Tile back
  tilePaths.push(getTileBackPath())

  await preloadImages(tilePaths)
}

/**
 * Preload menu screen assets
 */
export async function preloadMenuAssets(): Promise<void> {
  await preloadImages([...Object.values(menuAssets), backgroundAssets.menu])
}

/**
 * Preload game screen assets
 */
export async function preloadGameScreenAssets(): Promise<void> {
  await preloadImages(Object.values(gameScreenAssets))
}

/**
 * Preload all UI assets
 */
export async function preloadAllUIAssets(): Promise<void> {
  await Promise.all([
    preloadMenuAssets(),
    preloadGameScreenAssets(),
    preloadImages(Object.values(popupAssets)),
  ])
}

/**
 * Preload all game assets (tiles + UI)
 */
export async function preloadAllAssets(): Promise<void> {
  await Promise.all([preloadTileImages(), preloadAllUIAssets()])
}
