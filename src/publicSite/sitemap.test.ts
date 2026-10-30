import { describe, expect, it } from 'vitest'
import { normalizeSiteUrl, renderSitemap } from './sitemap'

describe('sitemap', () => {
  it('emits only the game root', () => {
    const doc = new DOMParser().parseFromString(
      renderSitemap(),
      'application/xml'
    )
    expect(doc.querySelector('parsererror')).toBeNull()
    expect([...doc.querySelectorAll('loc')].map((n) => n.textContent)).toEqual([
      'https://tensho.app/',
    ])
    expect(doc.querySelector('lastmod')).toBeNull()
  })

  it('supports a configured canonical origin without leaking the default origin', () => {
    expect(normalizeSiteUrl('https://example.com/game')).toBe(
      'https://example.com/game/'
    )
    expect(renderSitemap('https://example.com/game/')).toContain(
      '<loc>https://example.com/game/</loc>'
    )
    expect(renderSitemap('https://example.com/game/')).not.toContain(
      'tensho.app'
    )
  })

  it.each([
    'http://example.com',
    'https://user:secret@example.com',
    'https://example.com/?a=b',
    'https://example.com/#page',
  ])('rejects unsafe or ambiguous site URL %s', (url) => {
    expect(() => normalizeSiteUrl(url)).toThrow()
  })
})
