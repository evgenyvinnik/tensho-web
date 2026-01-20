/**
 * Pack Store - Blessing Pack state management
 *
 * Manages pack offerings, opening state, and selection tracking for Blessing Packs.
 * Blessing Packs (祝福袋) are booster packs containing mixed upgrades.
 */

import { create } from 'zustand'
import { PackType, PackSize, BlessingPack } from '../systems/types'
import { PackContent, PackOffering } from '../systems/BlessingPackSystem'

// =============================================================================
// PACK STATE TYPES
// =============================================================================

/**
 * Opening phase of a pack
 */
export type PackOpeningPhase = 'closed' | 'opening' | 'selecting' | 'confirmed' | 'skipped'

/**
 * Pack in the shop with purchase state
 */
export interface ShopPack {
  id: string
  pack: BlessingPack
  cost: number
  discountedCost: number
  isPurchased: boolean
}

/**
 * Pack being opened with selection state
 */
export interface OpeningPack {
  packId: string
  pack: BlessingPack
  contents: PackContent[]
  selectedIndices: number[]
  maxSelections: number
  phase: PackOpeningPhase
}

/**
 * Pack store state and actions
 */
export interface PackState {
  // Shop packs available for purchase
  availablePacks: ShopPack[]

  // Currently opening pack (if any)
  openingPack: OpeningPack | null

  // Statistics
  totalPacksPurchased: number
  totalPacksOpened: number
  totalSkips: number

  // Discount from charters
  packDiscount: number

  // Actions
  setAvailablePacks: (packs: ShopPack[]) => void
  purchasePack: (packId: string) => boolean
  openPack: (packId: string, contents: PackContent[], maxSelections: number) => void
  selectContent: (contentIndex: number) => boolean
  deselectContent: (contentIndex: number) => boolean
  confirmSelection: () => PackContent[]
  skipSelection: () => void
  closePackOpening: () => void
  setPackDiscount: (discount: number) => void
  incrementSkips: () => void
  resetForNewShop: () => void
  clearPackStore: () => void
}

// =============================================================================
// PACK STORE
// =============================================================================

export const usePackStore = create<PackState>()((set, get) => ({
  // Initial state
  availablePacks: [],
  openingPack: null,
  totalPacksPurchased: 0,
  totalPacksOpened: 0,
  totalSkips: 0,
  packDiscount: 0,

  // Actions
  setAvailablePacks: (packs: ShopPack[]) => {
    set({ availablePacks: packs })
  },

  purchasePack: (packId: string) => {
    const { availablePacks } = get()
    const packIndex = availablePacks.findIndex((p) => p.id === packId)

    if (packIndex === -1) {
      return false
    }

    const pack = availablePacks[packIndex]
    if (pack.isPurchased) {
      return false
    }

    set({
      availablePacks: availablePacks.map((p, i) =>
        i === packIndex ? { ...p, isPurchased: true } : p
      ),
      totalPacksPurchased: get().totalPacksPurchased + 1,
    })

    return true
  },

  openPack: (packId: string, contents: PackContent[], maxSelections: number) => {
    const { availablePacks, totalPacksOpened } = get()
    const shopPack = availablePacks.find((p) => p.id === packId)

    if (!shopPack) {
      return
    }

    set({
      openingPack: {
        packId,
        pack: shopPack.pack,
        contents,
        selectedIndices: [],
        maxSelections,
        phase: 'opening',
      },
      totalPacksOpened: totalPacksOpened + 1,
    })

    // Transition to selecting phase after a brief delay (for animation)
    setTimeout(() => {
      set((state) =>
        state.openingPack?.packId === packId
          ? { openingPack: { ...state.openingPack, phase: 'selecting' } }
          : state
      )
    }, 500)
  },

  selectContent: (contentIndex: number) => {
    const { openingPack } = get()

    if (!openingPack || openingPack.phase !== 'selecting') {
      return false
    }

    if (openingPack.selectedIndices.length >= openingPack.maxSelections) {
      return false
    }

    if (contentIndex < 0 || contentIndex >= openingPack.contents.length) {
      return false
    }

    if (openingPack.selectedIndices.includes(contentIndex)) {
      return false
    }

    set({
      openingPack: {
        ...openingPack,
        selectedIndices: [...openingPack.selectedIndices, contentIndex],
      },
    })

    return true
  },

  deselectContent: (contentIndex: number) => {
    const { openingPack } = get()

    if (!openingPack || openingPack.phase !== 'selecting') {
      return false
    }

    const index = openingPack.selectedIndices.indexOf(contentIndex)
    if (index === -1) {
      return false
    }

    const newSelectedIndices = [...openingPack.selectedIndices]
    newSelectedIndices.splice(index, 1)

    set({
      openingPack: {
        ...openingPack,
        selectedIndices: newSelectedIndices,
      },
    })

    return true
  },

  confirmSelection: () => {
    const { openingPack } = get()

    if (!openingPack || openingPack.phase !== 'selecting') {
      return []
    }

    const selectedContents = openingPack.selectedIndices.map(
      (i) => openingPack.contents[i]
    )

    set({
      openingPack: {
        ...openingPack,
        phase: 'confirmed',
      },
    })

    return selectedContents
  },

  skipSelection: () => {
    const { openingPack, totalSkips } = get()

    if (!openingPack || openingPack.phase !== 'selecting') {
      return
    }

    set({
      openingPack: {
        ...openingPack,
        selectedIndices: [],
        phase: 'skipped',
      },
      totalSkips: totalSkips + 1,
    })
  },

  closePackOpening: () => {
    set({ openingPack: null })
  },

  setPackDiscount: (discount: number) => {
    set({ packDiscount: discount })
  },

  incrementSkips: () => {
    set((state) => ({ totalSkips: state.totalSkips + 1 }))
  },

  resetForNewShop: () => {
    set({
      availablePacks: [],
      openingPack: null,
    })
  },

  clearPackStore: () => {
    set({
      availablePacks: [],
      openingPack: null,
      totalPacksPurchased: 0,
      totalPacksOpened: 0,
      totalSkips: 0,
      packDiscount: 0,
    })
  },
}))

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector: Get unpurchased packs
 */
export const selectAvailablePacks = (state: PackState): ShopPack[] => {
  return state.availablePacks.filter((p) => !p.isPurchased)
}

/**
 * Selector: Check if a pack is currently being opened
 */
export const selectIsPackOpening = (state: PackState): boolean => {
  return state.openingPack !== null
}

/**
 * Selector: Get selected content indices
 */
export const selectSelectedIndices = (state: PackState): number[] => {
  return state.openingPack?.selectedIndices || []
}

/**
 * Selector: Check if can confirm selection (at least 1 selected)
 */
export const selectCanConfirm = (state: PackState): boolean => {
  const { openingPack } = state
  if (!openingPack || openingPack.phase !== 'selecting') {
    return false
  }
  return openingPack.selectedIndices.length > 0
}

/**
 * Selector: Check if can select more content
 */
export const selectCanSelectMore = (state: PackState): boolean => {
  const { openingPack } = state
  if (!openingPack || openingPack.phase !== 'selecting') {
    return false
  }
  return openingPack.selectedIndices.length < openingPack.maxSelections
}

/**
 * Selector: Get remaining selections count
 */
export const selectRemainingSelections = (state: PackState): number => {
  const { openingPack } = state
  if (!openingPack) {
    return 0
  }
  return openingPack.maxSelections - openingPack.selectedIndices.length
}

/**
 * Selector: Get pack opening phase
 */
export const selectPackPhase = (state: PackState): PackOpeningPhase | null => {
  return state.openingPack?.phase || null
}

/**
 * Selector: Get total skips for synergy calculation
 */
export const selectTotalSkips = (state: PackState): number => {
  return state.totalSkips
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a shop pack from a blessing pack
 */
export function createShopPack(
  pack: BlessingPack,
  discount: number = 0
): ShopPack {
  const discountedCost = Math.max(1, Math.floor(pack.cost * (1 - discount / 100)))

  return {
    id: pack.id,
    pack,
    cost: pack.cost,
    discountedCost,
    isPurchased: false,
  }
}

/**
 * Get pack display info
 */
export function getPackDisplayInfo(pack: BlessingPack): {
  typeName: string
  sizeName: string
  fullName: string
  choiceText: string
} {
  const typeNames: Record<PackType, string> = {
    Arcana: 'Arcana Pack',
    Celestial: 'Celestial Pack',
    Tile: 'Tile Pack',
    Decree: 'Decree Pack',
    Void: 'Void Pack',
  }

  const sizeNames: Record<PackSize, string> = {
    Normal: 'Normal',
    Jumbo: 'Jumbo',
    Mega: 'Mega',
  }

  const typeName = typeNames[pack.type]
  const sizeName = sizeNames[pack.size]
  const fullName = `${sizeName} ${typeName}`

  let choiceText: string
  if (pack.selectCount === 1) {
    choiceText = `Choose 1 from ${pack.choiceCount}`
  } else {
    choiceText = `Choose up to ${pack.selectCount} from ${pack.choiceCount}`
  }

  return { typeName, sizeName, fullName, choiceText }
}

/**
 * Get Japanese pack name
 */
export function getPackJapaneseName(pack: BlessingPack): string {
  const typeNames: Record<PackType, string> = {
    Arcana: '秘術袋',
    Celestial: '天球袋',
    Tile: '牌袋',
    Decree: '法令袋',
    Void: '虚空袋',
  }

  const sizePrefixes: Record<PackSize, string> = {
    Normal: '',
    Jumbo: '大',
    Mega: '特大',
  }

  return `${sizePrefixes[pack.size]}${typeNames[pack.type]}`
}

/**
 * Get pack icon color
 */
export function getPackIconColor(type: PackType): string {
  const colors: Record<PackType, string> = {
    Arcana: '#9C27B0',
    Celestial: '#2196F3',
    Tile: '#8B4513',
    Decree: '#FFD700',
    Void: '#1C3A2E',
  }

  return colors[type]
}

/**
 * Generate unique pack ID
 */
let packIdCounter = 0
export function generatePackId(type: PackType, size: PackSize): string {
  return `pack-${type}-${size}-${++packIdCounter}-${Date.now()}`
}
