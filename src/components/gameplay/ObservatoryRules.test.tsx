import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { useItemText } from '../../i18n/useItemText'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
} from '../../systems/CelestialOrbSystem'
import { ConsumableDialog } from './ConsumableDialog'

function OldDescription() {
  const text = useItemText()
  return (
    <p data-charter-copy>
      {text.description('charters', {
        id: 'observatory',
        name: 'Observatory',
        description: 'Held Celestial Orbs give x1.5 Mult',
      })}
    </p>
  )
}
afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'explains holding versus use with current rules in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const item = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.saturn_orb
    )
    const onUse = vi.fn(() => ({ success: true, effects: [] }))
    const props = {
      title: 'Orbs',
      items: [item],
      tiles: [],
      concealedIds: new Set<string>(),
      canUse: () => true,
      onUse,
      onClose: vi.fn(),
    }
    const { rerender } = render(
      <>
        <OldDescription />
        <ConsumableDialog {...props} observatoryActive />
      </>
    )
    const rule = i18n.getResource(
      language,
      'translation',
      'observatory.description'
    )
    const note = i18n.getResource(
      language,
      'translation',
      'observatory.holdingNote'
    )
    expect(rule).toBeTruthy()
    expect(note).toBeTruthy()
    expect(document.querySelector('[data-charter-copy]')).toHaveTextContent(
      rule
    )
    expect(document.querySelector('[data-observatory-holding]')).toBeNull()
    fireEvent.click(document.querySelector('[data-consumable-item]')!)
    expect(screen.getByRole('dialog')).toHaveTextContent(rule)
    expect(screen.getByRole('dialog')).toHaveTextContent(note)
    expect(
      document.querySelector('[data-observatory-holding] img')
    ).toHaveAttribute('src', expect.stringMatching(/observatory.webp$/))
    expect(onUse).not.toHaveBeenCalled()
    rerender(
      <>
        <OldDescription />
        <ConsumableDialog {...props} observatoryActive={false} />
      </>
    )
    expect(document.querySelector('[data-observatory-holding]')).toBeNull()
  }
)
