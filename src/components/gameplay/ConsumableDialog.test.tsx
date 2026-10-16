import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import i18n from '../../i18n'
import { Tile, TileSuit } from '../../core/Tile'
import { EnhancementType, SealType } from '../../core/TileModifier'
import { FateSealSystem, FATE_SEALS } from '../../systems/FateSealSystem'
import { ConsumableDialog } from './ConsumableDialog'

it.each([false, true])(
  'restores focus safely when the inventory trigger disappears: %s',
  (spent) => {
    const wall = createRef<HTMLButtonElement>()
    const onUse = vi.fn(() => ({ success: true, effects: [] }))
    const view = (open: boolean, owned: boolean) => (
      <>
        {owned && <button>Owned item</button>}
        <button ref={wall}>Wall</button>
        {open && (
          <ConsumableDialog
            title="Items"
            items={[]}
            tiles={[]}
            concealedIds={new Set()}
            canUse={() => false}
            onUse={onUse}
            onClose={() => {}}
            fallbackFocusRef={wall}
          />
        )}
      </>
    )
    const { rerender } = render(view(false, true))
    const trigger = screen.getByRole('button', { name: 'Owned item' })
    trigger.focus()
    rerender(view(true, true))
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    // A live inventory update must not move focus behind the modal.
    rerender(view(true, !spent))
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    rerender(view(false, !spent))
    expect(spent ? wall.current : trigger).toHaveFocus()
    expect(onUse).not.toHaveBeenCalled()
  }
)

it('names the modifier a target would lose: a tile holds only one', () => {
  const seal = FateSealSystem.createFateSealInstance(FATE_SEALS.seal_of_stone)
  const plain = new Tile(TileSuit.Manzu, 3, 'plain')
  const lucky = new Tile(TileSuit.Manzu, 4, 'lucky').withEnhancement(
    EnhancementType.Lucky
  )
  const hidden = new Tile(TileSuit.Manzu, 5, 'hidden').withSeal(SealType.Red)
  render(
    <ConsumableDialog
      title="Items"
      items={[seal]}
      tiles={[plain, lucky, hidden]}
      concealedIds={new Set(['hidden'])}
      canUse={() => true}
      onUse={() => ({ success: true, effects: [] })}
      onClose={() => {}}
      initialItemId={seal.instanceId}
    />
  )
  const target = (id: string) =>
    fireEvent.click(document.querySelector(`[data-consumable-target="${id}"]`)!)
  const hint = () => document.querySelector('[data-consumable-replaces]')
  target('plain')
  expect(hint()).toBeNull()
  target('plain')
  // A face-down tile never reveals what it carries.
  target('hidden')
  expect(hint()).toBeNull()
  target('hidden')
  target('lucky')
  expect(hint()).toHaveTextContent(
    i18n.t('consumableUse.replacesModifier', { names: 'Lucky Mark' })
  )
})
