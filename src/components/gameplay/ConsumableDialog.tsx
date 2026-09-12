import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { UNITY_WIND_CONVERSIONS } from '../../core/tileTransformations'
import type { FateSeal } from '../../systems/FateSealSystem'
import type { CelestialOrb } from '../../systems/CelestialOrbSystem'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import type { BaseConsumable } from '../../systems/ConsumableSystem'
import type {
  ActionResult,
  PlayerAction,
  ValidationResult,
} from '../../game/ActionProcessor'
import { consumableTargetRange } from '../../gameplay/consumableTargeting'
import { useItemText } from '../../i18n/useItemText'
import {
  getVoidScriptIllustration,
  illustrationAssets,
} from '../../utils/assets'
import { TileImage } from '../tiles/TileImage'

type Item = FateSeal | CelestialOrb | VoidScript
type ConsumableAction = Extract<
  PlayerAction,
  { type: 'useSeal' | 'useOrb' | 'useScript' }
>

export interface ConsumableDialogProps {
  title: string
  items: readonly Item[]
  tiles: readonly Tile[]
  concealedIds: ReadonlySet<string>
  lastCopyableConsumable?: BaseConsumable | null
  scriptDownsideProtected?: boolean
  canUse: (action: ConsumableAction) => boolean
  validateUse?: (action: ConsumableAction) => ValidationResult
  onUse: (action: ConsumableAction) => ActionResult
  onClose: () => void
}

/** A private target selection: inspecting/cancelling never changes staged play. */
export function ConsumableDialog({
  title,
  items,
  tiles,
  concealedIds,
  lastCopyableConsumable,
  scriptDownsideProtected = false,
  canUse,
  validateUse,
  onUse,
  onClose,
}: ConsumableDialogProps) {
  const { t } = useTranslation()
  const itemText = useItemText()
  const headingId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false)
  const item = items.find((candidate) => candidate.instanceId === selectedId)
  const range =
    item && item.type !== 'CelestialOrb'
      ? consumableTargetRange(item.effect)
      : { min: 0, max: 0 }
  const targets = targetIds.filter((id) => tiles.some((tile) => tile.id === id))
  const action: ConsumableAction | null = !item
    ? null
    : item.type === 'FateSeal'
      ? { type: 'useSeal', sealId: item.instanceId, targets }
      : item.type === 'VoidScript'
        ? { type: 'useScript', scriptId: item.instanceId, targets }
        : { type: 'useOrb', orbId: item.instanceId }
  const availability = action ? validateUse?.(action) : undefined
  const allowed =
    action !== null && (availability ? availability.isValid : canUse(action))
  const countValid = targets.length >= range.min && targets.length <= range.max
  const copy = item?.type === 'FateSeal' && item.effect.type === 'copy_tile'

  const messageFor = (message: string) => {
    if (message === 'Choose a suited tile of a different suit')
      return t('consumableUse.errorSuit')
    if (message === 'Choose a suited tile whose new rank is between 1 and 9')
      return t('consumableUse.errorRank')
    if (message.includes('already at max level'))
      return t('consumableUse.errorMaxLevel')
    if (message.startsWith('No room for')) return t('consumableUse.errorNoRoom')
    if (message.startsWith('No Decrees to'))
      return t('consumableUse.errorNoDecrees')
    if (message === 'No Fate Seal or Celestial Orb has been used this run')
      return t('consumableUse.errorNoPrevious', {
        seals: t('consumableUse.fateSeals'),
        orbs: t('consumableUse.celestialOrbs'),
      })
    if (message === 'No gold can be generated')
      return t('consumableUse.errorNoGold')
    return message
  }

  useEffect(() => {
    const dialog = dialogRef.current!
    const previous = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => {
      dialog.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  const confirm = () => {
    if (!action || !allowed || busy.current) return
    busy.current = true
    try {
      const result = onUse(action)
      if (result.success) onClose()
      else
        setError(
          result.errors?.map(messageFor).join(' ') || t('consumableUse.failed')
        )
    } finally {
      busy.current = false
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      data-consumable-dialog
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [tabindex="0"]'
          )
        )
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      className="m-auto w-[calc(100vw-24px)] max-w-xl max-h-[calc(100dvh-24px)] overflow-hidden rounded-xl border-2 border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] p-0 text-[var(--color-beige-white)] shadow-2xl backdrop:bg-black/70"
    >
      <div className="flex max-h-[calc(100dvh-28px)] flex-col">
        <header className="relative shrink-0 border-b border-white/10 px-14 py-4">
          <h2
            id={headingId}
            className="text-center font-decorative text-lg text-[var(--color-golden-yellow)] sm:text-2xl"
          >
            {title}
          </h2>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute right-2 top-2 min-h-11 min-w-11 rounded-lg border border-white/20"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5">
          <p className="mb-3 text-sm opacity-80">{t('consumableUse.choose')}</p>
          <div className="space-y-2">
            {items.map((candidate) => {
              const kind =
                candidate.type === 'FateSeal'
                  ? 'seals'
                  : candidate.type === 'CelestialOrb'
                    ? 'orbs'
                    : 'scripts'
              const art =
                candidate.type === 'VoidScript'
                  ? getVoidScriptIllustration(candidate.id)
                  : candidate.type === 'FateSeal'
                    ? illustrationAssets.consumables.fateSeal
                    : illustrationAssets.consumables.celestialOrb
              return (
                <button
                  key={candidate.instanceId}
                  type="button"
                  data-consumable-item={candidate.instanceId}
                  aria-pressed={candidate.instanceId === selectedId}
                  onClick={() => {
                    setSelectedId(candidate.instanceId)
                    setTargetIds([])
                    setError(null)
                  }}
                  className={`flex w-full items-start gap-3 rounded-lg border-2 p-3 text-left ${candidate.instanceId === selectedId ? 'border-[var(--color-golden-yellow)] bg-white/10' : 'border-white/15 bg-black/20'}`}
                >
                  <img
                    src={art}
                    alt=""
                    className="h-14 w-14 shrink-0 object-contain"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {itemText.name(kind, candidate)}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed opacity-80">
                      {itemText.description(kind, candidate)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          {item?.id === 'seal_of_unity' && (
            <section
              className="mt-4"
              aria-label={t('consumableUse.unityMapping')}
              data-unity-mapping
            >
              <p className="mb-2 text-sm">{t('consumableUse.unityMapping')}</p>
              <div className="grid grid-cols-4 gap-2">
                {UNITY_WIND_CONVERSIONS.map(({ wind, key, ranks }) => (
                  <div
                    key={wind}
                    className="flex min-w-0 flex-col items-center gap-1"
                    data-unity-wind={wind}
                    role="img"
                    aria-label={`${ranks.join(', ')} → ${t(`tiles.${key}`)}`}
                  >
                    <span className="text-xs tabular-nums">
                      {ranks.join(' · ')}
                    </span>
                    <TileImage
                      tile={Tile.createWind(wind, `unity-legend-${wind}`)}
                      size="small"
                      showTooltip={false}
                    />
                    <span className="w-full break-words text-center text-xs">
                      {t(`tiles.${key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {item?.type === 'FateSeal' &&
            item.effect.type === 'duplicate_consumable' &&
            lastCopyableConsumable &&
            lastCopyableConsumable.type !== 'VoidScript' && (
              <p
                className="mt-4 text-sm text-amber-200"
                role="status"
                data-consumable-copy-result
              >
                {t('consumableUse.copyResult', {
                  name: itemText.name(
                    lastCopyableConsumable.type === 'FateSeal'
                      ? 'seals'
                      : 'orbs',
                    lastCopyableConsumable
                  ),
                })}
              </p>
            )}
          {item && range.max > 0 && (
            <section className="mt-4" aria-label={t('consumableUse.targets')}>
              <p className="mb-2 text-sm" role="status">
                {t('consumableUse.count', {
                  selected: targets.length,
                  required:
                    range.min === range.max
                      ? range.max
                      : `${range.min}–${range.max}`,
                })}
              </p>
              {copy && (
                <p className="mb-3 text-sm text-amber-200">
                  {t('consumableUse.copyOrder')}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-2 py-2">
                {tiles.map((tile) => {
                  const index = targets.indexOf(tile.id)
                  const hidden = concealedIds.has(tile.id)
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      data-consumable-target={tile.id}
                      aria-pressed={index >= 0}
                      aria-label={
                        hidden
                          ? t('tiles.faceDown', 'Face-down tile')
                          : tile.displayName
                      }
                      disabled={index < 0 && targets.length >= range.max}
                      onClick={() => {
                        setTargetIds(
                          index >= 0
                            ? targets.filter((id) => id !== tile.id)
                            : [...targets, tile.id]
                        )
                        setError(null)
                      }}
                      className={`relative flex min-h-11 min-w-11 items-center justify-center rounded disabled:opacity-35 ${index >= 0 ? 'ring-2 ring-[var(--color-golden-yellow)] ring-offset-2 ring-offset-[var(--color-dark-forest)]' : ''}`}
                    >
                      <TileImage
                        tile={tile}
                        faceDown={hidden}
                        size="medium"
                        showTooltip={false}
                      />
                      {index >= 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 text-xs font-bold text-black">
                          {index + 1}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
          {item?.type === 'VoidScript' && (
            <p className="mt-3 rounded-lg border border-red-400/40 p-2 text-sm text-red-200">
              {t('consumableUse.cost')}:{' '}
              {scriptDownsideProtected
                ? t('consumableUse.protected')
                : t(`consumableUse.penalty_${item.penalty.type}`, {
                    count: item.penalty.value || 1,
                  })}
            </p>
          )}
        </div>
        <footer className="shrink-0 border-t border-white/10 bg-[var(--color-dark-forest)] px-3 py-3 sm:px-5">
          {error && (
            <p role="alert" className="mb-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {!error && item && countValid && !allowed && (
            <p
              role="status"
              data-consumable-availability
              className="mb-2 text-sm text-amber-200"
            >
              {availability?.errors.map(messageFor).join(' ') ||
                t('consumableUse.unavailable')}
            </p>
          )}
          {!error && allowed && Boolean(availability?.warnings?.length) && (
            <p
              role="status"
              data-consumable-uncertainty
              className="mb-2 text-sm text-amber-200"
            >
              {t('consumableUse.hiddenOutcome')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-lg border border-[var(--color-metallic-gold)] px-2"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              data-consumable-confirm
              disabled={!allowed}
              onClick={confirm}
              className="min-h-12 rounded-lg border border-amber-200 bg-[var(--color-vibrant-orange)] px-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('consumableUse.confirm')}
            </button>
          </div>
        </footer>
      </div>
    </dialog>,
    document.body
  )
}
