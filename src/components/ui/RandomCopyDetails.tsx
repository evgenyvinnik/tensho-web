import { useTranslation } from 'react-i18next'
import type { OwnedDecree } from '../../systems/types'
import { isDecreeExcluded } from '../../systems/decreeIdentity'
import { useItemText } from '../../i18n/useItemText'

/** Render only for visible owned inventory; never infer a target from position. */
export function RandomCopyDetails({
  decree,
  owned,
  disabledIds,
}: {
  decree: OwnedDecree
  owned: readonly OwnedDecree[]
  disabledIds?: ReadonlySet<string>
}) {
  const { t, i18n } = useTranslation()
  const text = useItemText()
  if (
    ![decree.effect, ...(decree.extraEffects ?? [])].some(
      (e) => e.type === 'copy_decree' && e.source === 'random'
    )
  )
    return null
  const index = owned.findIndex(
    (d) =>
      d.instanceId === decree.randomCopyTargetId &&
      decree.randomCopyTargetId != null
  )
  const target = owned[index]
  const inactive =
    decree.isDebuffed ||
    isDecreeExcluded(decree, disabledIds) ||
    (target && (target.isDebuffed || isDecreeExcluded(target, disabledIds)))
  return (
    <div
      data-random-copy-details
      className="mt-3 rounded-lg border border-amber-200/25 bg-black/20 p-2.5 text-sm leading-relaxed"
    >
      <p className="font-semibold text-[var(--color-golden-yellow)]">
        {target
          ? t('randomCopy.target', {
              name: text.name('decrees', target),
              slot: new Intl.NumberFormat(i18n.language).format(index + 1),
            })
          : t(
              decree.randomCopyTargetId
                ? 'randomCopy.missing'
                : 'randomCopy.waiting'
            )}
      </p>
      {inactive && (
        <p className="mt-1 text-red-200">{t('randomCopy.inactive')}</p>
      )}
      <p className="mt-2 text-[var(--color-beige-white)]/85">
        {t('randomCopy.rules')}
      </p>
    </div>
  )
}
