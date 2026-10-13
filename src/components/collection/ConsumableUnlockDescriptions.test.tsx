import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { CONSUMABLE_UNLOCKS } from '../../config/unlockDefinitions'
import { ItemCard } from './ItemCard'
import { ArchiveSystem } from '../../systems/ArchiveSystem'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'explains the six secret consumable gates in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const archive = new ArchiveSystem()
    for (const definition of CONSUMABLE_UNLOCKS) {
      const entry = archive.getEntry('consumables', definition.unlocksId)!
      expect(entry.isUnlocked).toBe(false)
      const key = `consumableUnlocks.${entry.itemId}`
      const rule = i18n.getResource(language, 'translation', key)
      expect(rule).toBeTruthy()
      if (language !== 'en')
        expect(rule).not.toBe(i18n.getResource('en', 'translation', key))
      render(
        <ItemCard
          entry={entry}
          displayInfo={{
            id: entry.itemId,
            name: definition.name,
            description: '',
            category: 'consumables',
          }}
        />
      )
      fireEvent.click(screen.getByRole('button'), { detail: 1 })
      expect(screen.getByRole('dialog')).toHaveTextContent(rule)
      cleanup()
    }
  }
)
