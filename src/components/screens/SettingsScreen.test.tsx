import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SettingsScreen } from './SettingsScreen'
import { offerPrivacyChoices } from '../../native/privacy'
import { SOUND_EFFECT_CREDITS } from '../../config/creditsDefinitions'

const build = vi.hoisted(() => ({ native: false }))

vi.mock('../../native/nativeStorage', () => ({
  get IS_NATIVE_APP() {
    return build.native
  },
}))
vi.mock('../../router', () => ({
  useAppNavigation: () => ({ goBack: vi.fn() }),
}))
vi.mock('../../game/useClassicPersistence', () => ({
  useClassicPersistence: () => ({ disk: { kind: 'empty' } }),
}))
vi.mock('../ui/LanguageSelector', () => ({ LanguageSelector: () => null }))

const policyLink = () => screen.getByRole('link', { name: 'Privacy Policy' })
const choicesButton = () =>
  screen.queryByRole('button', { name: 'Privacy Choices' })

// The previous test's screen is unmounted by now, so nothing re-renders.
beforeEach(() => {
  build.native = false
  offerPrivacyChoices(null)
})
afterEach(() => vi.restoreAllMocks())

it('links the website to its own policy and never offers Privacy Choices', () => {
  // Only the app's AdMob module registers the form; even so, the site ignores it.
  offerPrivacyChoices(vi.fn())
  render(<SettingsScreen />)

  expect(policyLink()).toHaveAttribute(
    'href',
    `${import.meta.env.BASE_URL}privacy/`
  )
  expect(policyLink()).not.toHaveAttribute('target')
  expect(choicesButton()).toBeNull()
})

it('opens the public policy from the app, with no Privacy Choices where UMP does not require them', () => {
  build.native = true
  render(<SettingsScreen />)

  expect(policyLink()).toHaveAttribute('href', 'https://tensho.app/privacy/')
  expect(policyLink()).toHaveAttribute('target', '_blank')
  expect(choicesButton()).toBeNull()
})

it("offers Google's privacy options form in the app where UMP requires it", async () => {
  build.native = true
  let close!: () => void
  const open = vi.fn(() => new Promise<void>((resolve) => (close = resolve)))
  render(<SettingsScreen />)
  expect(choicesButton()).toBeNull()

  // The consent check finishes after Settings is already on screen.
  act(() => offerPrivacyChoices(open))
  expect(policyLink()).toBeInTheDocument()
  fireEvent.click(choicesButton()!)
  fireEvent.click(choicesButton()!)
  expect(open).toHaveBeenCalledTimes(1)
  expect(choicesButton()).toHaveAttribute('aria-disabled', 'true')

  await act(async () => close())
  expect(choicesButton()).toHaveAttribute('aria-disabled', 'false')
  expect(screen.queryByText(/could not be opened/)).toBeNull()
})

it('explains when the privacy options form cannot open', async () => {
  build.native = true
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  offerPrivacyChoices(() => Promise.reject(new Error('offline')))
  render(<SettingsScreen />)

  await act(async () => fireEvent.click(choicesButton()!))
  expect(
    await screen.findByText(
      'Privacy Choices could not be opened. Check your connection and try again.'
    )
  ).toBeInTheDocument()
})

it('credits every third-party sound with its author, licence and changes', () => {
  render(<SettingsScreen />)
  const panel = screen.getByRole('region', { name: 'Credits' })
  for (const credit of SOUND_EFFECT_CREDITS) {
    const work = within(panel).getByRole('link', { name: credit.title })
    expect(work).toHaveAttribute('href', credit.url)
    expect(work).toHaveAttribute('target', '_blank')
    expect(work).toHaveAttribute('rel', 'noopener noreferrer')
    const item = work.closest('li')!
    expect(item).toHaveTextContent(credit.author)
    expect(
      within(item).getByRole('link', { name: credit.license.name })
    ).toHaveAttribute('href', credit.license.url)
  }
  expect(panel).toHaveTextContent('original sounds synthesized for Tensho')
})
