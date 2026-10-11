import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { RackTools } from './RackTools'
import { RiichiControl } from './RiichiControl'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it('reveals tools without inspecting Riichi or running an action', () => {
  const inspect = vi.fn(() => ({
    status: 'available' as const,
    reason: null,
    cost: 1 as const,
  }))
  const action = vi.fn(() => ({ success: true, effects: [] }))
  const guide = vi.fn(),
    builder = vi.fn()
  render(
    <RackTools
      onOpenBeginnerGuide={guide}
      onOpenHandBuilder={builder}
      riichiControl={
        <RiichiControl status="available" inspect={inspect} onAction={action} />
      }
    >
      Hand (14)
    </RackTools>
  )
  const more = screen.getByRole('button', { name: 'More table tools' })
  const panel = document.getElementById(more.getAttribute('aria-controls')!)!
  expect(more).toHaveAttribute('aria-expanded', 'false')
  expect(panel).toHaveClass('hidden', 'sm:flex')
  fireEvent.click(more)
  expect(more).toHaveAttribute('aria-expanded', 'true')
  expect(panel).not.toHaveClass('hidden')
  expect(inspect).not.toHaveBeenCalled()
  expect(action).not.toHaveBeenCalled()
  expect(builder).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Build a hand' }))
  expect(builder).toHaveBeenCalledOnce()
  fireEvent.click(more)
  expect(more).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'Learn the tiles' }))
  expect(guide).toHaveBeenCalledOnce()
})

it('omits the disclosure if no secondary tools exist', () => {
  render(<RackTools onOpenBeginnerGuide={vi.fn()}>Hand</RackTools>)
  expect(document.querySelector('[data-open-rack-tools]')).toBeNull()
  expect(document.querySelector('[data-rack-tools]')).toBeNull()
})

it.each(SUPPORTED_LANGUAGES)(
  'localizes the disclosure in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const text = i18n.getResource(language, 'translation', 'gameplay.moreTools')
    expect(text).toBeTruthy()
    if (language !== 'en') expect(text).not.toBe('More table tools')
    render(<RackTools onOpenHandBuilder={vi.fn()}>Hand</RackTools>)
    expect(screen.getByRole('button', { name: text })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  }
)
