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
 * Uses the run-owned ShopSession for purchases and pack settlement.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation, ROUTES } from '../../router'
import { useGameController, useGameEvent } from '../../game/useGameController'
import { useProgressiveTutorial } from '../../hooks/useProgressiveTutorial'
import { getProgressiveHints } from '../../config/progressiveTutorialHints'
import { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { ShopResult } from '../../game/ShopSession'
import type { BlessingPack, ImperialCharter } from '../../systems/types'
import { Button } from '../ui/Button'
import { ConfirmPopup } from '../ui/Popup'
import { ShopHeader } from '../shop/ShopHeader'
import { ShopItemCard } from '../shop/ShopItemCard'
import { PackCard } from '../shop/PackCard'
import { CharterCard } from '../shop/CharterCard'
import { RoundCashOutBanner } from '../shop/RoundCashOutBanner'
import { PackOpeningModal } from '../shop/PackOpeningModal'
import { ProgressiveHintOverlay } from '../ui/ProgressiveHint'
import { backgroundAssets } from '../../utils/assets'
import { useItemText } from '../../i18n/useItemText'

// =============================================================================
// MAIN SHOP SCREEN COMPONENT
// =============================================================================

/**
 * ShopScreen - Tea House between-round shop
 */
export function ShopScreen() {
  const { t, i18n } = useTranslation()
  const itemText = useItemText()
  const { navigateTo } = useAppNavigation()
  const game = useGameController()
  const tutorialHints = useMemo(() => getProgressiveHints(t), [t])
  const tutorial = useProgressiveTutorial(tutorialHints)
  const hasTriggeredShopHint = useRef(false)

  const shop = game.shop

  // Local state
  const [confirmOffering, setConfirmOffering] =
    useState<TeaHouseOffering | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const currentPackOffering = shop.pendingPack
  const [shopError, setShopError] = useState<string | null>(null)

  useEffect(() => {
    if (hasTriggeredShopHint.current) return
    hasTriggeredShopHint.current = true
    const timer = window.setTimeout(
      () => tutorial.triggerHints('shopEntered'),
      700
    )
    return () => window.clearTimeout(timer)
  }, [tutorial])

  useGameEvent(
    'decreeAcquired',
    useCallback(() => tutorial.triggerHints('decreeAcquired'), [tutorial])
  )

  // Idempotent across rerenders and route changes; the run owns this visit.
  useEffect(() => {
    shop.open()
  }, [shop, game.phase])

  const shopState = shop.state
  const availableItems = shopState.itemOfferings.filter((o) => !o.isPurchased)
  const availablePacks = shopState.packOfferings.filter((o) => !o.isPurchased)
  const availableCharter = shopState.charterOffering?.isPurchased
    ? null
    : shopState.charterOffering
  const rerollCost = shopState.currentRerollCost
  const roundSummary = game.state.lastRoundSummary
  const interestCap =
    game.state.charterSystem.calculateEffects().interestCap +
    game.state.omenSystem.getInterestCapBonus()

  // Handle item selection (tap to view details)
  const handleItemSelect = useCallback((offering: TeaHouseOffering) => {
    setSelectedItemId((prev) => (prev === offering.id ? null : offering.id))
  }, [])

  const showResult = useCallback(
    (result: ShopResult) => {
      if (result.success) {
        setShopError(null)
      } else {
        const key =
          result.reason === 'notEnoughGold'
            ? 'shop.cantAfford'
            : result.reason === 'inventoryFull'
              ? 'shop.inventoryFull'
              : 'shop.purchaseFailed'
        setShopError(t(key))
      }
    },
    [t]
  )

  const handleItemPurchase = useCallback(
    (offering: TeaHouseOffering) => {
      const result = shop.purchase(offering.id)
      showResult(result)
      if (result.success) setSelectedItemId(null)
      setConfirmOffering(null)
    },
    [shop, showResult]
  )

  const handlePackPurchase = handleItemPurchase

  const handlePackConfirm = useCallback(
    (indices: number[]) => {
      showResult(shop.confirmPack(indices))
    },
    [shop, showResult]
  )

  const handlePackSkip = useCallback(() => {
    showResult(shop.skipPack())
  }, [shop, showResult])

  const handleReroll = useCallback(() => {
    showResult(shop.reroll())
  }, [shop, showResult])

  const handleNextRound = useCallback(() => {
    if (shop.pendingPack) return
    game.exitShop()
    navigateTo(ROUTES.PLAY)
  }, [shop, game, navigateTo])

  // Handle settings
  const handleSettings = useCallback(() => {
    navigateTo(ROUTES.SETTINGS)
  }, [navigateTo])

  return (
    <div className="viewport-full relative isolate flex flex-col overflow-hidden bg-[var(--color-forest-green)]">
      <div
        aria-hidden="true"
        className="immersive-background absolute inset-0"
        style={{ backgroundImage: `url("${backgroundAssets.shop}")` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-dark-forest)]/45"
      />

      {/* Header with gold, reroll, settings */}
      <ShopHeader
        gold={game.gold}
        rerollCost={rerollCost}
        canAffordReroll={game.gold >= rerollCost}
        onReroll={handleReroll}
        onSettings={handleSettings}
        rerollCount={shopState.rerollsThisVisit}
      />

      {/* Content area */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="screen-canvas pb-4">
          {/* Round payoff and next challenge — informative, never modal. */}
          {roundSummary ? (
            <RoundCashOutBanner
              summary={roundSummary}
              currentGold={game.gold}
              nextActNumber={game.nextActNumber}
              interestCap={interestCap}
              interestBlocked={game.state.omenSystem.isInterestBlocked()}
            />
          ) : (
            <div className="mx-3 mt-3 rounded-xl border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] p-4 text-center sm:mx-5 sm:mt-4">
              <p className="text-xl font-bold text-[var(--color-golden-yellow)] font-decorative">
                {t('shop.title', 'Tea House')}
              </p>
              <p className="mt-1 text-sm text-[var(--color-beige-white)]/65">
                {t('shop.ui.subtitle')}
              </p>
            </div>
          )}

          <div className="grid items-start gap-5 px-3 pt-5 sm:px-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:gap-6 lg:pt-6">
            {/* Items Section (Decrees, Fate Seals, Celestial Orbs) */}
            <section className="min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="min-w-0 break-words text-xl font-bold text-[var(--color-golden-yellow)]">
                  {t('shop.ui.items')}
                  <span className="mt-1 block text-sm font-normal text-[var(--color-metallic-gold)]">
                    {t('shop.ui.availableCount', {
                      count: availableItems.length,
                    })}
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
                {availableItems.map((offering) => (
                  <ShopItemCard
                    key={offering.id}
                    offering={offering}
                    canAfford={game.gold >= offering.finalCost}
                    onPurchase={() => handleItemPurchase(offering)}
                    onSelect={() => handleItemSelect(offering)}
                    isSelected={selectedItemId === offering.id}
                  />
                ))}
                {availableItems.length === 0 && (
                  <div className="col-span-full w-full py-8 text-center">
                    <p className="text-[var(--color-beige-white)] opacity-50">
                      {t('shop.ui.allPurchased')}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Blessing Packs Section */}
            <section className="min-w-0">
              <h2 className="mb-4 break-words text-xl font-bold text-[var(--color-golden-yellow)]">
                {t('shop.ui.packs')}
              </h2>

              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
                  <div className="col-span-full w-full py-4 text-center">
                    <p className="text-[var(--color-beige-white)] opacity-50">
                      {t('shop.ui.noPacks')}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Imperial Charter Section (after boss rounds only) */}
          {availableCharter && (
            <section className="mx-3 mt-6 mb-4 sm:mx-5">
              <h2 className="mb-4 break-words text-xl font-bold text-[var(--color-golden-yellow)]">
                {t('shop.ui.imperialCharter')}
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
      </div>

      {/* Bottom action bar */}
      {shopError && (
        <div
          role="alert"
          className="screen-canvas mb-2 rounded-lg border border-red-400/60 bg-red-950/70 px-3 py-2 text-center text-sm text-red-100"
        >
          {shopError}
        </div>
      )}

      <div className="flex-shrink-0 border-t-2 border-[var(--color-saddle-brown)] bg-[var(--color-dark-forest)] safe-area-bottom">
        <div className="screen-canvas px-3 py-3 sm:px-5 sm:py-4">
          <Button
            variant="primary"
            onClick={handleNextRound}
            className="w-full text-lg"
          >
            {t('shop.ui.nextRound')}
          </Button>
        </div>
      </div>

      {/* Purchase confirmation popup */}
      {confirmOffering && (
        <ConfirmPopup
          isOpen={true}
          onClose={() => setConfirmOffering(null)}
          onConfirm={() => handleItemPurchase(confirmOffering)}
          title={t('shop.ui.confirmPurchase')}
          message={t('shop.ui.purchasePrompt', {
            name: itemText.name(
              'charters',
              confirmOffering.item as ImperialCharter
            ),
            cost: confirmOffering.finalCost.toLocaleString(
              i18n.resolvedLanguage
            ),
          })}
          confirmText={t('shop.buy')}
          cancelText={t('common.cancel', 'Cancel')}
        />
      )}

      {/* Pack opening modal */}
      <PackOpeningModal
        isOpen={currentPackOffering !== null}
        packOffering={currentPackOffering}
        onConfirm={handlePackConfirm}
        onSkip={handlePackSkip}
        canConfirmSelection={(indices) =>
          shop.validatePackSelection(indices).success
        }
        error={shopError}
      />

      <ProgressiveHintOverlay
        hint={tutorial.currentHint}
        onDismiss={tutorial.dismissHint}
        onDisableHints={tutorial.disableHints}
        queueCount={tutorial.hintQueue.length}
      />
    </div>
  )
}

export default ShopScreen
