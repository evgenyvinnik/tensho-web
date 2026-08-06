/**
 * Consumable SVG Components
 *
 * Procedural SVG graphics for consumable items:
 * - Fate Seals (Tarot analog)
 * - Celestial Orbs (Planet analog)
 * - Void Scripts (Spectral analog)
 */


/**
 * Color palettes for consumables
 */
const SEAL_COLORS = {
  harmony: { primary: '#3B82F6', secondary: '#93C5FD', glow: 'rgba(59, 130, 246, 0.4)' },
  fortune: { primary: '#F59E0B', secondary: '#FCD34D', glow: 'rgba(245, 158, 11, 0.4)' },
  strength: { primary: '#EF4444', secondary: '#FCA5A5', glow: 'rgba(239, 68, 68, 0.4)' },
  wisdom: { primary: '#8B5CF6', secondary: '#C4B5FD', glow: 'rgba(139, 92, 246, 0.4)' },
  nature: { primary: '#10B981', secondary: '#6EE7B7', glow: 'rgba(16, 185, 129, 0.4)' },
  default: { primary: '#6B7280', secondary: '#D1D5DB', glow: 'rgba(107, 114, 128, 0.3)' },
} as const

const ORB_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  mercury: { primary: '#94A3B8', secondary: '#E2E8F0', glow: 'rgba(148, 163, 184, 0.5)' },
  venus: { primary: '#FCD34D', secondary: '#FEF3C7', glow: 'rgba(252, 211, 77, 0.5)' },
  earth: { primary: '#34D399', secondary: '#A7F3D0', glow: 'rgba(52, 211, 153, 0.5)' },
  mars: { primary: '#F87171', secondary: '#FECACA', glow: 'rgba(248, 113, 113, 0.5)' },
  jupiter: { primary: '#FB923C', secondary: '#FED7AA', glow: 'rgba(251, 146, 60, 0.5)' },
  saturn: { primary: '#A78BFA', secondary: '#DDD6FE', glow: 'rgba(167, 139, 250, 0.5)' },
  uranus: { primary: '#22D3EE', secondary: '#A5F3FC', glow: 'rgba(34, 211, 238, 0.5)' },
  neptune: { primary: '#60A5FA', secondary: '#BFDBFE', glow: 'rgba(96, 165, 250, 0.5)' },
  pluto: { primary: '#818CF8', secondary: '#C7D2FE', glow: 'rgba(129, 140, 248, 0.5)' },
  default: { primary: '#9CA3AF', secondary: '#E5E7EB', glow: 'rgba(156, 163, 175, 0.4)' },
} as const

export type SealVariant = keyof typeof SEAL_COLORS
export type OrbVariant = keyof typeof ORB_COLORS

export interface SealSVGProps {
  variant?: SealVariant
  size?: number
  animated?: boolean
  className?: string
}

/**
 * SealSVG - Fate Seal (Tarot) visualization
 */
export function SealSVG({
  variant = 'default',
  size = 64,
  animated = false,
  className = '',
}: SealSVGProps) {
  const colors = SEAL_COLORS[variant] || SEAL_COLORS.default

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      <defs>
        <radialGradient id={`seal-glow-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors.secondary} stopOpacity="0.6" />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`seal-bg-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.primary} />
        </linearGradient>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#seal-glow-${variant})`} />

      {/* Main seal body */}
      <circle
        cx="32"
        cy="32"
        r="24"
        fill={`url(#seal-bg-${variant})`}
        stroke={colors.primary}
        strokeWidth="2"
      />

      {/* Inner circle */}
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke={colors.secondary}
        strokeWidth="1"
        opacity="0.7"
      />

      {/* Mystical symbol - eight-pointed star */}
      <g transform="translate(32, 32)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1="0"
            y1="-6"
            x2="0"
            y2="-14"
            stroke="#1C3A2E"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle})`}
            opacity="0.8"
          />
        ))}
        <circle cx="0" cy="0" r="4" fill="#1C3A2E" opacity="0.6" />
      </g>

      {/* Animated pulse */}
      {animated && (
        <circle cx="32" cy="32" r="24" fill="none" stroke={colors.secondary} strokeWidth="1">
          <animate
            attributeName="r"
            values="24;28;24"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Corner decorations */}
      {[0, 90, 180, 270].map((angle) => (
        <circle
          key={angle}
          cx={32 + Math.cos((angle * Math.PI) / 180) * 20}
          cy={32 + Math.sin((angle * Math.PI) / 180) * 20}
          r="2"
          fill={colors.secondary}
        />
      ))}
    </svg>
  )
}

export interface OrbSVGProps {
  variant?: OrbVariant
  size?: number
  animated?: boolean
  className?: string
}

/**
 * OrbSVG - Celestial Orb (Planet) visualization
 */
export function OrbSVG({
  variant = 'default',
  size = 64,
  animated = false,
  className = '',
}: OrbSVGProps) {
  const colors = ORB_COLORS[variant] || ORB_COLORS.default

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      <defs>
        <radialGradient id={`orb-${variant}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="60%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.primary} stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id={`orb-glow-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={colors.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="orb-shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#orb-glow-${variant})`} />

      {/* Main sphere */}
      <circle
        cx="32"
        cy="32"
        r="22"
        fill={`url(#orb-${variant})`}
        filter="url(#orb-shadow)"
      />

      {/* Highlight */}
      <ellipse
        cx="26"
        cy="24"
        rx="6"
        ry="4"
        fill="white"
        opacity="0.4"
        transform="rotate(-30 26 24)"
      />

      {/* Small highlight */}
      <circle cx="22" cy="20" r="2" fill="white" opacity="0.6" />

      {/* Orbital ring for gas giants */}
      {(variant === 'saturn' || variant === 'jupiter') && (
        <ellipse
          cx="32"
          cy="32"
          rx="28"
          ry="8"
          fill="none"
          stroke={colors.secondary}
          strokeWidth="2"
          opacity="0.5"
          transform="rotate(-20 32 32)"
        />
      )}

      {/* Stars around */}
      {animated && (
        <g>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <circle
              key={i}
              cx={32 + Math.cos((angle * Math.PI) / 180) * 28}
              cy={32 + Math.sin((angle * Math.PI) / 180) * 28}
              r="1"
              fill="white"
            >
              <animate
                attributeName="opacity"
                values="0.2;1;0.2"
                dur={`${1 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}
    </svg>
  )
}

export interface ScriptSVGProps {
  size?: number
  corrupted?: boolean
  animated?: boolean
  className?: string
}

/**
 * ScriptSVG - Void Script (Spectral) visualization
 */
export function ScriptSVG({
  size = 64,
  corrupted = true,
  animated = false,
  className = '',
}: ScriptSVGProps) {
  const primaryColor = corrupted ? '#7C3AED' : '#3B82F6'
  const secondaryColor = corrupted ? '#A78BFA' : '#93C5FD'
  const glowColor = corrupted ? 'rgba(124, 58, 237, 0.5)' : 'rgba(59, 130, 246, 0.4)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
    >
      <defs>
        <linearGradient id={`script-bg-${corrupted}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0F0F1A" />
          <stop offset="100%" stopColor="#1A1A2E" />
        </linearGradient>
        <radialGradient id={`script-glow-${corrupted}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="script-blur">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>

      {/* Outer glow */}
      <circle cx="32" cy="32" r="30" fill={`url(#script-glow-${corrupted})`} />

      {/* Scroll background */}
      <rect
        x="12"
        y="8"
        width="40"
        height="48"
        rx="3"
        fill={`url(#script-bg-${corrupted})`}
        stroke={primaryColor}
        strokeWidth="2"
      />

      {/* Scroll rolls */}
      <ellipse cx="32" cy="10" rx="16" ry="4" fill={primaryColor} />
      <ellipse cx="32" cy="54" rx="16" ry="4" fill={primaryColor} />

      {/* Mystical writing lines */}
      <g opacity="0.7">
        <path
          d="M18 20 Q24 18 30 22 T42 20"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <path
          d="M18 28 Q26 32 34 28 T46 30"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <path
          d="M18 36 Q22 34 28 38 T40 36"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
        <path
          d="M18 44 Q30 48 42 44"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.5"
        />
      </g>

      {/* Central void symbol */}
      <circle
        cx="32"
        cy="32"
        r="8"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      <circle cx="32" cy="32" r="3" fill={secondaryColor} opacity="0.5" />

      {/* Corruption tendrils */}
      {corrupted && (
        <g filter="url(#script-blur)">
          <path
            d="M32 24 Q28 20 24 22 Q20 24 18 20"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="2"
            opacity="0.4"
          />
          <path
            d="M32 40 Q36 44 40 42 Q44 40 46 44"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="2"
            opacity="0.4"
          />
        </g>
      )}

      {/* Animated particles */}
      {animated && (
        <g>
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <circle
              key={i}
              cx={32 + Math.cos((angle * Math.PI) / 180) * 12}
              cy={32 + Math.sin((angle * Math.PI) / 180) * 12}
              r="1.5"
              fill={secondaryColor}
            >
              <animate
                attributeName="opacity"
                values="0;1;0"
                dur={`${1.5 + i * 0.3}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="1;2;1"
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

export default { SealSVG, OrbSVG, ScriptSVG }
