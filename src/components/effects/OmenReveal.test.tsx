import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { OmenReveal } from './OmenReveal'
import { omenTiming } from './omenTiming'
import { ALL_OMENS } from '../../config/omenDefinitions'
import { changeLanguage } from '../../i18n'
import en from '../../i18n/locales/en.json'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(async () => {
  vi.useRealTimers()
  await act(async () => {
    await changeLanguage('en')
  })
})

it('says when every Omen in the catalog takes effect', () => {
  const timings = en.omenReveal.timing as Record<string, string>
  for (const omen of ALL_OMENS) {
    const timing = omenTiming(omen)
    expect(timings[timing], omen.id).toBeTruthy()
  }
  const byId = (id: string) => omenTiming(ALL_OMENS.find((o) => o.id === id)!)
  expect(byId('merchants_omen')).toBe('shop')
  expect(byId('omen_of_rivers')).toBe('round')
  expect(byId('score_surge_omen')).toBe('hand')
  expect(byId('omen_of_ash')).toBe('voidScript')
  expect(byId('fortune_omen')).toBe('now')
  expect(byId('throwback_omen')).toBe('run')
  expect(byId('double_omen')).toBe('nextOmen')
})

it('names the swift clear, then lowers the Omen into its card', () => {
  const onDone = vi.fn()
  const { container } = render(
    <OmenReveal
      omenId="omen_of_rivers"
      roundType="Small"
      spareTurns={3}
      onDone={onDone}
    />
  )
  const dialog = screen.getByRole('dialog', {
    name: 'Omen earned: Omen of Rivers',
  })
  expect(dialog).toHaveAttribute('data-omen-reveal-stage', 'sign')
  expect(dialog).toHaveTextContent('Swift clear')
  expect(dialog).toHaveTextContent('Small Round cleared · 3 Turns to spare')
  expect(container.querySelector('.omen-descend')).not.toBeNull()

  act(() => vi.advanceTimersByTime(1700))
  expect(dialog).toHaveAttribute('data-omen-reveal-stage', 'card')
  expect(dialog).toHaveTextContent('Omen of Rivers')
  expect(dialog).toHaveTextContent('Common')
  expect(dialog).toHaveTextContent('Next round starts with +1 free Redraw.')
  expect(
    container.querySelector('[data-omen-reveal-timing="round"]')
  ).toHaveTextContent(
    'At the start of the next round.Until then it waits on the table with your items.'
  )
  expect(dialog).toHaveTextContent(
    'Clear a Small or Large round with 2 or more Turns to spare to earn an Omen.'
  )
  expect(container.querySelector('[data-omen-reveal-tradeoff]')).toBeNull()
  expect(onDone).not.toHaveBeenCalled()

  fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
  expect(onDone).toHaveBeenCalledOnce()
})

it('skips to the card on a tap and closes from the backdrop', () => {
  const onDone = vi.fn()
  const { container } = render(
    <OmenReveal omenId="fortune_omen" roundType="Small" onDone={onDone} />
  )
  const dialog = screen.getByRole('dialog')
  fireEvent.click(dialog)
  expect(dialog).toHaveAttribute('data-omen-reveal-stage', 'card')
  expect(onDone).not.toHaveBeenCalled()
  // An older save recorded no Turns; the clear is still named.
  expect(
    container.querySelector('[data-omen-reveal-origin]')
  ).toHaveTextContent(/^Swift clearSmall Round cleared$/)
  fireEvent.click(dialog)
  expect(onDone).toHaveBeenCalledOnce()
})

it('shows the result at once under reduced motion, with costs and copies', () => {
  const onDone = vi.fn()
  const { container } = render(
    <OmenReveal
      omenId="omen_of_ash"
      roundType="Large"
      spareTurns={2}
      copies={2}
      onDone={onDone}
      reducedMotion
    />
  )
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveAttribute('data-omen-reveal-stage', 'card')
  expect(container.querySelector('.omen-sway')).toBeNull()
  expect(container.querySelector('.decree-scroll-rise')).toBeNull()
  expect(dialog).toHaveTextContent('Large Round cleared · 2 Turns to spare')
  expect(
    container.querySelector('[data-omen-reveal-copies="2"]')
  ).toHaveTextContent('×2')
  expect(dialog).toHaveTextContent('Copied by Double Omen: ×2')
  expect(
    container.querySelector('[data-omen-reveal-timing="voidScript"]')
  ).toBeInTheDocument()
  expect(
    container.querySelector('[data-omen-reveal-tradeoff]')
  ).toHaveTextContent(
    'Trade-offNext Season drawn: Winter. This lock ends on that draw.'
  )
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onDone).toHaveBeenCalledOnce()
})

it('says a Tea House Omen is already at work and names its fee', () => {
  const { container } = render(
    <OmenReveal
      omenId="decree_omen"
      roundType="Large"
      spareTurns={1}
      onDone={() => {}}
      reducedMotion
    />
  )
  const timing = container.querySelector('[data-omen-reveal-timing="shop"]')
  expect(timing).toHaveTextContent(
    'Now, in this Tea House. Its effect is already on the offers.'
  )
  // Nothing waits on the table for an Omen already spent here.
  expect(timing).not.toHaveTextContent('your items')
  expect(
    container.querySelector('[data-omen-reveal-tradeoff]')
  ).toHaveTextContent('Cost: 5 gold')
  expect(screen.getByRole('dialog')).toHaveTextContent('1 Turn to spare')
})

it('counts spared Turns in the player’s language', async () => {
  await act(async () => {
    await changeLanguage('ru')
  })
  const { rerender } = render(
    <OmenReveal
      omenId="fortune_omen"
      roundType="Small"
      spareTurns={3}
      onDone={() => {}}
      reducedMotion
    />
  )
  expect(screen.getByRole('dialog')).toHaveTextContent('В запасе 3 хода')
  rerender(
    <OmenReveal
      omenId="fortune_omen"
      roundType="Small"
      spareTurns={5}
      onDone={() => {}}
      reducedMotion
    />
  )
  expect(screen.getByRole('dialog')).toHaveTextContent('В запасе 5 ходов')
  expect(screen.getByRole('dialog')).not.toHaveTextContent('Swift clear')
})

it('closes itself for an Omen the catalog no longer holds', () => {
  const onDone = vi.fn()
  const { container } = render(
    <OmenReveal omenId="retired_omen" roundType="Small" onDone={onDone} />
  )
  expect(container).toBeEmptyDOMElement()
  expect(onDone).toHaveBeenCalledOnce()
})
