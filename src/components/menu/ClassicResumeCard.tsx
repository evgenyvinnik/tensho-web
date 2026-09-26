import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useClassicPersistence } from '../../game/useClassicPersistence'
import { useGameController } from '../../game/useGameController'
import { classicDestination } from '../../game/classicPersistenceApp'
import { useAppNavigation } from '../../router'
import { getTableStyleById } from '../../config/tableStyleDefinitions'
import { getTableStyleIllustration } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'
import { ClassicSaveNotice } from '../gameplay/ClassicSaveNotice'
import { Button } from '../ui/Button'
import { ConfirmPopup } from '../ui/Popup'

function downloadBackup(raw: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'tensho-classic-backup.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ClassicResumeCard() {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const { navigateTo } = useAppNavigation()
  const { service, disk } = useClassicPersistence()
  const game = useGameController()
  const [busy, setBusy] = useState(false)
  const [discardRaw, setDiscardRaw] = useState<string | null>(null)
  const local = service.hasLocalRun
  const run = local
    ? game.state
    : disk.kind === 'ready'
      ? disk.saved.snapshot.state
      : null
  const table = run ? getTableStyleById(run.tableStyleId) : null
  const raw = disk.kind === 'ready' || disk.kind === 'invalid' ? disk.raw : null
  if (!run && raw === null && disk.kind !== 'unavailable') return null
  const resume = async () => {
    setBusy(true)
    try {
      if (local || (disk.kind === 'ready' && (await service.resume(disk.raw))))
        navigateTo(classicDestination())
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      data-classic-resume
      className="w-full rounded-xl border border-[var(--color-metallic-gold)]/60 bg-black/25 p-3 text-[var(--color-beige-white)]"
    >
      {run && (
        <>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={getTableStyleIllustration(run.tableStyleId)}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <h2 className="font-decorative text-lg text-[var(--color-golden-yellow)]">
                {t('classicSave.savedTitle')}
              </h2>
              <p className="break-words text-sm">
                {table
                  ? itemText.name('tableStyles', {
                      ...table,
                      name: table.displayName,
                    })
                  : run.tableStyleId}
              </p>
              <p className="text-xs opacity-75">
                {t('classicSave.position', {
                  act: new Intl.NumberFormat(i18n.language).format(
                    run.currentAct
                  ),
                  round: new Intl.NumberFormat(i18n.language).format(
                    run.currentRound
                  ),
                })}
              </p>
            </div>
          </div>
          <Button
            className="w-full min-w-0"
            disabled={busy}
            onClick={() => void resume()}
          >
            {t('classicSave.resume')}
          </Button>
        </>
      )}
      <ClassicSaveNotice errorsOnly />
      {raw !== null && (
        <div className="mt-2 flex flex-wrap justify-between gap-x-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => downloadBackup(raw)}
            className="min-h-11 text-xs underline underline-offset-4"
          >
            {t('classicSave.backup')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await service.flush()
              const current = service.getSnapshot().disk
              if (current.kind === 'ready' || current.kind === 'invalid')
                setDiscardRaw(current.raw)
            }}
            className="min-h-11 text-xs underline underline-offset-4"
          >
            {t('classicSave.discard')}
          </button>
        </div>
      )}
      <ConfirmPopup
        isOpen={discardRaw !== null}
        onClose={() => setDiscardRaw(null)}
        title={t('classicSave.discardTitle')}
        message={t('classicSave.discardBody')}
        confirmText={t('classicSave.discard')}
        onConfirm={() => {
          if (discardRaw !== null) {
            setBusy(true)
            void service.discard(discardRaw).finally(() => setBusy(false))
          }
        }}
      />
    </section>
  )
}
