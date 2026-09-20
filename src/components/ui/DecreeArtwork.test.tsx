import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { DecreeArtwork } from './DecreeArtwork'

it('uses a decorative contained portrait with the existing icon fallback', () => {
  const { container, rerender } = render(
    <DecreeArtwork decreeId="decree-wealth-engine" size={48} />
  )
  const image = container.querySelector('img')!
  expect(image).toHaveAttribute(
    'src',
    expect.stringMatching(/wealth-engine\.png$/)
  )
  expect(image).toHaveAttribute('alt', '')
  expect(image).toHaveAttribute('aria-hidden', 'true')
  expect(image).toHaveStyle({ width: '48px', height: '48px' })
  rerender(<DecreeArtwork decreeId="decree-blueprint" size={32} />)
  expect(container.querySelector('img')).toBeNull()
  expect(container.querySelector('svg')).not.toBeNull()
})
