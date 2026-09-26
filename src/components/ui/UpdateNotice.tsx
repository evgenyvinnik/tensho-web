import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popup } from './Popup'
import { Button } from './Button'
import { useUpdateStore } from '../../pwa/updateStore'

/** Deliberately offered only in menu/settings, never over the playing surface. */
export function UpdateNotice() {
  const { t } = useTranslation()
  const { available, busy, error, accept } = useUpdateStore()
  const [open, setOpen] = useState(false)
  const descriptionId = useId()
  if (!available) return null
  return (
    <div className="w-full min-w-0 text-center lg:col-span-2">
      <button
        type="button"
        className="min-h-11 rounded-lg border border-[var(--color-metallic-gold)] px-4 py-2 text-sm text-[var(--color-golden-yellow)]"
        onClick={() => setOpen(true)}
      >
        {t('appUpdate.available')}
      </button>
      <Popup
        isOpen={open}
        title={t('appUpdate.available')}
        descriptionId={descriptionId}
        onClose={() => {
          if (!busy) setOpen(false)
        }}
        showCloseButton={!busy}
        closeOnBackdrop={!busy}
      >
        <p id={descriptionId} className="mb-4 text-sm leading-relaxed">
          {t('appUpdate.description')}
        </p>
        {error && (
          <p role="alert" className="mb-4 text-sm text-amber-200">
            {t(`appUpdate.${error}`)}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            className="w-full min-w-0 sm:w-auto"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            {t('appUpdate.later')}
          </Button>
          <Button
            className="w-full min-w-0 sm:w-auto"
            disabled={busy}
            onClick={() => void accept()}
          >
            {t(busy ? 'appUpdate.updating' : 'appUpdate.accept')}
          </Button>
        </div>
      </Popup>
    </div>
  )
}
