/**
 * Rare Decree Icons (35 icons)
 * Imperial Decree rarity - Powerful decree icons
 */

import type { IconFn, DecreeIconMap } from './types'

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

/** Rare decree icon mappings */
export const RARE_ICONS: DecreeIconMap = {
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
}
