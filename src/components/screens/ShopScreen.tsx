/**
 * Shop Screen Component (Tea House)
 * Layout based on ARCHITECTURE.MD Shop specification
 */

import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'
import { useGameStore } from '../../stores/gameStore'
import { useAppNavigation, ROUTES } from '../../router'

export function ShopScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const { gold, nextAct, setPhase } = useGameStore()

  const handleNextRound = () => {
    nextAct()
    setPhase('gameplay')
    navigateTo(ROUTES.PLAY)
  }

  const handleSettings = () => {
    navigateTo(ROUTES.SETTINGS)
  }

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-dark-forest)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-forest-green)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{gold}</span>
        <span className="text-lg text-[var(--color-beige-white)]">{t('results.roundComplete')}</span>
        <button
          onClick={handleSettings}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-beige-white)]"
          aria-label={t('menu.settings')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </div>

      {/* Shop items */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Shop title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-decorative text-[var(--color-golden-yellow)]">{t('shop.title')}</h2>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70">{t('shop.titleJp')}</p>
        </div>

        {/* Row 1 - Decrees and Seals */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {[
            { name: 'River Tax', type: t('decrees.title'), price: 5 },
            { name: 'Phantom Terminal', type: t('decrees.title'), price: 8 },
            { name: 'Lightning', type: 'SEAL', price: 3, icon: '⚡' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 p-3 bg-[var(--color-forest-green)] rounded-lg border-2 border-[var(--color-metallic-gold)] text-center cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-xs text-[var(--color-golden-yellow)]">{item.type}</p>
              <p className="text-lg my-2">{item.icon || '📜'}</p>
              <p className="text-sm text-[var(--color-beige-white)] mb-1">{item.name}</p>
              <p className="text-sm text-[var(--color-golden-yellow)]">¥{item.price}</p>
            </div>
          ))}
        </div>

        {/* Row 2 - Packs */}
        <div className="flex gap-3 mb-4">
          {[
            { name: 'Standard Pack', price: 4 },
            { name: 'Premium Pack', price: 6 },
          ].map((item, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 p-3 bg-[var(--color-forest-green)] rounded-lg border-2 border-[var(--color-metallic-gold)] text-center cursor-pointer hover:scale-105 transition-transform"
            >
              <p className="text-xs text-[var(--color-golden-yellow)]">PACK</p>
              <p className="text-3xl my-2">📦</p>
              <p className="text-sm text-[var(--color-beige-white)] mb-1">{item.name}</p>
              <p className="text-sm text-[var(--color-golden-yellow)]">¥{item.price}</p>
            </div>
          ))}
        </div>

        {/* Imperial Charter */}
        <div className="p-4 bg-[var(--color-forest-green)] rounded-lg border-2 border-[var(--color-golden-yellow)]">
          <p className="text-sm text-[var(--color-golden-yellow)] mb-1">IMPERIAL CHARTER</p>
          <p className="text-lg text-[var(--color-beige-white)] font-bold">Abundant Stock</p>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mb-2">+1 shop slot</p>
          <p className="text-lg text-[var(--color-golden-yellow)]">¥10</p>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex justify-center gap-4 px-4 py-4 border-t border-[var(--color-forest-green)]">
        <Button variant="secondary" size="md">
          {t('shop.rerollCost', { cost: 5 })}
        </Button>
        <Button variant="primary" size="md" onClick={handleNextRound}>
          {t('shop.nextAct')} →
        </Button>
      </div>
    </div>
  )
}

export default ShopScreen
