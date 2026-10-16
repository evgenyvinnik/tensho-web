import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClassicSaveNotice } from './ClassicSaveNotice'

const persistence = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}))
const startConfiguredClassicRun = vi.hoisted(() => vi.fn())
const navigateTo = vi.hoisted(() => vi.fn())

vi.mock('../../game/useClassicPersistence', () => ({
  useClassicPersistence: () => persistence.current,
}))
vi.mock('../../game/classicPersistenceApp', () => ({
  startConfiguredClassicRun,
  classicDestination: () => 'play',
}))
vi.mock('../../router', () => ({
  useAppNavigation: () => ({ navigateTo }),
}))

const run = (overrides: Record<string, unknown>) => {
  persistence.current = {
    service: { hasLocalRun: true, retrySave: vi.fn(), refresh: vi.fn() },
    status: 'saved',
    unsaved: false,
    disk: { kind: 'ready', raw: 'saved-run' },
    ...overrides,
  }
}

beforeEach(() => {
  startConfiguredClassicRun.mockReset().mockResolvedValue(true)
  navigateTo.mockReset()
})

describe('ClassicSaveNotice', () => {
  it('never explains a run that cannot be saved: it offers a New Run instead', async () => {
    run({ status: 'invalid', unsaved: true })
    render(<ClassicSaveNotice errorsOnly />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(document.body).not.toHaveTextContent(/could not be saved/i)
    fireEvent.click(screen.getByRole('button', { name: 'New Run' }))
    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith('play'))
    // It replaces exactly the record it read.
    expect(startConfiguredClassicRun).toHaveBeenCalledWith('saved-run')
  })

  it('replaces an unreadable record with the New Run it offers', async () => {
    run({ disk: { kind: 'invalid', raw: '{broken' } })
    render(<ClassicSaveNotice errorsOnly />)
    fireEvent.click(screen.getByRole('button', { name: 'New Run' }))
    await waitFor(() =>
      expect(startConfiguredClassicRun).toHaveBeenCalledWith('{broken')
    )
  })

  it('stays silent where the screen has its own New Run, and in the toolbar', () => {
    run({ status: 'invalid', unsaved: true })
    const { container, rerender } = render(
      <ClassicSaveNotice errorsOnly offerNewRun={false} />
    )
    expect(container).toBeEmptyDOMElement()
    rerender(<ClassicSaveNotice inline />)
    expect(container).toBeEmptyDOMElement()
  })

  it('still says when storage cannot be used at all', () => {
    run({ status: 'unavailable', unsaved: true })
    render(<ClassicSaveNotice errorsOnly />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Saving or loading is unavailable'
    )
    expect(screen.queryByRole('button', { name: 'New Run' })).toBeNull()
  })
})
