import { readFileSync, readdirSync } from 'node:fs'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useTableLoopStore } from '../../stores/tableLoopStore'
import { TableSaveConflict } from './TableSaveConflict'

it.each(
  readdirSync('src/i18n/locales').filter((name) => name.endsWith('.json'))
)(
  'supplies conflict, destructive-recovery consent and failure copy in %s',
  (file) => {
    const copy = JSON.parse(readFileSync(`src/i18n/locales/${file}`, 'utf8'))
      .tableLoop.save
    for (const key of [
      'conflictTitle',
      'conflict',
      'loadLatest',
      'loadConfirm',
      'loadFailed',
    ]) {
      expect(typeof copy[key]).toBe('string')
      expect(copy[key].length).toBeGreaterThan(4)
    }
  }
)

it('requires explicit confirmation, preserves a failed branch and allows retry', async () => {
  const load = vi
    .spyOn(useTableLoopStore.getState(), 'loadSavedRun')
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true)
  const onLoaded = vi.fn()
  try {
    render(<TableSaveConflict onLoaded={onLoaded} onMenu={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load latest save' }))
    expect(load).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(load).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Load latest save' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() =>
      expect(
        screen.getByText(/The latest save could not be loaded/)
      ).toBeVisible()
    )
    expect(onLoaded).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Load latest save' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(onLoaded).toHaveBeenCalledOnce())
    expect(load).toHaveBeenCalledTimes(2)
  } finally {
    load.mockRestore()
  }
})
