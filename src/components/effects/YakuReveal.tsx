/**
 * YakuReveal Component for Tensho Mahjong Roguelike
 *
 * Dramatic yaku announcement animation with:
 * - Japanese name with translation
 * - Tier-based styling (higher tier = more dramatic)
 * - Chain animations for multiple yaku
 */

// Re-export all types
export type {
  YakuRevealProps,
  YakuRevealSequenceProps,
  YakuBannerProps,
  TierStyles,
} from './yaku-reveal/types'

// Re-export tier styling utility
export { getTierStyles } from './yaku-reveal/tierStyles'

// Re-export all components
export {
  YakuReveal,
  YakuRevealSequence,
  YakuBanner,
} from './yaku-reveal/RevealComponents'

// Default export for backwards compatibility
import { YakuReveal } from './yaku-reveal/RevealComponents'
export default YakuReveal
