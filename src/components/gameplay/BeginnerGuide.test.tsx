import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BeginnerGuide } from './BeginnerGuide'
import { Tile, TileSuit } from '../../core/Tile'
import {
  parsePartialHand,
  toPartialParsedHand,
} from '../../rules/PartialHandParser'
import { calculateScore, createScoringContext } from '../../rules/ScoringEngine'
import {
  MAHJONG_PATTERN_MULT,
  TAUGHT_PATTERNS,
  type PlayPatternId,
} from '../../rules/PlayPattern'
import {
  EditionType,
  EnhancementType,
  SealType,
} from '../../core/TileModifier'
import en from '../../i18n/locales/en.json'

const tiles = (suit: TileSuit, ranks: number[]) =>
  ranks.map((rank, i) => new Tile(suit, rank, `guide-test-${suit}-${rank}-${i}`))

/** The engine's payment for a play: shape bonus and Mult with no Yaku. */
function enginePays(play: Tile[]) {
  const parsed = parsePartialHand(play)
  const score = calculateScore(
    createScoringContext(play, toPartialParsedHand(parsed, play), {
      partialMelds: parsed.groups,
      previewMode: true,
    })
  )
  return { structure: score.structurePoints, mult: 1 + score.pattern.mult }
}

function shown(id: PlayPatternId) {
  const row = document.querySelector(`[data-guide-pattern="${id}"]`)!
  const [, structure, mult] = row.textContent!.match(/\+(\d+)×([\d.]+)/)!
  return { structure: Number(structure), mult: Number(mult) }
}

const renderGuide = (onClose = vi.fn()) =>
  render(<BeginnerGuide isOpen onClose={onClose} />)

describe('BeginnerGuide', () => {
  it('lists every taught hand, in order', () => {
    renderGuide()
    expect(
      Array.from(document.querySelectorAll('[data-guide-pattern]'), (row) =>
        row.getAttribute('data-guide-pattern')
      )
    ).toEqual([...TAUGHT_PATTERNS])
    for (const id of TAUGHT_PATTERNS)
      expect(
        screen.getByRole('heading', { name: en.patterns[id].name })
      ).toBeInTheDocument()
  })

  it.each([
    ['pair', tiles(TileSuit.Pinzu, [5, 5])],
    ['sequence', tiles(TileSuit.Souzu, [2, 3, 4])],
    ['two_pairs', [...tiles(TileSuit.Manzu, [3, 3]), ...tiles(TileSuit.Pinzu, [7, 7])]],
    ['triplet', tiles(TileSuit.Manzu, [7, 7, 7])],
    ['straight4', tiles(TileSuit.Souzu, [3, 4, 5, 6])],
    ['sequence_pair', [...tiles(TileSuit.Pinzu, [1, 2, 3]), ...tiles(TileSuit.Souzu, [9, 9])]],
    ['two_sequences', tiles(TileSuit.Manzu, [2, 3, 4, 6, 7, 8])],
    ['triplet_pair', [...tiles(TileSuit.Souzu, [5, 5, 5]), ...tiles(TileSuit.Manzu, [2, 2])]],
    ['straight5', tiles(TileSuit.Pinzu, [4, 5, 6, 7, 8])],
    ['quad', tiles(TileSuit.Pinzu, [9, 9, 9, 9])],
  ] as const)('shows the shape bonus and Mult the engine pays for %s', (id, play) => {
    renderGuide()
    expect(shown(id)).toEqual(enginePays([...play]))
  })

  it('shows every mark, seal and edition with the effect its tile details give', () => {
    renderGuide()
    const looks = [
      ...Object.values(EnhancementType)
        .filter((id) => id !== EnhancementType.None)
        .map((id) => ['tileMarks', id] as const),
      ...Object.values(SealType)
        .filter((id) => id !== SealType.None)
        .map((id) => ['archiveSeals', id] as const),
      ...Object.values(EditionType)
        .filter((id) => id !== EditionType.Base)
        .map((id) => ['editions', id] as const),
    ]
    expect(
      Array.from(document.querySelectorAll('[data-guide-special]'), (row) =>
        row.getAttribute('data-guide-special')
      )
    ).toEqual(looks.map(([kind, id]) => `${kind}.${id}`))
    for (const [kind, id] of looks) {
      const item = (en[kind].items as Record<string, { name: string; description: string }>)[id]
      const row = document.querySelector(`[data-guide-special="${kind}.${id}"]`)!
      expect(row).toHaveTextContent(item.name)
      expect(row).toHaveTextContent(item.description)
    }
    for (const key of ['marks', 'seals', 'editions'] as const)
      expect(
        screen.getByRole('heading', { name: en.guide[key] })
      ).toBeInTheDocument()
  })

  it('shows Mahjong’s flat Mult bonus', () => {
    renderGuide()
    expect(shown('mahjong').mult).toBe(1 + MAHJONG_PATTERN_MULT)
  })

  it('explains Turns, scoring, tiles, honors and special tiles, then closes', () => {
    const onClose = vi.fn()
    renderGuide(onClose)
    for (const key of [
      'turnsTitle',
      'scoreTitle',
      'handsTitle',
      'tilesTitle',
      'specialTitle',
    ] as const)
      expect(
        screen.getByRole('heading', { name: en.guide[key] })
      ).toBeInTheDocument()
    expect(screen.getByText(/Each round gives you 6 Turns/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Winds are worth 50 points each, 100 in a group. Each Dragon adds +2 Mult, +4 in a group.'
      )
    ).toBeInTheDocument()
    // The tile families teach their numbers even with rank numbers off.
    expect(
      document.querySelectorAll('[data-guide-tile-family] [data-tile-index]')
        .length
    ).toBeGreaterThanOrEqual(3)
    fireEvent.click(screen.getByRole('button', { name: en.guide.close }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
