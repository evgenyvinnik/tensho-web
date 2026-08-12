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
import { getTableStyleIllustration } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'

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
export function TableStyleButton({
  delay = 0,
  show = true,
}: TableStyleButtonProps) {
  const itemText = useItemText()
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
          relative flex min-h-[72px] w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 sm:px-4
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
        <img
          src={getTableStyleIllustration(currentStyle.id)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/75" />
        <div
          aria-hidden="true"
          className="relative h-10 w-1 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
          style={{
            color: currentStyle.themeColor,
            backgroundColor: currentStyle.themeColor,
          }}
        />

        {/* Label and current style name */}
        <div className="relative flex min-w-0 flex-1 flex-col items-start leading-tight">
          <span className="text-xs text-[var(--color-metallic-gold)] uppercase tracking-wide">
            {t('tableStyle.table', 'Run setup')}
          </span>
          <span className="max-w-full truncate text-[var(--color-beige-white)] drop-shadow-lg">
            {itemText.name('tableStyles', { ...currentStyle, name: currentStyle.displayName })}
          </span>
        </div>

        {/* Japanese name badge */}
        <span
          className="relative hidden shrink-0 text-lg font-decorative drop-shadow-lg sm:block"
          style={{ color: 'var(--color-golden-yellow)' }}
        >
          {currentStyle.japaneseName}
        </span>

        <span
          className="relative shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm"
          style={{
            color: currentStake?.color,
            borderColor: `${currentStake?.color ?? '#E0E0E0'}80`,
            backgroundColor: `${currentStake?.color ?? '#E0E0E0'}18`,
          }}
        >
          {t('gameplay.stake', 'Stake {{tier}}', { tier: currentStakeTier })}
        </span>

        {/* Chevron icon */}
        <svg
          className="relative h-5 w-5 shrink-0 text-[var(--color-metallic-gold)]"
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

        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute inset-0 shimmer opacity-20" />
        </div>
      </AnimatedButton>

      {/* Selection modal */}
      <TableStyleModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  )
}

export default TableStyleButton
