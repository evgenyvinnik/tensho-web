import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VOID_SCRIPTS } from '../../systems/VoidScriptSystem'
import { VoidScriptArtwork } from './VoidScriptArtwork'

describe('VoidScriptArtwork', () => {
  it('uses the script-specific illustration and reveals rules on hover', async () => {
    const script = VOID_SCRIPTS.script_of_eclipse

    render(<VoidScriptArtwork script={script} />)

    const artwork = screen.getByRole('img', {
      name: /Script of Eclipse.*Score at 1-shanten/i,
    })
    const image = artwork.querySelector('img')

    expect(image?.getAttribute('src')).toContain(
      '/illustrations/scripts/script_of_eclipse.png'
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.mouseEnter(artwork)

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Script of Eclipse')
    expect(tooltip).toHaveTextContent('Score at 1-shanten this round')
    expect(tooltip).toHaveTextContent('Lose a Decree slot next round')
    expect(tooltip).toHaveTextContent('Darkness bends the rules')
  })

  it('opens for keyboard focus and closes on blur', async () => {
    render(<VoidScriptArtwork script={VOID_SCRIPTS.script_of_the_gold_seal} />)

    const artwork = screen.getByRole('img', {
      name: /Script of the Gold Seal/i,
    })

    fireEvent.focus(artwork)
    expect(await screen.findByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(artwork)
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    )
  })

  it('clamps the popup inside a narrow viewport', async () => {
    const originalWidth = window.innerWidth
    const originalHeight = window.innerHeight
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 320,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 480,
    })

    try {
      render(<VoidScriptArtwork script={VOID_SCRIPTS.script_of_silence} />)
      const artwork = screen.getByRole('img', {
        name: /Script of Silence/i,
      })

      Object.defineProperty(artwork, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          bottom: 470,
          height: 40,
          left: 280,
          right: 320,
          top: 430,
          width: 40,
          x: 280,
          y: 430,
          toJSON: () => ({}),
        }),
      })

      fireEvent.mouseEnter(artwork)
      const tooltip = await screen.findByRole('tooltip')

      expect(tooltip.style.left).toBe('12px')
      expect(tooltip.style.width).toBe('296px')
      expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(12)
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      })
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalHeight,
      })
    }
  })
})
