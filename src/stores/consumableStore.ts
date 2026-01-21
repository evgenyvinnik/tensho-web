/**
 * Consumable Store - State management for Consumables
 *
 * Manages Fate Seals (Tarot), Celestial Orbs (Planet), and Void Scripts (Spectral).
 * These are one-time use items that provide powerful effects.
 */

import { create } from 'zustand'
import {
  ConsumableType,
  ConsumableEdition,
  BaseConsumable,
  ConsumableUseResult,
  DEFAULT_CONSUMABLE_SLOTS,
  MAX_CONSUMABLE_SLOTS,
} from '../systems/ConsumableSystem'
import {
  FateSeal,
  FateSealContext,
  FateSealSystem,
  FATE_SEALS,
} from '../systems/FateSealSystem'
import {
  CelestialOrb,
  YakuCategory,
  CelestialOrbSystem,
  CELESTIAL_ORBS,
} from '../systems/CelestialOrbSystem'
import {
  VoidScript,
  VoidScriptContext,
  VoidScriptSystem,
  VOID_SCRIPTS,
} from '../systems/VoidScriptSystem'

// =============================================================================
// STORE TYPES
// =============================================================================

export interface ConsumableState {
  // Inventory
  fateSeals: FateSeal[]
  celestialOrbs: CelestialOrb[]
  voidScripts: VoidScript[]

  // Slot limits
  fateSealSlots: number
  celestialOrbSlots: number
  voidScriptSlots: number

  // Usage tracking
  sealsUsedThisRound: number
  scriptsUsedThisRound: number
  maxSealsPerRound: number
  maxScriptsPerRound: number

  // Systems (for tracking state)
  fateSealSystem: FateSealSystem
  celestialOrbSystem: CelestialOrbSystem
  voidScriptSystem: VoidScriptSystem

  // Last used consumable (for Seal of the Fool)
  lastUsedConsumable: BaseConsumable | null

  // Actions - Inventory Management
  addFateSeal: (seal: FateSeal) => boolean
  addCelestialOrb: (orb: CelestialOrb) => boolean
  addVoidScript: (script: VoidScript) => boolean
  removeFateSeal: (instanceId: string) => FateSeal | null
  removeCelestialOrb: (instanceId: string) => CelestialOrb | null
  removeVoidScript: (instanceId: string) => VoidScript | null
  sellConsumable: (instanceId: string, type: ConsumableType) => number

  // Actions - Slot Management
  addSlot: (type: ConsumableType) => void
  removeSlot: (type: ConsumableType) => boolean

  // Actions - Usage
  useFateSeal: (
    instanceId: string,
    context: FateSealContext
  ) => ConsumableUseResult
  useCelestialOrb: (instanceId: string) => ConsumableUseResult
  useVoidScript: (
    instanceId: string,
    context: VoidScriptContext
  ) => ConsumableUseResult

  // Actions - Queries
  canUseFateSeal: () => boolean
  canUseVoidScript: () => boolean
  getAvailableSlots: (type: ConsumableType) => number
  getTotalSlots: (type: ConsumableType) => number
  getYakuLevel: (yaku: YakuCategory) => number
  getYakuBonus: (yaku: YakuCategory) => { mult: number; chips: number }

  // Actions - Round Management
  onRoundStart: () => void
  onRoundEnd: () => void
  onHandEnd: () => void

  // Actions - State Management
  clearConsumables: () => void
}

// =============================================================================
// STORE CREATION
// =============================================================================

export const useConsumableStore = create<ConsumableState>()((set, get) => ({
  // Initial state - Inventory
  fateSeals: [],
  celestialOrbs: [],
  voidScripts: [],

  // Initial state - Slots
  fateSealSlots: DEFAULT_CONSUMABLE_SLOTS,
  celestialOrbSlots: DEFAULT_CONSUMABLE_SLOTS,
  voidScriptSlots: DEFAULT_CONSUMABLE_SLOTS,

  // Initial state - Usage
  sealsUsedThisRound: 0,
  scriptsUsedThisRound: 0,
  maxSealsPerRound: 1,
  maxScriptsPerRound: 1,

  // Initial state - Systems
  fateSealSystem: new FateSealSystem(),
  celestialOrbSystem: new CelestialOrbSystem(),
  voidScriptSystem: new VoidScriptSystem(),

  // Initial state - Last used
  lastUsedConsumable: null,

  // ===========================================================================
  // INVENTORY MANAGEMENT
  // ===========================================================================

  addFateSeal: (seal: FateSeal) => {
    const state = get()
    if (state.fateSeals.length >= state.fateSealSlots) {
      return false
    }

    set({ fateSeals: [...state.fateSeals, seal] })
    return true
  },

  addCelestialOrb: (orb: CelestialOrb) => {
    const state = get()
    if (state.celestialOrbs.length >= state.celestialOrbSlots) {
      return false
    }

    set({ celestialOrbs: [...state.celestialOrbs, orb] })
    return true
  },

  addVoidScript: (script: VoidScript) => {
    const state = get()
    if (state.voidScripts.length >= state.voidScriptSlots) {
      return false
    }

    set({ voidScripts: [...state.voidScripts, script] })
    return true
  },

  removeFateSeal: (instanceId: string) => {
    const state = get()
    const index = state.fateSeals.findIndex((s) => s.instanceId === instanceId)

    if (index === -1) {
      return null
    }

    const [removed] = state.fateSeals.splice(index, 1)
    set({ fateSeals: [...state.fateSeals] })
    return removed
  },

  removeCelestialOrb: (instanceId: string) => {
    const state = get()
    const index = state.celestialOrbs.findIndex((o) => o.instanceId === instanceId)

    if (index === -1) {
      return null
    }

    const [removed] = state.celestialOrbs.splice(index, 1)
    set({ celestialOrbs: [...state.celestialOrbs] })
    return removed
  },

  removeVoidScript: (instanceId: string) => {
    const state = get()
    const index = state.voidScripts.findIndex((s) => s.instanceId === instanceId)

    if (index === -1) {
      return null
    }

    const [removed] = state.voidScripts.splice(index, 1)
    set({ voidScripts: [...state.voidScripts] })
    return removed
  },

  sellConsumable: (instanceId: string, type: ConsumableType) => {
    const state = get()
    let sellValue = 0

    switch (type) {
      case 'FateSeal': {
        const seal = state.removeFateSeal(instanceId)
        sellValue = seal?.sellValue || 0
        break
      }
      case 'CelestialOrb': {
        const orb = state.removeCelestialOrb(instanceId)
        sellValue = orb?.sellValue || 0
        break
      }
      case 'VoidScript': {
        const script = state.removeVoidScript(instanceId)
        sellValue = script?.sellValue || 0
        break
      }
    }

    return sellValue
  },

  // ===========================================================================
  // SLOT MANAGEMENT
  // ===========================================================================

  addSlot: (type: ConsumableType) => {
    const state = get()

    switch (type) {
      case 'FateSeal':
        set({
          fateSealSlots: Math.min(state.fateSealSlots + 1, MAX_CONSUMABLE_SLOTS),
        })
        break
      case 'CelestialOrb':
        set({
          celestialOrbSlots: Math.min(
            state.celestialOrbSlots + 1,
            MAX_CONSUMABLE_SLOTS
          ),
        })
        break
      case 'VoidScript':
        set({
          voidScriptSlots: Math.min(
            state.voidScriptSlots + 1,
            MAX_CONSUMABLE_SLOTS
          ),
        })
        break
    }
  },

  removeSlot: (type: ConsumableType) => {
    const state = get()

    switch (type) {
      case 'FateSeal':
        if (state.fateSeals.length >= state.fateSealSlots) {
          return false
        }
        set({ fateSealSlots: Math.max(0, state.fateSealSlots - 1) })
        break
      case 'CelestialOrb':
        if (state.celestialOrbs.length >= state.celestialOrbSlots) {
          return false
        }
        set({ celestialOrbSlots: Math.max(0, state.celestialOrbSlots - 1) })
        break
      case 'VoidScript':
        if (state.voidScripts.length >= state.voidScriptSlots) {
          return false
        }
        set({ voidScriptSlots: Math.max(0, state.voidScriptSlots - 1) })
        break
    }

    return true
  },

  // ===========================================================================
  // USAGE
  // ===========================================================================

  useFateSeal: (instanceId: string, context: FateSealContext) => {
    const state = get()

    // Check if we can use a seal this round
    if (state.sealsUsedThisRound >= state.maxSealsPerRound) {
      return {
        success: false,
        message: 'Already used maximum Fate Seals this round',
        effects: [],
      }
    }

    // Find the seal
    const seal = state.fateSeals.find((s) => s.instanceId === instanceId)
    if (!seal) {
      return {
        success: false,
        message: 'Fate Seal not found',
        effects: [],
      }
    }

    // Extend context with consumable slot info
    const extendedContext: FateSealContext = {
      ...context,
      getAvailableSlots: (type: ConsumableType) => get().getAvailableSlots(type),
    }

    // Use the seal via the system
    const result = state.fateSealSystem.useSeal(seal, extendedContext)

    if (result.success) {
      // Mark as used and remove from inventory
      state.removeFateSeal(instanceId)
      set({
        sealsUsedThisRound: state.sealsUsedThisRound + 1,
        lastUsedConsumable: seal,
      })

      // Update last used consumable in the system
      state.fateSealSystem.setLastUsedConsumable(seal)
    }

    return result
  },

  useCelestialOrb: (instanceId: string) => {
    const state = get()

    // Find the orb
    const orb = state.celestialOrbs.find((o) => o.instanceId === instanceId)
    if (!orb) {
      return {
        success: false,
        message: 'Celestial Orb not found',
        effects: [],
      }
    }

    // Use the orb via the system
    const result = state.celestialOrbSystem.useOrb(orb)

    if (result.success) {
      // Mark as used and remove from inventory
      // Note: Unlike Fate Seals, Celestial Orbs permanently upgrade yaku
      state.removeCelestialOrb(instanceId)
      set({ lastUsedConsumable: orb })
    }

    return result
  },

  useVoidScript: (instanceId: string, context: VoidScriptContext) => {
    const state = get()

    // Check if we can use a script this round
    if (state.scriptsUsedThisRound >= state.maxScriptsPerRound) {
      return {
        success: false,
        message: 'Already used maximum Void Scripts this round',
        effects: [],
      }
    }

    // Find the script
    const script = state.voidScripts.find((s) => s.instanceId === instanceId)
    if (!script) {
      return {
        success: false,
        message: 'Void Script not found',
        effects: [],
      }
    }

    // Use the script via the system
    const result = state.voidScriptSystem.useScript(script, context)

    if (result.success) {
      // Mark as used and remove from inventory
      state.removeVoidScript(instanceId)
      set({
        scriptsUsedThisRound: state.scriptsUsedThisRound + 1,
        lastUsedConsumable: script,
      })
    }

    return result
  },

  // ===========================================================================
  // QUERIES
  // ===========================================================================

  canUseFateSeal: () => {
    const state = get()
    return (
      state.sealsUsedThisRound < state.maxSealsPerRound &&
      state.fateSeals.length > 0
    )
  },

  canUseVoidScript: () => {
    const state = get()
    return (
      state.scriptsUsedThisRound < state.maxScriptsPerRound &&
      state.voidScripts.length > 0
    )
  },

  getAvailableSlots: (type: ConsumableType) => {
    const state = get()
    switch (type) {
      case 'FateSeal':
        return state.fateSealSlots - state.fateSeals.length
      case 'CelestialOrb':
        return state.celestialOrbSlots - state.celestialOrbs.length
      case 'VoidScript':
        return state.voidScriptSlots - state.voidScripts.length
    }
  },

  getTotalSlots: (type: ConsumableType) => {
    const state = get()
    switch (type) {
      case 'FateSeal':
        return state.fateSealSlots
      case 'CelestialOrb':
        return state.celestialOrbSlots
      case 'VoidScript':
        return state.voidScriptSlots
    }
  },

  getYakuLevel: (yaku: YakuCategory) => {
    const state = get()
    return state.celestialOrbSystem.getYakuLevel(yaku)
  },

  getYakuBonus: (yaku: YakuCategory) => {
    const state = get()
    return state.celestialOrbSystem.calculateYakuBonus(yaku)
  },

  // ===========================================================================
  // ROUND MANAGEMENT
  // ===========================================================================

  onRoundStart: () => {
    set({
      sealsUsedThisRound: 0,
      scriptsUsedThisRound: 0,
    })
  },

  onRoundEnd: () => {
    const state = get()
    state.voidScriptSystem.onRoundEnd()
  },

  onHandEnd: () => {
    const state = get()
    state.voidScriptSystem.onHandEnd()
  },

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  clearConsumables: () => {
    set({
      fateSeals: [],
      celestialOrbs: [],
      voidScripts: [],
      fateSealSlots: DEFAULT_CONSUMABLE_SLOTS,
      celestialOrbSlots: DEFAULT_CONSUMABLE_SLOTS,
      voidScriptSlots: DEFAULT_CONSUMABLE_SLOTS,
      sealsUsedThisRound: 0,
      scriptsUsedThisRound: 0,
      maxSealsPerRound: 1,
      maxScriptsPerRound: 1,
      fateSealSystem: new FateSealSystem(),
      celestialOrbSystem: new CelestialOrbSystem(),
      voidScriptSystem: new VoidScriptSystem(),
      lastUsedConsumable: null,
    })
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get all consumables as a flat array
 */
export const selectAllConsumables = (state: ConsumableState): BaseConsumable[] => {
  return [...state.fateSeals, ...state.celestialOrbs, ...state.voidScripts]
}

/**
 * Get total consumable count
 */
export const selectTotalConsumableCount = (state: ConsumableState): number => {
  return state.fateSeals.length + state.celestialOrbs.length + state.voidScripts.length
}

/**
 * Get total sell value of all consumables
 */
export const selectTotalSellValue = (state: ConsumableState): number => {
  return selectAllConsumables(state).reduce((sum, c) => sum + c.sellValue, 0)
}

/**
 * Get yaku bonus summary for all upgraded yaku
 */
export const selectYakuBonusSummary = (
  state: ConsumableState
): { yaku: YakuCategory; level: number; mult: number; chips: number }[] => {
  return state.celestialOrbSystem.getYakuBonusSummary()
}

/**
 * Check if hand size penalty is active from Void Scripts
 */
export const selectHandSizePenalty = (state: ConsumableState): number => {
  return state.voidScriptSystem.getHandSizePenalty()
}

/**
 * Check if shanten scoring is allowed
 */
export const selectIsShantenScoringAllowed = (state: ConsumableState): boolean => {
  return state.voidScriptSystem.isShantenScoringAllowed()
}

/**
 * Check if meld validation is bypassed
 */
export const selectIsMeldValidationBypassed = (state: ConsumableState): boolean => {
  return state.voidScriptSystem.isMeldValidationBypassed()
}

/**
 * Check if base score is halved
 */
export const selectIsBaseScoreHalved = (state: ConsumableState): boolean => {
  return state.voidScriptSystem.isBaseScoreHalved()
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a Fate Seal instance for the store
 */
export function createFateSealForStore(
  sealId: string,
  edition: ConsumableEdition = 'Base'
): FateSeal | null {
  const sealDef = FATE_SEALS[sealId]
  if (!sealDef) {
    return null
  }

  return FateSealSystem.createFateSealInstance(sealDef, edition)
}

/**
 * Create a Celestial Orb instance for the store
 */
export function createCelestialOrbForStore(
  orbId: string,
  edition: ConsumableEdition = 'Base'
): CelestialOrb | null {
  const orbDef = CELESTIAL_ORBS[orbId]
  if (!orbDef) {
    return null
  }

  return CelestialOrbSystem.createCelestialOrbInstance(orbDef, edition)
}

/**
 * Create a Void Script instance for the store
 */
export function createVoidScriptForStore(
  scriptId: string,
  edition: ConsumableEdition = 'Base'
): VoidScript | null {
  const scriptDef = VOID_SCRIPTS[scriptId]
  if (!scriptDef) {
    return null
  }

  return VoidScriptSystem.createVoidScriptInstance(scriptDef, edition)
}

/**
 * Get a random Fate Seal for shop generation
 */
export function getRandomFateSealForShop(
  excludeIds: string[] = []
): FateSeal | null {
  const sealDef = FateSealSystem.getRandomFateSeal(excludeIds)
  if (!sealDef) {
    return null
  }

  return FateSealSystem.createFateSealInstance(sealDef)
}

/**
 * Get a random Celestial Orb for shop generation
 */
export function getRandomCelestialOrbForShop(
  excludeIds: string[] = []
): CelestialOrb | null {
  const orbDef = CelestialOrbSystem.getRandomCelestialOrb(excludeIds)
  if (!orbDef) {
    return null
  }

  return CelestialOrbSystem.createCelestialOrbInstance(orbDef)
}

/**
 * Get a random Void Script for shop generation
 */
export function getRandomVoidScriptForShop(
  excludeIds: string[] = []
): VoidScript | null {
  const scriptDef = VoidScriptSystem.getRandomVoidScript(excludeIds)
  if (!scriptDef) {
    return null
  }

  return VoidScriptSystem.createVoidScriptInstance(scriptDef)
}
