import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BeginnerGuide } from './BeginnerGuide'
import { SecretPatternReveal } from './SecretPatternReveal'
import { Tile, TileSuit } from '../../core/Tile'
import { parsePlay, toPartialParsedHand } from '../../rules/PartialHandParser'
import { calculateScore, createScoringContext } from '../../rules/ScoringEngine'
import { useProgressionStore } from '../../stores/progressionStore'
import en from '../../i18n/locales/en.json'

const tiles = (suit: TileSuit, ranks: number[]) =>
  ranks.map((rank, i) => new Tile(suit, rank, `secret-ui-${suit}-${rank}-${i}`))

beforeEach(() => useProgressionStore.getState().resetProgression())
afterEach(() => {
  vi.useRealTimers()
  useProgressionStore.getState().resetProgression()
})

describe('secret hands in the guide', () => {
  it('stay hidden until this profile has played one', () => {
    render(<BeginnerGuide isOpen onClose={vi.fn()} />)
    expect(document.querySelector('[data-guide-secrets]')).toBeNull()
    expect(screen.queryByText(en.patterns.three_dragons.name)).toBeNull()
    expect(screen.queryByText(en.patterns.four_winds.name)).toBeNull()
  })

  it('show a played one with the shape bonus and Mult the engine pays', () => {
    act(() => {
      useProgressionStore.getState().discoverPattern('three_dragons')
    })
    render(<BeginnerGuide isOpen onClose={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: en.guide.secretTitle })
    ).toBeInTheDocument()
    const row = document.querySelector('[data-guide-pattern="three_dragons"]')!
    const [, structure, mult] = row.textContent!.match(/\+(\d+)×([\d.]+)/)!
    const play = tiles(TileSuit.Dragon, [1, 2, 3])
    const parsed = parsePlay(play)
    const score = calculateScore(
      createScoringContext(play, toPartialParsedHand(parsed, play), {
        partialMelds: parsed.groups,
        previewMode: true,
      })
    )
    expect(Number(structure)).toBe(score.structurePoints)
    expect(Number(mult)).toBe(1 + score.pattern.mult)
    expect(
      Array.from(row.querySelectorAll('img'), (img) => img.alt)
    ).toEqual([en.tiles.white, en.tiles.green, en.tiles.red])
    expect(
      document.querySelector('[data-guide-pattern="four_winds"]')
    ).toBeNull()
  })
})

describe('SecretPatternReveal', () => {
  it('names the hand, points to the guide, then leaves', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<SecretPatternReveal pattern="four_winds" onDone={onDone} />)
    expect(screen.getByRole('status')).toHaveTextContent(
      en.guide.secretFound
    )
    expect(screen.getByText(en.patterns.four_winds.name)).toBeInTheDocument()
    expect(screen.getByText(en.guide.secretInGuide)).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3200))
    expect(onDone).toHaveBeenCalledOnce()
  })
})
