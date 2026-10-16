import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HandScorePreview } from './HandScorePreview'
import { PlayToast } from './PlayToast'
import { RunHeader, type RunHeaderProps } from './RunHeader'
import { THE_NEEDLE, THE_WATER } from '../../config/mandateDefinitions'
import { settleScoreEquation } from '../../rules/ScoreEquation'

afterEach(() => vi.useRealTimers())

describe('HandScorePreview', () => {
  const twoPairs = {
    pattern: 'two_pairs' as const,
    points: 50,
    mult: 2.2,
    total: 110,
  }

  it('shows the selection’s pattern and its points × Mult = total', () => {
    const { container } = render(
      <HandScorePreview preview={twoPairs} lastPlay={null} />
    )
    expect(container.querySelector('[data-hand-score-state]')).toHaveAttribute(
      'data-hand-score-state',
      'preview'
    )
    expect(screen.getByLabelText('Hand score')).toHaveTextContent(
      'Two Pairs50×2.2=110'
    )
  })

  it('shows the last hand dimmed when nothing is selected', () => {
    const { container } = render(
      <HandScorePreview preview={null} lastPlay={twoPairs} />
    )
    expect(screen.getByLabelText('Last hand')).toHaveTextContent('Two Pairs')
    expect(
      container.querySelector('[data-hand-score-state="last"]')
    ).not.toBeNull()
  })

  it('never reveals the score of face-down tiles', () => {
    render(<HandScorePreview preview={twoPairs} hidden lastPlay={null} />)
    const section = screen.getByLabelText('Hand score')
    expect(section).toHaveTextContent('Face-down tiles')
    expect(section).not.toHaveTextContent('110')
  })

  it('shows the multiplier to one decimal and names a rounding instead of hiding it', () => {
    // Summer ×1.3 with Winter ×0.75 is 0.9750000000000001 in floating point,
    // reads ×1, and pays floor(48.75).
    const equation = settleScoreEquation(50, 1.3 * 0.75, 48)
    const { container } = render(
      <HandScorePreview
        preview={{
          pattern: 'sequence',
          ...equation,
          mult: equation.multiplier,
        }}
        lastPlay={null}
      />
    )
    expect(
      container.querySelector('[data-hand-score-points]')
    ).toHaveTextContent(/^50$/)
    expect(container.querySelector('[data-hand-score-mult]')).toHaveTextContent(
      /^1$/
    )
    expect(container.querySelector('[data-score-operator]')).toHaveTextContent(
      '→48.8 rounded down to 48'
    )
    expect(
      container.querySelector('[data-hand-score-total]')
    ).toHaveTextContent(/^48$/)
    expect(container.querySelector('[data-hand-score-adjustment]')).toBeNull()
  })

  it('shows after-score effects so the equation adds up', () => {
    // A Decay penalty of 10 after 45 × 1.
    const equation = settleScoreEquation(45, 1, 35)
    const { container } = render(
      <HandScorePreview
        preview={{
          pattern: 'sequence',
          ...equation,
          mult: equation.multiplier,
        }}
        lastPlay={null}
      />
    )
    expect(
      container.querySelector('[data-hand-score-adjustment]')
    ).toHaveTextContent('−10')
    expect(container.querySelector('[data-score-operator]')).toHaveTextContent(
      /^=$/
    )
    expect(
      container.querySelector('[data-hand-score-total]')
    ).toHaveTextContent(/^35$/)
  })

  it('shows placeholders before the first play', () => {
    render(<HandScorePreview preview={null} lastPlay={null} />)
    expect(screen.getByLabelText('Hand score')).toHaveTextContent('—×—=—')
  })
})

describe('PlayToast', () => {
  it('names what the play scored, then goes away', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(
      <PlayToast
        toast={{ id: 1, pattern: 'straight5', score: 1234, intensity: 0.2 }}
        onDone={onDone}
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Straight of Five!+1,234'
    )
    act(() => vi.advanceTimersByTime(1800))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('renders nothing without a play', () => {
    const { container } = render(<PlayToast toast={null} onDone={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('RunHeader', () => {
  const props = (overrides: Partial<RunHeaderProps> = {}): RunHeaderProps => ({
    gold: 12,
    stake: 1,
    currentAct: 2,
    hasEnteredEndless: false,
    roundType: 'Boss',
    score: 450,
    target: 1200,
    onHelp: vi.fn(),
    onExit: vi.fn(),
    onSettings: vi.fn(),
    ...overrides,
  })

  it('puts the round and its score against the target on one heading row', () => {
    render(<RunHeader {...props()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Act 2 · Boss'
    )
    expect(screen.getByLabelText('450 of 1,200 points')).toHaveTextContent(
      '450/1,200'
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '450'
    )
    expect(screen.getByLabelText(/12/)).toBeInTheDocument()
  })

  it('puts How to play beside Exit and Settings', () => {
    const p = props()
    render(<RunHeader {...p} />)
    const buttons = screen
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label'))
    expect(buttons).toEqual(['How to play', 'Exit', 'Settings'])
    fireEvent.click(screen.getByRole('button', { name: 'How to play' }))
    expect(p.onHelp).toHaveBeenCalledOnce()
  })

  it.each([
    [THE_NEEDLE, 'Only 1 Play'],
    [THE_WATER, 'No REDRAW'],
  ])(
    'states what $name does in a few words, with details on tap',
    (mandate, consequence) => {
      render(
        <RunHeader
          {...props({
            mandate: {
              id: mandate.id,
              effect: mandate.effect,
              name: mandate.name,
              description: mandate.description,
            },
          })}
        />
      )
      const badge = screen.getByRole('button', {
        name: `${mandate.name}: ${consequence}`,
      })
      expect(badge).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(badge)
      expect(badge).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('dialog')).toHaveTextContent(mandate.description)
    }
  )
})
