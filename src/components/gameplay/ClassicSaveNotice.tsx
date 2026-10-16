import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import {
  classicDestination,
  startConfiguredClassicRun,
} from '../../game/classicPersistenceApp'
import { useAppNavigation } from '../../router'
import { ControlIcon } from '../ui/ControlIcon'
import { Button } from '../ui/Button'

export function ClassicSaveNotice({
  errorsOnly = false,
  inline = false,
  offerNewRun = true,
}: {
  errorsOnly?: boolean
  /** Healthy status only, sized for a toolbar; failures render elsewhere. */
  inline?: boolean
  /**
   * When the run cannot be saved or read, offer a fresh one here. Off where
   * the screen already has its own New Run.
   */
  offerNewRun?: boolean
}) {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const { service, status, unsaved, disk } = useClassicPersistence()
  const [busy, setBusy] = useState(false)
  // A run that cannot be saved or read is never explained to the player:
  // there is nothing they can do about it but start again.
  const unusable = status === 'invalid' || disk.kind === 'invalid'
  const failure = status === 'conflict' || status === 'unavailable'
  const error = failure
    ? status
    : disk.kind === 'unavailable'
      ? disk.kind
      : null
  if (unusable && !error) {
    if (inline || !offerNewRun) return null
    const startOver = async () => {
      setBusy(true)
      try {
        // Replaces exactly the record read here, readable or not.
        const raw =
          disk.kind === 'ready' || disk.kind === 'invalid' ? disk.raw : null
        if (await startConfiguredClassicRun(raw))
          navigateTo(classicDestination())
      } finally {
        setBusy(false)
      }
    }
    return (
      <div data-classic-new-run className="mx-3 my-2 flex justify-center">
        <Button disabled={busy} onClick={() => void startOver()}>
          {t('menu.newRun', 'New Run')}
        </Button>
      </div>
    )
  }
  if (errorsOnly && !error) return null
  if (inline) {
    if (error) return null
    const label = t(`classicSave.${unsaved ? 'saving' : 'saved'}`)
    return (
      <p
        data-classic-save-status={status}
        title={label}
        className="flex items-center gap-1 whitespace-nowrap text-[10px] text-[var(--color-beige-white)]/60"
      >
        {unsaved ? (
          <span aria-hidden="true">…</span>
        ) : (
          <ControlIcon name="check" size={12} className="opacity-70" />
        )}
        <span className="sr-only sm:not-sr-only">{label}</span>
      </p>
    )
  }
  const retry = async () => {
    setBusy(true)
    try {
      if (service.hasLocalRun) await service.retrySave()
      service.refresh()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      data-classic-save-status={status}
      role={error ? 'alert' : undefined}
      className={
        error
          ? 'mx-3 my-2 rounded-lg border border-amber-300/45 bg-black/35 p-3 text-sm text-[var(--color-beige-white)]'
          : 'px-3 py-1 text-right text-xs text-[var(--color-beige-white)]/60'
      }
    >
      <p>{t(`classicSave.${error ?? (unsaved ? 'saving' : 'saved')}`)}</p>
      {error && error !== 'conflict' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void retry()}
          className="mt-2 min-h-11 rounded-lg border border-[var(--color-metallic-gold)] px-4 font-semibold disabled:opacity-50"
        >
          {t(service.hasLocalRun ? 'classicSave.retry' : 'classicSave.refresh')}
        </button>
      )}
    </div>
  )
}
