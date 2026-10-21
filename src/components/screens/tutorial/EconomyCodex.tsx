import { useTranslation } from 'react-i18next'
import { getItemArt } from '../../../utils/itemArt'

export const ECONOMY_CODEX_SECTIONS = [
  ['tea-house', 'shop.title', 'shop'],
  ['gold-economy', 'shop.payoutBreakdown', 'payout'],
  ['interest', 'shop.payout.interest', 'interest'],
] as const

type Section = (typeof ECONOMY_CODEX_SECTIONS)[number][2]

/** Read-only reference: do not open a live shop to explain its rules. */
export function EconomyCodex({ section }: { section: Section }) {
  const { t } = useTranslation()
  return (
    <div
      data-codex-economy={section}
      className="space-y-4 [overflow-wrap:anywhere]"
    >
      {section === 'shop' && (
        <>
          <p>{t('shop.help.what')}</p>
          <p>{t('shop.help.buy')}</p>
          <p>{t('codexEconomy.prices')}</p>
          <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
            {(
              [
                [
                  'seals',
                  'seal_of_glass',
                  'shop.kinds.seal',
                  'shop.kinds.sealHelp',
                ],
                ['orbs', 'earth_orb', 'shop.kinds.orb', 'shop.kinds.orbHelp'],
                [
                  'scripts',
                  'script_of_immolation',
                  'shop.kinds.script',
                  'shop.kinds.consumableHelp',
                ],
                [
                  'charters',
                  'money_tree',
                  'shop.kinds.charter',
                  'shop.kinds.charterHelp',
                ],
              ] as const
            ).map(([kind, id, title, description]) => (
              <article
                key={id}
                className="min-w-0 rounded-xl border border-[var(--color-metallic-gold)]/30 bg-black/15 p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={getItemArt(kind, id).src}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                  <h3 className="min-w-0 font-semibold text-[var(--color-golden-yellow)]">
                    {t(title)}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed">{t(description)}</p>
              </article>
            ))}
          </div>
          <p>{t('shop.help.build')}</p>
          <p>{t('codexEconomy.sale')}</p>
        </>
      )}
      {section === 'payout' && (
        <>
          <p>{t('codexEconomy.payout')}</p>
          <p>{t('shop.help.cashOut')}</p>
          <p>{t('results.defeatIncome')}</p>
        </>
      )}
      {section === 'interest' && (
        <>
          <p>{t('codexEconomy.interest')}</p>
          <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--color-metallic-gold)]/30 bg-black/15 p-4">
            <img
              src={getItemArt('charters', 'money_tree').src}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h3 className="mb-2 font-semibold text-[var(--color-golden-yellow)]">
                {t('charters.items.money_tree.name')}
              </h3>
              <p>{t('charters.items.money_tree.description')}</p>
            </div>
          </div>
          <p>{t('results.defeatIncome')}</p>
        </>
      )}
    </div>
  )
}
