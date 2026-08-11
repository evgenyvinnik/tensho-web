import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { illustrationAssets } from '../../utils/assets'
import { ConsumablesBar } from './ConsumablesBar'

describe('ConsumablesBar illustrations', () => {
  it('uses generated artwork for every consumable', () => {
    render(<ConsumablesBar fateSeals={2} celestialOrbs={1} voidScripts={3} />)

    const expectedSources = [
      ['Fate Seal', illustrationAssets.consumables.fateSeal],
      ['Celestial Orb', illustrationAssets.consumables.celestialOrb],
      ['Void Script', illustrationAssets.consumables.voidScript],
    ] as const

    for (const [name, source] of expectedSources) {
      const button = screen.getByRole('button', {
        name: new RegExp(`${name} \\(`),
      })
      const image = button.querySelector('img')

      expect(image).not.toBeNull()
      expect(image).toHaveAttribute('src', source)
      expect(image).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('keeps empty consumables disabled', () => {
    render(<ConsumablesBar fateSeals={0} celestialOrbs={0} voidScripts={0} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    buttons.forEach((button) => expect(button).toBeDisabled())
  })
})
