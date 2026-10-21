import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { VolumeMutedIcon, VolumeOnIcon } from './Icons'

afterEach(cleanup)

it('switches between two distinct decorative sound portraits without a tiny overlay', () => {
  const { container, rerender } = render(<VolumeOnIcon size={28} />)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    '/assets/illustrations/controls-jade/sound.webp'
  )
  rerender(<VolumeMutedIcon size={28} />)
  expect(container.querySelectorAll('img')).toHaveLength(1)
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    '/assets/illustrations/controls-jade/sound-off.webp'
  )
  expect(container.querySelector('img')).toHaveAttribute('alt', '')
  expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true')
})
