/**
 * ShopScreen Component (Tea House / 茶寮)
 *
 * Full Tea House shop interface for Tensho Mahjong Roguelike.
 * Features:
 * - Item Slots (2-4 slots): Random items (Decrees, Fate Seals, Celestial Orbs)
 * - Blessing Packs (2 packs): Booster packs with random contents
 * - Imperial Charter (1 slot): Voucher-style permanent upgrade (after boss rounds)
 * - Reroll Button: Refresh item slots (5 gold base, +1 per reroll)
 * - Gold Display: Current gold amount
 * - Next Round Button: Proceed to next round
 *
 * Uses the shopStore for state management and TeaHouseSystem for shop logic.
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController } from '../../game/useGameController'
import { useShopStore } from '../../stores/shopStore'
import { useDecreeStore, createDecree } from '../../stores/decreeStore'
import { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import { BlessingPackSystem, PackOffering } from '../../systems/BlessingPackSystem'
import { Decree, ImperialCharter, BlessingPack } from '../../systems/types'
import { Button } from '../ui/Button'
import { ConfirmPopup } from '../ui/Popup'
import { ShopHeader } from '../shop/ShopHeader'
import { ShopItemCard } from '../shop/ShopItemCard'
import { PackCard } from '../shop/PackCard'
import { CharterCard } from '../shop/CharterCard'
import { PackOpeningModal } from '../shop/PackOpeningModal'

// =============================================================================
// BLESSING PACK SYSTEM INSTANCE
// =============================================================================

// Create a singleton instance for pack management
const blessingPackSystem = new BlessingPackSystem()

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

  // Local state
  const [confirmOffering, setConfirmOffering] = useState<TeaHouseOffering | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [packModalOpen, setPackModalOpen] = useState(false)
  const [currentPackOffering, setCurrentPackOffering] = useState<PackOffering | null>(null)
  const [purchasedPackId, setPurchasedPackId] = useState<string | null>(null)

  // Initialize shop on mount
  useEffect(() => {
    if (!shopStore.isShopOpen) {
      // Get owned decree IDs from decree store
      const ownedDecreeIds = decreeStore.decrees.map((d) => d.id)

      // Determine if this is after a boss round (round 3 of an act)
      const isAfterBossRound = game.currentRound === 3 || game.currentRound === 0

      shopStore.openShop(ownedDecreeIds, isAfterBossRound)

      // Generate pack offerings
      blessingPackSystem.generatePackOfferings({
        ownedDecreeIds,
        currentAct: game.currentAct,
      })
    }
  }, [shopStore, decreeStore.decrees, game.currentRound, game.currentAct])

  // Get available offerings
  const availableItems = shopStore.getAvailableItems()
  const availablePacks = shopStore.getAvailablePacks()
  const availableCharter = shopStore.getAvailableCharter()
  const rerollCost = shopStore.currentRerollCost
  const packOfferings = blessingPackSystem.getCurrentOfferings()

  // Handle item selection (tap to view details)
  const handleItemSelect = useCallback((offering: TeaHouseOffering) => {
    setSelectedItemId((prev) => (prev === offering.id ? null : offering.id))
  }, [])

  // Handle item purchase
  const handleItemPurchase = useCallback(
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
            decree.rarity === 'LocalEdict'
              ? 'common'
              : decree.rarity === 'RegionalMandate'
                ? 'uncommon'
                : decree.rarity === 'ImperialDecree'
                  ? 'rare'
                  : 'legendary',
            [], // Effects will be handled by decree system
            result.offering.sellValue
          )
          decreeStore.addDecree(newDecree)
        } else if (result.offering.itemType === 'ImperialCharter') {
          const charter = result.offering.item as ImperialCharter
          shopStore.applyCharter(charter)
        }

        setSelectedItemId(null)
      }

      setConfirmOffering(null)
    },
    [shopStore, game, decreeStore]
  )

  // Handle pack purchase
  const handlePackPurchase = useCallback(
    (offering: TeaHouseOffering) => {
      const pack = offering.item as BlessingPack

      // Check if player can afford
      if (game.gold < offering.finalCost) return

      // Purchase the pack
      const result = shopStore.purchaseItem(
        offering.id,
        game.gold,
        game.currentAct,
        game.currentRound
      )

      if (result.success) {
        game.purchaseItem(offering.id, result.cost)

        // Find the corresponding pack offering in the system
        const packOfferingFromSystem = packOfferings.find((p) => p.pack.id === pack.id)

        if (packOfferingFromSystem) {
          // Open the pack
          const opened = blessingPackSystem.openPack(pack.id)
          if (opened) {
            setCurrentPackOffering(opened)
            setPurchasedPackId(pack.id)
            setPackModalOpen(true)
          }
        }
      }
    },
    [shopStore, game, packOfferings]
  )

  // Handle pack opening confirmation
  const handlePackConfirm = useCallback(
    (selectedIndices: number[]) => {
      if (!currentPackOffering || !purchasedPackId) return

      // Update selection in the system
      for (const index of selectedIndices) {
        blessingPackSystem.selectContent(purchasedPackId, index)
      }

      // Get selected contents
      const selectedContents = blessingPackSystem.confirmSelection(purchasedPackId)

      // Apply selected contents (simplified - just add decrees for now)
      for (const content of selectedContents) {
        if (content.type === 'Decree') {
          const decree = content.data as Decree
          const newDecree = createDecree(
            decree.name,
            decree.name,
            decree.description,
            content.rarity === 'common'
              ? 'common'
              : content.rarity === 'uncommon'
                ? 'uncommon'
                : content.rarity === 'rare'
                  ? 'rare'
                  : 'legendary',
            [],
            0
          )
          decreeStore.addDecree(newDecree)
        }
        // Other content types would be handled here
      }

      setPackModalOpen(false)
      setCurrentPackOffering(null)
      setPurchasedPackId(null)
    },
    [currentPackOffering, purchasedPackId, decreeStore]
  )

  // Handle pack skip
  const handlePackSkip = useCallback(() => {
    if (purchasedPackId) {
      blessingPackSystem.skipPack(purchasedPackId)
    }

    setPackModalOpen(false)
    setCurrentPackOffering(null)
    setPurchasedPackId(null)
  }, [purchasedPackId])

  // Handle reroll
  const handleReroll = useCallback(() => {
    const ownedDecreeIds = decreeStore.decrees.map((d) => d.id)
    const result = shopStore.rerollShop(ownedDecreeIds, game.gold)

    if (result.success) {
      game.purchaseItem('reroll', result.cost)
    }
  }, [shopStore, game, decreeStore.decrees])

  // Handle next round
  const handleNextRound = useCallback(() => {
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
      {/* Header with gold, reroll, settings */}
      <ShopHeader
        gold={game.gold}
        rerollCost={rerollCost}
        canAffordReroll={game.gold >= rerollCost}
        onReroll={handleReroll}
        onSettings={handleSettings}
        rerollCount={shopStore.rerollsThisVisit}
      />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Round complete banner */}
        <div className="mx-4 mt-4 bg-[var(--color-dark-forest)] rounded-xl p-4 text-center border-2 border-[var(--color-metallic-gold)]">
          <p className="text-2xl font-bold text-[var(--color-golden-yellow)] font-decorative">
            {t('shop.roundComplete', 'Round Complete!')}
          </p>
          <p className="text-sm text-[var(--color-beige-white)] opacity-70 mt-1">
            {t('shop.subtitle', 'Visit the Tea House to prepare for the next challenge')}
          </p>
          <p className="text-lg text-[var(--color-metallic-gold)] mt-2">
            {t('gameplay.act', 'Act')} {game.currentAct} - {t('gameplay.round', 'Round')}{' '}
            {game.currentRound}
          </p>
        </div>

        {/* Items Section (Decrees, Fate Seals, Celestial Orbs) */}
        <section className="px-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
              {t('shop.items', 'Items')}
              <span className="text-sm text-[var(--color-metallic-gold)] ml-2 font-normal">
                ({availableItems.length} available)
              </span>
            </h2>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {availableItems.map((offering) => (
              <ShopItemCard
                key={offering.id}
                offering={offering}
                canAfford={game.gold >= offering.finalCost}
                onPurchase={() => setConfirmOffering(offering)}
                onSelect={() => handleItemSelect(offering)}
                isSelected={selectedItemId === offering.id}
              />
            ))}
            {availableItems.length === 0 && (
              <div className="w-full py-8 text-center">
                <p className="text-[var(--color-beige-white)] opacity-50">
                  {t('shop.allPurchased', 'All items purchased!')}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Blessing Packs Section */}
        <section className="px-4 mt-6">
          <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative mb-4">
            {t('shop.packs', 'Blessing Packs')}
            <span className="text-sm text-[var(--color-metallic-gold)] ml-2 font-normal">
              \u795D\u798F\u888B
            </span>
          </h2>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {availablePacks.map((offering) => {
              const pack = offering.item as BlessingPack
              return (
                <PackCard
                  key={offering.id}
                  pack={pack}
                  finalCost={offering.finalCost}
                  canAfford={game.gold >= offering.finalCost}
                  onPurchase={() => handlePackPurchase(offering)}
                />
              )
            })}
            {availablePacks.length === 0 && (
              <div className="w-full py-4 text-center">
                <p className="text-[var(--color-beige-white)] opacity-50">
                  {t('shop.noPacks', 'No packs available')}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Imperial Charter Section (after boss rounds only) */}
        {availableCharter && (
          <section className="px-4 mt-6 mb-4">
            <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative mb-4">
              {t('shop.imperialCharter', 'Imperial Charter')}
              <span className="text-sm text-[var(--color-metallic-gold)] ml-2 font-normal">
                \u7687\u52C5
              </span>
            </h2>

            <CharterCard
              charter={availableCharter.item as ImperialCharter}
              finalCost={availableCharter.finalCost}
              canAfford={game.gold >= availableCharter.finalCost}
              onPurchase={() => setConfirmOffering(availableCharter)}
            />
          </section>
        )}

        {/* Spacer for bottom padding */}
        <div className="h-4" />
      </div>

      {/* Bottom action bar */}
      <div className="px-4 py-4 bg-[var(--color-dark-forest)] border-t-2 border-[var(--color-saddle-brown)]">
        <Button variant="primary" onClick={handleNextRound} className="w-full text-lg">
          {t('shop.nextRound', 'Continue to Next Round')}
        </Button>
      </div>

      {/* Purchase confirmation popup */}
      {confirmOffering && (
        <ConfirmPopup
          isOpen={true}
          onClose={() => setConfirmOffering(null)}
          onConfirm={() => handleItemPurchase(confirmOffering)}
          title={t('shop.confirmPurchase', 'Confirm Purchase')}
          message={`${t('shop.purchaseFor', 'Purchase for')} ${confirmOffering.finalCost}G?`}
          confirmText={t('common.buy', 'Buy')}
          cancelText={t('common.cancel', 'Cancel')}
        />
      )}

      {/* Pack opening modal */}
      <PackOpeningModal
        isOpen={packModalOpen}
        packOffering={currentPackOffering}
        onConfirm={handlePackConfirm}
        onSkip={handlePackSkip}
        onClose={() => setPackModalOpen(false)}
      />
    </div>
  )
}

export default ShopScreen
