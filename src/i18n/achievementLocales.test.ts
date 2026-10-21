import { expect, it } from 'vitest'
import { ACHIEVEMENT_DEFINITIONS } from '../stores/achievementStore'
import en from './locales/en.json'

type Copy = { name: string; description: string }
const locales = import.meta.glob<{
  achievements: Record<string, unknown>
}>('./locales/*.json', { eager: true, import: 'default' })
const numbers = (text: string) =>
  (text.replace(/[,.\u00a0\u202f]/g, '').match(/\d+/g) ?? []).sort()

it.each(Object.entries(locales))(
  '%s supplies every achievement without fallback',
  (path, locale) => {
    for (const definition of ACHIEVEMENT_DEFINITIONS) {
      const key = definition.nameKey.split('.')[1]
      const entry = locale.achievements[key] as Copy | undefined
      const reference = en.achievements[
        key as keyof typeof en.achievements
      ] as Copy
      expect(entry, definition.id).toBeDefined()
      expect(entry?.name.trim(), definition.nameKey).toBeTruthy()
      expect(entry?.description.trim(), definition.descriptionKey).toBeTruthy()
      if (!path.endsWith('/en.json'))
        expect(entry!.description, definition.descriptionKey).not.toBe(
          reference.description
        )
      expect(numbers(entry!.description), definition.id).toEqual(
        numbers(reference.description)
      )
    }
  }
)
