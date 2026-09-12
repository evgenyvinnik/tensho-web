import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { changeLanguage } from '../../i18n'
import { ConsumablesBar } from './ConsumablesBar'

afterEach(async () => {
  await act(async () => {
    await changeLanguage('en')
  })
})

describe('ConsumablesBar illustrations', () => {
  it('uses native SVG artwork for every compact consumable', () => {
    render(<ConsumablesBar fateSeals={2} celestialOrbs={1} voidScripts={3} />)

    const names = ['Fate Seals', 'Celestial Orbs', 'Void Scripts'] as const

    for (const name of names) {
      const button = screen.getByRole('button', {
        name: new RegExp(`${name} \\(`),
      })
      const icon = button.querySelector('svg')

      expect(icon).not.toBeNull()
      expect(button).not.toHaveTextContent(/[🎴🔮📜]/u)
    }
  })

  it('keeps empty consumables disabled', () => {
    render(<ConsumablesBar fateSeals={0} celestialOrbs={0} voidScripts={0} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    buttons.forEach((button) => expect(button).toBeDisabled())
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
      screen.getByRole('button', { name: 'Escritos del Vacío (0 disponibles)' })
    ).toBeDisabled()
  })
})
