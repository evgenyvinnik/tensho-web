/**
 * ShopScreen Component
 *
 * Tea House - between-round shop where players purchase decrees, consumables, and packs.
 * Uses the shopStore for state management and TeaHouseSystem for shop logic.
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController } from '../../game'
import { useShopStore } from '../../stores/shopStore'
import { useDecreeStore, createDecree } from '../../stores/decreeStore'
import { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import { Decree, ImperialCharter, BlessingPack } from '../../systems/types'
import { Button } from '../ui/Button'
import { ConfirmPopup } from '../ui/Popup'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get rarity border color class
 */
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'LocalEdict':
    case 'common':
      return 'border-gray-400'
    case 'RegionalMandate':
    case 'uncommon':
      return 'border-green-500'
    case 'ImperialDecree':
    case 'rare':
      return 'border-blue-500'
    case 'HeavenlyOrdinance':
    case 'legendary':
    case 'mythic':
      return 'border-purple-500'
    default:
      return 'border-gray-400'
  }
}

/**
 * Get item type icon
 */
function getItemTypeIcon(itemType: string): string {
  switch (itemType) {
    case 'Decree':
      return ''
    case 'FateSeal':
      return ''
    case 'CelestialOrb':
      return ''
    case 'BlessingPack':
      return ''
    case 'ImperialCharter':
      return ''
    default:
      return ''
  }
}

/**
 * Get pack size icon
 */
function getPackSizeIcon(size: string): string {
  switch (size) {
    case 'Normal':
      return ''
    case 'Jumbo':
      return ''
    case 'Mega':
      return ''
    default:
      return ''
  }
}

// =============================================================================
// SHOP ITEM CARD COMPONENT
// =============================================================================

interface ShopOfferingCardProps {
  offering: TeaHouseOffering
  canAfford: boolean
  onPurchase: () => void
}

function ShopOfferingCard({ offering, canAfford, onPurchase }: ShopOfferingCardProps) {
  // Extract display info based on item type
  let name = ''
  let description = ''
  let rarity = 'common'
  let icon = getItemTypeIcon(offering.itemType)

  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      name = decree.name
      description = decree.description
      rarity = decree.rarity
      break
    }
    case 'FateSeal':
      name = 'Fate Seal'
      description = 'A mystical seal that alters the current hand'
      rarity = 'uncommon'
      break
    case 'CelestialOrb':
      name = 'Celestial Orb'
      description = 'Permanently upgrades a yaku family'
      rarity = 'uncommon'
      break
    default:
      name = 'Unknown'
      description = ''
  }

  const hasDiscount = offering.baseCost + offering.editionCost > offering.finalCost

  return (
    <div
      className={`flex-shrink-0 w-36 bg-[var(--color-dark-forest)] rounded-lg border-2 ${getRarityColor(
        rarity
      )} p-3 flex flex-col`}
    >
      <div className="text-3xl text-center mb-2">{icon}</div>
      <p className="text-sm text-[var(--color-beige-white)] font-bold text-center truncate">
        {name}
      </p>
      {offering.edition && (
        <p className="text-xs text-blue-300 text-center mt-1">
          {offering.edition}
        </p>
      )}
      <p className="text-xs text-[var(--color-beige-white)] opacity-70 text-center mt-1 line-clamp-2 flex-1">
        {description}
      </p>
      <button
        onClick={onPurchase}
        disabled={!canAfford}
        className={`mt-3 py-2 px-3 rounded text-sm font-bold transition-colors ${
          canAfford
            ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {hasDiscount && (
          <span className="line-through text-gray-400 mr-1 text-xs">
            {offering.baseCost + offering.editionCost}G
          </span>
        )}
        {offering.finalCost}G
      </button>
    </div>
  )
}

// =============================================================================
// BLESSING PACK CARD COMPONENT
// =============================================================================

interface PackOfferingCardProps {
  offering: TeaHouseOffering
  canAfford: boolean
  onPurchase: () => void
}

function PackOfferingCard({ offering, canAfford, onPurchase }: PackOfferingCardProps) {
  const pack = offering.item as BlessingPack
  const icon = getPackSizeIcon(pack.size)

  const packTypeDisplay = {
    Tile: 'Tile Pack',
    Arcana: 'Arcana Pack',
    Celestial: 'Celestial Pack',
    Decree: 'Decree Pack',
    Void: 'Void Pack',
  }[pack.type] || 'Pack'

  const sizeDisplay = {
    Normal: '3 choices, pick 1',
    Jumbo: '5 choices, pick 1',
    Mega: '5 choices, pick 2',
  }[pack.size] || ''

  return (
    <div className="flex-shrink-0 w-28 bg-[var(--color-dark-forest)] rounded-lg border-2 border-[var(--color-metallic-gold)] p-2 flex flex-col items-center">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-xs text-[var(--color-beige-white)] font-bold text-center">
        {pack.size}
      </p>
      <p className="text-xs text-[var(--color-golden-yellow)] text-center">
        {packTypeDisplay}
      </p>
      <p className="text-xs text-[var(--color-beige-white)] opacity-60 text-center mt-1">
        {sizeDisplay}
      </p>
      <button
        onClick={onPurchase}
        disabled={!canAfford}
        className={`mt-2 py-1 px-3 rounded text-sm font-bold transition-colors ${
          canAfford
            ? 'bg-[var(--color-golden-yellow)] text-[var(--color-dark-forest)] hover:opacity-90'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {offering.finalCost}G
      </button>
    </div>
  )
}

// =============================================================================
// CHARTER CARD COMPONENT
// =============================================================================

interface CharterCardProps {
  offering: TeaHouseOffering
  canAfford: boolean
  onPurchase: () => void
}

function CharterCard({ offering, canAfford, onPurchase }: CharterCardProps) {
  const charter = offering.item as ImperialCharter

  return (
    <div className="bg-[var(--color-dark-forest)] rounded-lg p-4">
      <h2 className="text-lg font-bold text-[var(--color-golden-yellow)] mb-3">
        Imperial Charter
      </h2>
      <div className="flex items-center gap-4">
        <div className="text-4xl"></div>
        <div className="flex-1">
          <p className="text-[var(--color-beige-white)] font-bold">{charter.name}</p>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70">
            {charter.description}
          </p>
          {charter.isUpgraded && (
            <span className="text-xs text-blue-400 mt-1 inline-block">Upgraded</span>
          )}
        </div>
        <button
          onClick={onPurchase}
          disabled={!canAfford}
          className={`px-4 py-2 rounded font-bold transition-colors ${
            canAfford
              ? 'bg-[var(--color-vibrant-orange)] text-[var(--color-beige-white)] hover:opacity-90'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {offering.finalCost}G
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN SHOP SCREEN COMPONENT
// =============================================================================

/**
 * ShopScreen - Tea House between-round shop
 */
export function ShopScreen() {
  const { t } = useTranslation()
  const { navigateTo } = useAppNavigation()
  const game = useGameController()

  // Shop store
  const shopStore = useShopStore()

  // Decree store for adding purchased decrees
  const decreeStore = useDecreeStore()

  // Local state for confirmation popup
  const [confirmOffering, setConfirmOffering] = useState<TeaHouseOffering | null>(null)

  // Initialize shop on mount
  useEffect(() => {
    if (!shopStore.isShopOpen) {
      // Get owned decree IDs from decree store
      const ownedDecreeIds = decreeStore.decrees.map((d) => d.id)

      // Determine if this is after a boss round (round 3 of an act)
      const isAfterBossRound = game.currentRound === 3 || game.currentRound === 0

      shopStore.openShop(ownedDecreeIds, isAfterBossRound)
    }
  }, [shopStore, decreeStore.decrees, game.currentRound])

  // Get available offerings
  const availableItems = shopStore.getAvailableItems()
  const availablePacks = shopStore.getAvailablePacks()
  const availableCharter = shopStore.getAvailableCharter()
  const rerollCost = shopStore.currentRerollCost

  // Handle purchase
  const handlePurchase = useCallback(
    (offering: TeaHouseOffering) => {
      const result = shopStore.purchaseItem(
        offering.id,
        game.gold,
        game.currentAct,
        game.currentRound
      )

      if (result.success && result.offering) {
        // Deduct gold from game
        game.purchaseItem(offering.id, result.cost)

        // Handle specific item types
        if (result.offering.itemType === 'Decree') {
          const decree = result.offering.item as Decree
          // Add decree to decree store
          const newDecree = createDecree(
            decree.name,
            decree.name, // Japanese name placeholder
            decree.description,
            decree.rarity === 'LocalEdict' ? 'common' :
            decree.rarity === 'RegionalMandate' ? 'uncommon' :
            decree.rarity === 'ImperialDecree' ? 'rare' : 'legendary',
            [], // Effects will be handled by decree system
            result.offering.sellValue
          )
          decreeStore.addDecree(newDecree)
        } else if (result.offering.itemType === 'ImperialCharter') {
          const charter = result.offering.item as ImperialCharter
          shopStore.applyCharter(charter)
        }
      }

      setConfirmOffering(null)
    },
    [shopStore, game, decreeStore]
  )

  // Handle reroll
  const handleReroll = useCallback(() => {
    const ownedDecreeIds = decreeStore.decrees.map((d) => d.id)
    const result = shopStore.rerollShop(ownedDecreeIds, game.gold)

    if (result.success) {
      game.purchaseItem('reroll', result.cost)
    }
  }, [shopStore, game, decreeStore.decrees])

  // Handle next act
  const handleNextAct = useCallback(() => {
    shopStore.closeShop()
    game.exitShop()
    navigateTo(ROUTES.PLAY)
  }, [shopStore, game, navigateTo])

  // Handle settings
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  return (
    <div className="viewport-full flex flex-col bg-[var(--color-forest-green)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-dark-forest)] text-[var(--color-beige-white)]">
        <span className="text-lg font-bold text-[var(--color-golden-yellow)]">{game.gold}G</span>
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

        {/* Items Section (Decrees, Fate Seals, Celestial Orbs) */}
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
              Reroll {rerollCost}G
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {availableItems.map((offering) => (
              <ShopOfferingCard
                key={offering.id}
                offering={offering}
                canAfford={game.gold >= offering.finalCost}
                onPurchase={() => setConfirmOffering(offering)}
              />
            ))}
            {availableItems.length === 0 && (
              <p className="text-[var(--color-beige-white)] opacity-50 py-8 text-center w-full">
                All items purchased!
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
            {availablePacks.map((offering) => (
              <PackOfferingCard
                key={offering.id}
                offering={offering}
                canAfford={game.gold >= offering.finalCost}
                onPurchase={() => setConfirmOffering(offering)}
              />
            ))}
            {availablePacks.length === 0 && (
              <p className="text-[var(--color-beige-white)] opacity-50 py-4 text-center w-full">
                No packs available
              </p>
            )}
          </div>
        </section>

        {/* Imperial Charter (after boss rounds only) */}
        {availableCharter && (
          <CharterCard
            offering={availableCharter}
            canAfford={game.gold >= availableCharter.finalCost}
            onPurchase={() => setConfirmOffering(availableCharter)}
          />
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-4 bg-[var(--color-dark-forest)]">
        <Button variant="primary" onClick={handleNextAct} className="w-full">
          {t('shop.nextAct')}
        </Button>
      </div>

      {/* Purchase confirmation popup */}
      {confirmOffering && (
        <ConfirmPopup
          isOpen={true}
          onClose={() => setConfirmOffering(null)}
          onConfirm={() => handlePurchase(confirmOffering)}
          title={t('shop.confirmPurchase')}
          message={`Purchase for ${confirmOffering.finalCost}G?`}
          confirmLabel={t('common.buy')}
          cancelLabel={t('common.cancel')}
        />
      )}
    </div>
  )
}
