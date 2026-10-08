import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { DecreeCardCompact } from '../gameplay/DecreeBar'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'explains mastery only in the optional visible inspector (%s)',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const key of ['name', 'description', 'progress'])
      expect(
        i18n.getResource(language, 'translation', `closedHandAusterity.${key}`)
      ).toBeTruthy()
    const decree = new DecreeSystem().acquireDecree(
      ALL_DECREES.find((d) => d.id === 'closed_hand_austerity')!
    )!
    const { rerender } = render(
      <DecreeCardCompact decree={decree} completeConcealedHandsPlayed={2} />
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: i18n.t('closedHandAusterity.name') })
      )
    })
    expect(screen.getByRole('dialog')).toHaveTextContent(
      i18n.t('closedHandAusterity.description')
    )
    expect(
      screen.getByRole('dialog').querySelector('[data-austerity-details]')
    ).toHaveTextContent(
      i18n.t('closedHandAusterity.progress', {
        count: 2,
          factor: (2.16).toLocaleString(language, {
          maximumFractionDigits: 3,
        }),
      })
    )
    rerender(
      <DecreeCardCompact
        decree={decree}
        completeConcealedHandsPlayed={2}
        faceDown
      />
    )
    expect(document.querySelector('[data-austerity-details]')).toBeNull()
    expect(
      document.querySelector('img[src$="closed-hand-austerity.webp"]')
    ).toBeNull()
  }
)
