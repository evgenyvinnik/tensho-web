/**
 * Localized labels for tutorial/codex categories.
 *
 * Categories are identified by their English name on the step objects, which
 * doubles as a lookup key and a React key. Translating them in place would
 * change the identity, so the identifier stays English and only the displayed
 * label goes through i18n.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/** Category identifier as authored on a step, mapped to its translation key. */
const CATEGORY_KEYS: Record<string, string> = {
  Introduction: 'codex.introduction',
  Tiles: 'codex.tiles',
  'Hand Building': 'codex.handBuilding',
  'How to Play': 'codex.howToPlay',
  Scoring: 'codex.scoring',
  Progression: 'codex.progression',
  Decrees: 'codex.decrees',
  Flora: 'codex.flora',
  Economy: 'codex.economy',
  Strategy: 'codex.strategy',
  'Ready!': 'codex.finish',
}

export function useCategoryLabel(): (category: string) => string {
  const { t } = useTranslation()

  return useMemo(
    () => (category: string) => {
      const key = CATEGORY_KEYS[category]
      return key ? t(key, category) : category
    },
    [t]
  )
}
