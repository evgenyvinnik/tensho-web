import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProgressiveHint } from '../../config/progressiveTutorialHints'
import { ProgressiveHintCard } from './ProgressiveHint'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}))

const hint: ProgressiveHint = {
  id: 'test-hint',
  trigger: 'gameStart',
  title: 'A useful tip',
  content: 'Gameplay remains available while this small card is visible.',
  priority: 1,
  position: { x: 50, y: 40 },
  arrowDirection: 'top',
}

describe('ProgressiveHintCard', () => {
  it('enters visibly without disabling the surrounding game UI', async () => {
    const { container } = render(
      <>
        <button type="button">Play Hand</button>
        <ProgressiveHintCard
          hint={hint}
          queueCount={1}
          onDismiss={vi.fn()}
          onDisableHints={vi.fn()}
        />
      </>
    )

    const status = screen.getByRole('status')
    const animatedContainer = status.closest<HTMLElement>(
      '[data-progressive-hint]'
    )
    expect(container.contains(status)).toBe(true)
    expect(screen.getByRole('button', { name: 'Play Hand' })).toBeEnabled()

    await waitFor(() => {
      expect(Number(animatedContainer?.style.opacity ?? 0)).toBeGreaterThan(
        0.95
      )
    })
  })

  it('does not steal focus on arrival and only handles Escape inside the card', () => {
    const dismiss = vi.fn()
    const ui = (activeHint: ProgressiveHint | null) => (
      <>
        <button>Keep playing</button>
        <ProgressiveHintCard
          hint={activeHint}
          queueCount={1}
          onDismiss={dismiss}
          onDisableHints={vi.fn()}
        />
      </>
    )
    const { rerender, container } = render(ui(null))
    const play = screen.getByRole('button', { name: 'Keep playing' })
    play.focus()
    rerender(ui(hint))
    expect(play).toHaveFocus()
    fireEvent.keyDown(play, { key: 'Escape' })
    expect(dismiss).not.toHaveBeenCalled()
    const summary = container.querySelector('summary')!
    summary.focus()
    fireEvent.keyDown(summary, { key: 'Escape' })
    expect(dismiss).toHaveBeenCalledOnce()
    expect(play).toHaveFocus()
  })

  it('offers explicit acknowledgement and opt-out without a portal or focus trap', () => {
    const dismiss = vi.fn(),
      disable = vi.fn()
    const { container } = render(
      <ProgressiveHintCard
        hint={hint}
        queueCount={2}
        onDismiss={dismiss}
        onDisableHints={disable}
      />
    )
    expect(container.querySelector('details')).toHaveAttribute('open')
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(dismiss).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-hint-slot]')).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: "Don't show tips" }))
    expect(disable).toHaveBeenCalledOnce()
  })
})
