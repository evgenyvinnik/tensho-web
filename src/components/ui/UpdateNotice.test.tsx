import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { UpdateNotice } from './UpdateNotice'
import { useUpdateStore } from '../../pwa/updateStore'
import { UpdateError } from '../../pwa/registerUpdates'
import { registerReloadGuard } from '../../pwa/reloadGuards'

beforeEach(() =>
  useUpdateStore.setState({ available: false, busy: false, error: null })
)

it('announces passively and Later permits reopening without activating', () => {
  const activate = vi.fn()
  render(<UpdateNotice />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  act(() => useUpdateStore.getState().announce(activate))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Update available' }))
  fireEvent.click(screen.getByRole('button', { name: 'Later' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(activate).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Update available' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('explains failed saves, keeps the dialog open and allows a successful retry', async () => {
  const guard = vi.fn().mockReturnValueOnce(false).mockReturnValue(true)
  const cleanup = registerReloadGuard('notice-test', guard)
  try {
    const activate = vi
      .fn()
      .mockRejectedValueOnce(new UpdateError('tabs'))
      .mockResolvedValue(undefined)
    useUpdateStore.getState().announce(activate)
    render(<UpdateNotice />)
    fireEvent.click(screen.getByRole('button', { name: 'Update available' }))
    const accept = within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Save and update',
    })
    await act(async () => fireEvent.click(accept))
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved')
    expect(activate).not.toHaveBeenCalled()
    await act(async () => fireEvent.click(accept))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Close other Tensho tabs'
    )
    await act(async () => fireEvent.click(accept))
    expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Later' })).toBeDisabled()
    expect(activate).toHaveBeenCalledTimes(2)
  } finally {
    cleanup()
  }
})
