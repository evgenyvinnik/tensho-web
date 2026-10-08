import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { CopyCostDetails } from './CopyCostDetails'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
const owned = (id: string) =>
  new DecreeSystem().acquireDecree(ALL_DECREES.find((d) => d.id === id)!)!
it.each(SUPPORTED_LANGUAGES)(
  'authored, collapsed copy costs in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const { container } = render(
      <CopyCostDetails decree={owned('decree-blueprint')} />
    )
    const details = container.querySelector('details')!
    expect(details.open).toBe(false)
    for (const key of ['title', 'rescue', 'risk', 'limits']) {
      expect(
        i18n.getResource(language, 'translation', `copyCosts.${key}`)
      ).toBeTruthy()
      expect(screen.getByText(i18n.t(`copyCosts.${key}`))).toBeInTheDocument()
    }
    fireEvent.click(container.querySelector('summary')!)
    expect(details.open).toBe(true)
  }
)
it('connects to the inspector but reveals nothing while face-down or for non-copiers', async () => {
  const copy = owned('decree-blueprint')
  const { rerender } = render(<DecreeCardCompact decree={copy} />)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Blueprint' }))
  })
  expect(
    screen.getByRole('dialog').querySelector('[data-copy-cost-details]')
  ).not.toBeNull()
  rerender(<DecreeCardCompact decree={copy} faceDown />)
  expect(document.querySelector('[data-copy-cost-details]')).toBeNull()
  rerender(<CopyCostDetails decree={owned('decree-phoenix')} />)
  expect(document.querySelector('[data-copy-cost-details]')).toBeNull()
})
