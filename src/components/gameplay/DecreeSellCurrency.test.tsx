import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { DecreeCardCompact } from './DecreeBar'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'prices a Decree sale in the same Gold as its description and the shop (%s)',
  async (language) => {
    await loadLanguage(language)
    await act(async () => {
      await i18n.changeLanguage(language)
    })
    const decree = new DecreeSystem().acquireDecree(
      ALL_DECREES.find((d) => d.id === 'decree-midas-touch')!
    )!
    const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)
    render(<DecreeCardCompact decree={decree} onSell={vi.fn()} />)
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: i18n.t('decrees.items.decree-midas-touch.name'),
        })
      )
    })
    const dialog = screen.getByRole('dialog')
    const sell = dialog.querySelector('[data-decree-sell]')!
    expect(sell).toHaveTextContent(`${sellValue}G`)
    expect(dialog).not.toHaveTextContent('¥')
    if (language === 'en')
      expect(dialog).toHaveTextContent('+10G at end of round')
  }
)
