/**
 * Asset Path Helpers for Tensho Mahjong Roguelike
 * Provides utilities for accessing game assets (images, audio, fonts)
 */

import { TileSuit } from '../core/Tile'
import { tileFaceAsset } from './tileFaceAsset'
import type {
  CorruptedSeasonVariant,
  DecreeRarity,
  FlowerVariant,
  PackType,
  StickerType,
} from '../systems/types'
import { withBasePath } from './basePath'
import { getGeneratedArt } from './generatedArt'

// Base paths for assets
const ASSET_BASE = withBasePath('assets')
const MAHJONG_PNG_BASE = `${ASSET_BASE}/Mahjong/file/png`

// ============================================================================
// Tile Image Paths
// ============================================================================

/**
 * Get the image path for a specific tile
 * @param suit - The tile suit
 * @param rank - The tile rank (1-9 for suited, 1-4 for winds, 1-3 for dragons, 1-4 for flowers/seasons)
 * @returns The path to the tile image
 */
export function getTileImagePath(suit: TileSuit, rank: number): string {
  return `${ASSET_BASE}/${tileFaceAsset(suit, rank)}`
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

// Only the scroll frame survives from the pack's UI; its other screens and
// buttons were never shown and are no longer shipped or precached.
export const popupAssets = {
  background: `${MAHJONG_PNG_BASE}/popup/BG.png`,
} as const

/**
 * Generated miniature illustrations used for high-value game concepts.
 *
 * Functional controls use their own generated PNG family.
 */
export const illustrationAssets = {
  settlementLedger: `${ASSET_BASE}/illustrations/settlement-ledger.webp`,
  yakuLedger: `${ASSET_BASE}/illustrations/yaku-ledger.webp`,
  springBlossom: `${ASSET_BASE}/illustrations/spring-blossom.webp`,
  orchidBloom: `${ASSET_BASE}/illustrations/orchid-bloom.webp`,
  plumBloom: `${ASSET_BASE}/illustrations/plum-bloom.webp`,
  chrysanthemumBloom: `${ASSET_BASE}/illustrations/chrysanthemum-bloom.webp`,
  bambooBloom: `${ASSET_BASE}/illustrations/bamboo-bloom.webp`,
  autumnMaple: `${ASSET_BASE}/illustrations/autumn-maple.webp`,
  winterPine: `${ASSET_BASE}/illustrations/winter-pine.webp`,
  summerFan: `${ASSET_BASE}/illustrations/summer-fan.webp`,
  corruptedSeasons: {
    Monsoon: `${ASSET_BASE}/illustrations/states/seasons/monsoon.webp`,
    Drought: `${ASSET_BASE}/illustrations/states/seasons/drought.webp`,
    Decay: `${ASSET_BASE}/illustrations/states/seasons/decay.webp`,
    Frostbite: `${ASSET_BASE}/illustrations/states/seasons/frostbite.webp`,
  } satisfies Record<CorruptedSeasonVariant, string>,
  awakenedFlowers: {
    Plum: `${ASSET_BASE}/illustrations/states/flowers/plum-awakened.webp`,
    Orchid: `${ASSET_BASE}/illustrations/states/flowers/orchid-awakened.webp`,
    Chrysanthemum: `${ASSET_BASE}/illustrations/states/flowers/chrysanthemum-awakened.webp`,
    Bamboo: `${ASSET_BASE}/illustrations/states/flowers/bamboo-awakened.webp`,
  } satisfies Record<FlowerVariant, string>,
  decreeStickers: {
    Eternal: `${ASSET_BASE}/illustrations/states/badges/eternal.webp`,
    Perishable: `${ASSET_BASE}/illustrations/states/badges/perishable.webp`,
    Rental: `${ASSET_BASE}/illustrations/states/badges/rental.webp`,
  } satisfies Record<StickerType, string>,
  results: {
    victory: `${ASSET_BASE}/illustrations/states/results/victory.webp`,
    defeat: `${ASSET_BASE}/illustrations/states/results/defeat.webp`,
    endlessCompletion: `${ASSET_BASE}/illustrations/states/results/endless-completion.webp`,
  },
  pairsUpgrade: `${ASSET_BASE}/illustrations/upgrades/pairs.webp`,
  ceruleanBell: `${ASSET_BASE}/illustrations/cerulean-bell.webp`,
  mandates: {
    amber_acorn: `${ASSET_BASE}/illustrations/amber-acorn.webp`,
    verdant_leaf: `${ASSET_BASE}/illustrations/verdant-leaf.webp`,
    violet_vessel: `${ASSET_BASE}/illustrations/violet-vessel.webp`,
    crimson_heart: `${ASSET_BASE}/illustrations/crimson-heart.webp`,
    cerulean_bell: `${ASSET_BASE}/illustrations/cerulean-bell.webp`,
  },
  beginnerGuidebook: `${ASSET_BASE}/illustrations/beginner-guidebook.webp`,
  tableTools: `${ASSET_BASE}/illustrations/table-tools.webp`,
  wall: `${ASSET_BASE}/illustrations/wall.webp`,
  imperialCharter: `${ASSET_BASE}/illustrations/charters/imperial-charter.webp`,
  abundantStockCharter: `${ASSET_BASE}/illustrations/charters/abundant-stock.webp`,
  starChartCharter: `${ASSET_BASE}/illustrations/charters/star-chart.webp`,
  observatoryCharter: `${ASSET_BASE}/illustrations/charters/observatory.webp`,
  swiftHandCharter: `${ASSET_BASE}/illustrations/charters/swift-hand.webp`,
  fullPaletteCharter: `${ASSET_BASE}/illustrations/charters/full-palette.webp`,
  moneyTreeCharter: `${ASSET_BASE}/illustrations/charters/money-tree.webp`,
  plentifulStockCharter: `${ASSET_BASE}/illustrations/charters/plentiful-stock.webp`,
  consumables: {
    fateSeal: `${ASSET_BASE}/illustrations/fate-seal.webp`,
    celestialOrb: `${ASSET_BASE}/illustrations/celestial-orb.webp`,
    voidScript: `${ASSET_BASE}/illustrations/void-script.webp`,
  },
  packs: {
    Arcana: `${ASSET_BASE}/illustrations/packs/arcana-pack.webp`,
    Celestial: `${ASSET_BASE}/illustrations/packs/celestial-pack.webp`,
    Tile: `${ASSET_BASE}/illustrations/packs/tile-pack.webp`,
    Decree: `${ASSET_BASE}/illustrations/packs/decree-pack.webp`,
    Void: `${ASSET_BASE}/illustrations/packs/void-pack.webp`,
  } satisfies Record<PackType, string>,
  currency: {
    gold: `${ASSET_BASE}/illustrations/currency/tensho-gold.webp`,
  },
  decreeScrolls: {
    LocalEdict: `${ASSET_BASE}/illustrations/decrees/local-edict.webp`,
    RegionalMandate: `${ASSET_BASE}/illustrations/decrees/regional-mandate.webp`,
    ImperialDecree: `${ASSET_BASE}/illustrations/decrees/imperial-decree.webp`,
    HeavenlyOrdinance: `${ASSET_BASE}/illustrations/decrees/heavenly-ordinance.webp`,
  } satisfies Record<DecreeRarity, string>,
  decreePortraits: {
    'decree-riichi-devotee': `${ASSET_BASE}/illustrations/decrees/riichi-devotee.webp`,
    yaku_repetition_charter: `${ASSET_BASE}/illustrations/decrees/yaku-repetition.webp`,
    closed_hand_austerity: `${ASSET_BASE}/illustrations/decrees/closed-hand-austerity.webp`,
    'decree-blueprint': `${ASSET_BASE}/illustrations/decrees/blueprint.webp`,
    'decree-doppelganger': `${ASSET_BASE}/illustrations/decrees/doppelganger.webp`,
    'decree-supernova': `${ASSET_BASE}/illustrations/decrees/supernova.webp`,
    'decree-perfectionist': `${ASSET_BASE}/illustrations/decrees/perfectionist.webp`,
    'decree-echo-stone': `${ASSET_BASE}/illustrations/decrees/echo-stone.webp`,
    celestial_wildcard: `${ASSET_BASE}/illustrations/decrees/celestial-wildcard.webp`,
    shanten_clemency: `${ASSET_BASE}/illustrations/decrees/shanten-clemency.webp`,
    'decree-polished-stone': `${ASSET_BASE}/illustrations/decrees/polished-stone.webp`,
    'decree-phoenix': `${ASSET_BASE}/illustrations/decrees/phoenix.webp`,
    'decree-half-suited': `${ASSET_BASE}/illustrations/decrees/half-suited.webp`,
    'decree-wealth-engine': `${ASSET_BASE}/illustrations/decrees/wealth-engine.webp`,
    river_tax: `${ASSET_BASE}/illustrations/decrees/river-tax.webp`,
    extended_hand_grant: `${ASSET_BASE}/illustrations/decrees/extended-hand-grant.webp`,
    tanyao_dispensation: `${ASSET_BASE}/illustrations/decrees/tanyao-dispensation.webp`,
    yakuman_succession: `${ASSET_BASE}/illustrations/decrees/yakuman-succession.webp`,
    moonlit_seal: `${ASSET_BASE}/illustrations/decrees/moonlit-seal.webp`,
    pure_suit_asceticism: `${ASSET_BASE}/illustrations/decrees/pure-suit-asceticism.webp`,
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
    crimson_wall: `${ASSET_BASE}/illustrations/tables/crimson_wall.webp`,
    obsidian_wall: `${ASSET_BASE}/illustrations/tables/obsidian_wall.webp`,
  },
} as const

export const flowerIllustrations: Record<FlowerVariant, string> = {
  Plum: illustrationAssets.plumBloom,
  Orchid: illustrationAssets.orchidBloom,
  Chrysanthemum: illustrationAssets.chrysanthemumBloom,
  Bamboo: illustrationAssets.bambooBloom,
}

/** Return bespoke Decree art where available; generic scrolls remain the fallback. */
export function getDecreeIllustration(decreeId: string): string | undefined {
  return (
    getGeneratedArt('decrees', decreeId) ??
    (Object.prototype.hasOwnProperty.call(
      illustrationAssets.decreePortraits,
      decreeId
    )
      ? illustrationAssets.decreePortraits[
          decreeId as keyof typeof illustrationAssets.decreePortraits
        ]
      : undefined)
  )
}

/** Return the illustrated scroll frame for a Decree rarity. */
export function getDecreeScrollIllustration(rarity: DecreeRarity): string {
  return illustrationAssets.decreeScrolls[rarity]
}

/** No fallback portrait: an unrelated boss must not inherit another's identity. */
export function getMandateIllustration(id?: string): string | undefined {
  return (
    getGeneratedArt('mandates', id) ??
    (id && Object.prototype.hasOwnProperty.call(illustrationAssets.mandates, id)
      ? illustrationAssets.mandates[
          id as keyof typeof illustrationAssets.mandates
        ]
      : undefined)
  )
}

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

/** Return a seal-specific illustration, with the generic ritual seal as fallback. */
export function getFateSealIllustration(sealId?: string): string {
  return (
    getGeneratedArt('fateSeals', sealId) ??
    (sealId === 'seal_of_transmutation'
      ? `${ASSET_BASE}/illustrations/seal-transmutation.webp`
      : illustrationAssets.consumables.fateSeal)
  )
}

/** Return a script-specific illustration, with the generic scroll as fallback. */
export function getVoidScriptIllustration(scriptId?: string): string {
  if (!scriptId || !VOID_SCRIPT_ILLUSTRATION_IDS.has(scriptId)) {
    return illustrationAssets.consumables.voidScript
  }

  return `${ASSET_BASE}/illustrations/scripts/${scriptId}.webp`
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

/** Exact orb identity, with category art only for unknown/retired catalog entries. */
export function getCelestialOrbIllustration(id?: string): string {
  return (
    getGeneratedArt('orbs', id) ?? illustrationAssets.consumables.celestialOrb
  )
}

/** Generated pack states retain all live size, price, and selection text. */
export function getPackIllustration(
  type: PackType,
  state: 'sealed' | 'open' = 'sealed'
): string {
  return (
    getGeneratedArt('reveals', `pack_${type.toLowerCase()}_${state}`) ??
    illustrationAssets.packs[type]
  )
}
