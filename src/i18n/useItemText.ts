/**
 * Localized text for game content items.
 *
 * Item libraries (Decrees, Charters, Mandates, Omens, consumables) are authored
 * in English inside `src/config` and `src/systems`. Their translations live in
 * the locale files under `<kind>.items.<id>`, keyed by the item's own id.
 *
 * Components should never render `item.name` directly: that always shows the
 * authored English. Go through this hook instead, which looks the item up by id
 * and falls back to the authored text when a locale has no entry for it.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/** Content libraries that carry per-item translations. */
export type ItemKind =
  | 'decrees'
  | 'charters'
  | 'mandates'
  | 'omens'
  | 'seals'
  | 'orbs'
  | 'scripts'

/** The shape every translatable item shares. */
export interface TranslatableItem {
  id: string
  name: string
  description?: string
}

export interface ItemText {
  /** Localized display name, falling back to the authored English name. */
  name: (kind: ItemKind, item: TranslatableItem) => string
  /** Localized description, falling back to the authored English text. */
  description: (kind: ItemKind, item: TranslatableItem) => string
}

export function useItemText(): ItemText {
  const { t } = useTranslation()

  return useMemo(
    () => ({
      name: (kind, item) => t(`${kind}.items.${item.id}.name`, item.name),
      description: (kind, item) =>
        t(`${kind}.items.${item.id}.description`, item.description ?? ''),
    }),
    [t]
  )
}
