import { readFileSync } from 'node:fs'
import { cleanup, render, renderHook, within } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import type { ReactNode } from 'react'
import ts from 'typescript'
import { afterEach, expect, it } from 'vitest'
import en from '../../../i18n/locales/en.json'
import { ROUND_TYPE_DEFINITIONS } from '../../../config/mandateDefinitions'
import { MAX_TACTICAL_PLAY_TILES } from '../../../game/playRules'
import { MeldType } from '../../../core/Meld'
import { TileSuit } from '../../../core/Tile'
import { getTileImagePath } from '../../../utils/assets'
import {
  DRAGON_GROUP_MULT,
  DRAGON_MULT,
  GROUP_MULT,
  SECRET_PATTERNS,
} from '../../../rules/PlayPattern'
import {
  DRAGON_TILE_POINTS,
  STRUCTURE_POINTS_BY_TYPE,
  WIND_GROUP_POINTS,
  WIND_TILE_POINTS,
} from '../../../rules/ScoringEngine'
import { ALL_YAKU } from '../../../rules/YakuDetector'
import { useTutorialSteps } from './useTutorialSteps'

afterEach(cleanup)

// This is deliberately English-only. Locale parity belongs to the integration
// pass after translations land, not to this source/key-contract regression test.
async function englishProvider(resources: object = en) {
  const instance = createInstance()
  await instance.init({
    lng: 'en',
    fallbackLng: false,
    resources: { en: { translation: resources } },
    interpolation: { escapeValue: false },
  })
  return {
    instance,
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={instance}>{children}</I18nextProvider>
    ),
  }
}

function ReferenceProbe() {
  return useTutorialSteps()
    .filter(
      (step) =>
        step.category !== 'Economy' &&
        (step.category !== 'Flora' || step.id === 'hierarchy')
    )
    .map((step) => (
      <section key={step.id} data-testid={step.id}>
        <h2>{step.title}</h2>
        {step.content}
      </section>
    ))
}

const titleKeys = {
  'game-concept': 'titleConcept',
  'tiles-overview': 'titleTilesOverview',
  'numbered-suits': 'titleSuits',
  'terminals-simples': 'titleTerminals',
  'wind-tiles': 'titleWinds',
  'dragon-tiles': 'titleDragons',
  'bonus-tiles': 'titleBonus',
  'melds-overview': 'titleMeldsOverview',
  sequences: 'titleSequences',
  triplets: 'titleTriplets',
  quads: 'titleQuads',
  pairs: 'titlePairs',
  'winning-hand': 'titleWinningHand',
  'special-hands': 'titleSpecialHands',
  'yaku-intro': 'titleYakuIntro',
  'yaku-examples': 'titleYakuExamples',
  'acts-rounds': 'titleActsRounds',
  'boss-mandates': 'titleBossMandates',
  'decrees-intro': 'titleDecreesIntro',
  'decree-categories': 'titleDecreeCategories',
  'decree-rarities': 'titleDecreeRarities',
  'decree-slots': 'titleDecreeSlots',
  hierarchy: 'titleHierarchy',
  tips: 'titleTips',
  'more-tips': 'titleMoreTips',
} as const

it('renders all 25 formerly missing titles from the English key contract', async () => {
  const { wrapper } = await englishProvider()
  const { getByTestId, container } = render(<ReferenceProbe />, { wrapper })
  expect(Object.keys(titleKeys)).toHaveLength(25)
  for (const [id, key] of Object.entries(titleKeys)) {
    expect(en.codexReference[key]).toBeTruthy()
    expect(within(getByTestId(id)).getByRole('heading')).toHaveTextContent(
      en.codexReference[key]
    )
  }
  expect(container.textContent).not.toMatch(
    /(?:tutorial|codexReference)\.|{{|<\/?(?:strong|melds|pair|tiles)>/
  )
})

it('routes every new key through translation and leaves no English text literals', async () => {
  // Replace English resources with numbered markers (not a real locale). Any
  // hard-coded JSX, table header/row, title or Trans fallback remains visible.
  const markers = new Map<string, string>()
  function mask(value: unknown, path = ''): unknown {
    if (typeof value === 'string') {
      const marker = `§${markers.size}§`
      markers.set(path, marker)
      return marker
    }
    if (Array.isArray(value))
      return value.map((item, index) => mask(item, `${path}.${index}`))
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          mask(item, path ? `${path}.${key}` : key),
        ])
      )
    return value
  }
  const { wrapper } = await englishProvider(mask(en) as object)
  const { container } = render(<ReferenceProbe />, { wrapper })
  expect(container.textContent).not.toMatch(/[a-z]/i)
  for (const key of Object.keys(en.codexReference))
    expect(container, key).toHaveTextContent(
      markers.get(`codexReference.${key}`)!
    )
})

it('keeps explanations aligned with shipped scoring and action rules', async () => {
  const { wrapper, instance } = await englishProvider()
  const { getByTestId, container } = render(<ReferenceProbe />, { wrapper })
  expect(getByTestId('gameplay-overview')).toHaveTextContent(
    instance.t('tutorial.turns.play', { max: MAX_TACTICAL_PLAY_TILES })
  )
  expect(getByTestId('wind-tiles')).toHaveTextContent(
    instance.t('codexReference.windPoints', {
      points: WIND_TILE_POINTS,
      groupPoints: WIND_GROUP_POINTS,
    })
  )
  expect(getByTestId('dragon-tiles')).toHaveTextContent(
    instance.t('codexReference.dragonPoints', {
      points: DRAGON_TILE_POINTS,
      mult: DRAGON_MULT,
      groupMult: DRAGON_GROUP_MULT,
    })
  )
  expect(getByTestId('quads')).toHaveTextContent(
    instance.t('codexReference.quadBonus', {
      points: STRUCTURE_POINTS_BY_TYPE[MeldType.Quad],
      mult: GROUP_MULT.quad,
    })
  )
  expect(getByTestId('quads')).toHaveTextContent(en.codexReference.quadRefill)
  expect(getByTestId('winning-hand')).toHaveTextContent(
    en.codexReference.winningExample
  )
  expect(getByTestId('yaku-intro')).toHaveTextContent(
    instance.t('codexReference.yakuTiers', { count: ALL_YAKU.length })
  )
  for (const round of Object.values(ROUND_TYPE_DEFINITIONS))
    expect(getByTestId('acts-rounds')).toHaveTextContent(
      `×${round.scoreMultiplier}`
    )
  expect(getByTestId('hierarchy')).toHaveTextContent(en.guide.specialHelp)
  expect(getByTestId('decree-slots')).toHaveTextContent(en.codexEconomy.sale)
  expect(getByTestId('decree-rarities')).toHaveTextContent(
    en.codexReference.raritySources
  )
  expect(container.textContent).not.toMatch(
    /\bRiichi\b|safe to discard|When declared|21 yaku|base payout scales with score|half the purchase price/i
  )
  for (const id of SECRET_PATTERNS) {
    expect(container).not.toHaveTextContent(en.patterns[id].name)
    expect(container).not.toHaveTextContent(en.patterns[id].explain)
  }
})

it('preserves the teaching tables and tile illustrations', async () => {
  const { wrapper } = await englishProvider()
  const { result } = renderHook(useTutorialSteps, { wrapper })
  for (const [id, count] of [
    ['numbered-suits', 9],
    ['terminals-simples', 5],
    ['wind-tiles', 4],
    ['dragon-tiles', 3],
    ['sequences', 3],
    ['triplets', 3],
    ['quads', 4],
    ['pairs', 2],
    ['ready', 3],
  ] as const)
    expect(
      result.current.find((step) => step.id === id)?.showTiles,
      id
    ).toHaveLength(count)

  const { container, getByTestId } = render(<ReferenceProbe />, { wrapper })
  expect(container.querySelectorAll('table')).toHaveLength(8)
  const imageSources = (id: string) =>
    [...getByTestId(id).querySelectorAll('img')].map((image) =>
      image.getAttribute('src')
    )
  expect(imageSources('bonus-tiles')).toEqual(
    expect.arrayContaining([
      getTileImagePath(TileSuit.Flower, 1),
      getTileImagePath(TileSuit.Season, 3),
    ])
  )
  expect(imageSources('wind-tiles')).toEqual(
    expect.arrayContaining(
      [1, 2, 3, 4].map((rank) => getTileImagePath(TileSuit.Wind, rank))
    )
  )
})

it('requires real English resources and disallows literal titles or JSX copy', () => {
  const source = readFileSync(
    'src/components/screens/tutorial/useTutorialSteps.tsx',
    'utf8'
  )
  const file = ts.createSourceFile(
    'useTutorialSteps.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const violations: string[] = []
  function hasKey(key: string) {
    const value = key
      .split('.')
      .reduce<unknown>(
        (node, part) =>
          node && typeof node === 'object'
            ? (node as Record<string, unknown>)[part]
            : undefined,
        en
      )
    expect(typeof value, key).toBe('string')
    expect(value, key).not.toBe('')
  }
  function visit(node: ts.Node, translated = false) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(file) === 'Trans'
    )
      translated = true
    if (ts.isJsxText(node) && !translated && /[a-z]/i.test(node.text))
      violations.push(node.text.trim())
    if (ts.isCallExpression(node) && node.expression.getText(file) === 't') {
      if (ts.isStringLiteral(node.arguments[0])) hasKey(node.arguments[0].text)
      if (node.arguments[1] && ts.isStringLiteral(node.arguments[1]))
        violations.push(`English fallback: ${node.arguments[1].text}`)
    }
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      if (node.name.getText(file) === 'i18nKey') hasKey(node.initializer.text)
      if (
        ['title', 'label', 'aria-label', 'placeholder'].includes(
          node.name.getText(file)
        )
      )
        violations.push(`Literal attribute: ${node.getText(file)}`)
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === 'title') {
      expect(ts.isCallExpression(node.initializer), node.getText(file)).toBe(
        true
      )
      if (ts.isCallExpression(node.initializer)) {
        expect(node.initializer.expression.getText(file)).toBe('t')
        expect(node.initializer.arguments).toHaveLength(1)
      }
    }
    ts.forEachChild(node, (child) => visit(child, translated))
  }
  visit(file)
  expect(violations).toEqual([])
})
