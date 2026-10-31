/**
 * ActionBar: the two things you can do with your Turn.
 *
 *   Turns left 4   Wall   [ REDRAW ]  [ Play hand ]
 *
 * Play hand scores the selected tiles. REDRAW sends any number of selected
 * tiles to the river and draws replacements. Each spends one Turn (a free
 * redraw from an item is spent first, and shown on the button).
 *
 * The labels never change. When an action cannot be taken, the button is
 * disabled and one short reason floats just above the bar and is announced;
 * it never takes layout space, so showing it does not move the table.
 *
 * On Red Stake and above, from Act 2, the last Turn of a round can be
 * extended with Gold. On that Turn REDRAW cannot be used (the last Turn is
 * always a Play), so its place offers "+1 Turn" with the price instead:
 * buying one is what makes REDRAW possible again. It is shown disabled when
 * the player cannot afford it, so the option is learned before it is needed.
 * Taking an existing slot keeps the bar's height, so the offer never pushes
 * the bar over the rack on the Turn where every tile matters. While a free
 * redraw is left, REDRAW still works and keeps its place; the offer appears
 * once those are spent.
 *
 * @module components/gameplay/ActionBar
 */

import type { ReactNode, Ref } from 'react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/Button'
import { GoldIcon } from '../ui/GoldIcon'

export interface ActionBarProps {
  playButtonRef?: Ref<HTMLButtonElement>
  /** Wall inventory, kept beside the Turn count. */
  wall?: ReactNode
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
  /** An extra Turn for sale on the last Turn (Act 2 on), or null. */
  emergencyTurn?: { cost: number; affordable: boolean } | null
  onBuyTurn?: () => void
}

export function ActionBar({
  playButtonRef,
  wall,
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
  emergencyTurn = null,
  onBuyTurn,
}: ActionBarProps) {
  const { t, i18n } = useTranslation()
  const reasonId = useId()
  const emergencyHintId = useId()
  const number = (value: number) =>
    value.toLocaleString(i18n.resolvedLanguage ?? i18n.language)
  // Only explain a disabled action once the player has chosen tiles.
  const reason =
    selectedCount > 0 ? (!playAllowed ? playReason : undefined) : undefined
  // REDRAW's slot sells the emergency Turn only while REDRAW is unusable.
  const offer = freeRedraws > 0 ? null : emergencyTurn

  return (
    <div
      data-frame-corner-row="bottom"
      data-action-bar
      className="gameplay-action-bar gameplay-frame-corner-row sticky bottom-0 z-20 flex flex-shrink-0 flex-col gap-1 rounded-sm border-t border-white/5 bg-[var(--color-dark-forest)] px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] safe-area-bottom sm:px-4"
    >
      {/* Floats just above the bar so showing it never reflows the table. */}
      {reason && (
        <p
          id={reasonId}
          role="status"
          data-action-reason
          className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-max max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-full border border-amber-200/40 bg-[var(--color-dark-forest)]/95 px-3 py-1 text-center text-[11px] leading-tight text-amber-200 shadow-[0_4px_12px_rgba(0,0,0,0.45)] [overflow-wrap:anywhere]"
        >
          {reason}
        </p>
      )}
      <div className="gameplay-action-controls items-center gap-1.5 sm:gap-3">
        <p
          data-turns-left={turnsLeft}
          data-tutorial="hands-remaining"
          aria-label={t('gameplay.turnsLeft', {
            count: turnsLeft,
            formattedCount: number(turnsLeft),
          })}
          className="flex w-11 shrink-0 flex-col items-center text-center leading-none text-[var(--color-beige-white)] sm:w-[4.25rem]"
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

        {wall && (
          <div data-action-wall className="shrink-0">
            {wall}
          </div>
        )}

        {offer ? (
          <>
            <button
              type="button"
              data-emergency-turn={offer.cost}
              onClick={onBuyTurn}
              disabled={!offer.affordable}
              aria-label={t('gameplay.emergencyTurn.label', {
                cost: number(offer.cost),
              })}
              aria-describedby={offer.affordable ? undefined : emergencyHintId}
              title={
                offer.affordable
                  ? t('gameplay.emergencyTurn.label', {
                      cost: number(offer.cost),
                    })
                  : t('gameplay.emergencyTurn.short', {
                      cost: number(offer.cost),
                    })
              }
              className="flex !min-h-11 min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1.5 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-black/25 px-1 py-1 text-[13px] font-black uppercase leading-tight text-[var(--color-beige-white)] shadow-[0_0_14px_rgba(255,213,79,0.3)] hover:bg-[var(--color-forest-green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-golden-yellow)] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/55 disabled:shadow-none sm:px-2 sm:text-sm"
            >
              <span className="[overflow-wrap:anywhere]">
                {t('gameplay.emergencyTurn.buy')}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-[var(--color-golden-yellow)]">
                <GoldIcon className="h-4 w-4" />
                {number(offer.cost)}
              </span>
            </button>
            {!offer.affordable && (
              <span id={emergencyHintId} className="sr-only">
                {t('gameplay.emergencyTurn.short', {
                  cost: number(offer.cost),
                })}
              </span>
            )}
          </>
        ) : (
          <Button
            data-game-action="redraw"
            variant="secondary"
            size="sm"
            onClick={onRedraw}
            disabled={!redrawAllowed}
            title={
              !redrawAllowed && selectedCount > 0 ? redrawReason : undefined
            }
            className="flex !min-h-11 min-w-0 flex-1 flex-col items-center justify-center !px-1 text-[13px] font-black uppercase leading-tight tracking-normal sm:!px-2 sm:text-sm sm:tracking-wide"
          >
            <span className="max-w-full [overflow-wrap:anywhere]">
              {t('gameplay.redraw', 'REDRAW')}
            </span>
            {freeRedraws > 0 && (
              <span
                data-free-redraws={freeRedraws}
                className="max-w-full text-[10px] font-black normal-case leading-none tracking-normal text-emerald-200 [overflow-wrap:anywhere]"
              >
                {t('gameplay.freeRedraws', {
                  count: freeRedraws,
                  formattedCount: number(freeRedraws),
                })}
              </span>
            )}
          </Button>
        )}

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
          <span className="[overflow-wrap:anywhere]">
            {t('gameplay.playHand', 'Play hand')}
          </span>
        </Button>
      </div>
    </div>
  )
}

export default ActionBar
