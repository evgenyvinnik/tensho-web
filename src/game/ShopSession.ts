import type { GameOrchestrator } from './GameOrchestrator'
import { eventBus } from './EventBus'
import {
  TeaHouseSystem,
  TEA_HOUSE_BASE_CHARTERS,
  TEA_HOUSE_UPGRADED_CHARTERS,
  type TeaHouseOffering,
} from '../systems/TeaHouseSystem'
import {
  BlessingPackSystem,
  type PackContent,
  type PackOffering,
} from '../systems/BlessingPackSystem'
import { DecreeSystem } from '../systems/DecreeSystem'
import { runRandom } from './RunRandom'
import { FlowerSystem } from '../systems/FlowerSystem'
import { acceptsFlowerCatalyst } from '../systems/flowerCatalysts'
import type { BlessingPack, Decree, ImperialCharter } from '../systems/types'
import type { FateSeal } from '../systems/FateSealSystem'
import type { CelestialOrb } from '../systems/CelestialOrbSystem'
import type { VoidScript } from '../systems/VoidScriptSystem'
import { Tile } from '../core/Tile'

export type ShopFailure =
  | 'unavailable'
  | 'notEnoughGold'
  | 'inventoryFull'
  | 'flowerRequirement'
  | 'invalidSelection'
export type ShopResult =
  | { success: true }
  | { success: false; reason: ShopFailure }
type Reward = { type: PackContent['type']; data: unknown }
export type ShopPayment =
  | { type: 'gold' }
  | { type: 'flower'; flowerId: string }
type PurchasePlan =
  | {
      success: true
      offering: TeaHouseOffering
      cost: number
      flowerId?: string
      pack?: PackOffering
      reward?: Reward
    }
  | Extract<ShopResult, { success: false }>
const OK: ShopResult = { success: true }
const fail = (
  reason: ShopFailure
): Extract<ShopResult, { success: false }> => ({ success: false, reason })

export interface ShopSessionState {
  teaHouse: ReturnType<TeaHouseSystem['toSerializedState']>
  packs: ReturnType<BlessingPackSystem['toState']>
  opened: boolean
  pendingPackId: string | null
  spent: number
  purchases: number
}

/** One run's marketplace. UI and simulations must use this acquisition path.
 * Preflight a whole operation before payment; publish events after settlement.
 * A bought pack stays pending until claimed or explicitly skipped, even if its
 * screen unmounts. Shop visits and charter effects cannot leak into a new run.
 */
export class ShopSession {
  private teaHouse = new TeaHouseSystem()
  private packs = new BlessingPackSystem()
  private opened = false
  private busy = false
  private pending: PackOffering | null = null
  private spent = 0
  private purchases = 0

  constructor(private readonly game: GameOrchestrator) {
    this.teaHouse.setDecreeUnlockResolver((id) => game.isDecreeUnlocked(id))
    this.packs = new BlessingPackSystem((id) => game.isDecreeUnlocked(id))
  }

  get isOpen(): boolean {
    return this.opened
  }
  get isBusy(): boolean {
    return this.busy
  }

  toState(): ShopSessionState {
    if (this.busy)
      throw new Error('Cannot snapshot an unsettled shop operation')
    return {
      teaHouse: this.teaHouse.toSerializedState(),
      packs: this.packs.toState(),
      opened: this.opened,
      pendingPackId: this.pending?.pack.id ?? null,
      spent: this.spent,
      purchases: this.purchases,
    }
  }

  /** Rehydrate without opening the shop, charging gold or consuming Omens. */
  static fromState(
    game: GameOrchestrator,
    saved: ShopSessionState
  ): ShopSession {
    const shop = new ShopSession(game)
    shop.teaHouse = TeaHouseSystem.fromSerializedState(saved.teaHouse, {
      isDecreeUnlocked: (id) => game.isDecreeUnlocked(id),
      isCharterUnlocked: (id) =>
        game.getState().charterSystem.canPurchaseCharter(id),
    })
    shop.packs = BlessingPackSystem.fromState(saved.packs, (id) =>
      game.isDecreeUnlocked(id)
    )
    const unfinished = shop.packOfferings.filter(
      (p) => p.isOpened && !p.isResolved
    )
    if (
      unfinished.length !== (saved.pendingPackId === null ? 0 : 1) ||
      (unfinished[0] &&
        (!saved.opened || unfinished[0].pack.id !== saved.pendingPackId))
    )
      throw new Error('Invalid pending pack state')
    shop.pending = unfinished[0] ?? null
    if (
      shop.pending &&
      !shop.state.packOfferings.some(
        (o) => o.item.id === saved.pendingPackId && o.isPurchased
      )
    )
      throw new Error('Pending pack has not been purchased')
    shop.opened = saved.opened
    shop.spent = saved.spent
    shop.purchases = saved.purchases
    return shop
  }
  get pendingPack(): PackOffering | null {
    return this.pending
  }
  get state() {
    return this.teaHouse.getState()
  }
  get visitTotals() {
    return { goldSpent: this.spent, itemsPurchased: this.purchases }
  }
  get packOfferings() {
    return this.packs.getCurrentOfferings()
  }

  reset(): void {
    this.teaHouse = new TeaHouseSystem()
    this.teaHouse.setDecreeUnlockResolver((id) =>
      this.game.isDecreeUnlocked(id)
    )
    this.packs = new BlessingPackSystem((id) => this.game.isDecreeUnlocked(id))
    this.opened = false
    this.pending = null
    this.spent = 0
    this.purchases = 0
  }

  private available(): boolean {
    const state = this.game.getState()
    return state.isRunActive && state.phase === 'shop'
  }

  private notify(): void {
    eventBus.emit('shopUpdated', { isOpen: this.opened })
  }

  private operate(operation: () => ShopResult): ShopResult {
    if (this.busy || !this.opened || !this.available())
      return fail('unavailable')
    this.busy = true
    try {
      return eventBus.batch(operation)
    } finally {
      this.busy = false
    }
  }

  open(): boolean {
    if (this.busy || !this.available()) return false
    if (this.opened) return true
    this.busy = true
    try {
      return eventBus.batch(() => {
        const state = this.game.getState()
        this.teaHouse.setStake(state.stake)
        this.teaHouse.setCharterUnlockResolver((id) =>
          this.game.getState().charterSystem.canPurchaseCharter(id)
        )
        const ownedCharters = state.charterSystem.getPurchasedIds()
        for (const charter of [
          ...TEA_HOUSE_BASE_CHARTERS,
          ...TEA_HOUSE_UPGRADED_CHARTERS,
        ]) {
          if (ownedCharters.has(charter.id)) this.teaHouse.applyCharter(charter)
        }
        const ownedDecreeIds = state.decreeSystem
          .getOwnedDecrees()
          .map((d) => d.id)
        const shop = this.teaHouse.generateShop(
          ownedDecreeIds,
          state.lastCompletedRoundType === 'Boss',
          this.game.prepareShopVisit()
        )
        const effects = state.charterSystem.calculateEffects()
        const favoredOrb = effects.celestialFavor
          ? state.celestialOrbSystem.getOrbForMostPlayedYaku()
          : null
        this.packs.generateOfferingsForPacks(
          shop.packOfferings.map((o) => o.item as BlessingPack),
          {
            ownedDecreeIds,
            currentAct: state.currentAct,
            flowerCount: state.flowerSystem.getFlowerCount(),
            preferredYaku: favoredOrb?.effect.targetYaku,
            voidScriptsInArcana: effects.voidInArcana,
          }
        )
        this.spent = 0
        this.purchases = 0
        this.opened = true
        this.notify()
        return true
      })
    } finally {
      this.busy = false
    }
  }

  /** The orchestrator calls this before advancing; never abandon paid choices. */
  close(): boolean {
    if (this.busy || this.pending) return false
    this.opened = false
    this.notify()
    return true
  }

  private priceFailure(cost: number): ShopFailure | null {
    if (!Number.isFinite(cost) || cost < 0) return 'unavailable'
    return this.game.getState().gold < cost ? 'notEnoughGold' : null
  }

  /** Validate the combined reward, including Negative Decree slot expansion. */
  private canReceive(rewards: Reward[], flowerId?: string): boolean {
    const state = this.game.getState()
    // Capacity simulation must not spend the live copy-selection cursor. The
    // real acquisition below remains the sole owner of that random event.
    const decrees = DecreeSystem.fromState(
      state.decreeSystem.toState(),
      runRandom.fork()
    )
    const wallTemplate = [...state.wallTemplate]
    decrees.syncWallSlots(wallTemplate)
    const flowers = FlowerSystem.fromState(state.flowerSystem.toState())
    if (flowerId) {
      const slots = flowers.getBonusDecreeSlots()
      if (!flowers.consumeFlower(flowerId)) return false
      decrees.removeSlots(slots - flowers.getBonusDecreeSlots())
    }
    let consumables =
      state.fateSeals.length +
      state.celestialOrbs.length +
      state.voidScripts.length
    const capacity = 3 + state.charterSystem.calculateEffects().consumableSlots
    for (const reward of rewards) {
      switch (reward.type) {
        case 'Decree': {
          const decree = reward.data as Decree
          if (
            !decrees.canAcquireDecree(decree, flowers.getFlowerCount()) ||
            !decrees.acquireDecree(decree)
          )
            return false
          break
        }
        case 'Tile':
          if (
            !(reward.data instanceof Tile) ||
            (reward.data.isFlower && state.tableModifiers.flowersDisabled)
          )
            return false
          wallTemplate.push(reward.data)
          decrees.syncWallSlots(wallTemplate)
          break
        case 'FateSeal':
        case 'CelestialOrb':
        case 'VoidScript':
          if (++consumables > capacity) return false
          break
      }
    }
    return true
  }

  private grant(reward: Reward, source: 'purchase' | 'pack_open'): boolean {
    switch (reward.type) {
      case 'Decree':
        return this.game.addDecree(reward.data as Decree, source)
      case 'Tile':
        return this.game.addTileToWall(reward.data as Tile)
      case 'FateSeal':
        return this.game.addFateSeal(reward.data as FateSeal, source)
      case 'CelestialOrb':
        return this.game.addCelestialOrb(reward.data as CelestialOrb, source)
      case 'VoidScript':
        return this.game.addVoidScript(reward.data as VoidScript, source)
    }
  }

  private findOffering(id: string): TeaHouseOffering | undefined {
    const state = this.state
    return [
      ...state.itemOfferings,
      ...state.packOfferings,
      ...(state.charterOffering ? [state.charterOffering] : []),
    ].find((o) => o.id === id)
  }

  /** Read-only UI preflight. Purchase rechecks this same plan at commitment. */
  validatePurchase(
    id: string,
    payment: ShopPayment = { type: 'gold' }
  ): ShopResult {
    if (this.busy || !this.opened || !this.available())
      return fail('unavailable')
    const plan = this.preparePurchase(id, payment)
    return plan.success ? OK : plan
  }

  private preparePurchase(id: string, payment: ShopPayment): PurchasePlan {
    const offering = this.findOffering(id)
    if (this.pending || !offering || offering.isPurchased || offering.isLocked)
      return fail('unavailable')
    if (
      offering.itemType === 'Decree' &&
      !this.game.isDecreeUnlocked(offering.item.id)
    )
      return fail('unavailable')
    if (!Number.isFinite(offering.finalCost) || offering.finalCost < 0)
      return fail('unavailable')
    if (payment?.type !== 'gold' && payment?.type !== 'flower')
      return fail('invalidSelection')
    const flowerId = payment.type === 'flower' ? payment.flowerId : undefined
    if (
      payment.type === 'flower' &&
      (offering.itemType !== 'Decree' ||
        !acceptsFlowerCatalyst(offering.item as Decree) ||
        !this.game
          .getState()
          .flowerSystem.getFlowers()
          .some((flower) => flower.id === flowerId))
    )
      return fail('invalidSelection')
    const cost = payment.type === 'flower' ? 0 : offering.finalCost
    const flowerCount =
      this.game.getState().flowerSystem.getFlowerCount() -
      Number(payment.type === 'flower')
    const priceFailure = this.priceFailure(cost)
    if (priceFailure) return fail(priceFailure)
    let pack: PackOffering | undefined
    let reward: Reward | undefined
    if (offering.itemType === 'BlessingPack') {
      pack = this.packOfferings.find(
        (p) => p.pack.id === (offering.item as BlessingPack).id
      )
      if (!pack || pack.isOpened || pack.isResolved) return fail('unavailable')
      // Unpaid legacy stock is not a promised reward. Do not charge for a pack
      // containing profile-locked choices; paid pending packs remain claimable.
      if (
        pack.contents.some(
          (content) =>
            content.type === 'Decree' &&
            !this.game.isDecreeUnlocked((content.data as Decree).id)
        )
      )
        return fail('unavailable')
      // Do not sell an already-generated Decree pack whose entire selection
      // became Flower-ineligible after a catalyst was spent this visit.
      if (
        pack.contents.length > 0 &&
        pack.contents.every(
          (content) =>
            content.type === 'Decree' &&
            ((content.data as Decree).flowerRequirement ?? 0) > flowerCount
        )
      )
        return fail('flowerRequirement')
    } else if (offering.itemType === 'ImperialCharter') {
      if (!this.game.canAddImperialCharter(offering.item as ImperialCharter))
        return fail('unavailable')
    } else {
      reward = {
        type: offering.itemType,
        // Sale value follows the actual quote, not the immutable catalog cost
        // (editions, discounts and free Omens differ). Keep catalog definitions
        // intact so strict saved-run validation remains authoritative.
        // Tiles retain their class; pack rewards keep their separate grant path.
        data:
          offering.itemType === 'Tile'
            ? offering.item
            : {
                ...offering.item,
                sellValue: Math.floor(cost / 2),
              },
      }
      if (
        offering.itemType === 'Decree' &&
        ((offering.item as Decree).flowerRequirement ?? 0) > flowerCount
      )
        return { success: false, reason: 'flowerRequirement' }
      if (!this.canReceive([reward], flowerId)) return fail('inventoryFull')
    }
    return { success: true, offering, pack, reward, cost, flowerId }
  }

  purchase(id: string, payment: ShopPayment = { type: 'gold' }): ShopResult {
    return this.operate(() => {
      const plan = this.preparePurchase(id, payment)
      if (!plan.success) return plan
      const { offering, pack, reward, cost, flowerId } = plan

      // All failure-prone checks precede mutation. Event callbacks cannot run
      // between payment, granting inventory, and marking this offer purchased.
      if (flowerId) {
        const state = this.game.getState()
        const slots = state.flowerSystem.getBonusDecreeSlots()
        if (!state.flowerSystem.consumeFlower(flowerId))
          throw new Error('Validated Flower catalyst vanished')
        state.decreeSystem.removeSlots(
          slots - state.flowerSystem.getBonusDecreeSlots()
        )
        this.teaHouse.setFlowerCount(state.flowerSystem.getFlowerCount())
      }
      if (!this.game.purchaseItem(id, cost, offering.itemType))
        throw new Error('Validated shop payment failed')
      const bought = this.teaHouse.purchaseOffering(
        id,
        this.game
          .getState()
          .decreeSystem.getOwnedDecrees()
          .map((d) => d.id)
      )
      if (!bought.success)
        throw new Error('Validated shop offering could not be purchased')
      if (pack) {
        this.pending = this.packs.openPack(pack.pack.id)
        eventBus.emit('packOpened', {
          packId: pack.pack.id,
          packType: pack.pack.type,
          packSize: pack.pack.size,
        })
      } else {
        const added = reward
          ? this.grant(reward, 'purchase')
          : this.game.addImperialCharter(offering.item as ImperialCharter)
        if (!added)
          throw new Error('Validated shop reward could not be granted')
        if (
          !reward &&
          (offering.item.id === 'star_chart' ||
            offering.item.id === 'omen_lens')
        ) {
          this.packs.applyPurchasedCharter(
            offering.item.id,
            this.game.getState().celestialOrbSystem.getOrbForMostPlayedYaku()
              ?.effect.targetYaku
          )
        }
      }
      this.spent += cost
      this.purchases++
      this.notify()
      return OK
    })
  }

  validatePackSelection(indices: number[]): ShopResult {
    const pack = this.pending
    if (!this.available() || !this.opened || !pack || pack.isResolved)
      return fail('unavailable')
    if (
      !indices.length ||
      indices.length > pack.maxSelections ||
      new Set(indices).size !== indices.length ||
      indices.some(
        (i) => !Number.isInteger(i) || i < 0 || i >= pack.contents.length
      )
    )
      return fail('invalidSelection')
    if (
      indices.some(
        (i) =>
          pack.contents[i].type === 'Decree' &&
          ((pack.contents[i].data as Decree).flowerRequirement ?? 0) >
            this.game.getState().flowerSystem.getFlowerCount()
      )
    )
      return fail('flowerRequirement')
    return this.canReceive(indices.map((i) => pack.contents[i]))
      ? OK
      : fail('inventoryFull')
  }

  confirmPack(indices: number[]): ShopResult {
    return this.operate(() => {
      const validation = this.validatePackSelection(indices)
      if (!validation.success) return validation
      const pack = this.pending!
      for (const index of [...pack.selectedIndices])
        this.packs.deselectContent(pack.pack.id, index)
      for (const index of indices) this.packs.selectContent(pack.pack.id, index)
      const contents = this.packs.confirmSelection(pack.pack.id)
      if (contents.length !== indices.length)
        throw new Error('Validated pack selection could not be settled')
      for (const content of contents) {
        if (!this.grant(content, 'pack_open'))
          throw new Error('Validated pack reward could not be granted')
      }
      this.pending = null
      this.notify()
      return OK
    })
  }

  skipPack(): ShopResult {
    return this.operate(() => {
      if (!this.pending) return fail('unavailable')
      this.packs.skipPack(this.pending.pack.id)
      this.pending = null
      this.notify()
      return OK
    })
  }

  reroll(): ShopResult {
    return this.operate(() => {
      if (this.pending) return fail('unavailable')
      const cost = this.teaHouse.getCurrentRerollCost()
      const priceFailure = this.priceFailure(cost)
      if (priceFailure) return fail(priceFailure)
      if (!this.game.purchaseItem('reroll', cost, 'Reroll'))
        return fail('unavailable')
      this.teaHouse.setFlowerCount(
        this.game.getState().flowerSystem.getFlowerCount()
      )
      this.teaHouse.rerollItems(
        this.game
          .getState()
          .decreeSystem.getOwnedDecrees()
          .map((d) => d.id)
      )
      this.spent += cost
      eventBus.emit('shopRerolled', {
        cost,
        newRerollCost: this.teaHouse.getCurrentRerollCost(),
      })
      this.notify()
      return OK
    })
  }
}
