import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { FlowerCatalystDialog } from './FlowerCatalystDialog'
import { FlowerSystem } from '../../systems/FlowerSystem'
import { TANYAO_DISPENSATION } from '../../systems/DecreeSystem'
import { Tile } from '../../core/Tile'
import i18n, { changeLanguage } from '../../i18n'
import type { TeaHouseOffering } from '../../systems/TeaHouseSystem'
import type { ShopResult } from '../../game/ShopSession'

afterEach(async () => {
  cleanup()
  await changeLanguage('en')
})
const offer: TeaHouseOffering = {
  id: 'flower-offer',
  slotIndex: 0,
  itemType: 'Decree',
  item: TANYAO_DISPENSATION,
  baseCost: 6,
  editionCost: 0,
  finalCost: 6,
  sellValue: 3,
  isPurchased: false,
  isLocked: false,
}
function flowers(count = 4) {
  const system = new FlowerSystem()
  for (let type = 1; type <= count; type++)
    system.addFlower(Tile.createFlower(type, `flower-${type}`))
  system.unlockMutation('plum_overlap')
  return system.getCollection()
}
const valid = (): ShopResult => ({ success: true })

it.each(['en', 'es'] as const)(
  'requires explicit selection and confirmation, with illustrated localized consequences (%s)',
  async (language) => {
    await changeLanguage(language)
    const onConfirm = vi.fn(),
      onClose = vi.fn()
    render(
      <FlowerCatalystDialog
        offering={offer}
        flowers={flowers()}
        slots={6}
        ownedDecrees={2}
        validate={valid}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    )
    const dialog = screen.getByRole('dialog', {
      name: i18n.t('shop.catalyst.offer'),
    })
    expect(
      screen.getByRole('button', { name: i18n.t('common.confirm') })
    ).toBeDisabled()
    expect(
      screen
        .getAllByRole('radio')
        .every((radio) => !(radio as HTMLInputElement).checked)
    ).toBe(true)
    expect(dialog.querySelectorAll('img')).toHaveLength(4)
    expect(
      dialog.querySelector('img[src$="chrysanthemum-bloom.webp"]')
    ).not.toBeNull()
    expect(dialog.querySelector('img[src$="bamboo-bloom.webp"]')).not.toBeNull()
    fireEvent.click(screen.getAllByRole('radio')[0])
    expect(onConfirm).not.toHaveBeenCalled()
    expect(dialog).toHaveTextContent(i18n.t('shop.catalyst.warning'))
    expect(dialog).toHaveTextContent(i18n.t('shop.catalyst.loss4'))
    expect(dialog).toHaveTextContent(i18n.t('flora.mutations.plum'))
    expect(dialog).toHaveTextContent(
      i18n.t('shop.catalyst.slots', { used: 3, max: 6 })
    )
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('common.cancel') })
    )
    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', {
        name: i18n.t('shop.catalyst.confirm', { flower: i18n.t('flora.plum') }),
      })
    )
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith('flower-1')
    if (language === 'es')
      expect(dialog).not.toHaveTextContent('Powers given up')
  }
)

it('shows post-consumption slot loss and blocks a full build until the engine allows payment', () => {
  const onConfirm = vi.fn()
  const props = {
    offering: offer,
    flowers: flowers(2),
    slots: 6,
    ownedDecrees: 5,
    onConfirm,
    onClose: vi.fn(),
  }
  const { rerender } = render(
    <FlowerCatalystDialog
      {...props}
      validate={() => ({ success: false, reason: 'inventoryFull' })}
    />
  )
  fireEvent.click(screen.getAllByRole('radio')[0])
  expect(screen.getByRole('alert')).toHaveTextContent(
    i18n.t('shop.catalyst.noSpace')
  )
  expect(screen.getByRole('dialog')).toHaveTextContent(
    i18n.t('shop.catalyst.loss2')
  )
  expect(screen.getByRole('dialog')).toHaveTextContent(
    i18n.t('shop.catalyst.slots', { used: 6, max: 5 })
  )
  expect(screen.getByRole('button', { name: /Consume/ })).toBeDisabled()
  rerender(
    <FlowerCatalystDialog
      {...props}
      offering={{
        ...offer,
        item: { ...TANYAO_DISPENSATION, edition: 'Negative' },
      }}
      validate={valid}
    />
  )
  expect(screen.getByRole('dialog')).toHaveTextContent(
    i18n.t('shop.catalyst.slots', { used: 6, max: 6 })
  )
  expect(screen.getByRole('button', { name: /Consume/ })).toBeEnabled()
  expect(onConfirm).not.toHaveBeenCalled()
})

it('explains the empty collection and preserves a failed confirmation for retry', () => {
  const props = {
    offering: offer,
    slots: 5,
    ownedDecrees: 1,
    validate: valid,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  }
  const { rerender } = render(
    <FlowerCatalystDialog {...props} flowers={flowers(0)} />
  )
  expect(screen.queryByRole('radio')).toBeNull()
  expect(screen.getByRole('dialog')).toHaveTextContent(
    i18n.t('shop.catalyst.empty')
  )
  expect(
    screen.getByRole('button', { name: i18n.t('common.confirm') })
  ).toBeDisabled()
  rerender(
    <FlowerCatalystDialog
      {...props}
      flowers={flowers(3)}
      error="Trade changed. Please review."
    />
  )
  fireEvent.click(screen.getAllByRole('radio')[1])
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Trade changed. Please review.'
  )
  expect(screen.getByRole('dialog')).toHaveTextContent(
    i18n.t('shop.catalyst.loss3')
  )
  expect(props.onConfirm).not.toHaveBeenCalled()
})
