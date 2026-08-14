import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DecreeCardCompact } from './DecreeBar'
import type { OwnedDecree } from '../../systems/types'

const decree: OwnedDecree = {
  id: 'river_tax',
  name: 'River Tax',
  description: 'Gain Gold when discarding.',
  category: 'Entropy',
  rarity: 'LocalEdict',
  cost: 4,
  acquiredRound: 1,
  roundsActive: 0,
  effect: {
    type: 'gold',
    trigger: 'OnDiscard',
    description: '+1 Gold per discard',
    amount: 1,
    perTile: true,
  },
}

describe('DecreeCardCompact mandate states', () => {
  it('conceals identity and sells the chosen hidden Decree', () => {
    const onSell = vi.fn()
    render(<DecreeCardCompact decree={decree} faceDown onSell={onSell} />)

    expect(screen.getByLabelText('Face-down Decree')).toBeInTheDocument()
    expect(screen.queryByText('River Tax')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Face-down Decree'))
    fireEvent.click(screen.getByRole('button', { name: 'Sell hidden Decree' }))
    expect(onSell).toHaveBeenCalledOnce()
  })

  it('uses rarity scroll artwork and keeps Sell inside the details popover', () => {
    render(<DecreeCardCompact decree={decree} onSell={vi.fn()} />)

    const decreeButton = screen.getByRole('button', { name: 'River Tax' })
    expect(decreeButton.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/decrees\/local-edict\.png$/)
    )
    expect(
      screen.queryByRole('button', { name: 'Sell River Tax' })
    ).not.toBeInTheDocument()

    fireEvent.mouseEnter(decreeButton)
    expect(screen.getByText(/Gain .*Gold.*discard/i)).toBeInTheDocument()
    const sellButton = screen.getByRole('button', { name: 'Sell River Tax' })
    expect(sellButton).toHaveAttribute('data-decree-sell')
    expect(sellButton).not.toHaveClass('w-full')
  })

  it('labels a Crimson Heart-disabled Decree', () => {
    render(<DecreeCardCompact decree={decree} disabledByMandate />)

    fireEvent.mouseEnter(screen.getByLabelText('River Tax'))
    expect(
      screen.getByText('Disabled by Crimson Heart this hand')
    ).toBeInTheDocument()
  })

  it('prevents Eternal Decrees from being sold', () => {
    const onSell = vi.fn()
    const eternalDecree: OwnedDecree = {
      ...decree,
      sticker: { type: 'Eternal' },
    }
    render(<DecreeCardCompact decree={eternalDecree} onSell={onSell} />)

    fireEvent.click(screen.getByRole('button', { name: 'River Tax' }))
    const sellButton = screen.getByRole('button', {
      name: 'River Tax is Eternal and cannot be sold',
    })
    expect(sellButton).toBeDisabled()
    fireEvent.click(sellButton)
    expect(onSell).not.toHaveBeenCalled()
  })
})
