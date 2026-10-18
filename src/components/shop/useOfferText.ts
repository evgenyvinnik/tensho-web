/**
 * What a Tea House item says about itself: its name, its kind, its rule, and
 * any help or cost worth knowing before taking it. Shared by the shop's offer
 * details and the Blessing Pack choices, so both describe an item alike.
 *
 * @module components/shop/useOfferText
 */

import { useTranslation } from 'react-i18next'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { BlessingPack, Decree, ImperialCharter } from '../../systems/types'
import type { FateSeal } from '../../systems/FateSealSystem'
import type { CelestialOrb } from '../../systems/CelestialOrbSystem'
import type { VoidScript } from '../../systems/VoidScriptSystem'
import { Tile } from '../../core/Tile'
import { useItemText } from '../../i18n/useItemText'
import { tileRewardText } from '../../i18n/tileRewardText'

export const RARITY_COLORS: Record<string, string> = {
  common: '#A0A0A0',
  LocalEdict: '#A0A0A0',
  uncommon: '#4CAF50',
  RegionalMandate: '#4CAF50',
  rare: '#2196F3',
  ImperialDecree: '#2196F3',
  legendary: '#9C27B0',
  mythic: '#9C27B0',
  HeavenlyOrdinance: '#9C27B0',
}

const DECREE_RARITY_KEYS: Record<Decree['rarity'], string> = {
  LocalEdict: 'common',
  RegionalMandate: 'uncommon',
  ImperialDecree: 'rare',
  HeavenlyOrdinance: 'legendary',
}

export interface OfferText {
  name: string
  kind: string
  description: string
  extra?: string
  /** A Void Script's price for its power. */
  cost?: string
  rarity: string
}

export function useOfferText(
  offering: Pick<TeaHouseOffering, 'itemType' | 'item'>
): OfferText {
  const { t } = useTranslation()
  const itemText = useItemText()
  switch (offering.itemType) {
    case 'Decree': {
      const decree = offering.item as Decree
      return {
        name: itemText.name('decrees', decree),
        kind: t('shop.kinds.decree', {
          rarity: t(`shop.ui.rarity_${DECREE_RARITY_KEYS[decree.rarity]}`),
        }),
        description: itemText.description('decrees', decree),
        extra: t('shop.kinds.decreeHelp'),
        rarity: decree.rarity,
      }
    }
    case 'FateSeal': {
      const seal = offering.item as FateSeal
      return {
        name: itemText.name('seals', seal),
        kind: t('shop.kinds.seal'),
        description: itemText.description('seals', seal),
        extra: t('shop.kinds.consumableHelp'),
        rarity: seal.rarity.toLowerCase(),
      }
    }
    case 'CelestialOrb': {
      const orb = offering.item as CelestialOrb
      return {
        name: itemText.name('orbs', orb),
        kind: t('shop.kinds.orb'),
        description: itemText.description('orbs', orb),
        extra: [
          orb.effect.targetYaku === 'All'
            ? null
            : t(`upgradeFamilies.${orb.effect.targetYaku}.covers`),
          t('shop.kinds.orbHelp'),
        ]
          .filter(Boolean)
          .join(' · '),
        rarity: orb.rarity.toLowerCase(),
      }
    }
    case 'VoidScript': {
      const script = offering.item as VoidScript
      return {
        name: itemText.name('scripts', script),
        kind: t('shop.kinds.script'),
        description: itemText.description('scripts', script),
        extra: t('shop.kinds.consumableHelp'),
        cost: script.penalty
          ? t(`consumableUse.penalty_${script.penalty.type}`, {
              count: script.penalty.value || 1,
            })
          : undefined,
        rarity: script.rarity.toLowerCase(),
      }
    }
    case 'Tile': {
      const tile = offering.item as Tile
      const text = tileRewardText(tile, t)
      return {
        name: text.name,
        kind: t('shop.kinds.tile'),
        description: tile.hasModifiers
          ? text.description
          : t('shop.kinds.tileHelp'),
        rarity: tile.hasModifiers ? 'uncommon' : 'common',
      }
    }
    case 'BlessingPack': {
      const pack = offering.item as BlessingPack
      const id = `${pack.type.toLowerCase()}_${pack.size.toLowerCase()}`
      return {
        name: t(`packs.items.${id}.name`),
        kind: t('shop.kinds.pack', {
          choose: pack.selectCount,
          from: pack.choiceCount,
        }),
        description: t(`packs.items.${id}.description`),
        rarity:
          pack.size === 'Mega'
            ? 'rare'
            : pack.size === 'Jumbo'
              ? 'uncommon'
              : 'common',
      }
    }
    case 'ImperialCharter': {
      const charter = offering.item as ImperialCharter
      return {
        name: itemText.name('charters', charter),
        kind: t('shop.kinds.charter'),
        description: itemText.description('charters', charter),
        extra: t('shop.kinds.charterHelp'),
        rarity: 'legendary',
      }
    }
  }
}
