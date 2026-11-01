import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import i18n from '../i18n'
import { LanguageSync, useAppNavigation } from '.'

function Settings() {
  const { changeLanguage, goBack } = useAppNavigation()
  return (
    <>
      <button onClick={() => void changeLanguage('ja')}>Japanese</button>
      <button onClick={goBack}>Back</button>
    </>
  )
}

function openGame(initialEntries: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: '/:lang',
        element: (
          <LanguageSync>
            <Outlet />
          </LanguageSync>
        ),
        children: [
          { path: 'play', element: <p>Table</p> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
    { initialEntries }
  )
  render(<RouterProvider router={router} />)
  return router
}

afterEach(async () => {
  cleanup()
  window.history.replaceState(null, '', '/')
  await act(() => i18n.changeLanguage('en'))
})

it('keeps a language chosen in Settings when Back returns to the round', async () => {
  const router = openGame(['/en/play'])
  await act(() => router.navigate('/en/settings'))

  fireEvent.click(screen.getByText('Japanese'))
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/ja/settings')
  )
  expect(i18n.language).toBe('ja')

  // The round's history entry still says /en/play; it is rewritten, not obeyed.
  await act(async () => fireEvent.click(screen.getByText('Back')))
  expect(await screen.findByText('Table')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/ja/play')
  expect(i18n.language).toBe('ja')
})

it('rewrites an unknown language in the address, keeping the screen', async () => {
  const router = openGame(['/xx/play?seed=7#hand'])
  expect(await screen.findByText('Table')).toBeInTheDocument()
  const { pathname, search, hash } = router.state.location
  expect(`${pathname}${search}${hash}`).toBe('/en/play?seed=7#hand')
  expect(i18n.language).toBe('en')
})

it('opens a link in the language it names', async () => {
  window.history.replaceState(null, '', '/ja/play')
  vi.resetModules()
  const linked = await import('../i18n')
  await linked.i18nReady
  expect(linked.default.language).toBe('ja')
})
