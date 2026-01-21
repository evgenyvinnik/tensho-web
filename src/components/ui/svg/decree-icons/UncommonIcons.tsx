/**
 * Uncommon Decree Icons (40 icons)
 * Regional Mandate rarity - Enhanced decree icons
 */

import type { IconFn, DecreeIconMap } from './types'

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

/** Uncommon decree icon mappings */
export const UNCOMMON_ICONS: DecreeIconMap = {
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
}
