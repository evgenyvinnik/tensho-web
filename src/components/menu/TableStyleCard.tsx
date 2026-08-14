/**
 * Illustrated table-style option used by the run setup modal.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { animated, useSpring } from '@react-spring/web'
import type { TableStyleDefinition } from '../../config/tableStyleDefinitions'
import { getCurrentLanguage } from '../../i18n'
import { getTableStyleIllustration } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'

const AnimatedButton = animated('button')

function isCJKLanguage(): boolean {
  const lang = getCurrentLanguage()
  return (
    lang === 'ja' || lang === 'ko' || lang === 'zh-Hant' || lang === 'zh-Hans'
  )
}

export interface TableStyleCardProps {
  style: TableStyleDefinition
  isUnlocked: boolean
  isSelected: boolean
  unlockProgress?: number
  onClick: () => void
  delay?: number
}

export function TableStyleCard({
  style,
  isUnlocked,
  isSelected,
  unlockProgress = 0,
  onClick,
  delay = 0,
}: TableStyleCardProps) {
  const itemText = useItemText()
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = React.useState(false)
  const artwork = getTableStyleIllustration(style.id)
  const localizedName = itemText.name('tableStyles', {
    ...style,
    name: style.displayName,
  })
  const localizedDescription = itemText.description('tableStyles', {
    ...style,
    name: style.displayName,
  })
  const localizedTheme = t(`tableStyles.items.${style.id}.theme`, style.theme)
  const localizedUnlock = t(
    `tableStyles.items.${style.id}.unlock`,
    style.unlockCondition.description
  )
  const modifierText = (index: number, authoredText: string) =>
    t(`tableStyles.items.${style.id}.modifiers.${index}`, authoredText)
  const benefits = style.startingModifiers.filter(
    (modifier) => modifier.isBenefit && modifier.type !== 'none'
  )
  const detriments = style.startingModifiers.filter(
    (modifier) => !modifier.isBenefit
  )

  const spring = useSpring({
    from: { opacity: 0, transform: 'translateY(18px) scale(0.96)' },
    to: {
      opacity: 1,
      transform:
        isHovered && isUnlocked
          ? 'translateY(-3px) scale(1.015)'
          : 'translateY(0px) scale(1)',
    },
    delay,
    config: { tension: 300, friction: 22 },
  })

  return (
    <AnimatedButton
      type="button"
      disabled={!isUnlocked}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isUnlocked ? isSelected : undefined}
      aria-label={
        isUnlocked
          ? t('tableStyle.optionLabel', '{{name}}, {{theme}} table', {
              name: localizedName,
              theme: localizedTheme,
            })
          : t(
              'tableStyle.lockedOptionLabel',
              '{{name}}, locked: {{requirement}}',
              { name: localizedName, requirement: localizedUnlock }
            )
      }
      data-table-style-card={style.id}
      className={`relative h-auto w-full self-start overflow-hidden rounded-xl border-2 bg-[var(--color-dark-forest)] text-left shadow-lg transition-[border-color,box-shadow,filter] duration-200 ${
        isSelected && isUnlocked
          ? 'border-[var(--color-golden-yellow)] ring-2 ring-[var(--color-golden-yellow)]/70'
          : 'border-[var(--color-saddle-brown)]'
      } ${
        isUnlocked
          ? 'cursor-pointer hover:border-[var(--color-metallic-gold)] hover:shadow-2xl'
          : 'cursor-not-allowed grayscale-[35%]'
      }`}
      style={{
        ...spring,
        boxShadow:
          isSelected && isUnlocked
            ? `0 0 22px ${style.themeColor}70`
            : isHovered && isUnlocked
              ? `0 12px 28px rgba(0,0,0,.42), 0 0 18px ${style.themeColor}35`
              : '0 8px 20px rgba(0,0,0,.28)',
      }}
    >
      <div className="relative aspect-[16/7] min-h-[108px] overflow-hidden bg-black">
        <img
          src={artwork}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover transition duration-500 ${
            isHovered && isUnlocked ? 'scale-[1.045]' : 'scale-100'
          } ${isUnlocked ? 'brightness-90' : 'brightness-[.42] grayscale'}`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark-forest)] via-transparent to-black/25"
        />
        <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-sm">
          {localizedTheme}
        </div>

        <div className="absolute right-3 top-3 flex min-h-8 min-w-8 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white shadow-lg backdrop-blur-sm">
          {isUnlocked ? (
            isSelected ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            ) : (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: style.themeColor }}
              />
            )
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2Z" />
            </svg>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-3">
          <h3 className="min-w-0 text-lg font-bold leading-tight text-white drop-shadow-lg sm:text-xl">
            {localizedName}
          </h3>
          {isCJKLanguage() && (
            <span className="shrink-0 font-decorative text-lg text-[var(--color-golden-yellow)] drop-shadow-lg">
              {style.japaneseName}
            </span>
          )}
        </div>
      </div>

      <div className="px-3.5 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
        <p
          data-table-description
          className="mb-3 break-words text-xs leading-relaxed text-[var(--color-beige-white)]/75 sm:text-[13px]"
        >
          {localizedDescription}
        </p>

        <div className="space-y-1.5">
          {benefits.map((modifier) => {
            const modifierIndex = style.startingModifiers.indexOf(modifier)
            return (
              <div
                key={`${modifier.type}-${modifier.description}`}
                className="flex items-start gap-2 text-xs sm:text-sm"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 font-black text-emerald-300">
                  +
                </span>
                <span className="min-w-0 break-words text-emerald-200/90">
                  {modifierText(modifierIndex, modifier.description)}
                </span>
              </div>
            )
          })}

          {detriments.map((modifier) => {
            const modifierIndex = style.startingModifiers.indexOf(modifier)
            return (
              <div
                key={`${modifier.type}-${modifier.description}`}
                className="flex items-start gap-2 text-xs sm:text-sm"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-400/15 font-black text-rose-300">
                  −
                </span>
                <span className="min-w-0 break-words text-rose-200/90">
                  {modifierText(modifierIndex, modifier.description)}
                </span>
              </div>
            )
          })}

          {benefits.length === 0 && detriments.length === 0 && (
            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-metallic-gold)]/15 text-[var(--color-golden-yellow)]">
                •
              </span>
              <span className="text-[var(--color-beige-white)]/70">
                {t('menu.noSpecialModifiers', 'No special modifiers')}
              </span>
            </div>
          )}
        </div>

        {!isUnlocked && (
          <div className="mt-3 border-t border-[var(--color-saddle-brown)]/70 pt-3">
            <p className="text-xs font-semibold text-[var(--color-metallic-gold)]">
              {t('tableStyle.unlock', 'Unlock: {{requirement}}', {
                requirement: localizedUnlock,
              })}
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full border border-white/10 bg-black/35"
              role="progressbar"
              aria-label={t(
                'tableStyle.unlockProgress',
                'Progress toward {{name}}',
                { name: localizedName }
              )}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(unlockProgress * 100)}
            >
              <div
                className="h-full rounded-full bg-[var(--color-golden-yellow)] transition-[width] duration-500"
                style={{
                  width: `${Math.max(0, Math.min(1, unlockProgress)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AnimatedButton>
  )
}

export default TableStyleCard
