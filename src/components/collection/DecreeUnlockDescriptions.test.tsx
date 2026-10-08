import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES } from '../../config/decreeDefinitions'
import { ItemDetailModal } from './ItemDetailModal'
import { ArchiveSystem } from '../../systems/ArchiveSystem'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'explains all six locked Decrees in %s',
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
        <ItemDetailModal
          isOpen
          onClose={() => {}}
          entry={entry}
          categoryInfo={null}
          displayInfo={{
            id: decree.id,
            name: localItem.name,
            description: localItem.description,
            category: 'decrees',
          }}
        />
      )
      expect(screen.getByRole('dialog')).toHaveTextContent(localRule)
      expect(screen.getByRole('dialog')).toHaveAccessibleName(localItem.name)
      expect(screen.getByRole('dialog')).toHaveTextContent(
        localItem.description
      )
      cleanup()
    }
  }
)
