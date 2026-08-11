import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConsumablesBar } from './ConsumablesBar'

describe('ConsumablesBar illustrations', () => {
  it('uses native SVG artwork for every compact consumable', () => {
    render(<ConsumablesBar fateSeals={2} celestialOrbs={1} voidScripts={3} />)

    const names = ['Fate Seal', 'Celestial Orb', 'Void Script'] as const

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
})
