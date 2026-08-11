import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GREEN_FELT, RED_LACQUER } from '../../config/tableStyleDefinitions'
import { TableStyleCard } from './TableStyleCard'

describe('TableStyleCard', () => {
  it('renders table artwork and selects an unlocked style', () => {
    const onClick = vi.fn()
    const { container } = render(
      <TableStyleCard
        style={GREEN_FELT}
        isUnlocked
        isSelected={false}
        onClick={onClick}
      />
    )

    const option = screen.getByRole('button', {
      name: 'Green Felt, Classic table',
    })
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringMatching(/green_felt\.webp$/)
    )

    fireEvent.click(option)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('keeps locked artwork aspirational but disables selection', () => {
    const onClick = vi.fn()
    render(
      <TableStyleCard
        style={RED_LACQUER}
        isUnlocked={false}
        isSelected={false}
        unlockProgress={0.5}
        onClick={onClick}
      />
    )

    const option = screen.getByRole('button', {
      name: 'Red Lacquer, locked: Complete Act 3',
    })
    expect(option).toBeDisabled()
    expect(
      screen.getByRole('progressbar', { name: 'Progress toward Red Lacquer' })
    ).toHaveAttribute('aria-valuenow', '50')

    fireEvent.click(option)
    expect(onClick).not.toHaveBeenCalled()
  })
})
