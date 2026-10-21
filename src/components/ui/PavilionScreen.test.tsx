import { readFileSync } from 'node:fs'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PavilionScreen } from './PavilionScreen'
import { useTableStyleStore } from '../../stores/tableStyleStore'
import { getTableStyleById } from '../../config/tableStyleDefinitions'
import { feltPalette } from '../../utils/feltPalette'

afterEach(cleanup)
it.each(['codex', 'settings', 'achievements', 'collection'] as const)(
  'ships an optimized %s background',
  (page) => {
    const bytes = readFileSync(
      `public/assets/illustrations/pavilion/${page}-background.webp`
    )
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(bytes.length).toBeLessThan(120_000)
  }
)
it.each(['codex', 'settings', 'achievements', 'collection'] as const)(
  'ships a transparent, bounded %s illustration',
  (page) => {
    const bytes = readFileSync(
      `public/assets/illustrations/pavilion/${page}.webp`
    )
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    expect(bytes.subarray(12, 16).toString()).toBe('VP8X')
    expect(bytes[20] & 0x10).toBe(0x10)
    expect(bytes.readUIntLE(24, 3) + 1).toBe(320)
    expect(bytes.readUIntLE(27, 3) + 1).toBe(320)
    expect(bytes.length).toBeLessThan(50_000)
  }
)
it('uses the selected table palette, keeps live text and decorative art separate', () => {
  useTableStyleStore.setState({ currentStyleId: 'dragons_den' })
  const { container } = render(
    <PavilionScreen page="settings" title="Settings" onBack={vi.fn()}>
      <p>Preferences</p>
    </PavilionScreen>
  )
  expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible()
  expect(screen.getByRole('main')).toHaveTextContent('Preferences')
  expect(screen.getByRole('button', { name: 'Back' })).toBeVisible()
  expect(container.querySelector('.pavilion-emblem')).toHaveAttribute('alt', '')
  expect(container.querySelector('[data-table-artwork]')).toHaveStyle({
    backgroundImage:
      'url("/assets/illustrations/pavilion/settings-background.webp")',
  })
  expect(container.querySelector('.pavilion')).toHaveStyle({
    '--pavilion-surface': feltPalette(
      getTableStyleById('dragons_den')!.feltColor
    ).surface,
  })
  cleanup()
  useTableStyleStore.setState({ currentStyleId: 'green_felt' })
})
