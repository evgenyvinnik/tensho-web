import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ProgressiveHint } from '../../config/progressiveTutorialHints'
import { ProgressiveHintOverlay } from './ProgressiveHint'

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

describe('ProgressiveHintOverlay', () => {
  it('enters visibly without disabling the surrounding game UI', async () => {
    render(
      <>
        <button type="button">Play Hand</button>
        <ProgressiveHintOverlay
          hint={hint}
          queueCount={1}
          onDismiss={vi.fn()}
          onDisableHints={vi.fn()}
        />
      </>
    )

    const status = screen.getByRole('status')
    const animatedContainer = status.parentElement
    expect(screen.getByRole('button', { name: 'Play Hand' })).toBeEnabled()

    await waitFor(() => {
      expect(Number(animatedContainer?.style.opacity ?? 0)).toBeGreaterThan(0.95)
    })
  })
})
