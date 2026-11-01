import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { CollectibleToken } from './CollectibleToken'

const matchMedia = window.matchMedia
beforeEach(() => {
  // A desktop with a mouse: hover previews are on.
  window.matchMedia = (query: string) =>
    ({
      ...matchMedia(query),
      matches: query === '(any-hover: hover)',
    }) as MediaQueryList
})
afterEach(() => {
  window.matchMedia = matchMedia
})

const renderToken = () => {
  render(
    <CollectibleToken label="Plum Blossom">
      <p>Each Pair scores +4 Mult.</p>
    </CollectibleToken>
  )
  return screen.getByRole('button', { name: 'Plum Blossom' })
}
const details = () => screen.queryByRole('dialog', { name: 'Plum Blossom' })

it('previews only when the mouse moves over it, not when the board shifts under a resting cursor', () => {
  const token = renderToken()
  // Tiles flying or the board scrolling put the token under the cursor:
  // the browser sends pointerenter, but no pointermove.
  fireEvent.pointerEnter(token, { pointerType: 'mouse' })
  expect(details()).toBeNull()
  fireEvent.pointerMove(token, { pointerType: 'mouse' })
  expect(details()).not.toBeNull()
})

it('stays closed after a click closes it until the pointer leaves and comes back', () => {
  const token = renderToken()
  fireEvent.pointerEnter(token, { pointerType: 'mouse' })
  fireEvent.pointerMove(token, { pointerType: 'mouse' })
  fireEvent.click(token, { detail: 1 }) // pins the preview
  fireEvent.click(token, { detail: 1 }) // closes it
  expect(details()).toBeNull()
  fireEvent.pointerMove(token, { pointerType: 'mouse' })
  expect(details()).toBeNull()
  fireEvent.pointerLeave(token, { pointerType: 'mouse' })
  fireEvent.pointerEnter(token, { pointerType: 'mouse' })
  fireEvent.pointerMove(token, { pointerType: 'mouse' })
  expect(details()).not.toBeNull()
})

it('never previews for touch; a tap opens it', () => {
  const token = renderToken()
  fireEvent.pointerEnter(token, { pointerType: 'touch' })
  fireEvent.pointerMove(token, { pointerType: 'touch' })
  expect(details()).toBeNull()
  fireEvent.click(token, { detail: 1 })
  expect(details()).not.toBeNull()
})
