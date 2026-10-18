/** Border and glow colours for the upgrade families, shared by every token. */

import type { YakuCategory } from '../../systems/CelestialOrbSystem'

export const FAMILY_TONES: Partial<Record<YakuCategory, string>> = {
  Pairs: '#7dd3fc',
  Pinfu: '#6ee7b7',
  Ittsu: '#a5b4fc',
  Toitoi: '#fcd34d',
  Yakuhai: '#fca5a5',
  Tanyao: '#bef264',
}

export const DEFAULT_FAMILY_TONE = '#facc15'
