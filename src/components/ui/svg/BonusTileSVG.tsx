/**
 * Bonus Tile SVG Components
 *
 * Procedural SVG graphics for bonus tiles:
 * - Flowers (Plum, Orchid, Chrysanthemum, Bamboo)
 * - Seasons (Spring, Summer, Autumn, Winter)
 */


/**
 * Flower color palettes
 */
const FLOWER_COLORS = {
  plum: { primary: '#DB7093', secondary: '#FFB6C1', accent: '#8B0A50', bg: '#FFF0F5' },
  orchid: { primary: '#9932CC', secondary: '#DA70D6', accent: '#4B0082', bg: '#F8F4FF' },
  chrysanthemum: { primary: '#FFD700', secondary: '#FFFACD', accent: '#B8860B', bg: '#FFFEF0' },
  bamboo: { primary: '#228B22', secondary: '#90EE90', accent: '#006400', bg: '#F0FFF0' },
} as const

/**
 * Season color palettes
 */
const SEASON_COLORS = {
  spring: { primary: '#98FB98', secondary: '#00FF7F', accent: '#2E8B57', bg: '#F0FFF0' },
  summer: { primary: '#FF6347', secondary: '#FF7F50', accent: '#DC143C', bg: '#FFF5EE' },
  autumn: { primary: '#D2691E', secondary: '#F4A460', accent: '#8B4513', bg: '#FAEBD7' },
  winter: { primary: '#87CEEB', secondary: '#E0FFFF', accent: '#4682B4', bg: '#F0FFFF' },
} as const

export type FlowerVariant = keyof typeof FLOWER_COLORS
export type SeasonVariant = keyof typeof SEASON_COLORS

export interface FlowerSVGProps {
  variant: FlowerVariant
  size?: number
  animated?: boolean
  className?: string
}

/**
 * FlowerSVG - Procedural flower tile visualization
 */
export function FlowerSVG({
  variant,
  size = 64,
  animated = false,
  className = '',
}: FlowerSVGProps) {
  const colors = FLOWER_COLORS[variant]

  const renderFlower = () => {
    switch (variant) {
      case 'plum':
        return (
          <g>
            {/* Plum blossom - 5 petals */}
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <ellipse
                key={i}
                cx={32 + Math.cos((angle * Math.PI) / 180) * 12}
                cy={32 + Math.sin((angle * Math.PI) / 180) * 12}
                rx="8"
                ry="10"
                fill={colors.primary}
                stroke={colors.accent}
                strokeWidth="1"
                transform={`rotate(${angle + 90} ${32 + Math.cos((angle * Math.PI) / 180) * 12} ${32 + Math.sin((angle * Math.PI) / 180) * 12})`}
              />
            ))}
            {/* Center */}
            <circle cx="32" cy="32" r="6" fill={colors.secondary} />
            <circle cx="32" cy="32" r="3" fill={colors.accent} />
            {/* Stamens */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <circle
                key={`stamen-${i}`}
                cx={32 + Math.cos((angle * Math.PI) / 180) * 4}
                cy={32 + Math.sin((angle * Math.PI) / 180) * 4}
                r="1"
                fill={colors.accent}
              />
            ))}
          </g>
        )

      case 'orchid':
        return (
          <g>
            {/* Orchid - elegant curved petals */}
            <path
              d="M32 12 C40 20 44 28 32 32 C20 28 24 20 32 12"
              fill={colors.primary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            <path
              d="M32 52 C40 44 44 36 32 32 C20 36 24 44 32 52"
              fill={colors.primary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            <path
              d="M12 32 C20 24 28 20 32 32 C28 44 20 40 12 32"
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            <path
              d="M52 32 C44 24 36 20 32 32 C36 44 44 40 52 32"
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            {/* Center column */}
            <ellipse cx="32" cy="32" rx="4" ry="6" fill={colors.accent} />
            <circle cx="32" cy="29" r="2" fill={colors.secondary} />
          </g>
        )

      case 'chrysanthemum':
        return (
          <g>
            {/* Many thin petals radiating out */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180
              const length = i % 2 === 0 ? 16 : 12
              return (
                <ellipse
                  key={i}
                  cx={32 + Math.cos(angle) * length * 0.5}
                  cy={32 + Math.sin(angle) * length * 0.5}
                  rx="2"
                  ry={length / 2}
                  fill={i % 2 === 0 ? colors.primary : colors.secondary}
                  transform={`rotate(${i * 15} ${32 + Math.cos(angle) * length * 0.5} ${32 + Math.sin(angle) * length * 0.5})`}
                />
              )
            })}
            {/* Center */}
            <circle cx="32" cy="32" r="6" fill={colors.accent} />
            <circle cx="32" cy="32" r="3" fill={colors.secondary} />
          </g>
        )

      case 'bamboo':
        return (
          <g>
            {/* Bamboo stalk */}
            <rect x="28" y="10" width="8" height="44" rx="2" fill={colors.primary} stroke={colors.accent} strokeWidth="1" />
            {/* Nodes */}
            <rect x="26" y="20" width="12" height="3" rx="1" fill={colors.accent} />
            <rect x="26" y="35" width="12" height="3" rx="1" fill={colors.accent} />
            {/* Leaves */}
            <path
              d="M38 22 Q48 16 52 20 Q48 24 38 22"
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="0.5"
            />
            <path
              d="M26 30 Q16 24 12 28 Q16 32 26 30"
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="0.5"
            />
            <path
              d="M38 40 Q50 36 54 42 Q48 46 38 40"
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="0.5"
            />
          </g>
        )

      default:
        return <circle cx="32" cy="32" r="20" fill={colors.primary} />
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      <defs>
        <radialGradient id={`flower-glow-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.4" />
          <stop offset="100%"stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#flower-glow-${variant})`} />

      {/* Render specific flower */}
      {renderFlower()}

      {/* Animated sparkle */}
      {animated && (
        <g>
          {[0, 120, 240].map((angle, i) => (
            <circle
              key={i}
              cx={32 + Math.cos((angle * Math.PI) / 180) * 26}
              cy={32 + Math.sin((angle * Math.PI) / 180) * 26}
              r="2"
              fill="white"
            >
              <animate
                attributeName="opacity"
                values="0.2;1;0.2"
                dur={`${1.5 + i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}
    </svg>
  )
}

export interface SeasonSVGProps {
  variant: SeasonVariant
  size?: number
  animated?: boolean
  className?: string
}

/**
 * SeasonSVG - Procedural season tile visualization
 */
export function SeasonSVG({
  variant,
  size = 64,
  animated = false,
  className = '',
}: SeasonSVGProps) {
  const colors = SEASON_COLORS[variant]

  const renderSeason = () => {
    switch (variant) {
      case 'spring':
        return (
          <g>
            {/* Sprouting plants */}
            <path
              d="M32 50 Q32 35 32 28"
              fill="none"
              stroke={colors.accent}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Leaves */}
            <path
              d="M32 35 Q20 30 24 22 Q28 28 32 35"
              fill={colors.primary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            <path
              d="M32 28 Q44 24 40 16 Q36 22 32 28"
              fill={colors.secondary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            {/* Small flower bud */}
            <circle cx="32" cy="22" r="4" fill={colors.secondary} />
            <circle cx="32" cy="22" r="2" fill="white" />
            {/* Butterflies */}
            <g transform="translate(48, 20)">
              <path d="M0 0 Q-4 -4 0 -6 Q4 -4 0 0" fill={colors.primary} />
              <path d="M0 0 Q-4 4 0 6 Q4 4 0 0" fill={colors.secondary} />
              <circle cx="0" cy="0" r="1" fill={colors.accent} />
            </g>
          </g>
        )

      case 'summer':
        return (
          <g>
            {/* Sun */}
            <circle cx="32" cy="28" r="12" fill={colors.primary} />
            {/* Sun rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1={32 + Math.cos((angle * Math.PI) / 180) * 14}
                y1={28 + Math.sin((angle * Math.PI) / 180) * 14}
                x2={32 + Math.cos((angle * Math.PI) / 180) * 20}
                y2={28 + Math.sin((angle * Math.PI) / 180) * 20}
                stroke={colors.secondary}
                strokeWidth="3"
                strokeLinecap="round"
              />
            ))}
            {/* Heat waves */}
            <path
              d="M16 48 Q22 44 28 48 Q34 52 40 48 Q46 44 52 48"
              fill="none"
              stroke={colors.secondary}
              strokeWidth="2"
              opacity="0.6"
            />
            <path
              d="M12 54 Q18 50 24 54 Q30 58 36 54 Q42 50 48 54"
              fill="none"
              stroke={colors.secondary}
              strokeWidth="2"
              opacity="0.4"
            />
          </g>
        )

      case 'autumn':
        return (
          <g>
            {/* Falling maple leaf */}
            <path
              d="M32 12 L28 20 L18 18 L24 26 L14 32 L24 34 L20 44 L32 38 L44 44 L40 34 L50 32 L40 26 L46 18 L36 20 Z"
              fill={colors.primary}
              stroke={colors.accent}
              strokeWidth="1"
            />
            {/* Leaf veins */}
            <path d="M32 12 L32 38" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.5" />
            <path d="M32 26 L24 26" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.5" />
            <path d="M32 26 L40 26" fill="none" stroke={colors.accent} strokeWidth="1" opacity="0.5" />
            {/* Small falling leaves */}
            <path
              d="M50 48 L48 52 L44 50 L48 54 Z"
              fill={colors.secondary}
              transform="rotate(30 48 52)"
            />
            <path
              d="M18 50 L16 54 L12 52 L16 56 Z"
              fill={colors.secondary}
              transform="rotate(-20 16 54)"
            />
          </g>
        )

      case 'winter':
        return (
          <g>
            {/* Snowflake */}
            {[0, 60, 120].map((angle, i) => (
              <g key={i} transform={`rotate(${angle} 32 32)`}>
                <line x1="32" y1="12" x2="32" y2="52" stroke={colors.primary} strokeWidth="3" />
                {/* Branch */}
                <line x1="32" y1="18" x2="26" y2="14" stroke={colors.primary} strokeWidth="2" />
                <line x1="32" y1="18" x2="38" y2="14" stroke={colors.primary} strokeWidth="2" />
                <line x1="32" y1="46" x2="26" y2="50" stroke={colors.primary} strokeWidth="2" />
                <line x1="32" y1="46" x2="38" y2="50" stroke={colors.primary} strokeWidth="2" />
              </g>
            ))}
            {/* Center crystal */}
            <circle cx="32" cy="32" r="4" fill={colors.secondary} stroke={colors.accent} strokeWidth="1" />
            {/* Snow particles */}
            <circle cx="18" cy="20" r="2" fill="white" opacity="0.8" />
            <circle cx="48" cy="44" r="2" fill="white" opacity="0.8" />
            <circle cx="14" cy="40" r="1.5" fill="white" opacity="0.6" />
            <circle cx="50" cy="24" r="1.5" fill="white" opacity="0.6" />
          </g>
        )

      default:
        return <circle cx="32" cy="32" r="20" fill={colors.primary} />
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      <defs>
        <radialGradient id={`season-glow-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#season-glow-${variant})`} />

      {/* Render specific season */}
      {renderSeason()}

      {/* Animated element based on season */}
      {animated && variant === 'winter' && (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx={12 + i * 10}
              cy="10"
              r="1.5"
              fill="white"
            >
              <animate
                attributeName="cy"
                values="10;54"
                dur={`${2 + i * 0.4}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur={`${2 + i * 0.4}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}
      {animated && variant === 'autumn' && (
        <g>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d="M0 0 L-2 4 L-4 2 L-2 6 Z"
              fill={colors.secondary}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`${54 - i * 16} 0; ${20 - i * 8} 56`}
                dur={`${3 + i * 0.5}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                dur={`${3 + i * 0.5}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}
        </g>
      )}
    </svg>
  )
}

export default { FlowerSVG, SeasonSVG }
