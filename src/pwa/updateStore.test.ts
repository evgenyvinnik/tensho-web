import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUpdateStore } from './updateStore'
import { prepareForReload, registerReloadGuard } from './reloadGuards'
import { UpdateError } from './registerUpdates'

describe('explicit update consent', () => {
  it('waits for saves and ignores repeat clicks', async () => {
    let saved!: (value: boolean) => void
    const prepare = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          saved = resolve
        })
    )
    const activate = vi.fn().mockResolvedValue(undefined)
    const store = createUpdateStore(prepare)
    await store.getState().accept()
    expect(prepare).not.toHaveBeenCalled()
    store.getState().announce(activate)
    expect(activate).not.toHaveBeenCalled()
    const pending = store.getState().accept()
    await store.getState().accept()
    expect(prepare).toHaveBeenCalledOnce()
    expect(activate).not.toHaveBeenCalled()
    saved(true)
    await pending
    expect(activate).toHaveBeenCalledOnce()
    expect(store.getState().busy).toBe(true)
  })

  it.each(['false', 'throw'])(
    'blocks failed saves (%s), retaining a working retry',
    async (failure) => {
      const prepare = vi.fn().mockResolvedValue(true)
      if (failure === 'throw')
        prepare.mockRejectedValueOnce(new Error('denied'))
      else prepare.mockResolvedValueOnce(false)
      const activate = vi.fn().mockResolvedValue(undefined)
      const store = createUpdateStore(prepare)
      store.getState().announce(activate)
      await store.getState().accept()
      expect(store.getState()).toMatchObject({
        available: true,
        busy: false,
        error: 'save',
      })
      expect(activate).not.toHaveBeenCalled()
      await store.getState().accept()
      expect(activate).toHaveBeenCalledOnce()
      expect(prepare).toHaveBeenCalledTimes(2)
    }
  )

  it.each(['tabs', 'update'] as const)(
    'rechecks saves after %s failure',
    async (reason) => {
      const prepare = vi.fn().mockResolvedValue(true)
      const activate = vi
        .fn()
        .mockRejectedValueOnce(new UpdateError(reason))
        .mockResolvedValue(undefined)
      const store = createUpdateStore(prepare)
      store.getState().announce(activate)
      await store.getState().accept()
      expect(store.getState()).toMatchObject({ busy: false, error: reason })
      await store.getState().accept()
      expect(prepare).toHaveBeenCalledTimes(2)
      expect(activate).toHaveBeenCalledTimes(2)
    }
  )
})

describe('reload guards', () => {
  const cleanups: (() => void)[] = []
  afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))
  it('checks every loaded mode, stops on failure and can retry', async () => {
    const classic = vi.fn().mockResolvedValue(true)
    const table = vi.fn().mockReturnValueOnce(false).mockReturnValue(true)
    cleanups.push(
      registerReloadGuard('test-classic', classic),
      registerReloadGuard('test-table', table)
    )
    expect(await prepareForReload()).toBe(false)
    expect(await prepareForReload()).toBe(true)
    expect(classic).toHaveBeenCalledTimes(2)
    expect(table).toHaveBeenCalledTimes(2)
  })
  it('treats guard exceptions as failed saves', async () => {
    cleanups.push(
      registerReloadGuard('test-throw', () => {
        throw new Error('denied')
      })
    )
    expect(await prepareForReload()).toBe(false)
  })
  it('old cleanup cannot remove a newly registered guard', async () => {
    const oldCleanup = registerReloadGuard('test-replace', () => true)
    cleanups.push(registerReloadGuard('test-replace', () => false))
    oldCleanup()
    expect(await prepareForReload()).toBe(false)
  })
})
