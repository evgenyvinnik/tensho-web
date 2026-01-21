/**
 * Mythic Decree Icons (15 icons)
 * Ultimate rarity - Most powerful decree icons
 */

import type { IconFn, DecreeIconMap } from './types'

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

/** Mythic decree icon mappings */
export const MYTHIC_ICONS: DecreeIconMap = {
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
