/**
 * TableStyleButton Component
 *
 * Button for the menu screen that shows the currently selected table style
 * and opens the table style selection modal when clicked.
 */

import { useState } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { useTranslation } from 'react-i18next'
import { TableStyleModal } from './TableStyleModal'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import { useStakeStore } from '../../stores/stakeStore'
import { getStakeByTier } from '../../config/stakeDefinitions'

const AnimatedButton = animated('button')

export interface TableStyleButtonProps {
  /** Animation delay for entrance */
  delay?: number
  /** Whether to show the button */
  show?: boolean
}

/**
 * TableStyleButton - Shows current table style and opens selection modal
 */
export function TableStyleButton({ delay = 0, show = true }: TableStyleButtonProps) {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const { getCurrentStyle } = useTableStyleStore()
  const currentStyle = getCurrentStyle()
  const currentStakeTier = useStakeStore((state) =>
    state.currentWallId === currentStyle.id ? state.currentStakeTier : 1
  )
  const currentStake = getStakeByTier(currentStakeTier)

  const spring = useSpring({
    from: { opacity: 0, scale: 0.8, y: 30 },
    to: {
      opacity: show ? 1 : 0,
      scale: show ? (isPressed ? 0.95 : isHovered ? 1.05 : 1) : 0.8,
      y: show ? 0 : 30,
    },
    config: { tension: 200, friction: 15 },
    delay: show ? delay : 0,
  })

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <AnimatedButton
        onClick={handleOpenModal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsPressed(false)
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        className="
          relative flex w-full items-center justify-center gap-3 px-4 py-3 rounded-lg
          font-ui font-bold text-base md:text-lg
          text-[var(--color-beige-white)]
          border-2 border-[var(--color-metallic-gold)]
          transition-colors duration-200
          bg-[var(--color-forest-green)]
          hover:border-[var(--color-golden-yellow)]
        "
        style={{
          opacity: spring.opacity,
          transform: spring.scale.to(
            (s) => `scale(${s}) translateY(${spring.y.get()}px)`
          ),
          boxShadow: isHovered
            ? `0 0 20px ${currentStyle.themeColor}60, 0 0 40px rgba(0,0,0,0.3)`
            : `0 0 10px rgba(0,0,0,0.3)`,
        }}
        aria-label={t('tableStyle.chooseTable', 'Choose table and stake')}
      >
        {/* Color swatch showing current style */}
        <div
          className="w-8 h-8 rounded-lg flex-shrink-0 border-2 border-white/30"
          style={{
            backgroundColor: currentStyle.themeColor,
            boxShadow: `inset 0 -2px 4px ${currentStyle.accentColor}`,
          }}
        />

        {/* Label and current style name */}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs text-[var(--color-metallic-gold)] uppercase tracking-wide">
            {t('tableStyle.table', 'Run setup')}
          </span>
          <span className="text-[var(--color-beige-white)]">
            {currentStyle.displayName}
          </span>
        </div>

        {/* Japanese name badge */}
        <span
          className="ml-2 text-lg font-decorative"
          style={{ color: currentStyle.themeColor }}
        >
          {currentStyle.japaneseName}
        </span>

        <span
          className="ml-1 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide"
          style={{
            color: currentStake?.color,
            borderColor: `${currentStake?.color ?? '#E0E0E0'}80`,
            backgroundColor: `${currentStake?.color ?? '#E0E0E0'}18`,
          }}
        >
          Stake {currentStakeTier}
        </span>

        {/* Chevron icon */}
        <svg
          className="w-5 h-5 ml-1 text-[var(--color-metallic-gold)]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>

        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 shimmer opacity-20" />
        </div>
      </AnimatedButton>

      {/* Selection modal */}
      <TableStyleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

export default TableStyleButton
