import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ScreenDownloadError } from '../../router/screenDownloadRecovery'
import { ScreenDownloadFallback } from './ScreenDownloadFallback'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
const error = new ScreenDownloadError(
  new TypeError('Failed to fetch dynamically imported module: /screen.js'),
  'already'
)

it('does not disrupt a changed URL and re-enables manual actions', async () => {
  const original = window.location.href
  const reload = vi.fn()
  render(
    <ScreenDownloadFallback
      error={error}
      prepare={async () => {
        window.history.replaceState(null, '', '#other-route')
        return true
      }}
      reload={reload}
    />
  )
  const retry = screen.getByRole('button', {
    name: i18n.t('screenDownload.retry'),
  })
  try {
    await act(async () => fireEvent.click(retry))
    expect(reload).not.toHaveBeenCalled()
    expect(retry).toBeEnabled()
  } finally {
    window.history.replaceState(null, '', original)
  }
})

it('allows another manual attempt when browser navigation throws', async () => {
  const reload = vi.fn().mockImplementationOnce(() => {
    throw Error('blocked')
  })
  render(
    <ScreenDownloadFallback
      error={error}
      prepare={async () => true}
      reload={reload}
    />
  )
  const retry = screen.getByRole('button', {
    name: i18n.t('screenDownload.retry'),
  })
  await act(async () => fireEvent.click(retry))
  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('screenDownload.reloadFailed')
  )
  expect(retry).toBeEnabled()
  await act(async () => fireEvent.click(retry))
  expect(reload).toHaveBeenCalledTimes(2)
})

it('does not navigate after the user leaves the error screen during saving', async () => {
  let resolve!: (value: boolean) => void
  const prepare = () =>
      new Promise<boolean>((done) => {
        resolve = done
      }),
    reload = vi.fn()
  const { unmount } = render(
    <ScreenDownloadFallback error={error} prepare={prepare} reload={reload} />
  )
  fireEvent.click(
    screen.getByRole('button', { name: i18n.t('screenDownload.retry') })
  )
  unmount()
  await act(async () => resolve(true))
  expect(reload).not.toHaveBeenCalled()
})

it.each(SUPPORTED_LANGUAGES)(
  'shows authored recovery copy and safe actions in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const prepare = vi.fn().mockResolvedValue(true),
      reload = vi.fn()
    render(
      <ScreenDownloadFallback error={error} prepare={prepare} reload={reload} />
    )
    for (const key of [
      'title',
      'description',
      'retry',
      'menu',
      'saving',
      'saveFailed',
      'reloadFailed',
      'details',
    ])
      expect(
        i18n.getResource(language, 'translation', `screenDownload.${key}`)
      ).toBeTruthy()
    expect(screen.getByRole('heading')).toHaveFocus()
    expect(screen.getByRole('heading')).toHaveTextContent(
      i18n.getResource(language, 'translation', 'screenDownload.title')
    )
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: i18n.t('screenDownload.retry') })
      )
    )
    expect(prepare).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  }
)

it.each(['retry', 'menu'] as const)(
  'retains the page and permits retry after %s save failure',
  async (action) => {
    const prepare = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    const navigate = vi.fn()
    render(
      <ScreenDownloadFallback
        error={error}
        prepare={prepare}
        reload={navigate}
        goHome={navigate}
      />
    )
    const button = screen.getByRole('button', {
      name: i18n.t(`screenDownload.${action}`),
    })
    await act(async () => fireEvent.click(button))
    expect(navigate).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(
      i18n.t('screenDownload.saveFailed')
    )
    expect(button).toBeEnabled()
    await act(async () => fireEvent.click(button))
    expect(navigate).toHaveBeenCalledOnce()
    expect(prepare).toHaveBeenCalledTimes(2)
  }
)

it('waits for pending saves and ignores repeated clicks', async () => {
  let resolve!: (value: boolean) => void
  const prepare = vi.fn(
      () =>
        new Promise<boolean>((done) => {
          resolve = done
        })
    ),
    reload = vi.fn()
  render(
    <ScreenDownloadFallback error={error} prepare={prepare} reload={reload} />
  )
  const retry = screen.getByRole('button', {
    name: i18n.t('screenDownload.retry'),
  })
  fireEvent.click(retry)
  fireEvent.click(retry)
  expect(prepare).toHaveBeenCalledOnce()
  expect(reload).not.toHaveBeenCalled()
  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('screenDownload.saving')
  )
  screen
    .getAllByRole('button')
    .forEach((button) => expect(button).toBeDisabled())
  await act(async () => resolve(true))
  expect(reload).toHaveBeenCalledOnce()
})

it('reports an initial failed automatic save and contains a later thrown guard', async () => {
  const reload = vi.fn()
  render(
    <ScreenDownloadFallback
      error={new ScreenDownloadError(error.original, 'save')}
      prepare={async () => {
        throw Error('denied')
      }}
      reload={reload}
    />
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('screenDownload.saveFailed')
  )
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('screenDownload.retry') })
    )
  )
  expect(reload).not.toHaveBeenCalled()
})
