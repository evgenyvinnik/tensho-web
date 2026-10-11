import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { CoachPanel } from './CoachPanel'
import { Button } from '../ui/Button'
import { Tile, TileSuit } from '../../core/Tile'
import { MeldType } from '../../core/Meld'
import type { CoachAdvice } from '../../gameplay/beginnerCoach'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { scoreNumber } from '../../utils/scoreNumber'

const tiles = [1, 2, 3, 5, 5].map(
  (rank, index) => new Tile(TileSuit.Pinzu, rank, `coach-${index}`)
)
const advice: CoachAdvice = {
  best: {
    tileIds: tiles.map((tile) => tile.id),
    score: 95,
    pattern: null,
    structurePoints: 45,
  },
  shape: {
    tileIds: tiles.slice(0, 3).map((tile) => tile.id),
    score: 65,
    pattern: MeldType.Sequence,
    structurePoints: 30,
  },
  requiredPerHand: 75,
  keepsPace: true,
  structureGivenUp: 0,
}
beforeEach(() => useSettingsStore.setState({ reducedMotion: true }))
afterEach(async () => {
  cleanup()
  useSettingsStore.setState({ reducedMotion: false })
  await i18n.changeLanguage('en')
})

it('uses short visible labels and full accessible names without ellipses', () => {
  render(<CoachPanel advice={advice} onChoose={vi.fn()} />)
  expect(
    screen.getByRole('button', { name: 'Points now: +95' })
  ).toHaveTextContent('Score now')
  expect(
    screen.getByRole('button', { name: 'Sequence: +65' })
  ).toHaveTextContent('Sequence')
  expect(document.querySelector('[data-coach-label]')).not.toHaveClass(
    'truncate'
  )
  expect(
    screen.getByRole('button', { name: 'Sequence: +65' })
  ).toHaveAccessibleDescription(
    expect.stringContaining('does not predict future draws')
  )
})

it('explains exact physical selections without selecting or spending', () => {
  const choose = vi.fn()
  render(<CoachPanel advice={advice} visibleTiles={tiles} onChoose={choose} />)
  const trigger = screen.getByRole('button', { name: 'Why these tiles?' })
  trigger.focus()
  fireEvent.click(trigger)
  const dialog = screen.getByRole('dialog', { name: 'Why these tiles?' })
  expect(within(dialog).getByText(/only selects tiles/)).toBeVisible()
  expect(
    dialog.querySelectorAll('[data-coach-option="now"] [data-coach-tile]')
  ).toHaveLength(5)
  expect(
    dialog.querySelectorAll('[data-coach-option="shape"] [data-coach-tile]')
  ).toHaveLength(3)
  expect(within(dialog).getByText('+95')).toBeVisible()
  expect(within(dialog).getByText('+65')).toBeVisible()
  expect(choose).not.toHaveBeenCalled()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
  expect(trigger).toHaveFocus()
  expect(choose).not.toHaveBeenCalled()
})

it('selects precisely the illustrated choice, and separately supports dismissal', () => {
  const choose = vi.fn(),
    dismiss = vi.fn()
  render(
    <CoachPanel
      advice={advice}
      visibleTiles={tiles}
      onChoose={choose}
      onDismiss={dismiss}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Why these tiles?' }))
  fireEvent.click(document.querySelector('[data-coach-select="shape"]')!)
  expect(choose).toHaveBeenCalledExactlyOnceWith(advice.shape!.tileIds)
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Why these tiles?' }))
  fireEvent.click(screen.getByRole('button', { name: 'Hide advice' }))
  expect(dismiss).toHaveBeenCalledOnce()
  expect(choose).toHaveBeenCalledOnce()
})

it('does not invent another choice or expose missing/concealed tile identities', () => {
  render(
    <CoachPanel
      advice={{ ...advice, shape: null }}
      visibleTiles={tiles.slice(0, 2)}
      onChoose={vi.fn()}
    />
  )
  expect(document.querySelectorAll('[data-coach-choice]')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Why these tiles?' }))
  expect(document.querySelectorAll('[data-coach-tile]')).toHaveLength(2)
  expect(document.querySelector('[data-coach-tile="coach-2"]')).toBeNull()
  expect(document.querySelector('[data-coach-dismiss]')).toBeNull()
})

it('forwards the play button ref to a focusable native button', () => {
  const ref = createRef<HTMLButtonElement>()
  render(<Button ref={ref}>Confirm play</Button>)
  expect(ref.current).toBe(screen.getByRole('button', { name: 'Confirm play' }))
  ref.current!.focus()
  expect(ref.current).toHaveFocus()
})

it('illustrates a complete-hand suggestion without cutting it down to five tiles', () => {
  const hand = Array.from(
    { length: 14 },
    (_, index) => new Tile(TileSuit.Pinzu, (index % 9) + 1, `hand-${index}`)
  )
  const ids = hand.map((tile) => tile.id)
  const choose = vi.fn()
  render(
    <CoachPanel
      advice={{
        ...advice,
        best: { ...advice.best, tileIds: ids },
        shape: null,
      }}
      visibleTiles={hand}
      onChoose={choose}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Why these tiles?' }))
  expect(document.querySelectorAll('[data-coach-tile]')).toHaveLength(14)
  expect(document.querySelector('[data-popup-footer]')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Preview these tiles' }))
  expect(choose).toHaveBeenCalledExactlyOnceWith(ids)
})

it.each(SUPPORTED_LANGUAGES)(
  'localizes labels, explanations and exact large scores in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const key of [
      'pointsShort',
      'shapeShort',
      'explain',
      'hideAdvice',
      'previewChoice',
      'shapeCost',
      'tradeoff',
      ...Object.values(MeldType).map((pattern) => `patternShort.${pattern}`),
    ]) {
      expect(
        i18n.getResource(language, 'translation', `gameplay.coach.${key}`)
      ).toBeTruthy()
    }
    const score = 1_234_567_890
    render(
      <CoachPanel
        advice={{ ...advice, best: { ...advice.best, score } }}
        onChoose={vi.fn()}
      />
    )
    expect(
      screen.getByRole('button', {
        name: `${i18n.t('gameplay.coach.pointsNow')}: +${scoreNumber(score, language).exact}`,
      })
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('gameplay.coach.explain') })
    )
    expect(
      screen.getByRole('dialog').querySelector('[data-coach-exact]')
        ?.textContent
    ).toBe(`+${scoreNumber(score, language).exact}`)
  }
)
