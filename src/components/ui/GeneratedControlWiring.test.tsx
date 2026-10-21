import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { BackButton } from './BackButton'
import { IconButton, Icons } from './IconButton'
import { LanguageSelector } from './LanguageSelector'
import { Arrow, type ArrowDirection } from './game-tutorial/TutorialComponents'

const { changeLanguage } = vi.hoisted(() => ({ changeLanguage: vi.fn() }))
vi.mock('../../router', () => ({
  useAppNavigation: () => ({ changeLanguage }),
}))

beforeEach(async () => {
  vi.clearAllMocks()
  await i18n.changeLanguage('en')
})
afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('generated control wiring', () => {
  it.each([
    ['Settings', ['controls-jade/settings.webp']],
    ['VolumeOn', ['controls-jade/sound.webp']],
    ['VolumeOff', ['controls-jade/sound-off.webp']],
    ['Close', ['generated/controls/close.png']],
    ['Refresh', ['generated/controls/redraw.png']],
  ] as const)(
    'keeps %s decorative and preserves its owning button',
    (name, assets) => {
      const onClick = vi.fn()
      const Glyph = Icons[name]
      render(<IconButton icon={<Glyph />} ariaLabel={name} onClick={onClick} />)
      const button = screen.getByRole('button', { name })
      expect(button.querySelector('svg')).toBeNull()
      const images = Array.from(button.querySelectorAll('img'))
      expect(images).toHaveLength(assets.length)
      images.forEach((image, index) => {
        expect(image).toHaveAttribute(
          'src',
          expect.stringContaining(`/illustrations/${assets[index]}`)
        )
        expect(image).toHaveAttribute('alt', '')
        expect(image).toHaveAttribute('aria-hidden', 'true')
      })
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledOnce()
    }
  )

  it('keeps menu text available without adding an accessible-name fragment', () => {
    render(<IconButton icon={<Icons.Menu />} ariaLabel="Open menu" />)
    const button = screen.getByRole('button', { name: 'Open menu' })
    expect(button).toHaveTextContent('Menu')
    expect(button.querySelector('svg')).toBeNull()
    expect(button.querySelector('span[aria-hidden="true"]')).toHaveTextContent(
      'Menu'
    )
  })

  it('uses generated back art without changing navigation', () => {
    const onClick = vi.fn()
    render(<BackButton onClick={onClick} ariaLabel="Back to collection" />)
    const button = screen.getByRole('button', { name: 'Back to collection' })
    expect(button.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/controls/back.png')
    )
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it.each([
    ['top', '-rotate-90'],
    ['bottom', 'rotate-90'],
    ['left', 'rotate-180'],
    ['right', 'rotate-0'],
  ] as const)(
    'points tutorial art %s',
    (direction: ArrowDirection, rotation) => {
      const { container } = render(<Arrow direction={direction} />)
      expect(container.querySelector('img')).toHaveClass(rotation)
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringContaining('/controls/next.png')
      )
    }
  )
})

describe('language control text fallback', () => {
  it.each(SUPPORTED_LANGUAGES)(
    'keeps the full %s accessible name with a compact code',
    async (language) => {
      await loadLanguage(language)
      await i18n.changeLanguage(language)
      render(<LanguageSelector compact />)
      const button = screen.getByRole('button', {
        name: i18n.t('accessibility.selectLanguage'),
      })
      expect(button).toHaveTextContent(language.toUpperCase())
      expect(button.querySelector('svg')).toBeNull()
      expect(button).toHaveAttribute('aria-expanded', 'false')
    }
  )

  it('preserves disclosure, dismissal, selected status and language navigation', async () => {
    render(<LanguageSelector compact />)
    const button = screen.getByRole('button', {
      name: i18n.t('accessibility.selectLanguage'),
    })
    const arrow = button.querySelector('img')!
    expect(arrow).toHaveClass('rotate-90')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(arrow).toHaveClass('-rotate-90')
    const selected = screen.getByRole('option', { selected: true })
    expect(selected.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/controls-jade/check.webp')
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    fireEvent.mouseDown(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    await act(async () =>
      fireEvent.click(screen.getByRole('option', { name: /Español/ }))
    )
    expect(changeLanguage).toHaveBeenCalledOnce()
    expect(changeLanguage).toHaveBeenCalledWith('es')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
