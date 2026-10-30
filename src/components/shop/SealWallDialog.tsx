/**
 * SealWallDialog: lay a Seal on tiles of your wall.
 *
 * A Seal is used the moment it is obtained, on the run's wall rather than a
 * hand: bought or chosen from a pack in the Tea House, or made by the run at
 * the table. Every wall tile is shown, suit by suit, a column per rank with
 * its copies stacked, so the player sees the whole wall and picks exactly the
 * tiles to change; tiles the Seal cannot change are dimmed. The chosen tiles
 * and what they become stay in view above the confirm button. Cancelling a
 * purchase changes nothing; a Seal the run made has no cancel.
 *
 * @module components/shop/SealWallDialog
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Tile, TileSuit } from '../../core/Tile'
import type { FateSeal } from '../../systems/FateSealSystem'
import {
  consumableTargetRange,
  replacesTileModifier,
} from '../../gameplay/consumableTargeting'
import {
  canSealTile,
  previewWallSeal,
  sealableWallTiles,
} from '../../gameplay/wallSeals'
import { tileModifierEntries } from '../../core/tileModifierEntries'
import { tileName } from '../../i18n/tileText'
import { useItemText } from '../../i18n/useItemText'
import { getFateSealIllustration } from '../../utils/assets'
import { TileImage } from '../tiles/TileImage'
import { ControlIcon } from '../ui/ControlIcon'

const GROUPS = [
  { suit: TileSuit.Manzu, label: 'tiles.manzu', columns: 9 },
  { suit: TileSuit.Pinzu, label: 'tiles.pinzu', columns: 9 },
  { suit: TileSuit.Souzu, label: 'tiles.souzu', columns: 9 },
  { suit: TileSuit.Wind, label: 'tiles.winds', columns: 4 },
  { suit: TileSuit.Dragon, label: 'tiles.dragons', columns: 3 },
] as const

export interface SealWallDialogProps {
  seal: FateSeal
  /** The run's wall as the Seal will find it. */
  wall: readonly Tile[]
  /** The confirm button's words: a price to pay, or a pack's claim. */
  confirmLabel: string
  /** Which of a pack's Seals this is, when it holds more than one. */
  step?: { index: number; count: number }
  /** The engine's refusal of the last confirm, in the player's language. */
  error?: string | null
  onConfirm: (targets: string[]) => void
  /** Leave without using it; omitted for a Seal the run made. */
  onClose?: () => void
}

export function SealWallDialog({
  seal,
  wall,
  confirmLabel,
  step,
  error,
  onConfirm,
  onClose,
}: SealWallDialogProps) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const headingId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [targets, setTargets] = useState<string[]>([])
  const range = consumableTargetRange(seal.effect)
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)
  const copy = seal.effect.type === 'copy_tile'

  const groups = useMemo(() => {
    const tiles = sealableWallTiles(wall)
    return GROUPS.map((group) => {
      const ofSuit = tiles
        .filter((tile) => tile.suit === group.suit)
        .sort(Tile.compare)
      // Copies of a rank stack down its column, in wall order.
      const placed = ofSuit.map((tile, index) => ({
        tile,
        column: tile.rank,
        row:
          ofSuit.slice(0, index).filter((other) => other.rank === tile.rank)
            .length + 1,
      }))
      return { ...group, placed }
    }).filter((group) => group.placed.length > 0)
  }, [wall])

  const chosen = previewWallSeal(seal, wall, targets)
  const countValid = targets.length >= range.min && targets.length <= range.max
  const replaced = [
    ...new Set(
      wall
        .filter(
          (tile) =>
            targets.includes(tile.id) &&
            // Transmutation's second tile is only read, never changed.
            !(copy && targets.indexOf(tile.id) === 1) &&
            replacesTileModifier(seal.effect, tile)
        )
        .flatMap(tileModifierEntries)
        .map((entry) => itemText.name(entry.kind, entry))
    ),
  ]

  useEffect(() => {
    const dialog = dialogRef.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('[data-seal-wall-close]')?.focus()
    return () => {
      dialog.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  const toggle = (tile: Tile) => {
    setTargets((current) => {
      if (current.includes(tile.id))
        return current.filter((id) => id !== tile.id)
      // A one-tile Seal moves its choice; a fuller choice must be undone first.
      if (range.max === 1) return [tile.id]
      return current.length < range.max ? [...current, tile.id] : current
    })
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      data-seal-wall-dialog={seal.id}
      onCancel={(event) => {
        event.preventDefault()
        onClose?.()
      }}
      className="m-auto w-[calc(100vw-16px)] max-w-2xl max-h-[calc(100dvh-16px)] overflow-hidden rounded-xl border-2 border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] p-0 text-[var(--color-beige-white)] shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex max-h-[calc(100dvh-20px)] flex-col">
        <header className="relative flex shrink-0 items-start gap-3 border-b border-white/10 py-3 pl-3 pr-14 sm:pl-5">
          <img
            src={getFateSealIllustration(seal.id)}
            alt=""
            aria-hidden="true"
            className="game-illustration h-14 w-14 shrink-0 object-contain"
          />
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <h2
              id={headingId}
              className="font-decorative text-lg leading-tight text-[var(--color-golden-yellow)] sm:text-xl"
            >
              {itemText.name('seals', seal)}
              {step && step.count > 1 && (
                <span className="ml-2 text-sm font-normal tabular-nums opacity-70">
                  {t('shop.sealWall.step', {
                    index: number(step.index + 1),
                    total: number(step.count),
                  })}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm leading-snug opacity-85">
              {itemText.description('seals', seal)}
            </p>
            <p
              data-seal-lifetime
              className="mt-1 text-xs leading-snug text-amber-100/75"
            >
              {t('runOwnership.fateSeal')}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              data-seal-wall-close
              onClick={onClose}
              aria-label={t('common.close')}
              className="absolute right-2 top-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/20"
            >
              <ControlIcon name="close" size={24} />
            </button>
          )}
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-2 py-3 sm:px-5">
          <h3 className="mb-2 text-sm font-semibold">
            {t('shop.sealWall.title')}
          </h3>
          <div className="space-y-3">
            {groups.map((group) => (
              <section
                key={group.suit}
                data-seal-wall-suit={group.suit}
                aria-label={t(group.label)}
                className="min-w-0"
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-beige-white)]/70">
                  {t(group.label)}{' '}
                  <span className="tabular-nums opacity-70">
                    · {number(group.placed.length)}
                  </span>
                </p>
                <div className="overflow-x-auto pb-1">
                  <div
                    className="seal-wall-grid grid w-max gap-0.5"
                    style={{
                      gridTemplateColumns: `repeat(${group.columns}, auto)`,
                    }}
                  >
                    {group.placed.map(({ tile, column, row }) => {
                      const order = targets.indexOf(tile.id)
                      const eligible = canSealTile(seal, tile)
                      const full = range.max > 1 && targets.length >= range.max
                      return (
                        <button
                          key={tile.id}
                          type="button"
                          data-seal-wall-tile={tile.id}
                          aria-pressed={order >= 0}
                          aria-label={tileName(tile, t)}
                          disabled={!eligible || (order < 0 && full)}
                          onClick={() => toggle(tile)}
                          style={{ gridColumn: column, gridRow: row }}
                          className={`relative flex !min-w-0 rounded-md transition-opacity disabled:cursor-not-allowed ${
                            !eligible
                              ? 'opacity-25'
                              : order < 0 && full
                                ? 'opacity-50'
                                : ''
                          } ${
                            order >= 0
                              ? 'ring-2 ring-[var(--color-golden-yellow)] ring-offset-1 ring-offset-[var(--color-dark-forest)]'
                              : ''
                          }`}
                        >
                          <TileImage
                            tile={tile}
                            size="small"
                            showTooltip={false}
                          />
                          {order >= 0 && (
                            <span className="absolute -right-1 -top-1 z-30 rounded-full bg-amber-300 px-1.5 text-[10px] font-bold leading-4 text-black">
                              {number(order + 1)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-[var(--color-dark-forest)] px-3 py-3 sm:px-5">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <p role="status" className="tabular-nums">
              {t('consumableUse.count', {
                selected: number(targets.length),
                required:
                  range.min === range.max
                    ? number(range.max)
                    : `${number(range.min)}–${number(range.max)}`,
              })}
            </p>
            {copy && (
              <p className="text-xs text-amber-200">
                {t('consumableUse.copyOrder')}
              </p>
            )}
          </div>
          {chosen.length > 0 && (
            <ul
              data-seal-wall-result
              aria-label={t('shop.sealWall.result')}
              className="scroll-rail mb-2 flex gap-3 overflow-x-auto pb-1"
            >
              {chosen.map(({ before, after }) => (
                <li
                  key={before.id}
                  className="flex shrink-0 items-center gap-1"
                  aria-label={
                    after
                      ? t('shop.sealWall.becomes', {
                          from: tileName(before, t),
                          to: tileName(after, t),
                        })
                      : t('shop.sealWall.destroyed', {
                          name: tileName(before, t),
                        })
                  }
                >
                  <TileImage tile={before} size="small" showTooltip={false} />
                  <span aria-hidden="true" className="text-amber-200">
                    →
                  </span>
                  {after ? (
                    <TileImage tile={after} size="small" showTooltip={false} />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-[49px] w-[35px] items-center justify-center rounded-md border border-dashed border-red-300/60 text-lg text-red-200"
                    >
                      ✕
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {replaced.length > 0 && (
            <p
              role="status"
              data-seal-wall-replaces
              className="mb-2 text-xs text-amber-200"
            >
              {t('consumableUse.replacesModifier', {
                names: replaced.join(', '),
              })}
            </p>
          )}
          {error && (
            <p role="alert" className="mb-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <div className={`grid gap-3 ${onClose ? 'grid-cols-2' : ''}`}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 rounded-lg border border-[var(--color-metallic-gold)] px-2"
              >
                {t('common.cancel')}
              </button>
            )}
            <button
              type="button"
              data-seal-wall-confirm
              disabled={!countValid}
              onClick={() => onConfirm(targets)}
              className="min-h-12 rounded-lg border border-amber-200 bg-[var(--color-vibrant-orange)] px-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </dialog>,
    document.body
  )
}

export default SealWallDialog
