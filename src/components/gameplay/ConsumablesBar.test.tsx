import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n, { changeLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ConsumablesBar } from './ConsumablesBar'

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
  })
})

describe('ConsumablesBar illustrations', () => {
  it('uses generated image artwork for every compact consumable', () => {
    render(<ConsumablesBar fateSeals={2} celestialOrbs={1} voidScripts={3} />)

    const names = ['Fate Seals', 'Celestial Orbs', 'Void Scripts'] as const

    for (const name of names) {
      const button = screen.getByRole('button', {
        name: new RegExp(`${name} \\(`),
      })
      const icon = button.querySelector('img')

      expect(icon).toHaveAttribute('alt', '')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(icon).toHaveAttribute(
        'src',
        expect.stringMatching(/illustrations\/.+\.webp$/)
      )
      expect(button).not.toHaveTextContent(/[🎴🔮📜]/u)
    }
  })

  it('reserves no inventory space for empty categories', () => {
    const { container } = render(
      <ConsumablesBar fateSeals={0} celestialOrbs={0} voidScripts={0} />
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('localizes the family names and accessible inventory counts', async () => {
    await act(async () => {
      await changeLanguage('es')
    })
    render(<ConsumablesBar fateSeals={2} celestialOrbs={1} voidScripts={0} />)
    expect(
      screen.getByRole('button', { name: 'Sellos del Destino (2 disponibles)' })
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Orbes Celestiales (1 disponibles)' })
    ).toBeEnabled()
    expect(
      screen.queryByRole('button', {
        name: 'Escritos del Vacío (0 disponibles)',
      })
    ).not.toBeInTheDocument()
  })

  it.each(SUPPORTED_LANGUAGES)(
    'keeps owned controls localized, stable and actionable in %s',
    async (language) => {
      const useOrb = vi.fn()
      const props = {
        fateSeals: 0,
        celestialOrbs: 1,
        voidScripts: 0,
        onUseCelestialOrb: useOrb,
      }
      const { rerender } = render(<ConsumablesBar {...props} />)
      const original = screen.getByRole('button')
      original.focus()
      await act(() => changeLanguage(language))
      const expected = i18n.t('consumableUse.available', {
        name: i18n.t('consumableUse.celestialOrbs'),
        count: 1,
      })
      expect(screen.getByRole('button', { name: expected })).toBe(original)
      expect(original).toHaveFocus()
      fireEvent.click(original)
      expect(useOrb).toHaveBeenCalledOnce()
      rerender(<ConsumablesBar {...props} celestialOrbs={0} />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      rerender(<ConsumablesBar {...props} fateSeals={2} />)
      expect(screen.getAllByRole('button')).toHaveLength(2)
    }
  )
})
