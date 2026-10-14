import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { ALL_OMENS } from '../config/omenDefinitions'
import { ARCHIVE_CATEGORIES } from '../config/archiveDefinitions'
import {
  ArchiveArtwork,
  getArchiveIllustration,
} from '../components/collection/ArchiveArtwork'
import { OmenArtwork } from '../components/ui/OmenArtwork'
import { DoubleOmenArtwork } from '../components/ui/DoubleOmenArtwork'
import { generatedArtPaths } from './generatedArt'
import { getItemArt } from './itemArt'
import { getOmenIllustration } from './omenArt'
import { ItemCard } from '../components/collection/ItemCard'
import type { ArchiveEntry } from '../systems/ArchiveSystem'

afterEach(cleanup)

describe('complete Omen artwork coverage', () => {
  it('covers all 24 live catalog identities with distinct images', () => {
    expect(ALL_OMENS).toHaveLength(24)
    expect(ARCHIVE_CATEGORIES.omens.expectedCount).toBe(ALL_OMENS.length)
    expect(Object.keys(generatedArtPaths.omens)).toHaveLength(23)
    const paths = ALL_OMENS.map(({ id }) => getOmenIllustration(id))
    expect(new Set(paths).size).toBe(ALL_OMENS.length)
    for (const omen of ALL_OMENS) {
      const path = getOmenIllustration(omen.id)
      expect(path, omen.id).toBeDefined()
      expect(getArchiveIllustration('omens', omen.id)).toBe(path)
      expect(getItemArt('omens', omen.id)).toEqual({
        src: path,
        hasOwnArt: true,
      })
      expect(
        readFileSync(`public/${path!.replace(/^\//, '')}`).length
      ).toBeGreaterThan(0)
    }
  })

  it('retains Double Omen and rejects unknown or inherited identities', () => {
    expect(getOmenIllustration('double_omen')).toMatch(
      /\/omens\/double-omen\.webp$/
    )
    expect(generatedArtPaths.omens).not.toHaveProperty('double_omen')
    for (const id of [
      'missing',
      'toString',
      '__proto__',
      'foil',
      'omen_lens',
    ]) {
      expect(getOmenIllustration(id)).toBeUndefined()
      expect(getArchiveIllustration('omens', id)).toBeUndefined()
      expect(getItemArt('omens', id).hasOwnArt).toBe(false)
    }
    const { container } = render(<OmenArtwork omenId="missing" />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(ALL_OMENS)(
    'renders $id as decorative artwork in archive and live rows',
    ({ id }) => {
      const { container } = render(
        <>
          <ArchiveArtwork category="omens" id={id} className="h-24 w-24" />
          <OmenArtwork omenId={id} className="h-12 w-12" />
        </>
      )
      const images = container.querySelectorAll('img')
      expect(images).toHaveLength(2)
      for (const image of images) {
        expect(image).toHaveAttribute('src', getOmenIllustration(id))
        expect(image).toHaveAttribute('alt', '')
        expect(image).toHaveAttribute('aria-hidden', 'true')
        expect(image).toHaveAttribute('draggable', 'false')
        expect(image).toHaveClass('object-contain')
      }
    }
  )

  it('preserves the existing Double Omen component contract', () => {
    const { container } = render(<DoubleOmenArtwork className="h-10 w-10" />)
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      getOmenIllustration('double_omen')
    )
    expect(container.querySelector('img')).toHaveClass('h-10', 'w-10')
  })
})

it.each(ALL_OMENS)(
  'pictures $id once on its Archive card, and never while undiscovered',
  (omen) => {
    const entry: ArchiveEntry = {
      key: `omens:${omen.id}`,
      itemId: omen.id,
      category: 'omens',
      discoveredAt: 1,
      timesUsed: 1,
      timesWonWith: 0,
      isUnlocked: true,
    }
    const displayInfo = { ...omen, category: 'omens' as const }
    const imageSelector = `img[src="${getOmenIllustration(omen.id)}"]`
    const { rerender } = render(
      <ItemCard entry={entry} displayInfo={displayInfo} />
    )
    // The popup explains the picture; it does not repeat it.
    fireEvent.click(screen.getByRole('button'), { detail: 1 })
    expect(screen.getByRole('dialog')).toHaveTextContent(omen.description)
    expect(document.querySelectorAll(imageSelector)).toHaveLength(1)
    rerender(
      <ItemCard
        entry={{ ...entry, discoveredAt: null }}
        displayInfo={displayInfo}
      />
    )
    expect(document.querySelector(imageSelector)).toBeNull()
  }
)
