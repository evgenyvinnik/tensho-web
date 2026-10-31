/**
 * Border and glow colours, one hue per upgrade family, taken from the body of
 * the Orb that raises it (named below), so an Orb and its family's upgrade
 * share a colour as well as a tile motif.
 */

import type { YakuCategory } from '../../systems/CelestialOrbSystem'

export const FAMILY_TONES: Record<YakuCategory, string> = {
  Pairs: '#d9a3b0', // Pluto: rose and plum
  Tanyao: '#b7bdc6', // Mercury: silver stone
  Yakuhai: '#7fdfec', // Uranus: pale cyan
  Pinfu: '#f3d687', // Venus: cream and gold
  Ittsu: '#bc9af3', // Saturn: lavender rings
  Honitsu: '#efa754', // Jupiter: amber bands
  Toitoi: '#67bbdf', // Earth: blue oceans
  Chinitsu: '#ed7652', // Mars: terracotta
  Sanshoku: '#4b9af4', // Neptune: deep blue
  SevenPairs: '#a47bff', // Planet X: violet
  Chanta: '#c5bca8', // Ceres: warm grey stone
  Kokushi: '#d8d0ff', // Eris: pale lilac ice
  All: '#ffc66a', // Black Hole: golden accretion ring
}

export const DEFAULT_FAMILY_TONE = '#facc15'
