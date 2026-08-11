/**
 * Asset Path Helpers for Tensho Mahjong Roguelike
 * Provides utilities for accessing game assets (images, audio, fonts)
 */

import { TileSuit } from '../core/Tile';
import { withBasePath } from './basePath';

// Base paths for assets
const ASSET_BASE = withBasePath('assets');
const MAHJONG_PNG_BASE = `${ASSET_BASE}/Mahjong/file/png`;

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
};

/**
 * Get the image path for a specific tile
 * @param suit - The tile suit
 * @param rank - The tile rank (1-9 for suited, 1-4 for winds, 1-3 for dragons, 1-4 for flowers/seasons)
 * @returns The path to the tile image
 */
export function getTileImagePath(suit: TileSuit, rank: number): string {
  const prefix = SUIT_TO_FILE_PREFIX[suit];
  return `${MAHJONG_PNG_BASE}/tiles/${prefix} (${rank}).png`;
}

/**
 * Get the path for a tile back image
 */
export function getTileBackPath(): string {
  return `${MAHJONG_PNG_BASE}/tiles/Mahjon2g_05.png`;
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
} as const;

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
} as const;

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
} as const;

// ============================================================================
// Audio Asset Paths
// ============================================================================

export const audioAssets = {
  dragonDance: `${ASSET_BASE}/Dragon Dance.mp3`,
  japaneseWinter: `${ASSET_BASE}/JapaneseWinter.mp3`,
  lotusPond: `${ASSET_BASE}/Lotus Pond.mp3`,
  theDojo: `${ASSET_BASE}/TheDojo.mp3`,
} as const;

/** Display names for audio tracks */
export const audioTrackDisplayNames: Record<keyof typeof audioAssets, string> = {
  dragonDance: 'Dragon Dance',
  japaneseWinter: 'Japanese Winter',
  lotusPond: 'Lotus Pond',
  theDojo: 'The Dojo',
} as const;

/** Array of all music track URLs for random playback */
export const MUSIC_TRACKS = Object.values(audioAssets);

export type AudioTrack = keyof typeof audioAssets;

/**
 * Get all available audio tracks
 */
export function getAudioTracks(): AudioTrack[] {
  return Object.keys(audioAssets) as AudioTrack[];
}

/**
 * Get display name for a track
 */
export function getTrackDisplayName(track: AudioTrack): string {
  return audioTrackDisplayNames[track];
}

// ============================================================================
// Font Asset Paths
// ============================================================================

export const fontAssets = {
  longCang: `${ASSET_BASE}/LongCang-Regular.ttf`,
  notoSansJP: `${ASSET_BASE}/NotoSansJP-Regular.ttf`,
  go3v2: `${ASSET_BASE}/go3v2.ttf`,
} as const;

// ============================================================================
// Image Preloading Utilities
// ============================================================================

/**
 * Preload a single image and return a promise
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images in parallel
 */
export async function preloadImages(sources: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(preloadImage));
}

/**
 * Preload all tile images
 */
export async function preloadTileImages(): Promise<void> {
  const tilePaths: string[] = [];

  // Suited tiles (1-9)
  const suitedSuits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu];
  for (const suit of suitedSuits) {
    for (let rank = 1; rank <= 9; rank++) {
      tilePaths.push(getTileImagePath(suit, rank));
    }
  }

  // Wind tiles (1-4)
  for (let rank = 1; rank <= 4; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Wind, rank));
  }

  // Dragon tiles (1-3)
  for (let rank = 1; rank <= 3; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Dragon, rank));
  }

  // Flower tiles (1-4)
  for (let rank = 1; rank <= 4; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Flower, rank));
  }

  // Season tiles (1-4)
  for (let rank = 1; rank <= 4; rank++) {
    tilePaths.push(getTileImagePath(TileSuit.Season, rank));
  }

  // Tile back
  tilePaths.push(getTileBackPath());

  await preloadImages(tilePaths);
}

/**
 * Preload menu screen assets
 */
export async function preloadMenuAssets(): Promise<void> {
  await preloadImages(Object.values(menuAssets));
}

/**
 * Preload game screen assets
 */
export async function preloadGameScreenAssets(): Promise<void> {
  await preloadImages(Object.values(gameScreenAssets));
}

/**
 * Preload all UI assets
 */
export async function preloadAllUIAssets(): Promise<void> {
  await Promise.all([
    preloadMenuAssets(),
    preloadGameScreenAssets(),
    preloadImages(Object.values(popupAssets)),
  ]);
}

/**
 * Preload all game assets (tiles + UI)
 */
export async function preloadAllAssets(): Promise<void> {
  await Promise.all([preloadTileImages(), preloadAllUIAssets()]);
}
