/**
 * Border and glow colours, one hue per upgrade family, taken from the body of
 * the Orb that raises it (named below), so an Orb and its family's upgrade
 * share a colour as well as a tile motif.
 */

import type { YakuCategory } from '../../systems/CelestialOrbSystem'

export const FAMILY_TONES: Record<YakuCategory, string> = {
  Pairs: '#d9a3b0', // Pluto: rose and plum
  ThreePairs: '#a47bff', // Planet X: violet
  Sequence: '#f3d687', // Venus: cream and gold
  SequencePair: '#e9e4cf', // Moon: pearl and silver
  TwoSequences: '#b7bdc6', // Mercury: silver stone
  Triplets: '#67bbdf', // Earth: blue oceans
  FullHouse: '#efa754', // Jupiter: amber bands
  Straights: '#bc9af3', // Saturn: lavender rings
  Quads: '#ed7652', // Mars: terracotta
  Winds: '#d8d0ff', // Eris: pale lilac ice
  Dragons: '#7fdfec', // Uranus: pale cyan
  MixedSuits: '#4b9af4', // Neptune: deep blue
  Loose: '#c5bca8', // Ceres: warm grey stone
  All: '#ffc66a', // Black Hole: golden accretion ring
}

export const DEFAULT_FAMILY_TONE = '#facc15'
