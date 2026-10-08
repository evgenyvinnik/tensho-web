import { describe, expect, it, vi } from 'vitest'
import {
  isScreenDownloadFailure,
  loadScreen,
  recoverScreenDownload,
  ScreenDownloadError,
  type RecoveryEnvironment,
} from './screenDownloadRecovery'

function fixture() {
  const values = new Map<string, string>()
  const environment: RecoveryEnvironment = {
    version: 'test-version',
    url: () => 'https://game.test/en/play?seed=7',
    session: () => ({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value)
      },
    }),
    prepare: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
  }
  return { environment, values }
}

describe('bounded screen recovery', () => {
  it('contains a failed reload without allowing another automatic attempt', async () => {
    const { environment } = fixture()
    environment.reload = vi.fn(() => {
      throw Error('navigation denied')
    })
    expect(await recoverScreenDownload(environment.url(), environment)).toBe(
      'session'
    )
    expect(await recoverScreenDownload(environment.url(), environment)).toBe(
      'already'
    )
    expect(environment.reload).toHaveBeenCalledOnce()
  })
  it('waits for saving and cannot repeat in the next document of the same tab', async () => {
    const { environment, values } = fixture()
    let finish!: (value: boolean) => void
    environment.prepare = () =>
      new Promise((resolve) => {
        finish = resolve
      })
    const pending = recoverScreenDownload(environment.url(), environment)
    expect(environment.reload).not.toHaveBeenCalled()
    expect(await recoverScreenDownload(environment.url(), environment)).toBe(
      'already'
    )
    finish(true)
    expect(await pending).toBe('reloading')
    expect(environment.reload).toHaveBeenCalledOnce()
    expect(values.size).toBe(1)
    expect(
      await recoverScreenDownload(environment.url(), { ...environment })
    ).toBe('already')
  })
  it.each(['false', 'throw'])(
    'does not reload when saving returns %s',
    async (mode) => {
      const { environment } = fixture()
      environment.prepare =
        mode === 'false'
          ? vi.fn().mockResolvedValue(false)
          : vi.fn().mockRejectedValue(Error('save'))
      expect(await recoverScreenDownload(environment.url(), environment)).toBe(
        'save'
      )
      expect(environment.reload).not.toHaveBeenCalled()
    }
  )
  it.each(['read', 'write', 'access'])(
    'handles session storage %s denial without reload loops',
    async (mode) => {
      const { environment } = fixture()
      environment.session = () => {
        if (mode === 'access') throw Error('denied')
        return {
          getItem: () => {
            if (mode === 'read') throw Error('denied')
            return null
          },
          setItem: () => {
            throw Error('denied')
          },
        }
      }
      expect(await recoverScreenDownload(environment.url(), environment)).toBe(
        'session'
      )
      expect(environment.prepare).not.toHaveBeenCalled()
      expect(environment.reload).not.toHaveBeenCalled()
    }
  )
  it('does not disrupt a different route before or after saving', async () => {
    const { environment } = fixture()
    expect(
      await recoverScreenDownload('https://game.test/es/codex', environment)
    ).toBe('navigated')
    expect(environment.prepare).not.toHaveBeenCalled()
    const requested = environment.url()
    environment.prepare = async () => {
      environment.url = () => 'https://game.test/en/'
      return true
    }
    expect(await recoverScreenDownload(requested, environment)).toBe(
      'navigated'
    )
    expect(environment.reload).not.toHaveBeenCalled()
  })
  it('scopes recovery to the actual build and URL', async () => {
    const { environment } = fixture()
    expect(await recoverScreenDownload(environment.url(), environment)).toBe(
      'reloading'
    )
    expect(
      await recoverScreenDownload(environment.url(), {
        ...environment,
        version: 'next',
      })
    ).toBe('reloading')
    environment.url = () => 'https://game.test/es/shop'
    expect(await recoverScreenDownload(environment.url(), environment)).toBe(
      'reloading'
    )
  })
  it('preserves successful modules and propagates ordinary evaluation errors without reload', async () => {
    const { environment } = fixture()
    const module = { value: 7 }
    expect(await loadScreen(async () => module, environment)).toBe(module)
    const error = new TypeError('Cannot read properties of undefined')
    await expect(
      loadScreen(async () => {
        throw error
      }, environment)
    ).rejects.toBe(error)
    expect(environment.prepare).not.toHaveBeenCalled()
    expect(environment.reload).not.toHaveBeenCalled()
  })
  it('exposes a typed recoverable error when the automatic attempt was already used', async () => {
    const { environment } = fixture()
    await recoverScreenDownload(environment.url(), environment)
    const error = new TypeError(
      'Failed to fetch dynamically imported module: /screen.js'
    )
    await expect(
      loadScreen(async () => {
        throw error
      }, environment)
    ).rejects.toEqual(new ScreenDownloadError(error, 'already'))
  })
  it.each([
    'Failed to fetch dynamically imported module: /screen.js',
    'error loading dynamically imported module: /screen.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /screen.css',
  ])('recognizes the download failure %s', (message) =>
    expect(isScreenDownloadFailure(new TypeError(message))).toBe(true)
  )
  it.each([
    new TypeError('fetch is undefined'),
    new SyntaxError('Unexpected token'),
    'Failed to fetch dynamically imported module: /screen.js',
  ])('does not misclassify non-download failure %#', (error) =>
    expect(isScreenDownloadFailure(error)).toBe(false)
  )
})
