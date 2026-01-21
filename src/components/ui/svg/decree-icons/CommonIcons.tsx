/**
 * Common Decree Icons (40 icons)
 * Local Edict rarity - Basic decree icons
 */

import type { IconFn, DecreeIconMap } from './types'

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

/** Common decree icon mappings */
export const COMMON_ICONS: DecreeIconMap = {
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
}
