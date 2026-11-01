import { useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { OwnedDecree } from '../../systems/types'
import { DecreeCapacityNotice } from '../gameplay/DecreeCapacityNotice'
import type { YakuRepetitionHistory } from '../ui/YakuRepetitionDetails'
import { SellableDecrees } from './SellableDecrees'
import { DecreeBuildGuide } from './DecreeBuildGuide'

interface Props {
  yakuHistory?: YakuRepetitionHistory
  completeConcealedHandsPlayed?: number
  decrees: OwnedDecree[]
  maxSlots: number
  onSell: (instanceId: string) => { success: boolean }
  /** Compact run trackers shown at the end of the heading row. */
  aside?: ReactNode
  /** The run's Yaku upgrades, on the Decrees' line at its right end. */
  upgrades?: ReactNode
}

/**
 * The player's actual ordered build, not a predicted shopping
 * recommendation: owned Decrees on the left and, on the same line, the
 * run's Yaku upgrades on the right. On a phone each side is a three-column
 * grid, side by side where the panel is wide enough and stacked where it is
 * not; wider screens let each side wrap within its own column. Either way
 * the whole build shows without opening anything. The synergy guide is
 * hidden on phone-width screens, where it costs too much of the Tea House;
 * the Codex keeps the same guide under Decrees.
 */
export function ShopBuildPanel({
  decrees,
  maxSlots,
  onSell,
  yakuHistory,
  completeConcealedHandsPlayed,
  aside,
  upgrades,
}: Props) {
  const { t, i18n } = useTranslation()
  const titleId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)

  return (
    <section
      data-shop-build
      aria-labelledby={titleId}
      className="mx-3 mt-2 min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)]/85 p-3 sm:mx-5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="min-w-0 flex-1 break-words text-base font-bold text-[var(--color-golden-yellow)] focus-visible:outline focus-visible:outline-2 sm:text-lg"
        >
          {t('shop.build.title')}
        </h2>
        {aside && <div className="ml-auto shrink-0">{aside}</div>}
      </div>
      <DecreeCapacityNotice owned={decrees.length} slots={maxSlots} />
      <div
        data-shop-build-row
        className="shop-build-row mt-1 flex items-start gap-3"
      >
        <div data-shop-build-content className="min-w-0 flex-[1_1_auto]">
          <p
            data-build-slots
            className="text-xs font-semibold uppercase tracking-wider text-[var(--color-beige-white)]/60"
          >
            {t('shop.build.slots', {
              used: number(decrees.length),
              max: number(maxSlots),
            })}
          </p>
          <SellableDecrees
            decrees={decrees}
            onSell={onSell}
            // A stable focus return target survives removal of the sold card
            // and the transient detail popover that launched confirmation.
            focusTarget={titleRef}
            yakuHistory={yakuHistory}
            completeConcealedHandsPlayed={completeConcealedHandsPlayed}
            tutorialTarget="decrees"
            grid
            empty={
              <p className="mt-1 text-sm text-[var(--color-beige-white)]/60">
                {t('shop.build.empty')}
              </p>
            }
          />
        </div>
        {upgrades && (
          <div
            data-shop-build-upgrades
            className="min-w-0 flex-[0_1_auto] border-[var(--color-metallic-gold)]/25 sm:border-l sm:pl-3"
          >
            {upgrades}
          </div>
        )}
      </div>
      <div data-shop-build-guide className="hidden sm:block">
        <DecreeBuildGuide />
      </div>
    </section>
  )
}
