/**
 * Yaku Reveal Constants
 *
 * Styling and configuration for yaku tier effects.
 */

import { YakuTier } from '../../../rules/YakuDefinition'
import { ANIMATION_COLORS } from '../../../animations/constants'
import { colors } from '../../../styles/theme'

/**
 * Style configuration for a yaku tier
 */
export interface TierStyles {
  backgroundColor: string
  borderColor: string
  glowColor: string
  textColor: string
  accentColor: string
  intensity: number
  scale: number
}

/**
 * Get styling based on yaku tier
 */
export function getTierStyles(tier: YakuTier): TierStyles {
  switch (tier) {
    case YakuTier.Tier4: // Yakuman
      return {
        backgroundColor: `linear-gradient(135deg, ${colors.darkForest}, #1a0a1a)`,
        borderColor: ANIMATION_COLORS.red,
        glowColor: ANIMATION_COLORS.red,
        textColor: ANIMATION_COLORS.gold,
        accentColor: ANIMATION_COLORS.red,
        intensity: 1,
        scale: 1.2,
      }
    case YakuTier.Tier3: // Advanced
      return {
        backgroundColor: `linear-gradient(135deg, ${colors.darkForest}, #1a1a0a)`,
        borderColor: ANIMATION_COLORS.gold,
        glowColor: ANIMATION_COLORS.gold,
        textColor: ANIMATION_COLORS.gold,
        accentColor: ANIMATION_COLORS.orange,
        intensity: 0.8,
        scale: 1.1,
      }
    case YakuTier.Tier2: // Intermediate
      return {
        backgroundColor: `linear-gradient(135deg, ${colors.darkForest}, #0a1a1a)`,
        borderColor: ANIMATION_COLORS.orange,
        glowColor: ANIMATION_COLORS.orange,
        textColor: colors.beigeWhite,
        accentColor: ANIMATION_COLORS.gold,
        intensity: 0.6,
        scale: 1.05,
      }
    case YakuTier.Tier1: // Basic
    default:
      return {
        backgroundColor: colors.darkForest,
        borderColor: colors.beigeWhite,
        glowColor: colors.beigeWhite,
        textColor: colors.beigeWhite,
        accentColor: ANIMATION_COLORS.gold,
        intensity: 0.4,
        scale: 1,
      }
  }
}
