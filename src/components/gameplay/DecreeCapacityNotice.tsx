import { useTranslation } from 'react-i18next'

export function DecreeCapacityNotice({
  owned,
  slots,
}: {
  owned: number
  slots: number
}) {
  const { t } = useTranslation()
  if (owned <= slots) return null
  return (
    <p
      data-decree-capacity-notice
      role="status"
      className="mx-3 my-2 rounded-lg border border-amber-200/30 bg-black/25 p-2 text-sm leading-relaxed text-amber-100"
    >
      {t('runOwnership.overCapacity')}
    </p>
  )
}
