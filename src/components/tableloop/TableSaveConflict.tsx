import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTableLoopStore } from '../../stores/tableLoopStore'
import { ConfirmPopup } from '../ui/Popup'
import { illustrationAssets } from '../../utils/assets'

/** A stale branch is never silently merged, replayed or allowed to overwrite. */
export function TableSaveConflict({
  onLoaded,
  onMenu,
}: {
  onLoaded: () => void
  onMenu: () => void
}) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const load = async () => {
    if (busy) return
    setBusy(true)
    const loaded = await useTableLoopStore.getState().loadSavedRun()
    if (loaded) onLoaded()
    else {
      setFailed(true)
      setBusy(false)
    }
  }
  return (
    <main className="viewport-full flex items-center justify-center bg-[var(--color-dark-forest)] p-6 text-[var(--color-beige-white)]">
      <section
        className="w-full max-w-lg rounded-xl border border-[var(--color-metallic-gold)] p-6 text-center"
        aria-labelledby="table-conflict-title"
      >
        <img
          src={illustrationAssets.beginnerGuidebook}
          alt=""
          className="mx-auto mb-3 h-20 w-20 object-contain"
        />
        <h1
          id="table-conflict-title"
          className="text-xl font-bold text-[var(--color-golden-yellow)]"
        >
          {t('tableLoop.save.conflictTitle')}
        </h1>
        <p className="mt-4 text-sm leading-relaxed" role="alert">
          {t('tableLoop.save.conflict')}
        </p>
        {failed && (
          <p role="alert" className="mt-3 text-sm text-amber-200">
            {t('tableLoop.save.loadFailed')}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            className="min-h-11 rounded-lg border border-[var(--color-metallic-gold)] px-3 py-2 disabled:opacity-50"
            onClick={() => setConfirm(true)}
          >
            {t('tableLoop.save.loadLatest')}
          </button>
          <button
            type="button"
            disabled={busy}
            className="min-h-11 px-3 py-2 disabled:opacity-50"
            onClick={onMenu}
          >
            {t('common.mainMenu')}
          </button>
        </div>
        <ConfirmPopup
          isOpen={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => void load()}
          title={t('tableLoop.save.loadLatest')}
          message={t('tableLoop.save.loadConfirm')}
        />
      </section>
    </main>
  )
}
