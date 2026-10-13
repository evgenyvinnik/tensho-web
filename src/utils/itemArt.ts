/**
 * Artwork for any game item, by kind and id.
 *
 * Every item resolves to an image — never an emoji. In order:
 *   1. its own generated portrait, when `itemArtManifest.json` lists the id
 *      (files live at `assets/illustrations/items/<kind>/<id>.webp`);
 *   2. an older bespoke portrait already in the game;
 *   3. its family's shared artwork (all Orbs share the orb, and so on).
 *
 * `hasOwnArt` tells a caller whether the image is unique to this item, so a
 * shared family image can be paired with the item's unique icon.
 */

import manifest from '../config/itemArtManifest.json'
import { withBasePath } from './basePath'
import {
  flowerIllustrations,
  getDecreeIllustration,
  getFateSealIllustration,
  getMandateIllustration,
  getVoidScriptIllustration,
  illustrationAssets,
} from './assets'
import type { FlowerVariant, PackType } from '../systems/types'

export type ItemArtKind =
  | 'decrees'
  | 'orbs'
  | 'seals'
  | 'scripts'
  | 'charters'
  | 'mandates'
  | 'omens'
  | 'yakuUpgrades'
  | 'tileMarks'
  | 'packs'

const listed = manifest as unknown as Record<ItemArtKind, string[]>
const own = (kind: ItemArtKind, id: string) =>
  listed[kind]?.includes(id)
    ? withBasePath(`assets/illustrations/items/${kind}/${id}.webp`)
    : undefined

const CHARTER_PORTRAITS: Record<string, string> = {
  swift_hand: illustrationAssets.swiftHandCharter,
  full_palette: illustrationAssets.fullPaletteCharter,
  star_chart: illustrationAssets.starChartCharter,
  observatory: illustrationAssets.observatoryCharter,
  abundant_stock: illustrationAssets.abundantStockCharter,
  money_tree: illustrationAssets.moneyTreeCharter,
  plentiful_stock: illustrationAssets.plentifulStockCharter,
}

export interface ItemArt {
  src: string
  /** False when the image is the family's shared artwork. */
  hasOwnArt: boolean
}

export function getItemArt(kind: ItemArtKind, id: string): ItemArt {
  const generated = own(kind, id)
  if (generated) return { src: generated, hasOwnArt: true }
  switch (kind) {
    case 'decrees': {
      const portrait = getDecreeIllustration(id)
      return portrait
        ? { src: portrait, hasOwnArt: true }
        : { src: illustrationAssets.decreeScrolls.LocalEdict, hasOwnArt: false }
    }
    case 'scripts': {
      const src = getVoidScriptIllustration(id)
      return { src, hasOwnArt: src !== illustrationAssets.consumables.voidScript }
    }
    case 'seals': {
      const src = getFateSealIllustration(id)
      return { src, hasOwnArt: src !== illustrationAssets.consumables.fateSeal }
    }
    case 'orbs':
      return { src: illustrationAssets.consumables.celestialOrb, hasOwnArt: false }
    case 'charters':
      return Object.prototype.hasOwnProperty.call(CHARTER_PORTRAITS, id)
        ? { src: CHARTER_PORTRAITS[id], hasOwnArt: true }
        : { src: illustrationAssets.imperialCharter, hasOwnArt: false }
    case 'mandates': {
      const portrait = getMandateIllustration(id)
      return portrait
        ? { src: portrait, hasOwnArt: true }
        : { src: illustrationAssets.codex.ascent, hasOwnArt: false }
    }
    case 'omens':
      return {
        src: withBasePath('assets/illustrations/omens/double-omen.webp'),
        hasOwnArt: id === 'double_omen',
      }
    case 'yakuUpgrades':
      return { src: illustrationAssets.yakuLedger, hasOwnArt: false }
    case 'packs':
      return id in illustrationAssets.packs
        ? { src: illustrationAssets.packs[id as PackType], hasOwnArt: true }
        : { src: illustrationAssets.packs.Arcana, hasOwnArt: false }
    case 'tileMarks':
      return { src: illustrationAssets.tableTools, hasOwnArt: false }
  }
}

/** Flower and Season art (both already have their own illustrations). */
export function getFlowerArt(flower: FlowerVariant): string {
  return flowerIllustrations[flower]
}

const SEASON_ART: Record<string, string> = {
  Spring: illustrationAssets.springBlossom,
  Summer: illustrationAssets.summerFan,
  Autumn: illustrationAssets.autumnMaple,
  Winter: illustrationAssets.winterPine,
}

export function getSeasonArt(season: string): string {
  return SEASON_ART[season] ?? illustrationAssets.codex.flora
}
