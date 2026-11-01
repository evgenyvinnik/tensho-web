import { cleanup, render, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SettingsScreen } from './SettingsScreen'
import { SOUND_EFFECT_CREDITS } from '../../config/creditsDefinitions'

vi.mock('../../router', () => ({
  useAppNavigation: () => ({ goBack: vi.fn(), changeLanguage: vi.fn() }),
}))
afterEach(cleanup)

it('credits every third-party sound with its author, licence and changes', () => {
  const { getByRole } = render(<SettingsScreen />)
  const panel = getByRole('region', { name: 'Credits' })
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
  const tiles = within(panel)
    .getByRole('link', { name: 'Mahjong Tiles Sound Effect' })
    .closest('li')!
  expect(tiles).toHaveTextContent('Tile sounds')
  expect(tiles).toHaveTextContent('level-matched for Tensho')
  expect(panel).toHaveTextContent('original sounds synthesized for Tensho')
})
