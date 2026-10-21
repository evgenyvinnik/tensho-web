import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES } from '../../config/decreeDefinitions'
import { ItemCard } from './ItemCard'
import { ArchiveSystem } from '../../systems/ArchiveSystem'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'explains every locked Decree in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const archive = new ArchiveSystem()
    for (const decree of ALL_DECREES.filter((d) => d.unlockCondition)) {
      const localItem = i18n.getResource(
        language,
        'translation',
        `decrees.items.${decree.id}`
      )
      expect(localItem?.name).toBeTruthy()
      expect(localItem?.description).toBeTruthy()
      const entry = archive.getEntry('decrees', decree.id)!
      expect(entry.isUnlocked).toBe(false)
      const key = `decreeUnlocks.${decree.id}`
      const localRule = i18n.getResource(language, 'translation', key)
      expect(localRule).toBeTruthy()
      if (language !== 'en')
        expect(localRule).not.toBe(i18n.getResource('en', 'translation', key))
      render(
        <ItemCard
          entry={entry}
          displayInfo={{
            id: decree.id,
            name: localItem.name,
            description: localItem.description,
            category: 'decrees',
          }}
        />
      )
      // A locked reward stays readable: what it is, does, and needs.
      fireEvent.click(screen.getByRole('button'), { detail: 1 })
      // The matcher normalizes rendered NBSP/narrow-NBSP as ordinary spaces.
      // Preserve localized typography while comparing equivalent visible text.
      expect(screen.getByRole('dialog')).toHaveTextContent(
        localRule.replace(/\s+/g, ' ')
      )
      expect(screen.getByRole('dialog')).toHaveTextContent(localItem.name)
      expect(screen.getByRole('dialog')).toHaveTextContent(
        localItem.description
      )
      cleanup()
    }
  }
)
