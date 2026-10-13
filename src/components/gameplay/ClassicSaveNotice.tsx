import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import { ControlIcon } from '../ui/ControlIcon'

export function ClassicSaveNotice({
  errorsOnly = false,
  inline = false,
}: {
  errorsOnly?: boolean
  /** Healthy status only, sized for a toolbar; failures render elsewhere. */
  inline?: boolean
}) {
  const { t } = useTranslation()
  const { service, status, unsaved, disk } = useClassicPersistence()
  const [busy, setBusy] = useState(false)
  const failure =
    status === 'conflict' || status === 'invalid' || status === 'unavailable'
  const error = failure
    ? status
    : disk.kind === 'invalid' || disk.kind === 'unavailable'
      ? disk.kind
      : null
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
