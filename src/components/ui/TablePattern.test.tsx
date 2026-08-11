import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TablePattern } from './TablePattern'
import { backgroundAssets } from '../../utils/assets'

describe('TablePattern', () => {
  it('uses the ornamental frame as the content boundary', () => {
    const { container } = render(
      <TablePattern>
        <div>Gameplay UI</div>
      </TablePattern>
    )

    const frame = container.querySelector('[data-table-frame]')
    const content = container.querySelector('[data-table-content]')
    const artwork = container.querySelector('[data-table-artwork]')

    expect(frame).toBeInTheDocument()
    expect(frame?.querySelectorAll('svg')).toHaveLength(4)
    expect(
      frame?.querySelector('[data-table-ornament="top-left"]')
    ).toBeInTheDocument()
    expect(
      frame?.querySelector('[data-table-ornament="bottom-right"]')
    ).toBeInTheDocument()
    expect(content).toHaveClass('table-pattern-content-framed')
    expect(artwork).toHaveStyle({
      backgroundImage: `url("${backgroundAssets.gameplay}")`,
    })
    expect(screen.getByText('Gameplay UI')).toBeInTheDocument()
  })

  it('does not reserve frame spacing when ornaments are disabled', () => {
    const { container } = render(
      <TablePattern showOrnaments={false}>
        <div>Unframed UI</div>
      </TablePattern>
    )

    expect(
      container.querySelector('[data-table-frame]')
    ).not.toBeInTheDocument()
    expect(container.querySelector('[data-table-content]')).not.toHaveClass(
      'table-pattern-content-framed'
    )
  })
})
