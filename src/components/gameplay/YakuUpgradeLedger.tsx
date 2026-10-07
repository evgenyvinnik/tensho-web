import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GameOrchestrator } from '../../game/GameOrchestrator'
import {
  DEFAULT_ORB_MAX_LEVEL,
  type YakuCategory,
} from '../../systems/CelestialOrbSystem'
import { illustrationAssets } from '../../utils/assets'
import { Popup } from '../ui/Popup'

const YAKU_KEYS: Record<YakuCategory, string> = {
  Riichi: 'riichi',
  Tanyao: 'tanyao',
  Yakuhai: 'yakuhai',
  Pinfu: 'pinfu',
  Ittsu: 'ittsu',
  Honitsu: 'honitsu',
  Toitoi: 'toitoi',
  Chinitsu: 'chinitsu',
  Sanshoku: 'sanshokuDoujun',
  SevenPairs: 'chiitoitsu',
  Chanta: 'chanta',
  Kokushi: 'kokushiMusou',
  All: 'title',
}

/** Optional run ledger, shared by play and the shop. No automatic overlays. */
export function YakuUpgradeLedger({
  upgrades,
}: {
  upgrades: ReturnType<GameOrchestrator['getYakuUpgradeState']>
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const number = (value: number) => value.toLocaleString(i18n.resolvedLanguage)
  const title = t('yakuUpgrades.title')
  return (
    <>
      <button
        type="button"
        data-testid="yaku-upgrades-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-[var(--color-metallic-gold)]/40 bg-[var(--color-dark-forest)] px-2 py-1 text-left text-[var(--color-beige-white)] hover:border-[var(--color-golden-yellow)] focus-visible:outline-2 focus-visible:outline-amber-300"
      >
        <img
          src={illustrationAssets.yakuLedger}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 object-contain"
        />
        <span className="min-w-0 break-words text-xs">
          <span className="block font-semibold">{title}</span>
          <span className="block opacity-70">
            {t('yakuUpgrades.summary', { total: number(upgrades.length) })}
          </span>
        </span>
      </button>
      <Popup isOpen={open} onClose={() => setOpen(false)} title={title}>
        <div
          className="space-y-4 text-sm [overflow-wrap:anywhere]"
          data-testid="yaku-upgrades-ledger"
        >
          <img
            src={illustrationAssets.yakuLedger}
            alt=""
            width={64}
            height={64}
            className="mx-auto h-12 w-12 object-contain sm:h-16 sm:w-16"
          />
          {upgrades.length === 0 ? (
            <p className="rounded-lg border border-white/15 bg-black/20 p-3">
              {t('yakuUpgrades.empty')}
            </p>
          ) : (
            <ul className="space-y-3" aria-label={title}>
              {upgrades.map((upgrade) => (
                <li
                  key={upgrade.yaku}
                  data-yaku-upgrade={upgrade.yaku}
                  className="rounded-lg border border-[var(--color-metallic-gold)]/40 bg-black/20 p-3"
                >
                  <h3 className="text-sm font-semibold text-[var(--color-golden-yellow)]">
                    {t(`yaku.${YAKU_KEYS[upgrade.yaku]}`)}
                  </h3>
                  <p className="mt-1">
                    {t('yakuUpgrades.level', {
                      level: number(upgrade.level),
                      max: number(DEFAULT_ORB_MAX_LEVEL),
                    })}
                  </p>
                  <p className="mt-2 text-emerald-200">
                    {t('yakuUpgrades.bonus', {
                      chips: number(upgrade.chips),
                      mult: number(upgrade.mult),
                    })}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    {t('yakuUpgrades.triggers', {
                      total: number(upgrade.timesScored),
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <details className="text-xs opacity-80">
            <summary className="min-h-11 cursor-pointer py-3 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-300">
              {t('yakuUpgrades.help')}
            </summary>
            <div className="space-y-3">
              <p>{t('yakuUpgrades.intro')}</p>
              <p>{t('yakuUpgrades.baseline')}</p>
              <p>{t('yakuUpgrades.note')}</p>
            </div>
          </details>
        </div>
      </Popup>
    </>
  )
}
