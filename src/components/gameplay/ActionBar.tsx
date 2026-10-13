/**
 * ActionBar: the two things you can do with your Turn.
 *
 *   Turns left 4        [ REDRAW ]  [ Play hand ]
 *
 * Play hand scores the selected tiles. REDRAW sends any number of selected
 * tiles to the river and draws replacements. Each spends one Turn (a free
 * redraw from an item is spent first, and shown on the button).
 *
 * The labels never change. When an action cannot be taken, the button is
 * disabled and one short reason is shown beside the counter and announced.
 *
 * @module components/gameplay/ActionBar
 */

import type { Ref } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'

export interface ActionBarProps {
  playButtonRef?: Ref<HTMLButtonElement>
  /** Turns left this round (Play and REDRAW share them). */
  turnsLeft: number
  /** Free redraws granted by items, spent before Turns. */
  freeRedraws: number
  /** Tiles currently selected. */
  selectedCount: number
  /** Authoritative legality of playing the selection. */
  playAllowed: boolean
  /** Authoritative legality of redrawing the selection. */
  redrawAllowed: boolean
  /** Why the selection cannot be played, when it cannot. */
  playReason?: string
  /** Why the selection cannot be redrawn, when it cannot. */
  redrawReason?: string
  onRedraw: () => void
  onPlayHand: () => void
  /** The play would clear the round. */
  willClear?: boolean
}

export function ActionBar({
  playButtonRef,
  turnsLeft,
  freeRedraws,
  selectedCount,
  playAllowed,
  redrawAllowed,
  playReason,
  redrawReason,
  onRedraw,
  onPlayHand,
  willClear = false,
}: ActionBarProps) {
  const { t, i18n } = useTranslation()
  const reasonId = useId()
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  // Only explain a disabled action once the player has chosen tiles.
  const reason =
    selectedCount > 0 ? (!playAllowed ? playReason : undefined) : undefined

  return (
    <div
      data-frame-corner-row="bottom"
      data-action-bar
      className="gameplay-frame-corner-row sticky bottom-0 z-20 flex flex-shrink-0 flex-col gap-1 rounded-sm border-t border-white/5 bg-[var(--color-dark-forest)] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] safe-area-bottom sm:px-4"
    >
      {reason && (
        <p
          id={reasonId}
          role="status"
          data-action-reason
          className="text-center text-[11px] leading-tight text-amber-200 [overflow-wrap:anywhere]"
        >
          {reason}
        </p>
      )}
      <div className="flex items-center gap-2 sm:gap-3">
        <p
          data-turns-left={turnsLeft}
          data-tutorial="hands-remaining"
          aria-label={t('gameplay.turnsLeft', {
            count: turnsLeft,
            formattedCount: number(turnsLeft),
          })}
          className="flex w-[3.25rem] shrink-0 flex-col items-center text-center leading-none text-[var(--color-beige-white)] sm:w-[4.25rem]"
        >
          <span
            aria-hidden="true"
            className="text-2xl font-black tabular-nums text-[var(--color-golden-yellow)]"
          >
            {number(turnsLeft)}
          </span>
          <span
            aria-hidden="true"
            className="mt-0.5 text-[9px] font-semibold uppercase leading-tight tracking-wide sm:text-[10px]"
          >
            {t('gameplay.turnsLabel', 'Turns left')}
          </span>
        </p>

        <Button
          data-game-action="redraw"
          variant="secondary"
          size="sm"
          onClick={onRedraw}
          disabled={!redrawAllowed}
          title={!redrawAllowed && selectedCount > 0 ? redrawReason : undefined}
          className="flex !min-h-11 min-w-0 flex-1 flex-col items-center justify-center !px-1 text-[13px] font-black uppercase leading-tight tracking-normal sm:!px-2 sm:text-sm sm:tracking-wide"
        >
          <span>{t('gameplay.redraw', 'REDRAW')}</span>
          {freeRedraws > 0 && (
            <span
              data-free-redraws={freeRedraws}
              className="whitespace-nowrap text-[10px] font-black normal-case leading-none tracking-normal text-emerald-200"
            >
              {t('gameplay.freeRedraws', {
                count: freeRedraws,
                formattedCount: number(freeRedraws),
              })}
            </span>
          )}
        </Button>

        <Button
          data-game-action="play"
          ref={playButtonRef}
          variant="primary"
          size="sm"
          onClick={onPlayHand}
          disabled={!playAllowed}
          aria-describedby={reason ? reasonId : undefined}
          className={`!min-h-11 min-w-0 flex-1 !px-1 text-[13px] font-black uppercase leading-tight tracking-normal sm:flex-[1.4] sm:!px-6 sm:text-sm sm:tracking-wide ${
            willClear && playAllowed
              ? 'shadow-[0_0_22px_rgba(74,222,128,0.55)]'
              : ''
          }`}
        >
          {t('gameplay.playHand', 'Play hand')}
        </Button>
      </div>
    </div>
  )
}

export default ActionBar
