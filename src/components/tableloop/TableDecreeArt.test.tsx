import { render } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TableDecreeArt } from './TableDecreeArt'

describe('individual Table Loop scroll artwork', () => {
  it.each([
    'echoing_bamboo',
    'patient_pair',
    'watch_fire',
    'terminal_gate',
    'gap_bridge',
  ] as const)(
    'renders a project-owned PNG for %s without duplicating its accessible name',
    (id) => {
      const { container } = render(<TableDecreeArt id={id} />)
      const img = container.querySelector('img')!
      const filename = `${id.replace(/_/g, '-')}.png`
      expect(img).toHaveAttribute(
        'src',
        `/assets/illustrations/table-loop/${filename}`
      )
      expect(img).toHaveAttribute('alt', '')
      expect(img).toHaveAttribute('aria-hidden', 'true')
      const path = `public/assets/illustrations/table-loop/${filename}`
      expect(existsSync(path)).toBe(true)
      expect(readFileSync(path).subarray(0, 8).toString('hex')).toBe(
        '89504e470d0a1a0a'
      )
    }
  )

  it('retains the illustrated fallback for other Decrees', () => {
    const { container } = render(<TableDecreeArt id="jade_ledger" />)
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('regional-mandate')
    )
  })
})
