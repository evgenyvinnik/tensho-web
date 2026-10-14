/**
 * Artwork for any game item, by kind and id.
 *
 * Every item resolves to an image — never an emoji. In order:
 *   1. its own portrait, when `itemArtManifest.json` lists the id
 *      (files live at `assets/illustrations/items/<kind>/<id>.webp`);
 *   2. its generated portrait from the delivered art set
 *      (`src/utils/generatedArt.ts`), or an older bespoke portrait;
 *   3. its family's shared artwork, for an id the catalog does not know.
 *
 * `hasOwnArt` tells a caller whether the image is unique to this item, so a
 * shared family image can be paired with the item's unique icon.
 */

import manifest from '../config/itemArtManifest.json'
import { withBasePath } from './basePath'
import {
  flowerIllustrations,
  getCelestialOrbIllustration,
  getDecreeIllustration,
  getFateSealIllustration,
  getMandateIllustration,
  getPackIllustration,
  getVoidScriptIllustration,
  illustrationAssets,
} from './assets'
import { getGeneratedArt, getYakuIllustration } from './generatedArt'
import { getOmenIllustration } from './omenArt'
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

const UPGRADE_ORBS: Record<string, string> = {
  Pairs: 'pluto_orb',
  All: 'black_hole_orb',
}

const TILE_LAYERS: Record<string, 'enhancements' | 'seals' | 'editions'> = {
  mark: 'enhancements',
  seal: 'seals',
  edition: 'editions',
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
    case 'orbs': {
      const src = getCelestialOrbIllustration(id)
      return { src, hasOwnArt: src !== illustrationAssets.consumables.celestialOrb }
    }
    case 'charters': {
      const src =
        getGeneratedArt('charters', id) ??
        (Object.prototype.hasOwnProperty.call(CHARTER_PORTRAITS, id)
          ? CHARTER_PORTRAITS[id]
          : undefined)
      return src
        ? { src, hasOwnArt: true }
        : { src: illustrationAssets.imperialCharter, hasOwnArt: false }
    }
    case 'mandates': {
      const portrait = getMandateIllustration(id)
      return portrait
        ? { src: portrait, hasOwnArt: true }
        : { src: illustrationAssets.codex.ascent, hasOwnArt: false }
    }
    case 'omens': {
      const src = getOmenIllustration(id)
      return src
        ? { src, hasOwnArt: true }
        : {
            src: withBasePath('assets/illustrations/omens/double-omen.webp'),
            hasOwnArt: false,
          }
    }
    case 'yakuUpgrades': {
      // A family is pictured by its hand; Pairs and All by the Orb that
      // levels them.
      const src =
        getYakuIllustration(id) ??
        getGeneratedArt('orbs', UPGRADE_ORBS[id])
      return src
        ? { src, hasOwnArt: true }
        : { src: illustrationAssets.yakuLedger, hasOwnArt: false }
    }
    case 'packs':
      return id in illustrationAssets.packs
        ? { src: getPackIllustration(id as PackType), hasOwnArt: true }
        : { src: illustrationAssets.packs.Arcana, hasOwnArt: false }
    case 'tileMarks': {
      // `gold` or `mark-gold` is a mark; `seal-red` and `edition-foil` too.
      const [layer, value] = id.includes('-') ? id.split('-', 2) : ['mark', id]
      const src = getGeneratedArt(TILE_LAYERS[layer] ?? 'enhancements', value)
      return src
        ? { src, hasOwnArt: true }
        : { src: illustrationAssets.tableTools, hasOwnArt: false }
    }
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
