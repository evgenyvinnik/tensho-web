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
import type { BlessingPack, Decree, ImperialCharter } from '../systems/types'
import type { FateSeal } from '../systems/FateSealSystem'
import type { CelestialOrb } from '../systems/CelestialOrbSystem'
import type { VoidScript } from '../systems/VoidScriptSystem'
import { Tile } from '../core/Tile'

export type ShopFailure =
  | 'unavailable'
  | 'notEnoughGold'
  | 'inventoryFull'
  | 'invalidSelection'
export type ShopResult =
  | { success: true }
  | { success: false; reason: ShopFailure }
type Reward = { type: PackContent['type']; data: unknown }
const OK: ShopResult = { success: true }
const fail = (reason: ShopFailure): ShopResult => ({ success: false, reason })

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

  constructor(private readonly game: GameOrchestrator) {}

  get isOpen(): boolean {
    return this.opened
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
    this.packs = new BlessingPackSystem()
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
  private canReceive(rewards: Reward[]): boolean {
    const state = this.game.getState()
    const decrees = DecreeSystem.fromState(state.decreeSystem.toState())
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
            !decrees.canAcquireDecree(
              decree,
              state.flowerSystem.getFlowerCount()
            ) ||
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

  purchase(id: string): ShopResult {
    return this.operate(() => {
      const offering = this.findOffering(id)
      if (
        this.pending ||
        !offering ||
        offering.isPurchased ||
        offering.isLocked
      )
        return fail('unavailable')
      const priceFailure = this.priceFailure(offering.finalCost)
      if (priceFailure) return fail(priceFailure)
      let pack: PackOffering | undefined
      let reward: Reward | undefined
      if (offering.itemType === 'BlessingPack') {
        pack = this.packOfferings.find(
          (p) => p.pack.id === (offering.item as BlessingPack).id
        )
        if (!pack || pack.isOpened || pack.isResolved)
          return fail('unavailable')
      } else if (offering.itemType === 'ImperialCharter') {
        if (!this.game.canAddImperialCharter(offering.item as ImperialCharter))
          return fail('unavailable')
      } else {
        reward = { type: offering.itemType, data: offering.item }
        if (!this.canReceive([reward])) return fail('inventoryFull')
      }

      // All failure-prone checks precede mutation. Event callbacks cannot run
      // between payment, granting inventory, and marking this offer purchased.
      if (!this.game.purchaseItem(id, offering.finalCost, offering.itemType))
        return fail('unavailable')
      const bought = this.teaHouse.purchaseOffering(id)
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
      }
      this.spent += offering.finalCost
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
