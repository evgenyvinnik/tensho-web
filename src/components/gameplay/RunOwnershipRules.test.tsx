import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { Tile, TileSuit } from '../../core/Tile'
import { EditionType } from '../../core/TileModifier'
import { tileDetails } from '../../i18n/tileText'
import { tileRewardText } from '../../i18n/tileRewardText'
import { FATE_SEALS, FateSealSystem } from '../../systems/FateSealSystem'
import { ConsumableDialog } from './ConsumableDialog'
import { DecreeCapacityNotice } from './DecreeCapacityNotice'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

it.each(SUPPORTED_LANGUAGES)(
  'explains run ownership without English fallback in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const tile = new Tile(TileSuit.Pinzu, 3, 'negative').withEdition(
      EditionType.Negative
    )
    const rule = i18n.getResource(
      language,
      'translation',
      'runOwnership.negativeTile'
    )
    expect(rule).toBeTruthy()
    expect(tileDetails(tile, i18n.t, language).modifiers[0].description).toBe(
      rule
    )
    expect(tileRewardText(tile, i18n.t).description).toBe(rule)
    expect(tileDetails(tile, i18n.t, language, true).modifiers).toEqual([])

    const item = FateSealSystem.createFateSealInstance(
      FATE_SEALS.seal_of_transmutation
    )
    const { container } = render(
      <>
        <DecreeCapacityNotice owned={6} slots={5} />
        <ConsumableDialog
          title="Seals"
          items={[item]}
          tiles={[tile]}
          concealedIds={new Set()}
          canUse={() => false}
          onUse={() => ({ success: false, effects: [] })}
          onClose={() => {}}
        />
      </>
    )
    expect(
      container.querySelector('[data-decree-capacity-notice]')
    ).toHaveTextContent(
      i18n.getResource(language, 'translation', 'runOwnership.overCapacity')
    )
    expect(document.querySelector('[data-seal-lifetime]')).toBeNull()
    fireEvent.click(document.querySelector('[data-consumable-item]')!)
    expect(screen.getByRole('dialog')).toHaveTextContent(
      i18n.getResource(language, 'translation', 'runOwnership.fateSeal')
    )
    expect(screen.getByRole('dialog').querySelector('img')).toHaveAttribute(
      'src',
      '/assets/illustrations/seal-transmutation.webp'
    )
  }
)

it('does not warn when at or below capacity', () => {
  const { container, rerender } = render(
    <DecreeCapacityNotice owned={5} slots={5} />
  )
  expect(container).toBeEmptyDOMElement()
  rerender(<DecreeCapacityNotice owned={4} slots={5} />)
  expect(container).toBeEmptyDOMElement()
})
