import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { YakuArtwork } from './YakuArtwork'
import { illustrationAssets } from '../../utils/assets'

it.each(['Pairs', 'pairs'])(
  'renders the dedicated %s badge in scoring UI',
  (id) => {
    const { container } = render(<YakuArtwork id={id} />)
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      illustrationAssets.pairsUpgrade
    )
    expect(container.querySelector('img')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  }
)
