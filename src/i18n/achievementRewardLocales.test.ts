import { createInstance } from 'i18next'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../router/routeManifest'
import { TABLE_STYLE_DEFINITIONS } from '../config/tableStyleDefinitions'
import en from './locales/en.json'

type Copy = { name: string; description: string }
type WallCopy = Copy & {
  theme: string
  unlock: string
  modifiers: Record<string, string>
}
type RewardLocale = {
  decrees: { items: Record<string, Copy> }
  decreeUnlocks: Record<string, string>
  tableStyles: { items: Record<string, WallCopy> }
  walls: { items: Record<string, Copy> }
  achievements: Record<string, Copy>
  gameplay: { redraw: string }
  shop: { title: string }
}

const localeModules = import.meta.glob<RewardLocale>('./locales/*.json', {
  eager: true,
  import: 'default',
})

const englishDecrees = {
  stage_master: {
    name: 'Stage Master',
    description: '+25 Points and +1 Mult per completed Act.',
  },
  flower_pot: {
    name: 'Flower Pot',
    description: '×3 Mult while you own all four different Flowers.',
  },
  satellite: {
    name: 'Satellite',
    description:
      'At the end of each won round, +1 Gold for each hand family you have raised above level 1 with Orbs.',
  },
  swift_andy: {
    name: 'Swift Andy',
    description: '+2 free redraws each round; −2 rack spaces.',
  },
  lucky_sixes: {
    name: 'Lucky Sixes',
    description: '+6 Mult per numbered 6 played. Stones do not count.',
  },
  the_idol: {
    name: 'The Idol',
    description:
      '×3 Mult when you play at least two tiles and all of them are the same printed tile. Stones break it; Wild tiles keep their printed face.',
  },
  stuntman: {
    name: 'Stuntman',
    description: '+250 Points; −3 rack spaces.',
  },
  cartomancer: {
    name: 'Cartomancer',
    description:
      'Adds one free Fate Seal offer when you enter the Tea House. Rerolls do not refresh it.',
  },
  astronomer: {
    name: 'Astronomer',
    description:
      'Adds one free Celestial Orb offer when you enter the Tea House. Rerolls do not refresh it.',
  },
} as const

type RewardId = keyof typeof englishDecrees
const rewardIds = Object.keys(englishDecrees) as RewardId[]
const wallIds = ['crimson_wall', 'obsidian_wall'] as const
const englishWalls = {
  crimson_wall: {
    name: 'Crimson Wall',
    theme: 'Dragon',
    description:
      'Crimson lacquer and golden dragons favor a Dragon-led strategy, with less room for Decrees.',
    unlock: 'Win on Red Stake or higher',
    modifiers: {
      '0': 'Starting Dragons have Mult Marks (+4 Mult when scored)',
      '1': '−1 starting Decree slot',
    },
  },
  obsidian_wall: {
    name: 'Obsidian Wall',
    theme: 'Wind',
    description:
      'Dark stone and silver wind carvings reward a Wind-led strategy, with less room for Decrees.',
    unlock: 'Win on Black Stake or higher',
    modifiers: {
      '0': 'Starting Winds have Bonus Marks (+30 Points when scored)',
      '1': '−1 starting Decree slot',
    },
  },
}

// Keep operators: +3, −3, and ×3 are different mechanics, not just "3".
// Written-out cardinalities are checked separately below.
const numericSignature = (text: string) =>
  (text.match(/[+−×-]?\d+(?:[.,]\d+)?/g) ?? []).sort()

const expectedNumbers: Record<RewardId, string[]> = {
  stage_master: ['+1', '+25'],
  flower_pot: ['×3'],
  satellite: ['+1', '1'],
  swift_andy: ['+2', '−2'],
  lucky_sixes: ['+6', '6'],
  the_idol: ['×3'],
  stuntman: ['+250', '−3'],
  cartomancer: [],
  astronomer: [],
}

const cardinalities: Record<string, readonly [string, string, string]> = {
  en: ['four', 'two', 'one'],
  es: ['cuatro', 'dos', 'una'],
  fr: ['quatre', 'deux', 'une'],
  id: ['keempat', 'dua', 'satu'],
  it: ['quattro', 'due', 'un’offerta'],
  ja: ['四', '二', '一つ'],
  ko: ['네', '두', '하나'],
  ru: ['четыре', 'двух', 'одно'],
  th: ['สี่', 'สอง', 'หนึ่ง'],
  tl: ['apat', 'dalawang', 'isang'],
  tr: ['Dört', 'iki', 'bir'],
  'zh-Hans': ['四', '两', '一个'],
  'zh-Hant': ['四', '兩', '一個'],
}

const achievementForReward: Record<RewardId, string> = {
  stage_master: 'firstSteps',
  flower_pot: 'ascending',
  satellite: 'fortuneBuilt',
  swift_andy: 'speedRun',
  lucky_sixes: 'score10k',
  the_idol: 'score1m',
  stuntman: 'score100m',
  cartomancer: 'sealScholar',
  astronomer: 'starGazer',
}

describe('achievement reward localization', () => {
  it('covers every supported language explicitly', () => {
    expect(Object.keys(cardinalities).sort()).toEqual(
      [...SUPPORTED_LANGUAGES].sort()
    )
    for (const language of SUPPORTED_LANGUAGES)
      expect(
        localeModules[`./locales/${language}.json`],
        language
      ).toBeDefined()
  })

  it('keeps the approved English Decree copy and edge-case explanations', () => {
    for (const id of rewardIds)
      expect(en.decrees.items[id], id).toEqual(englishDecrees[id])
  })

  it('keeps the approved English Wall copy', () => {
    for (const id of wallIds)
      expect(en.tableStyles.items[id], id).toEqual(englishWalls[id])
  })

  it.each(SUPPORTED_LANGUAGES)(
    '%s resolves every reward key without English fallback',
    async (language) => {
      const locale = localeModules[`./locales/${language}.json`]
      const i18n = createInstance()
      await i18n.init({
        lng: language,
        fallbackLng: false,
        resources: { [language]: { translation: locale } },
      })
      const checkKey = (key: string, reference: string, translated = true) => {
        expect(i18n.exists(key), key).toBe(true)
        const value = i18n.t(key)
        expect(value.trim(), key).toBeTruthy()
        expect(value, key).not.toBe(key)
        expect(value, key).not.toMatch(/undefined|TODO|\{\{/)
        if (language !== 'en' && translated)
          expect(value, key).not.toBe(reference)
        return value
      }
      for (const id of rewardIds) {
        // Proper names and cognates (e.g. French "Satellite") may match English.
        checkKey(`decrees.items.${id}.name`, englishDecrees[id].name, false)
        const description = checkKey(
          `decrees.items.${id}.description`,
          englishDecrees[id].description
        )
        expect(numericSignature(description), id).toEqual(expectedNumbers[id])
        const unlock = checkKey(`decreeUnlocks.${id}`, en.decreeUnlocks[id])
        // Reuse the exact localized achievement requirement, including paid-turn
        // accounting, discovery scope, and score separators.
        expect(unlock, id).toBe(
          locale.achievements[achievementForReward[id]].description
        )
        const normalizedNumbers = (text: string) =>
          text.replace(/[,.\u00a0\u202f]/g, '').match(/\d+/g) ?? []
        expect(normalizedNumbers(unlock), id).toEqual(
          normalizedNumbers(en.decreeUnlocks[id])
        )
      }

      const [four, two, one] = cardinalities[language]
      expect(locale.decrees.items.flower_pot.description).toContain(four)
      expect(locale.decrees.items.the_idol.description).toContain(two)
      for (const id of ['cartomancer', 'astronomer']) {
        expect(locale.decrees.items[id].description).toContain(one)
        expect(locale.decrees.items[id].description).toContain(
          locale.shop.title
        )
      }

      for (const id of wallIds) {
        const reference = en.tableStyles.items[id]
        expect(locale.tableStyles.items[id].name).toBe(
          locale.walls.items[id].name
        )
        for (const field of ['name', 'theme', 'description', 'unlock'] as const)
          checkKey(
            `tableStyles.items.${id}.${field}`,
            reference[field],
            field !== 'theme'
          )
        expect(Object.keys(locale.tableStyles.items[id].modifiers)).toEqual([
          '0',
          '1',
        ])
        for (const index of ['0', '1'] as const) {
          const modifier = checkKey(
            `tableStyles.items.${id}.modifiers.${index}`,
            reference.modifiers[index]
          )
          expect(numericSignature(modifier), `${id} modifier ${index}`).toEqual(
            index === '1' ? ['−1'] : id === 'crimson_wall' ? ['+4'] : ['+30']
          )
        }
        expect(
          numericSignature(locale.tableStyles.items[id].description)
        ).toEqual([])
        expect(numericSignature(locale.tableStyles.items[id].unlock)).toEqual(
          []
        )
      }
    }
  )

  it.each([
    ['crimson_wall', 'starting_dragon_mult', 4, 2],
    ['obsidian_wall', 'starting_wind_bonus', 30, 4],
  ] as const)(
    'keeps %s modifier indexes aligned with its definition',
    (id, type, value, tier) => {
      const definition = TABLE_STYLE_DEFINITIONS.find((wall) => wall.id === id)
      expect(definition, id).toBeDefined()
      expect(definition!.startingModifiers).toHaveLength(2)
      expect(definition!.startingModifiers[0]).toMatchObject({ type, value })
      expect(definition!.startingModifiers[1]).toMatchObject({
        type: 'decree_slot',
        value: -1,
      })
      expect(definition!.unlockCondition).toMatchObject({
        type: 'win_at_tier',
        threshold: tier,
      })
    }
  )
})
