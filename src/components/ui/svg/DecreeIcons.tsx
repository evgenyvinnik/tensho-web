/**
 * Decree Icons - Unique SVG icons for each decree
 *
 * Provides thematically appropriate icons for all 155 decrees.
 * Icons are organized by decree ID and rendered as inline SVGs.
 */

import React from 'react'

export interface DecreeIconProps {
  decreeId: string
  size?: number
  color?: string
  className?: string
}

/**
 * Get unique icon for a decree by ID
 */
export function DecreeUniqueIcon({
  decreeId,
  size = 32,
  color = '#FFD54F',
  className = '',
}: DecreeIconProps) {
  const IconComponent = DECREE_ICONS[decreeId] || DefaultIcon

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      fill="none"
    >
      <IconComponent color={color} />
    </svg>
  )
}

type IconFn = (props: { color: string }) => React.ReactNode

// Default icon for unknown decrees
const DefaultIcon: IconFn = ({ color }) => (
  <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
)

// =============================================================================
// COMMON DECREE ICONS (40)
// =============================================================================

// Chip icons - stacked coins/gems
const HalfSuitedIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="12" width="16" height="4" rx="2" fill={color} />
    <rect x="10" y="16" width="12" height="4" rx="2" fill={color} opacity="0.7" />
  </g>
)

const MistyJadeIcon: IconFn = ({ color }) => (
  <g>
    <ellipse cx="16" cy="16" rx="10" ry="8" fill={color} opacity="0.3" />
    <ellipse cx="16" cy="16" rx="6" ry="5" fill={color} opacity="0.6" />
    <ellipse cx="16" cy="16" rx="3" ry="2.5" fill={color} />
  </g>
)

const BambooScrollIcon: IconFn = ({ color }) => (
  <g>
    <rect x="10" y="6" width="12" height="20" rx="2" fill={color} opacity="0.8" />
    <line x1="13" y1="10" x2="19" y2="10" stroke="#1C3A2E" strokeWidth="1.5" />
    <line x1="13" y1="14" x2="19" y2="14" stroke="#1C3A2E" strokeWidth="1.5" />
    <line x1="13" y1="18" x2="17" y2="18" stroke="#1C3A2E" strokeWidth="1.5" />
  </g>
)

const JadeTabletIcon: IconFn = ({ color }) => (
  <g>
    <rect x="7" y="8" width="18" height="16" rx="2" fill={color} />
    <rect x="10" y="11" width="12" height="2" fill="#1C3A2E" />
    <rect x="10" y="15" width="12" height="2" fill="#1C3A2E" />
    <rect x="10" y="19" width="8" height="2" fill="#1C3A2E" />
  </g>
)

const PolishedStoneIcon: IconFn = ({ color }) => (
  <g>
    <ellipse cx="16" cy="16" rx="10" ry="10" fill={color} />
    <ellipse cx="13" cy="13" rx="3" ry="2" fill="white" opacity="0.4" />
  </g>
)

// Mult icons - flames/stars
const GentleBreezeIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 20 Q12 14 16 18 Q20 14 24 20" stroke={color} strokeWidth="2" fill="none" />
    <path d="M6 24 Q12 18 18 22 Q22 18 26 24" stroke={color} strokeWidth="2" fill="none" opacity="0.6" />
  </g>
)

const RisingSunIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="20" r="6" fill={color} />
    <line x1="16" y1="8" x2="16" y2="12" stroke={color} strokeWidth="2" />
    <line x1="8" y1="16" x2="12" y2="18" stroke={color} strokeWidth="2" />
    <line x1="24" y1="16" x2="20" y2="18" stroke={color} strokeWidth="2" />
    <line x1="10" y1="10" x2="13" y2="14" stroke={color} strokeWidth="2" />
    <line x1="22" y1="10" x2="19" y2="14" stroke={color} strokeWidth="2" />
  </g>
)

const LunarGlowIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" fill={color} opacity="0.3" />
    <path d="M12 16 A8 8 0 0 1 20 8 A10 10 0 1 0 12 16" fill={color} />
  </g>
)

const CrimsonBannerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="4" width="4" height="24" fill={color} opacity="0.5" />
    <polygon points="6,6 18,6 18,18 12,14 6,18" fill={color} />
  </g>
)

const GoldenSealIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" fill={color} />
    <circle cx="16" cy="16" r="6" fill="#1C3A2E" />
    <path d="M16 12 L17.5 15 L21 15.5 L18.5 18 L19 21.5 L16 20 L13 21.5 L13.5 18 L11 15.5 L14.5 15 Z" fill={color} />
  </g>
)

// Suit icons - mahjong suits
const ManzuMasterIcon: IconFn = ({ color }) => (
  <g>
    <text x="16" y="22" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>萬</text>
  </g>
)

const PinzuPerfectionistIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="3" fill="none" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </g>
)

const SouzuScholarIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="6" width="4" height="20" rx="2" fill={color} />
    <circle cx="16" cy="10" r="2" fill="#1C3A2E" />
  </g>
)

const WindWalkerIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 12 Q16 8 24 12" stroke={color} strokeWidth="2" fill="none" />
    <path d="M6 16 Q16 12 26 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M8 20 Q16 16 24 20" stroke={color} strokeWidth="2" fill="none" />
    <path d="M10 24 Q16 20 22 24" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const DragonDiscipleIcon: IconFn = ({ color }) => (
  <g>
    <path d="M10 24 Q8 18 12 14 Q16 10 20 14 Q24 18 22 24" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="14" cy="16" r="1.5" fill={color} />
    <circle cx="18" cy="16" r="1.5" fill={color} />
    <path d="M12 10 L10 6" stroke={color} strokeWidth="2" />
    <path d="M20 10 L22 6" stroke={color} strokeWidth="2" />
  </g>
)

// Terminal/Simple icons
const EdgeRunnerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="14" width="8" height="8" rx="1" fill={color} />
    <text x="10" y="21" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1C3A2E">1</text>
    <rect x="18" y="10" width="8" height="8" rx="1" fill={color} />
    <text x="22" y="17" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1C3A2E">9</text>
  </g>
)

const MiddleWayIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="2" fill="none" />
    <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="bold" fill={color}>5</text>
  </g>
)

const GreenFortuneIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 6 L16 26" stroke={color} strokeWidth="3" />
    <path d="M10 10 Q16 14 22 10" stroke={color} strokeWidth="2" fill="none" />
    <path d="M10 16 Q16 20 22 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M10 22 Q16 26 22 22" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

// Gold icons - coins
const CoinCollectorIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="12" cy="18" r="6" fill={color} />
    <circle cx="12" cy="18" r="3" fill="#1C3A2E" />
    <circle cx="20" cy="14" r="6" fill={color} opacity="0.7" />
    <circle cx="20" cy="14" r="3" fill="#1C3A2E" />
  </g>
)

const MerchantsFavorIcon: IconFn = ({ color }) => (
  <g>
    <ellipse cx="16" cy="16" rx="10" ry="6" fill={color} />
    <ellipse cx="16" cy="16" rx="4" ry="2" fill="#1C3A2E" />
    <ellipse cx="16" cy="12" rx="10" ry="6" stroke={color} strokeWidth="1" fill="none" />
  </g>
)

const LuckyCoinIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" fill={color} />
    <rect x="12" y="12" width="8" height="8" fill="#1C3A2E" />
    <path d="M4 4 L28 28 M28 4 L4 28" stroke={color} strokeWidth="1" opacity="0.3" />
  </g>
)

// Structure icons - pairs, sequences, triplets
const PairLoverIcon: IconFn = ({ color }) => (
  <g>
    <rect x="7" y="10" width="8" height="12" rx="1" fill={color} />
    <rect x="17" y="10" width="8" height="12" rx="1" fill={color} />
  </g>
)

const SequenceSeekerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="5" y="12" width="6" height="10" rx="1" fill={color} opacity="0.6" />
    <rect x="13" y="10" width="6" height="10" rx="1" fill={color} opacity="0.8" />
    <rect x="21" y="8" width="6" height="10" rx="1" fill={color} />
  </g>
)

const TripletTrackerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="12" width="7" height="10" rx="1" fill={color} />
    <rect x="12.5" y="12" width="7" height="10" rx="1" fill={color} />
    <rect x="21" y="12" width="7" height="10" rx="1" fill={color} />
  </g>
)

// Flora icons
const FlowerFriendIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="14" r="4" fill={color} />
    <circle cx="11" cy="17" r="3" fill={color} opacity="0.8" />
    <circle cx="21" cy="17" r="3" fill={color} opacity="0.8" />
    <circle cx="13" cy="22" r="3" fill={color} opacity="0.6" />
    <circle cx="19" cy="22" r="3" fill={color} opacity="0.6" />
    <circle cx="16" cy="16" r="2" fill="#1C3A2E" />
  </g>
)

const SeasonalBlessingIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 4 L16 28" stroke={color} strokeWidth="1" opacity="0.3" />
    <path d="M4 16 L28 16" stroke={color} strokeWidth="1" opacity="0.3" />
    <circle cx="16" cy="8" r="4" fill={color} opacity="0.9" />
    <circle cx="24" cy="16" r="4" fill={color} opacity="0.7" />
    <circle cx="16" cy="24" r="4" fill={color} opacity="0.5" />
    <circle cx="8" cy="16" r="4" fill={color} opacity="0.3" />
  </g>
)

// Hand size icons
const WideGripIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 20 L8 14 Q8 10 12 10 L12 20" stroke={color} strokeWidth="2" fill="none" />
    <path d="M14 20 L14 8 Q14 6 16 6 Q18 6 18 8 L18 20" stroke={color} strokeWidth="2" fill="none" />
    <path d="M20 20 L20 10 Q20 8 22 8 Q24 8 24 10 L24 20" stroke={color} strokeWidth="2" fill="none" />
    <rect x="6" y="20" width="20" height="4" rx="2" fill={color} />
  </g>
)

const SecondChanceIcon: IconFn = ({ color }) => (
  <g>
    <path d="M22 8 A10 10 0 1 1 8 16" stroke={color} strokeWidth="2" fill="none" />
    <polygon points="22,4 26,10 18,10" fill={color} />
  </g>
)

// Mixed effect icons
const BalancedPathIcon: IconFn = ({ color }) => (
  <g>
    <line x1="16" y1="6" x2="16" y2="26" stroke={color} strokeWidth="2" />
    <line x1="6" y1="16" x2="26" y2="16" stroke={color} strokeWidth="3" />
    <circle cx="10" cy="16" r="3" fill={color} />
    <circle cx="22" cy="16" r="3" fill={color} />
  </g>
)

const ModestFortuneIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="8" width="10" height="8" rx="1" fill={color} opacity="0.7" />
    <circle cx="20" cy="20" r="5" fill={color} />
    <circle cx="20" cy="20" r="2" fill="#1C3A2E" />
  </g>
)

const HumblePowerIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,6 20,14 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,14" fill={color} opacity="0.5" />
    <circle cx="16" cy="16" r="4" fill={color} />
  </g>
)

// Rank icons
const OneMasteryIcon: IconFn = ({ color }) => (
  <g>
    <rect x="10" y="6" width="12" height="20" rx="2" fill={color} />
    <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1C3A2E">1</text>
  </g>
)

const NineMasteryIcon: IconFn = ({ color }) => (
  <g>
    <rect x="10" y="6" width="12" height="20" rx="2" fill={color} />
    <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1C3A2E">9</text>
  </g>
)

const FiveBlessingIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" fill={color} opacity="0.3" />
    <text x="16" y="21" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>5</text>
  </g>
)

// Multiplier icons
const SparkIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 18,12 26,14 18,16 16,24 14,16 6,14 14,12" fill={color} />
  </g>
)

const EmberIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 28 Q10 20 14 14 Q12 10 16 4 Q20 10 18 14 Q22 20 16 28" fill={color} />
  </g>
)

// Yaku icons
const RiichiDevoteeIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="10" width="20" height="4" fill={color} />
    <rect x="14" y="6" width="4" height="20" fill={color} />
  </g>
)

const TanyaoTacticianIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="2" fill="none" />
    <line x1="8" y1="8" x2="24" y2="24" stroke={color} strokeWidth="2" />
    <line x1="24" y1="8" x2="8" y2="24" stroke={color} strokeWidth="2" />
  </g>
)

const PinfuPuristIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="12" width="20" height="8" rx="1" fill={color} opacity="0.3" />
    <line x1="6" y1="16" x2="26" y2="16" stroke={color} strokeWidth="2" />
  </g>
)

// =============================================================================
// UNCOMMON DECREE ICONS (40)
// =============================================================================

const ManzuEmperorIcon: IconFn = ({ color }) => (
  <g>
    <text x="16" y="18" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>萬</text>
    <path d="M8 4 L16 8 L24 4" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="6" r="2" fill={color} />
  </g>
)

const PinzuPrincessIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="18" r="8" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="18" r="3" fill={color} />
    <path d="M12 6 L16 10 L20 6" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const SouzuSageIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="8" width="4" height="18" rx="2" fill={color} />
    <circle cx="16" cy="12" r="2" fill="#1C3A2E" />
    <path d="M10 6 Q16 2 22 6" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const FlushFeverIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="8" width="20" height="16" rx="2" fill={color} opacity="0.3" />
    <rect x="9" y="11" width="14" height="10" rx="1" fill={color} opacity="0.6" />
    <rect x="12" y="14" width="8" height="4" rx="1" fill={color} />
  </g>
)

const HonorGuardIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 26,12 22,28 10,28 6,12" fill={color} opacity="0.5" />
    <text x="16" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>字</text>
  </g>
)

const TerminalTideIcon: IconFn = ({ color }) => (
  <g>
    <path d="M4 16 Q10 10 16 16 Q22 22 28 16" stroke={color} strokeWidth="3" fill="none" />
    <circle cx="8" cy="16" r="3" fill={color} />
    <circle cx="24" cy="16" r="3" fill={color} />
  </g>
)

const StraightArrowIcon: IconFn = ({ color }) => (
  <g>
    <line x1="6" y1="16" x2="22" y2="16" stroke={color} strokeWidth="3" />
    <polygon points="26,16 20,12 20,20" fill={color} />
  </g>
)

const RunMasterIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="14" width="6" height="8" rx="1" fill={color} opacity="0.6" />
    <rect x="11" y="12" width="6" height="8" rx="1" fill={color} opacity="0.8" />
    <rect x="18" y="10" width="6" height="8" rx="1" fill={color} />
    <line x1="7" y1="24" x2="21" y2="24" stroke={color} strokeWidth="2" />
  </g>
)

const TripleThreatIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="10" width="7" height="12" rx="1" fill={color} />
    <rect x="12.5" y="10" width="7" height="12" rx="1" fill={color} />
    <rect x="21" y="10" width="7" height="12" rx="1" fill={color} />
    <polygon points="16,4 20,8 12,8" fill={color} />
  </g>
)

const TripletThunderIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="14,4 18,4 14,16 20,16 10,28 14,18 8,18" fill={color} />
  </g>
)

const EchoStoneIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </g>
)

const MirrorShardIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 28,16 16,28 4,16" fill={color} opacity="0.3" />
    <polygon points="16,8 24,16 16,24 8,16" fill={color} opacity="0.6" />
    <polygon points="16,12 20,16 16,20 12,16" fill={color} />
  </g>
)

const DragonEchoIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 26 Q6 18 12 12 Q18 8 24 14 Q28 20 24 26" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="14" cy="14" r="2" fill={color} />
    <circle cx="20" cy="16" r="2" fill={color} />
    <circle cx="16" cy="14" r="5" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
  </g>
)

const WindEchoIcon: IconFn = ({ color }) => (
  <g>
    <path d="M6 10 Q16 4 26 10" stroke={color} strokeWidth="2" fill="none" />
    <path d="M6 16 Q16 10 26 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M6 22 Q16 16 26 22" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="24" cy="10" r="3" stroke={color} fill="none" />
    <circle cx="24" cy="16" r="3" stroke={color} fill="none" />
  </g>
)

const GoldenRatioIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="6" width="20" height="20" stroke={color} strokeWidth="2" fill="none" />
    <rect x="6" y="6" width="12" height="12" fill={color} opacity="0.3" />
    <rect x="18" y="6" width="8" height="8" fill={color} opacity="0.5" />
    <rect x="18" y="14" width="5" height="5" fill={color} opacity="0.7" />
  </g>
)

const TreasureHunterIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="12" width="16" height="12" rx="2" fill={color} opacity="0.7" />
    <rect x="12" y="8" width="8" height="6" rx="1" fill={color} />
    <circle cx="16" cy="18" r="3" fill="#1C3A2E" />
    <line x1="16" y1="18" x2="16" y2="16" stroke={color} strokeWidth="1" />
  </g>
)

const TaxCollectorIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="10" cy="12" r="4" fill={color} />
    <circle cx="16" cy="16" r="4" fill={color} opacity="0.8" />
    <circle cx="22" cy="12" r="4" fill={color} opacity="0.6" />
    <circle cx="16" cy="22" r="4" fill={color} opacity="0.4" />
  </g>
)

const GardenKeeperIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 26 L16 14" stroke={color} strokeWidth="2" />
    <circle cx="16" cy="10" r="4" fill={color} />
    <circle cx="12" cy="14" r="3" fill={color} opacity="0.8" />
    <circle cx="20" cy="14" r="3" fill={color} opacity="0.8" />
    <path d="M8 26 L24 26" stroke={color} strokeWidth="2" />
  </g>
)

const BlossomStormIcon: IconFn = ({ color }) => (
  <g>
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <circle
        key={i}
        cx={16 + 8 * Math.cos((angle * Math.PI) / 180)}
        cy={16 + 8 * Math.sin((angle * Math.PI) / 180)}
        r="3"
        fill={color}
        opacity={0.4 + (i * 0.1)}
      />
    ))}
    <circle cx="16" cy="16" r="4" fill={color} />
  </g>
)

const SeasonalWindIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 8 Q16 4 24 8 Q20 12 16 10 Q12 12 8 8" fill={color} />
    <path d="M6 16 Q16 12 26 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M8 24 Q16 20 24 24" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const SlowBurnIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 28 Q12 22 14 18 Q12 14 16 8 Q20 14 18 18 Q20 22 16 28" fill={color} opacity="0.6" />
    <path d="M16 26 Q14 22 15 19 Q13 16 16 12 Q19 16 17 19 Q18 22 16 26" fill={color} />
  </g>
)

const MomentumIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="8" cy="20" r="4" fill={color} opacity="0.4" />
    <circle cx="14" cy="16" r="4" fill={color} opacity="0.6" />
    <circle cx="20" cy="12" r="4" fill={color} opacity="0.8" />
    <circle cx="26" cy="8" r="4" fill={color} />
    <line x1="8" y1="20" x2="26" y2="8" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
  </g>
)

const CrescendoIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="20" width="4" height="6" fill={color} opacity="0.4" />
    <rect x="12" y="16" width="4" height="10" fill={color} opacity="0.6" />
    <rect x="18" y="10" width="4" height="16" fill={color} opacity="0.8" />
    <rect x="24" y="4" width="4" height="22" fill={color} />
  </g>
)

const WasteNotIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="2" fill="none" />
    <path d="M10 10 L22 22 M22 10 L10 22" stroke={color} strokeWidth="2" />
  </g>
)

const RecyclerIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 6 L22 12 L18 12 L18 20 L14 20 L14 12 L10 12 Z" fill={color} />
    <path d="M8 22 Q16 28 24 22" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const YakuhaiZealotIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 26,12 22,28 10,28 6,12" fill={color} />
    <text x="16" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C3A2E">役</text>
  </g>
)

const ToitoiTitanIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="8" width="7" height="10" rx="1" fill={color} />
    <rect x="4" y="18" width="7" height="10" rx="1" fill={color} opacity="0.7" />
    <rect x="12.5" y="8" width="7" height="20" rx="1" fill={color} />
    <rect x="21" y="8" width="7" height="10" rx="1" fill={color} />
    <rect x="21" y="18" width="7" height="10" rx="1" fill={color} opacity="0.7" />
  </g>
)

const IttsuInitiateIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="14" width="5" height="8" rx="1" fill={color} opacity="0.5" />
    <rect x="10" y="13" width="5" height="8" rx="1" fill={color} opacity="0.6" />
    <rect x="16" y="12" width="5" height="8" rx="1" fill={color} opacity="0.8" />
    <rect x="22" y="11" width="5" height="8" rx="1" fill={color} />
    <line x1="6" y1="24" x2="26" y2="24" stroke={color} strokeWidth="2" />
  </g>
)

const ChinitsuChampionIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="6" width="20" height="20" rx="2" fill={color} opacity="0.3" />
    <rect x="9" y="9" width="14" height="14" rx="1" fill={color} opacity="0.6" />
    <circle cx="16" cy="16" r="5" fill={color} />
    <circle cx="16" cy="16" r="2" fill="#1C3A2E" />
  </g>
)

const VeteranIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 20,12 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,12" stroke={color} strokeWidth="2" fill="none" />
    <polygon points="16,10 18,14 22,15 19,18 20,22 16,20 12,22 13,18 10,15 14,14" fill={color} />
  </g>
)

const ExperienceIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="8" width="20" height="16" rx="2" fill={color} opacity="0.5" />
    <line x1="10" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
    <line x1="10" y1="16" x2="22" y2="16" stroke={color} strokeWidth="2" />
    <line x1="10" y1="20" x2="18" y2="20" stroke={color} strokeWidth="2" />
  </g>
)

const GreaterJadeIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 28,16 16,28 4,16" fill={color} />
    <polygon points="16,10 22,16 16,22 10,16" fill="#1C3A2E" opacity="0.3" />
  </g>
)

const BlazingBannerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="4" width="4" height="24" fill={color} opacity="0.5" />
    <polygon points="4,4 18,4 18,20 11,14 4,20" fill={color} />
    <path d="M18 8 Q22 6 26 8 Q24 12 26 16 Q22 14 18 16" fill={color} opacity="0.7" />
  </g>
)

const FlameIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 28 Q8 20 12 12 Q10 6 16 2 Q22 6 20 12 Q24 20 16 28" fill={color} />
    <path d="M16 24 Q12 18 14 14 Q12 10 16 6 Q20 10 18 14 Q20 18 16 24" fill="#1C3A2E" opacity="0.3" />
  </g>
)

const WindDragonIcon: IconFn = ({ color }) => (
  <g>
    <path d="M6 12 Q16 6 26 12" stroke={color} strokeWidth="2" fill="none" />
    <path d="M10 24 Q8 18 14 14 Q18 10 24 16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="20" cy="18" r="2" fill={color} />
  </g>
)

const AllSuitsIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="10" cy="12" r="5" fill={color} opacity="0.5" />
    <circle cx="22" cy="12" r="5" fill={color} opacity="0.7" />
    <circle cx="16" cy="22" r="5" fill={color} />
  </g>
)

const BookendsIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="8" width="8" height="16" rx="1" fill={color} />
    <rect x="20" y="8" width="8" height="16" rx="1" fill={color} />
    <text x="8" y="19" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C3A2E">1</text>
    <text x="24" y="19" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1C3A2E">9</text>
  </g>
)

const ExpansiveGripIcon: IconFn = ({ color }) => (
  <g>
    <path d="M6 22 L6 14 Q6 10 10 10 L10 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M12 22 L12 8 Q12 6 14 6 Q16 6 16 8 L16 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M18 22 L18 8 Q18 6 20 6 Q22 6 22 8 L22 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M24 22 L24 10 Q24 8 26 8 Q28 8 28 10 L28 22" stroke={color} strokeWidth="2" fill="none" />
    <rect x="4" y="22" width="26" height="4" rx="2" fill={color} />
  </g>
)

const CarefulPlayerIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="2" fill="none" />
    <path d="M16 8 L16 16 L22 16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="2" fill={color} />
  </g>
)

// =============================================================================
// RARE DECREE ICONS (35) - Selected key icons
// =============================================================================

const InfernoIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 30 Q4 18 12 8 Q8 2 16 0 Q24 2 20 8 Q28 18 16 30" fill={color} />
    <path d="M16 26 Q10 18 14 12 Q10 6 16 4 Q22 6 18 12 Q22 18 16 26" fill={color} opacity="0.5" />
    <path d="M16 20 Q14 16 15 12 Q14 8 16 6 Q18 8 17 12 Q18 16 16 20" fill="#1C3A2E" opacity="0.3" />
  </g>
)

const SupernovaIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="8" fill={color} />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <line
        key={i}
        x1={16 + 8 * Math.cos((angle * Math.PI) / 180)}
        y1={16 + 8 * Math.sin((angle * Math.PI) / 180)}
        x2={16 + 14 * Math.cos((angle * Math.PI) / 180)}
        y2={16 + 14 * Math.sin((angle * Math.PI) / 180)}
        stroke={color}
        strokeWidth="2"
      />
    ))}
  </g>
)

const PerfectionistIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1.5" fill="none" />
    <circle cx="16" cy="16" r="4" fill={color} />
    <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" />
    <line x1="16" y1="26" x2="16" y2="30" stroke={color} strokeWidth="2" />
  </g>
)

const CompoundInterestIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="8" cy="22" r="4" fill={color} opacity="0.4" />
    <circle cx="14" cy="18" r="5" fill={color} opacity="0.6" />
    <circle cx="20" cy="12" r="6" fill={color} opacity="0.8" />
    <circle cx="26" cy="6" r="3" fill={color} />
    <path d="M8 22 Q14 16 20 12 Q24 8 26 6" stroke={color} strokeWidth="1" strokeDasharray="2,2" fill="none" />
  </g>
)

const TripleEchoIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" fill="none" opacity="0.4" />
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" />
    <circle cx="16" cy="16" r="4" fill={color} />
  </g>
)

const BlueprintIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="6" width="20" height="20" rx="2" stroke={color} strokeWidth="2" fill="none" />
    <line x1="6" y1="12" x2="26" y2="12" stroke={color} strokeWidth="1" strokeDasharray="3,2" />
    <line x1="6" y1="20" x2="26" y2="20" stroke={color} strokeWidth="1" strokeDasharray="3,2" />
    <line x1="12" y1="6" x2="12" y2="26" stroke={color} strokeWidth="1" strokeDasharray="3,2" />
    <line x1="20" y1="6" x2="20" y2="26" stroke={color} strokeWidth="1" strokeDasharray="3,2" />
  </g>
)

const PhotographIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="8" width="24" height="18" rx="2" fill={color} opacity="0.5" />
    <circle cx="16" cy="17" r="6" fill={color} />
    <circle cx="16" cy="17" r="3" fill="#1C3A2E" />
    <rect x="8" y="10" width="4" height="2" rx="1" fill={color} />
  </g>
)

const PhoenixIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 28 Q10 22 14 16 Q8 14 12 8 Q16 12 16 8 Q16 12 20 8 Q24 14 18 16 Q22 22 16 28" fill={color} />
    <circle cx="14" cy="12" r="1" fill="#1C3A2E" />
    <circle cx="18" cy="12" r="1" fill="#1C3A2E" />
  </g>
)

const WealthEngineIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="12" width="16" height="12" rx="2" fill={color} opacity="0.6" />
    <circle cx="16" cy="18" r="4" fill={color} />
    <circle cx="16" cy="18" r="2" fill="#1C3A2E" />
    <rect x="10" y="8" width="4" height="6" rx="1" fill={color} />
    <rect x="18" y="8" width="4" height="6" rx="1" fill={color} />
  </g>
)

const PerpetualMotionIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="2" fill="none" />
    <path d="M16 8 L20 16 L16 14 L12 16 L16 8" fill={color} />
    <path d="M16 24 L12 16 L16 18 L20 16 L16 24" fill={color} opacity="0.7" />
  </g>
)

const TerminalResonanceIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="10" width="8" height="12" rx="1" fill={color} />
    <rect x="18" y="10" width="8" height="12" rx="1" fill={color} />
    <text x="10" y="19" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1C3A2E">1</text>
    <text x="22" y="19" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1C3A2E">9</text>
    <path d="M14 16 Q16 14 18 16 Q16 18 14 16" stroke={color} strokeWidth="1" fill="none" />
  </g>
)

const HonorResonanceIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 26,12 22,28 10,28 6,12" fill={color} opacity="0.5" />
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </g>
)

const ManzuMonarchIcon: IconFn = ({ color }) => (
  <g>
    <text x="16" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill={color}>萬</text>
    <polygon points="16,2 20,6 12,6" fill={color} />
    <line x1="8" y1="8" x2="24" y2="8" stroke={color} strokeWidth="2" />
  </g>
)

const PinzuPotentateIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="18" r="8" stroke={color} strokeWidth="3" fill="none" />
    <circle cx="16" cy="18" r="4" fill={color} />
    <polygon points="16,2 20,6 12,6" fill={color} />
    <line x1="8" y1="8" x2="24" y2="8" stroke={color} strokeWidth="2" />
  </g>
)

const SouzuSovereignIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="10" width="4" height="18" rx="2" fill={color} />
    <circle cx="16" cy="14" r="2" fill="#1C3A2E" />
    <polygon points="16,2 20,6 12,6" fill={color} />
    <line x1="8" y1="8" x2="24" y2="8" stroke={color} strokeWidth="2" />
  </g>
)

const FlowerEmperorIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="14" r="5" fill={color} />
    <circle cx="10" cy="18" r="4" fill={color} opacity="0.8" />
    <circle cx="22" cy="18" r="4" fill={color} opacity="0.8" />
    <circle cx="12" cy="24" r="3" fill={color} opacity="0.6" />
    <circle cx="20" cy="24" r="3" fill={color} opacity="0.6" />
    <polygon points="16,2 18,6 14,6" fill={color} />
  </g>
)

const SeasonLordIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="10" cy="10" r="4" fill={color} opacity="0.9" />
    <circle cx="22" cy="10" r="4" fill={color} opacity="0.7" />
    <circle cx="10" cy="22" r="4" fill={color} opacity="0.5" />
    <circle cx="22" cy="22" r="4" fill={color} opacity="0.3" />
    <polygon points="16,14 18,18 14,18" fill={color} />
  </g>
)

const NatureBondIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 26 L16 14" stroke={color} strokeWidth="2" />
    <circle cx="16" cy="10" r="5" fill={color} />
    <circle cx="11" cy="14" r="3" fill={color} opacity="0.7" />
    <circle cx="21" cy="14" r="3" fill={color} opacity="0.7" />
    <path d="M8 26 Q12 22 16 24 Q20 22 24 26" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const HonitsuHeraldIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="8" width="20" height="16" rx="2" fill={color} opacity="0.4" />
    <rect x="9" y="11" width="7" height="10" rx="1" fill={color} />
    <polygon points="20,12 24,16 20,20" fill={color} />
  </g>
)

const SanshokuSageIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="10" cy="14" r="5" fill={color} opacity="0.6" />
    <rect x="14" y="10" width="4" height="12" rx="1" fill={color} opacity="0.8" />
    <text x="24" y="19" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>萬</text>
  </g>
)

const ChantaChampionIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="10" width="8" height="12" rx="1" fill={color} />
    <rect x="20" y="10" width="8" height="12" rx="1" fill={color} />
    <text x="8" y="19" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1C3A2E">1</text>
    <text x="24" y="19" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1C3A2E">9</text>
    <polygon points="16,8 18,12 14,12" fill={color} />
    <polygon points="16,24 14,20 18,20" fill={color} />
  </g>
)

const MandateBreakerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="8" width="16" height="16" rx="2" stroke={color} strokeWidth="2" fill="none" />
    <line x1="8" y1="8" x2="24" y2="24" stroke={color} strokeWidth="3" />
    <line x1="24" y1="8" x2="8" y2="24" stroke={color} strokeWidth="3" />
  </g>
)

const BossSlayerIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 4 L16 20" stroke={color} strokeWidth="3" />
    <polygon points="16,20 12,28 20,28" fill={color} />
    <line x1="10" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
    <circle cx="16" cy="6" r="2" fill={color} />
  </g>
)

const FortuneAndGloryIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 20,12 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,12" fill={color} opacity="0.6" />
    <circle cx="16" cy="16" r="5" fill={color} />
    <circle cx="16" cy="16" r="2" fill="#1C3A2E" />
  </g>
)

const EmperorsBlessingIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,2 20,8 14,8" fill={color} />
    <line x1="8" y1="10" x2="24" y2="10" stroke={color} strokeWidth="2" />
    <rect x="10" y="12" width="12" height="14" rx="2" fill={color} opacity="0.7" />
    <circle cx="16" cy="19" r="4" fill={color} />
  </g>
)

const GoldenAgeIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="12" cy="16" r="6" fill={color} />
    <circle cx="12" cy="16" r="3" fill="#1C3A2E" />
    <circle cx="20" cy="12" r="5" fill={color} opacity="0.7" />
    <circle cx="20" cy="12" r="2" fill="#1C3A2E" />
    <circle cx="20" cy="22" r="4" fill={color} opacity="0.5" />
    <circle cx="20" cy="22" r="1.5" fill="#1C3A2E" />
  </g>
)

const AncientScrollIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="6" width="16" height="22" rx="2" fill={color} opacity="0.8" />
    <circle cx="16" cy="8" r="3" fill={color} />
    <line x1="11" y1="14" x2="21" y2="14" stroke="#1C3A2E" strokeWidth="1.5" />
    <line x1="11" y1="18" x2="21" y2="18" stroke="#1C3A2E" strokeWidth="1.5" />
    <line x1="11" y1="22" x2="17" y2="22" stroke="#1C3A2E" strokeWidth="1.5" />
  </g>
)

const SacrificeIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 28 Q8 20 14 12 Q10 6 16 2 Q22 6 18 12 Q24 20 16 28" fill={color} />
    <line x1="8" y1="16" x2="24" y2="16" stroke="#1C3A2E" strokeWidth="2" />
  </g>
)

const TransmuterIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 28,16 16,28 4,16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="5" fill={color} />
    <path d="M12 16 L20 16 M16 12 L16 20" stroke="#1C3A2E" strokeWidth="1.5" />
  </g>
)

const HarmonizerIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="10" cy="16" r="5" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="22" cy="16" r="5" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </g>
)

const FinalActIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="6" width="20" height="20" rx="2" stroke={color} strokeWidth="2" fill="none" />
    <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>終</text>
  </g>
)

const EndlessJourneyIcon: IconFn = ({ color }) => (
  <g>
    <path d="M4 16 Q10 8 16 16 Q22 24 28 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M4 20 Q10 12 16 20 Q22 28 28 20" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
    <circle cx="28" cy="16" r="2" fill={color} />
  </g>
)

const MasterGripIcon: IconFn = ({ color }) => (
  <g>
    <path d="M6 22 L6 12 Q6 8 10 8 L10 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M12 22 L12 6 Q12 4 14 4 Q16 4 16 6 L16 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M18 22 L18 6 Q18 4 20 4 Q22 4 22 6 L22 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M24 22 L24 8 Q24 6 26 6 Q28 6 28 8 L28 22" stroke={color} strokeWidth="2" fill="none" />
    <rect x="4" y="22" width="26" height="4" rx="2" fill={color} />
    <polygon points="17,10 19,6 15,6" fill={color} />
  </g>
)

const InfinitePatienceIcon: IconFn = ({ color }) => (
  <g>
    <path d="M10 16 Q10 8 16 8 Q22 8 22 16 Q22 24 16 24 Q10 24 10 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M16 8 L16 16 L22 16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="2" fill={color} />
    <circle cx="16" cy="4" r="2" fill={color} opacity="0.5" />
  </g>
)

// =============================================================================
// LEGENDARY DECREE ICONS (25)
// =============================================================================

const DivineFlameIcon: IconFn = ({ color }) => (
  <g>
    <path d="M16 30 Q2 16 12 4 Q16 8 16 0 Q16 8 20 4 Q30 16 16 30" fill={color} />
    <circle cx="16" cy="16" r="4" fill="white" opacity="0.5" />
  </g>
)

const HeavensWrathIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,2 18,10 26,10 20,16 22,24 16,20 10,24 12,16 6,10 14,10" fill={color} />
    <circle cx="16" cy="14" r="3" fill="#1C3A2E" opacity="0.3" />
  </g>
)

const EternalEchoIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="2" fill="none" opacity="0.7" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </g>
)

const DragonKingIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 28 Q4 18 12 10 Q18 4 26 10 Q30 18 24 28" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="14" cy="12" r="2" fill={color} />
    <circle cx="22" cy="14" r="2" fill={color} />
    <path d="M10 6 L8 2" stroke={color} strokeWidth="2" />
    <path d="M24 8 L28 4" stroke={color} strokeWidth="2" />
    <polygon points="16,18 20,24 12,24" fill={color} />
  </g>
)

const MidasTouchIcon: IconFn = ({ color }) => (
  <g>
    <path d="M10 26 L10 14 Q10 10 14 10 L14 26" stroke={color} strokeWidth="2" fill="none" />
    <path d="M16 26 L16 6 Q16 4 18 4 Q20 4 20 6 L20 26" stroke={color} strokeWidth="2" fill="none" />
    <path d="M22 26 L22 10 Q22 8 24 8 Q26 8 26 10 L26 26" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="18" cy="18" r="4" fill={color} />
    <circle cx="18" cy="18" r="2" fill="#1C3A2E" />
  </g>
)

const GlassCannonIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,2 20,10 28,14 20,18 16,28 12,18 4,14 12,10" fill={color} opacity="0.5" />
    <polygon points="16,6 18,12 24,14 18,16 16,22 14,16 8,14 14,12" fill={color} />
    <line x1="4" y1="28" x2="28" y2="4" stroke={color} strokeWidth="1" opacity="0.5" />
  </g>
)

const VoidBlessingIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="8" fill={color} opacity="0.3" />
    <polygon points="16,8 18,14 24,16 18,18 16,24 14,18 8,16 14,14" fill={color} />
  </g>
)

const YakuAmplifierIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 26,12 22,28 10,28 6,12" fill={color} opacity="0.6" />
    <text x="16" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>役</text>
    <polygon points="16,22 18,26 14,26" fill={color} />
  </g>
)

const YakumanSeekerIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,2 20,10 28,12 22,18 24,26 16,22 8,26 10,18 4,12 12,10" fill={color} />
    <text x="16" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1C3A2E">満</text>
  </g>
)

const FourSeasonsMasterIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="10" cy="10" r="5" fill={color} />
    <circle cx="22" cy="10" r="5" fill={color} opacity="0.8" />
    <circle cx="10" cy="22" r="5" fill={color} opacity="0.6" />
    <circle cx="22" cy="22" r="5" fill={color} opacity="0.4" />
    <polygon points="16,14 18,18 14,18" fill={color} />
  </g>
)

const EternalGardenIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="12" r="6" fill={color} />
    <circle cx="10" cy="16" r="4" fill={color} opacity="0.8" />
    <circle cx="22" cy="16" r="4" fill={color} opacity="0.8" />
    <circle cx="10" cy="22" r="3" fill={color} opacity="0.6" />
    <circle cx="22" cy="22" r="3" fill={color} opacity="0.6" />
    <circle cx="16" cy="24" r="3" fill={color} opacity="0.4" />
    <circle cx="16" cy="14" r="2" fill="#1C3A2E" />
  </g>
)

const InfiniteWealthIcon: IconFn = ({ color }) => (
  <g>
    <path d="M10 16 Q10 8 16 8 Q22 8 22 16 Q22 24 16 24 Q10 24 10 16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="5" fill={color} />
    <circle cx="16" cy="16" r="2" fill="#1C3A2E" />
  </g>
)

const BrainstormIcon: IconFn = ({ color }) => (
  <g>
    <ellipse cx="16" cy="14" rx="10" ry="8" fill={color} opacity="0.5" />
    <path d="M12 22 L12 26 M16 22 L16 28 M20 22 L20 26" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill={color} />
    <circle cx="20" cy="12" r="2" fill={color} />
    <circle cx="16" cy="16" r="2" fill={color} />
  </g>
)

const DoppelgangerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="6" y="8" width="10" height="16" rx="2" fill={color} />
    <rect x="16" y="8" width="10" height="16" rx="2" fill={color} opacity="0.6" />
    <line x1="11" y1="8" x2="11" y2="24" stroke="#1C3A2E" strokeWidth="1" strokeDasharray="2,2" />
  </g>
)

const ManzuGodIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color}>萬</text>
    <polygon points="16,2 18,6 14,6" fill={color} />
  </g>
)

const PinzuGodIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="3" fill="none" />
    <circle cx="16" cy="16" r="3" fill={color} />
    <polygon points="16,2 18,6 14,6" fill={color} />
  </g>
)

const SouzuGodIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <rect x="14" y="8" width="4" height="16" rx="2" fill={color} />
    <circle cx="16" cy="12" r="2" fill="#1C3A2E" />
    <polygon points="16,2 18,6 14,6" fill={color} />
  </g>
)

const TimeLordIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <path d="M16 6 L16 16 L24 16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="3" fill={color} />
    <polygon points="16,2 18,6 14,6" fill={color} />
  </g>
)

const ExponentialIcon: IconFn = ({ color }) => (
  <g>
    <path d="M4 26 Q10 24 14 18 Q18 10 26 4" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="6" cy="24" r="3" fill={color} opacity="0.5" />
    <circle cx="14" cy="18" r="3" fill={color} opacity="0.7" />
    <circle cx="26" cy="4" r="3" fill={color} />
  </g>
)

const ChainReactionIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="8" cy="16" r="4" fill={color} opacity="0.5" />
    <circle cx="16" cy="16" r="5" fill={color} opacity="0.7" />
    <circle cx="24" cy="16" r="6" fill={color} />
    <line x1="12" y1="16" x2="18" y2="16" stroke={color} strokeWidth="2" />
    <line x1="21" y1="16" x2="27" y2="16" stroke={color} strokeWidth="2" />
  </g>
)

const CosmicJadeIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 28,16 16,28 4,16" fill={color} />
    <polygon points="16,8 24,16 16,24 8,16" fill="#1C3A2E" opacity="0.3" />
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <circle
        key={i}
        cx={16 + 14 * Math.cos((angle * Math.PI) / 180)}
        cy={16 + 14 * Math.sin((angle * Math.PI) / 180)}
        r="1.5"
        fill={color}
        opacity="0.6"
      />
    ))}
  </g>
)

const SolarBannerIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="4" width="4" height="24" fill={color} opacity="0.5" />
    <polygon points="4,4 18,4 18,18 11,14 4,18" fill={color} />
    <circle cx="22" cy="10" r="6" fill={color} opacity="0.8" />
    <circle cx="22" cy="10" r="3" fill="#1C3A2E" opacity="0.3" />
  </g>
)

const UniversalGripIcon: IconFn = ({ color }) => (
  <g>
    <path d="M4 22 L4 12 Q4 6 10 6 L10 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M12 22 L12 4 Q12 2 14 2 Q16 2 16 4 L16 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M18 22 L18 4 Q18 2 20 2 Q22 2 22 4 L22 22" stroke={color} strokeWidth="2" fill="none" />
    <path d="M24 22 L24 6 Q24 4 26 4 Q28 4 28 6 L28 22" stroke={color} strokeWidth="2" fill="none" />
    <rect x="2" y="22" width="28" height="6" rx="2" fill={color} />
    <polygon points="16,8 20,2 12,2" fill={color} />
  </g>
)

// =============================================================================
// MYTHIC DECREE ICONS (15)
// =============================================================================

const HeavenlyOrdinanceIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
    <polygon points="16,2 20,12 30,14 22,22 24,32 16,26 8,32 10,22 2,14 12,12" fill={color} />
    <polygon points="16,8 18,14 24,15 19,19 20,25 16,22 12,25 13,19 8,15 14,14" fill="white" opacity="0.3" />
  </g>
)

const CelestialThroneIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="16" width="16" height="12" rx="2" fill={color} />
    <rect x="6" y="12" width="20" height="6" rx="1" fill={color} opacity="0.8" />
    <path d="M10 12 L10 6 Q10 4 12 4 L20 4 Q22 4 22 6 L22 12" fill={color} opacity="0.6" />
    <polygon points="16,2 18,4 14,4" fill={color} />
  </g>
)

const InfiniteLoopIcon: IconFn = ({ color }) => (
  <g>
    <path d="M10 16 Q10 10 16 10 Q22 10 22 16 Q22 22 16 22 Q10 22 10 16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M6 16 Q6 6 16 6 Q26 6 26 16 Q26 26 16 26 Q6 26 6 16" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </g>
)

const WorldTreeIcon: IconFn = ({ color }) => (
  <g>
    <rect x="14" y="16" width="4" height="12" fill={color} opacity="0.7" />
    <circle cx="16" cy="12" r="8" fill={color} opacity="0.5" />
    <circle cx="12" cy="8" r="4" fill={color} />
    <circle cx="20" cy="8" r="4" fill={color} />
    <circle cx="16" cy="4" r="3" fill={color} />
    <circle cx="10" cy="14" r="3" fill={color} opacity="0.8" />
    <circle cx="22" cy="14" r="3" fill={color} opacity="0.8" />
  </g>
)

const OmegaIcon: IconFn = ({ color }) => (
  <g>
    <path d="M8 24 L8 18 Q8 8 16 8 Q24 8 24 18 L24 24" stroke={color} strokeWidth="3" fill="none" />
    <line x1="4" y1="24" x2="12" y2="24" stroke={color} strokeWidth="3" />
    <line x1="20" y1="24" x2="28" y2="24" stroke={color} strokeWidth="3" />
  </g>
)

const RealityWarpIcon: IconFn = ({ color }) => (
  <g>
    <rect x="8" y="8" width="16" height="16" stroke={color} strokeWidth="2" fill="none" transform="rotate(45 16 16)" />
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="2" fill={color} />
    <line x1="16" y1="4" x2="16" y2="10" stroke={color} strokeWidth="1" />
    <line x1="16" y1="22" x2="16" y2="28" stroke={color} strokeWidth="1" />
    <line x1="4" y1="16" x2="10" y2="16" stroke={color} strokeWidth="1" />
    <line x1="22" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1" />
  </g>
)

const VoidEmperorIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" fill={color} opacity="0.2" />
    <circle cx="16" cy="16" r="8" fill={color} opacity="0.4" />
    <circle cx="16" cy="16" r="4" fill={color} />
    <polygon points="16,2 18,6 14,6" fill={color} />
    <line x1="6" y1="6" x2="26" y2="26" stroke={color} strokeWidth="1" opacity="0.5" />
    <line x1="26" y1="6" x2="6" y2="26" stroke={color} strokeWidth="1" opacity="0.5" />
  </g>
)

const EchoDimensionIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
    <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
    <circle cx="16" cy="16" r="6" stroke={color} strokeWidth="2" fill="none" opacity="0.7" />
    <circle cx="16" cy="16" r="3" fill={color} />
    <text x="16" y="19" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1C3A2E">2x</text>
  </g>
)

const CloneArmyIcon: IconFn = ({ color }) => (
  <g>
    <rect x="4" y="8" width="6" height="16" rx="1" fill={color} />
    <rect x="11" y="8" width="6" height="16" rx="1" fill={color} opacity="0.85" />
    <rect x="18" y="8" width="6" height="16" rx="1" fill={color} opacity="0.7" />
    <rect x="25" y="8" width="6" height="16" rx="1" fill={color} opacity="0.55" />
  </g>
)

const PhilosophersStoneIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 28,16 16,28 4,16" fill={color} />
    <circle cx="16" cy="16" r="6" fill="#1C3A2E" opacity="0.3" />
    <polygon points="16,10 20,16 16,22 12,16" fill={color} />
  </g>
)

const DragonHoardIcon: IconFn = ({ color }) => (
  <g>
    <ellipse cx="16" cy="20" rx="12" ry="6" fill={color} opacity="0.5" />
    <circle cx="10" cy="18" r="4" fill={color} />
    <circle cx="10" cy="18" r="2" fill="#1C3A2E" />
    <circle cx="16" cy="16" r="5" fill={color} />
    <circle cx="16" cy="16" r="2" fill="#1C3A2E" />
    <circle cx="22" cy="18" r="4" fill={color} />
    <circle cx="22" cy="18" r="2" fill="#1C3A2E" />
    <path d="M12 10 Q16 4 20 10" stroke={color} strokeWidth="2" fill="none" />
  </g>
)

const YakuNexusIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 26,12 22,28 10,28 6,12" fill={color} opacity="0.5" />
    <polygon points="16,8 22,14 20,24 12,24 10,14" fill={color} />
    <text x="16" y="20" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1C3A2E">役</text>
    <circle cx="16" cy="6" r="2" fill={color} />
  </g>
)

const YakumanBlessingIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,2 20,10 28,12 22,18 24,26 16,22 8,26 10,18 4,12 12,10" fill={color} />
    <text x="16" y="16" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1C3A2E">役満</text>
    <circle cx="16" cy="4" r="2" fill={color} />
  </g>
)

const TimeMasterIcon: IconFn = ({ color }) => (
  <g>
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" fill="none" />
    <path d="M16 6 L16 16 L24 16" stroke={color} strokeWidth="3" fill="none" />
    <circle cx="16" cy="16" r="4" fill={color} />
    <polygon points="16,2 20,6 12,6" fill={color} />
    <polygon points="16,30 20,26 12,26" fill={color} />
  </g>
)

const ImmortalDecreeIcon: IconFn = ({ color }) => (
  <g>
    <polygon points="16,4 28,16 16,28 4,16" stroke={color} strokeWidth="2" fill="none" />
    <path d="M10 16 Q10 10 16 10 Q22 10 22 16 Q22 22 16 22 Q10 22 10 16" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="16" cy="16" r="3" fill={color} />
    <line x1="16" y1="6" x2="16" y2="10" stroke={color} strokeWidth="1" />
    <line x1="16" y1="22" x2="16" y2="26" stroke={color} strokeWidth="1" />
  </g>
)

// =============================================================================
// ICON REGISTRY
// =============================================================================

const DECREE_ICONS: Record<string, IconFn> = {
  // Common
  'decree-half-suited': HalfSuitedIcon,
  'decree-misty-jade': MistyJadeIcon,
  'decree-bamboo-scroll': BambooScrollIcon,
  'decree-jade-tablet': JadeTabletIcon,
  'decree-polished-stone': PolishedStoneIcon,
  'decree-gentle-breeze': GentleBreezeIcon,
  'decree-rising-sun': RisingSunIcon,
  'decree-lunar-glow': LunarGlowIcon,
  'decree-crimson-banner': CrimsonBannerIcon,
  'decree-golden-seal': GoldenSealIcon,
  'decree-manzu-master': ManzuMasterIcon,
  'decree-pinzu-perfectionist': PinzuPerfectionistIcon,
  'decree-souzu-scholar': SouzuScholarIcon,
  'decree-wind-walker': WindWalkerIcon,
  'decree-dragon-disciple': DragonDiscipleIcon,
  'decree-edge-runner': EdgeRunnerIcon,
  'decree-middle-way': MiddleWayIcon,
  'decree-green-fortune': GreenFortuneIcon,
  'decree-coin-collector': CoinCollectorIcon,
  'decree-merchants-favor': MerchantsFavorIcon,
  'decree-lucky-coin': LuckyCoinIcon,
  'decree-pair-lover': PairLoverIcon,
  'decree-sequence-seeker': SequenceSeekerIcon,
  'decree-triplet-tracker': TripletTrackerIcon,
  'decree-flower-friend': FlowerFriendIcon,
  'decree-seasonal-blessing': SeasonalBlessingIcon,
  'decree-wide-grip': WideGripIcon,
  'decree-second-chance': SecondChanceIcon,
  'decree-balanced-path': BalancedPathIcon,
  'decree-modest-fortune': ModestFortuneIcon,
  'decree-humble-power': HumblePowerIcon,
  'decree-one-mastery': OneMasteryIcon,
  'decree-nine-mastery': NineMasteryIcon,
  'decree-five-blessing': FiveBlessingIcon,
  'decree-spark': SparkIcon,
  'decree-ember': EmberIcon,
  'decree-riichi-devotee': RiichiDevoteeIcon,
  'decree-tanyao-tactician': TanyaoTacticianIcon,
  'decree-pinfu-purist': PinfuPuristIcon,

  // Uncommon
  'decree-manzu-emperor': ManzuEmperorIcon,
  'decree-pinzu-princess': PinzuPrincessIcon,
  'decree-souzu-sage': SouzuSageIcon,
  'decree-flush-fever': FlushFeverIcon,
  'decree-honor-guard': HonorGuardIcon,
  'decree-terminal-tide': TerminalTideIcon,
  'decree-straight-arrow': StraightArrowIcon,
  'decree-run-master': RunMasterIcon,
  'decree-triple-threat': TripleThreatIcon,
  'decree-triplet-thunder': TripletThunderIcon,
  'decree-echo-stone': EchoStoneIcon,
  'decree-mirror-shard': MirrorShardIcon,
  'decree-dragon-echo': DragonEchoIcon,
  'decree-wind-echo': WindEchoIcon,
  'decree-golden-ratio': GoldenRatioIcon,
  'decree-treasure-hunter': TreasureHunterIcon,
  'decree-tax-collector': TaxCollectorIcon,
  'decree-garden-keeper': GardenKeeperIcon,
  'decree-blossom-storm': BlossomStormIcon,
  'decree-seasonal-wind': SeasonalWindIcon,
  'decree-slow-burn': SlowBurnIcon,
  'decree-momentum': MomentumIcon,
  'decree-crescendo': CrescendoIcon,
  'decree-waste-not': WasteNotIcon,
  'decree-recycler': RecyclerIcon,
  'decree-yakuhai-zealot': YakuhaiZealotIcon,
  'decree-toitoi-titan': ToitoiTitanIcon,
  'decree-ittsu-initiate': IttsuInitiateIcon,
  'decree-chinitsu-champion': ChinitsuChampionIcon,
  'decree-veteran': VeteranIcon,
  'decree-experience': ExperienceIcon,
  'decree-greater-jade': GreaterJadeIcon,
  'decree-blazing-banner': BlazingBannerIcon,
  'decree-flame': FlameIcon,
  'decree-wind-dragon': WindDragonIcon,
  'decree-all-suits': AllSuitsIcon,
  'decree-bookends': BookendsIcon,
  'decree-expansive-grip': ExpansiveGripIcon,
  'decree-careful-player': CarefulPlayerIcon,

  // Rare
  'decree-inferno': InfernoIcon,
  'decree-supernova': SupernovaIcon,
  'decree-perfectionist': PerfectionistIcon,
  'decree-compound-interest': CompoundInterestIcon,
  'decree-triple-echo': TripleEchoIcon,
  'decree-blueprint': BlueprintIcon,
  'decree-photograph': PhotographIcon,
  'decree-phoenix': PhoenixIcon,
  'decree-wealth-engine': WealthEngineIcon,
  'decree-perpetual-motion': PerpetualMotionIcon,
  'decree-terminal-resonance': TerminalResonanceIcon,
  'decree-honor-resonance': HonorResonanceIcon,
  'decree-manzu-monarch': ManzuMonarchIcon,
  'decree-pinzu-potentate': PinzuPotentateIcon,
  'decree-souzu-sovereign': SouzuSovereignIcon,
  'decree-flower-emperor': FlowerEmperorIcon,
  'decree-season-lord': SeasonLordIcon,
  'decree-nature-bond': NatureBondIcon,
  'decree-honitsu-herald': HonitsuHeraldIcon,
  'decree-sanshoku-sage': SanshokuSageIcon,
  'decree-chanta-champion': ChantaChampionIcon,
  'decree-mandate-breaker': MandateBreakerIcon,
  'decree-boss-slayer': BossSlayerIcon,
  'decree-fortune-and-glory': FortuneAndGloryIcon,
  'decree-emperors-blessing': EmperorsBlessingIcon,
  'decree-golden-age': GoldenAgeIcon,
  'decree-ancient-scroll': AncientScrollIcon,
  'decree-sacrifice': SacrificeIcon,
  'decree-transmuter': TransmuterIcon,
  'decree-harmonizer': HarmonizerIcon,
  'decree-final-act': FinalActIcon,
  'decree-endless-journey': EndlessJourneyIcon,
  'decree-master-grip': MasterGripIcon,
  'decree-infinite-patience': InfinitePatienceIcon,

  // Legendary
  'decree-divine-flame': DivineFlameIcon,
  'decree-heavens-wrath': HeavensWrathIcon,
  'decree-eternal-echo': EternalEchoIcon,
  'decree-dragon-king': DragonKingIcon,
  'decree-midas-touch': MidasTouchIcon,
  'decree-glass-cannon': GlassCannonIcon,
  'decree-void-blessing': VoidBlessingIcon,
  'decree-yaku-amplifier': YakuAmplifierIcon,
  'decree-yakuman-seeker': YakumanSeekerIcon,
  'decree-four-seasons-master': FourSeasonsMasterIcon,
  'decree-eternal-garden': EternalGardenIcon,
  'decree-infinite-wealth': InfiniteWealthIcon,
  'decree-brainstorm': BrainstormIcon,
  'decree-doppelganger': DoppelgangerIcon,
  'decree-manzu-god': ManzuGodIcon,
  'decree-pinzu-god': PinzuGodIcon,
  'decree-souzu-god': SouzuGodIcon,
  'decree-time-lord': TimeLordIcon,
  'decree-exponential': ExponentialIcon,
  'decree-chain-reaction': ChainReactionIcon,
  'decree-cosmic-jade': CosmicJadeIcon,
  'decree-solar-banner': SolarBannerIcon,
  'decree-universal-grip': UniversalGripIcon,

  // Mythic
  'decree-heavenly-ordinance': HeavenlyOrdinanceIcon,
  'decree-celestial-throne': CelestialThroneIcon,
  'decree-infinite-loop': InfiniteLoopIcon,
  'decree-world-tree': WorldTreeIcon,
  'decree-omega': OmegaIcon,
  'decree-reality-warp': RealityWarpIcon,
  'decree-void-emperor': VoidEmperorIcon,
  'decree-echo-dimension': EchoDimensionIcon,
  'decree-clone-army': CloneArmyIcon,
  'decree-philosophers-stone': PhilosophersStoneIcon,
  'decree-dragon-hoard': DragonHoardIcon,
  'decree-yaku-nexus': YakuNexusIcon,
  'decree-yakuman-blessing': YakumanBlessingIcon,
  'decree-time-master': TimeMasterIcon,
  'decree-immortal-decree': ImmortalDecreeIcon,
}

export default DecreeUniqueIcon
