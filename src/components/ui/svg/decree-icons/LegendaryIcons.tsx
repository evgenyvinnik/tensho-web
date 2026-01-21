/**
 * Legendary Decree Icons (25 icons)
 * Heavenly Ordinance rarity - Epic decree icons
 */

import type { IconFn, DecreeIconMap } from './types'

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

/** Legendary decree icon mappings */
export const LEGENDARY_ICONS: DecreeIconMap = {
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
}
