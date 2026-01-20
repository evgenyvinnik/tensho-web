/**
 * ShopScreen Component
 *
 * Tea House - between-round shop where players purchase decrees, consumables, and packs.
 * Uses the GameOrchestrator via useGameController for purchases.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController } from '../../game'
import { Button } from '../ui/Button'
import { Popup, ConfirmPopup } from '../ui/Popup'

/**
 * Shop item types
 */
interface ShopItem {
  id: string
  name: string
  description: string
  cost: number
  type: 'decree' | 'fateSeal' | 'celestialOrb' | 'charter'
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic'
}

/**
 * Blessing pack types
 */
interface BlessingPack {
  id: string
  name: string
  description: string
  cost: number
  size: 'normal' | 'jumbo' | 'mega'
}

/**
 * Generate shop items (simplified for now)
 */
function generateShopItems(): ShopItem[] {
  return [
    {
      id: 'decree_1',
      name: 'River Tax',
      description: 'Gain 1 Gold per tile discarded this round.',
      cost: 4,
      type: 'decree',
      rarity: 'common',
    },
    {
      id: 'decree_2',
      name: 'Extended Hand Grant',
      description: '+3 additional draws before round failure.',
      cost: 5,
      type: 'decree',
      rarity: 'common',
    },
    {
      id: 'decree_3',
      name: 'Moonlit Seal',
      description: 'Each Honor tile adds +0.1x multiplier.',
      cost: 6,
      type: 'decree',
      rarity: 'uncommon',
    },
  ]
}

/**
 * Generate blessing packs
 */
function generateBlessingPacks(): BlessingPack[] {
  return [
    {
      id: 'pack_normal',
      name: 'Standard Pack',
      description: '3 Fate Seals, choose 1',
      cost: 4,
      size: 'normal',
    },
    {
      id: 'pack_jumbo',
      name: 'Premium Pack',
      description: '5 Celestial Orbs, choose 1',
      cost: 8,
      size: 'jumbo',
    },
  ]
}

/**
 * Get rarity color
 */
function getRarityColor(rarity: ShopItem['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'border-gray-400'
    case 'uncommon':
      return 'border-green-500'
    case 'rare':
      return 'border-blue-500'
    case 'mythic':
      return 'border-purple-500'
    default:
      return 'border-gray-400'
  }
}

/**
 * Shop Item Card Component
 */
interface ShopItemCardProps {
  item: ShopItem
  canAfford: boolean
  onPurchase: () => void
}

function ShopItemCard({ item, canAfford, onPurchase }: ShopItemCardProps) {
  return (
    <div
      className={`flex-shrink-0 w-32 bg-[var(--color-dark-forest)] rounded-lg border-2 ${getRarityColor(
        item.rarity
      )} p-2 flex flex-col`}
    >
      <div className="text-3xl text-center mb-2">📜</div>
      <p className="text-xs text-[var(--color-beige-white)] font-bold text-center truncate">
        {item.name}
      </p>
      <p className="text-xs text-[var(--color-beige-white)] opacity-70 text-center mt-1 line-clamp-2 flex-1">
        {item.description}
      </p>
      <button
        onClick={onPurchase}
        disabled={!canAfford}
        className={`mt-2 py-1 px-2 rounded text-xs font-bold transition-colors ${
          canAfford
            ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        ¥{item.cost}
      </button>
    </div>
  )
}

/**
 * Blessing Pack Card Component
 */
interface BlessingPackCardProps {
  pack: BlessingPack
  canAfford: boolean
  onPurchase: () => void
}

function BlessingPackCard({ pack, canAfford, onPurchase }: BlessingPackCardProps) {
  const emoji = pack.size === 'normal' ? '🎴' : pack.size === 'jumbo' ? '🌟' : '✨'

  return (
    <div className="flex-shrink-0 w-24 bg-[var(--color-dark-forest)] rounded-lg border-2 border-[var(--color-metallic-gold)] p-2 flex flex-col items-center">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="text-xs text-[var(--color-beige-white)] font-bold text-center">{pack.name}</p>
      <p className="text-xs text-[var(--color-beige-white)] opacity-70 text-center mt-1">
        {pack.description}
      </p>
      <button
        onClick={onPurchase}
        disabled={!canAfford}
        className={`mt-2 py-1 px-2 rounded text-xs font-bold transition-colors ${
          canAfford
            ? 'bg-[var(--color-golden-yellow)] text-[var(--color-dark-forest)] hover:opacity-90'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        ¥{pack.cost}
      </button>
    </div>
  )
}

/**
 * ShopScreen - Tea House between-round shop
 */
export function ShopScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const game = useGameController()

  // Shop state
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => generateShopItems())
  const [blessingPacks] = useState<BlessingPack[]>(() => generateBlessingPacks())
  const [rerollCost, setRerollCost] = useState(5)
  const [rerollCount, setRerollCount] = useState(0)

  // Confirmation popup state
  const [confirmPurchase, setConfirmPurchase] = useState<ShopItem | BlessingPack | null>(null)

  // Handle purchase
  const handlePurchase = useCallback(
    (item: ShopItem | BlessingPack) => {
      if (game.gold >= item.cost) {
        game.purchaseItem(item.id, item.cost)

        // Remove purchased item from shop (for decrees)
        if ('type' in item) {
          setShopItems((prev) => prev.filter((i) => i.id !== item.id))
        }
      }
      setConfirmPurchase(null)
    },
    [game]
  )

  // Handle reroll
  const handleReroll = useCallback(() => {
    if (game.gold >= rerollCost) {
      game.purchaseItem('reroll', rerollCost)
      setShopItems(generateShopItems())
      setRerollCount((prev) => prev + 1)
      setRerollCost((prev) => prev + 1)
    }
  }, [game, rerollCost])

  // Handle next act
  const handleNextAct = useCallback(() => {
    game.exitShop()
    navigateTo(ROUTES.PLAY)
  }, [game, navigateTo])

  // Handle settings
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">¥{game.gold}</span>
        <span className="text-lg font-bold">{t('shop.title')}</span>
        <button
          onClick={handleSettings}
          className="p-2 rounded hover:bg-[var(--color-forest-green)] min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={t('menu.settings')}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
          </svg>
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Round complete banner */}
        <div className="bg-[var(--color-dark-forest)] rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-[var(--color-golden-yellow)]">
            Act {game.currentAct} Complete!
          </p>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mt-1">
            Visit the Tea House to prepare for the next act
          </p>
        </div>

        {/* Decrees Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[var(--color-golden-yellow)]">
              {t('shop.decrees')}
            </h2>
            <button
              onClick={handleReroll}
              disabled={game.gold < rerollCost}
              className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                game.gold >= rerollCost
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Reroll ¥{rerollCost}
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {shopItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                canAfford={game.gold >= item.cost}
                onPurchase={() => setConfirmPurchase(item)}
              />
            ))}
            {shopItems.length === 0 && (
              <p className="text-[var(--color-beige-white)] opacity-50 py-8 text-center w-full">
                All decrees purchased!
              </p>
            )}
          </div>
        </section>

        {/* Blessing Packs Section */}
        <section>
          <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-3">
            {t('shop.packs')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {blessingPacks.map((pack) => (
              <BlessingPackCard
                key={pack.id}
                pack={pack}
                canAfford={game.gold >= pack.cost}
                onPurchase={() => setConfirmPurchase(pack)}
              />
            ))}
          </div>
        </section>

        {/* Imperial Charter (post-boss) */}
        <section className="bg-[var(--color-dark-forest)] rounded-lg p-4">
          <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-3">
            Imperial Charter
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl">🏛️</div>
            <div className="flex-1">
              <p className="text-[var(--color-beige-white)] font-bold">Abundant Stock</p>
              <p className="text-sm text-[var(--color-beige-white)] opacity-70">
                +1 item slot in shop permanently
              </p>
            </div>
            <button
              disabled={game.gold < 10}
              className={`px-4 py-2 rounded font-bold transition-colors ${
                game.gold >= 10
                  ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              ¥10
            </button>
          </div>
        </section>
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-4 bg-[var(--color-dark-forest)]">
        <Button variant="primary" onClick={handleNextAct} className="w-full">
          {t('shop.nextAct')} →
        </Button>
      </div>

      {/* Purchase confirmation popup */}
      {confirmPurchase && (
        <ConfirmPopup
          isOpen={true}
          onClose={() => setConfirmPurchase(null)}
          onConfirm={() => handlePurchase(confirmPurchase)}
          title={t('shop.confirmPurchase')}
          message={`Purchase ${confirmPurchase.name} for ¥${confirmPurchase.cost}?`}
          confirmLabel={t('common.buy')}
          cancelLabel={t('common.cancel')}
        />
      )}
    </div>
  )
}
