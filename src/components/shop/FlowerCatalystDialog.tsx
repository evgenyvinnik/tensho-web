import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { Decree, FlowerCollection } from '../../systems/types'
import type { ShopResult } from '../../game/ShopSession'
import { useItemText } from '../../i18n/useItemText'
import { flowerIllustrations } from '../../utils/assets'
import { FLOWER_BASE_EFFECTS } from '../../systems/FlowerSystem'
import { Popup } from '../ui/Popup'
import { Button } from '../ui/Button'

/** Explicit, cancellable payment selection. Opening or selecting never spends. */
export function FlowerCatalystDialog({
  offering,
  flowers,
  slots,
  ownedDecrees,
  validate,
  onConfirm,
  onClose,
  error,
}: {
  offering: TeaHouseOffering
  flowers: FlowerCollection
  slots: number
  ownedDecrees: number
  validate: (flowerId: string) => ShopResult
  onConfirm: (flowerId: string) => void
  onClose: () => void
  error?: string | null
}) {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const descriptionId = useId()
  const radioName = useId()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = flowers.flowers.find((flower) => flower.id === selectedId)
  const check = selected ? validate(selected.id) : null
  const count = flowers.flowers.length
  const postSlots =
    slots -
    Number(count === 2) +
    Number((offering.item as Decree).edition === 'Negative')
  const format = (value: number) => value.toLocaleString(i18n.resolvedLanguage)
  const failure =
    check && !check.success
      ? t(
          check.reason === 'inventoryFull'
            ? 'shop.catalyst.noSpace'
            : check.reason === 'flowerRequirement'
              ? 'shop.availability.flowers'
              : 'shop.availability.unavailable'
        )
      : null
  return (
    <Popup
      isOpen
      onClose={onClose}
      title={t('shop.catalyst.offer')}
      descriptionId={descriptionId}
    >
      <div
        data-flower-catalyst
        className="min-w-0 space-y-4 text-sm [overflow-wrap:anywhere]"
      >
        <p id={descriptionId}>
          {t('shop.catalyst.prompt', {
            name: itemText.name('decrees', offering.item as Decree),
            cost: format(offering.finalCost),
          })}
        </p>
        {count === 0 ? (
          <p>{t('shop.catalyst.empty')}</p>
        ) : (
          <fieldset className="min-w-0 space-y-2">
            <legend className="mb-2 font-bold">
              {t('shop.catalyst.choose')}
            </legend>
            {flowers.flowers.map((flower) => (
              <label
                key={flower.id}
                className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border p-2 ${selectedId === flower.id ? 'border-[var(--color-golden-yellow)] bg-black/25' : 'border-[var(--color-metallic-gold)]/40'}`}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={flower.id}
                  checked={selectedId === flower.id}
                  onChange={() => setSelectedId(flower.id)}
                  className="h-5 w-5 shrink-0 accent-amber-300"
                />
                <img
                  src={flowerIllustrations[flower.type]}
                  alt=""
                  aria-hidden="true"
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 object-contain"
                />
                <span className="min-w-0">
                  <span className="block font-bold">
                    {t('flora.' + flower.type.toLowerCase())}
                  </span>
                  {flower.mutation?.isUnlocked && (
                    <span className="block text-xs text-[var(--color-golden-yellow)]">
                      {t('flora.mutations.awakened')}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {selected && (
          <div
            data-catalyst-consequences
            className="space-y-2 rounded-lg bg-black/20 p-3"
          >
            <p>{t('shop.catalyst.warning')}</p>
            <p className="font-bold">{t('shop.catalyst.givenUp')}</p>
            <p>
              {t(
                selected.type === 'Chrysanthemum' &&
                  selected.mutation?.isUnlocked
                  ? 'flora.mutations.chrysanthemum'
                  : 'flora.details.flower' + selected.type,
                {
                  percent: format(
                    FLOWER_BASE_EFFECTS[selected.type].percentagePerMatch *
                      flowers.totalEffectiveness
                  ),
                  factor: format(1 + 0.2 * flowers.totalEffectiveness),
                }
              )}
            </p>
            {selected.mutation?.isUnlocked &&
              selected.type !== 'Chrysanthemum' && (
                <p>{t('flora.mutations.' + selected.type.toLowerCase())}</p>
              )}
            {count >= 2 && count <= 4 && (
              <p>{t('shop.catalyst.loss' + count)}</p>
            )}
            <p>
              {t('shop.catalyst.slots', {
                used: format(ownedDecrees + 1),
                max: format(postSlots),
              })}
            </p>
          </div>
        )}
        {(error || failure) && (
          <p role="alert" className="text-amber-100">
            {error || failure}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="min-w-0">
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!selected || !check?.success}
            onClick={() => selected && check?.success && onConfirm(selected.id)}
            className="min-w-0 whitespace-normal"
          >
            {selected
              ? t('shop.catalyst.confirm', {
                  flower: t('flora.' + selected.type.toLowerCase()),
                })
              : t('common.confirm')}
          </Button>
        </div>
      </div>
    </Popup>
  )
}
