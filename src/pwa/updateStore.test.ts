import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUpdateStore, isOutsideRunPath } from './updateStore'
import { prepareForReload, registerReloadGuard } from './reloadGuards'
import { UpdateError } from './registerUpdates'

describe('automatic updates', () => {
  it('applies a downloaded update by itself once saves finish, ignoring repeats', async () => {
    let saved!: (value: boolean) => void
    const prepare = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          saved = resolve
        })
    )
    const activate = vi.fn().mockResolvedValue(undefined)
    const store = createUpdateStore(prepare, () => true)
    await store.getState().attempt()
    expect(prepare).not.toHaveBeenCalled()
    store.getState().announce(activate)
    expect(prepare).toHaveBeenCalledOnce()
    await store.getState().attempt()
    expect(prepare).toHaveBeenCalledOnce()
    expect(activate).not.toHaveBeenCalled()
    saved(true)
    await vi.waitFor(() => expect(activate).toHaveBeenCalledOnce())
    expect(store.getState().busy).toBe(true)
  })

  it('waits inside a run and applies at the next safe boundary', async () => {
    let safe = false
    const prepare = vi.fn().mockResolvedValue(true)
    const activate = vi.fn().mockResolvedValue(undefined)
    const store = createUpdateStore(prepare, () => safe)
    store.getState().announce(activate)
    await store.getState().attempt()
    expect(prepare).not.toHaveBeenCalled()
    expect(store.getState()).toMatchObject({ available: true, busy: false })
    safe = true
    await store.getState().attempt()
    expect(prepare).toHaveBeenCalledOnce()
    expect(activate).toHaveBeenCalledOnce()
  })

  it('does not reload when the player entered a run while saves flushed', async () => {
    let safe = true
    const prepare = vi.fn(async () => {
      safe = false
      return true
    })
    const activate = vi.fn().mockResolvedValue(undefined)
    const store = createUpdateStore(prepare, () => safe)
    store.getState().announce(activate)
    await vi.waitFor(() => expect(store.getState().busy).toBe(false))
    expect(activate).not.toHaveBeenCalled()
    expect(store.getState().available).toBe(true)
  })

  it.each(['false', 'throw'])(
    'postpones after a failed save (%s) and retries at the next boundary',
    async (failure) => {
      const prepare = vi.fn().mockResolvedValue(true)
      if (failure === 'throw')
        prepare.mockRejectedValueOnce(new Error('denied'))
      else prepare.mockResolvedValueOnce(false)
      const activate = vi.fn().mockResolvedValue(undefined)
      const store = createUpdateStore(prepare, () => true)
      store.getState().announce(activate)
      await vi.waitFor(() =>
        expect(store.getState()).toMatchObject({
          available: true,
          busy: false,
          error: 'save',
        })
      )
      expect(activate).not.toHaveBeenCalled()
      await store.getState().attempt()
      expect(activate).toHaveBeenCalledOnce()
      expect(prepare).toHaveBeenCalledTimes(2)
    }
  )

  it.each(['tabs', 'update'] as const)(
    'rechecks saves after a %s failure',
    async (reason) => {
      const prepare = vi.fn().mockResolvedValue(true)
      const activate = vi
        .fn()
        .mockRejectedValueOnce(new UpdateError(reason))
        .mockResolvedValue(undefined)
      const store = createUpdateStore(prepare, () => true)
      store.getState().announce(activate)
      await vi.waitFor(() =>
        expect(store.getState()).toMatchObject({ busy: false, error: reason })
      )
      await store.getState().attempt()
      expect(prepare).toHaveBeenCalledTimes(2)
      expect(activate).toHaveBeenCalledTimes(2)
    }
  )
})

describe('safe boundaries', () => {
  it.each([
    ['/en', true],
    ['/tensho-web/ja/', true],
    ['/en/settings', true],
    ['/en/codex', true],
    ['/en/play', false],
    ['/tensho-web/en/shop/', false],
    ['/ru/game-over', false],
  ])('%s is outside a run: %s', (path, outside) => {
    expect(isOutsideRunPath(path)).toBe(outside)
  })
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
