import { render } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TableDecreeArt } from './TableDecreeArt'
import { TABLE_DECREES } from '../../tableloop/content'

describe('individual Table Loop scroll artwork', () => {
  it.each(TABLE_DECREES.map(({ id }) => id))(
    'renders a compact transparent WebP for %s without duplicating its accessible name',
    (id) => {
      const { container } = render(<TableDecreeArt id={id} />)
      const img = container.querySelector('img')!
      const filename = `${id.replace(/_/g, '-')}.webp`
      expect(img).toHaveAttribute(
        'src',
        `/assets/illustrations/table-loop/${filename}`
      )
      expect(img).toHaveAttribute('alt', '')
      expect(img).toHaveAttribute('aria-hidden', 'true')
      const path = `public/assets/illustrations/table-loop/${filename}`
      expect(existsSync(path)).toBe(true)
      const webp = readFileSync(path)
      expect(webp.subarray(12, 16).toString()).toBe('VP8X')
      expect(webp[20] & 0x10).toBe(0x10) // Actual alpha, no baked backdrop.
      expect(webp.length).toBeLessThan(120_000)
    }
  )
})
