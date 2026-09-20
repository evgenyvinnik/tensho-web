import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PUBLIC_PAGES, type PublicPageId } from './content'
import { normalizeSiteUrl, renderPublicPage, renderSitemap } from './render'

describe('static public guides', () => {
  it.each(Object.keys(PUBLIC_PAGES) as PublicPageId[])(
    '%s contains readable content, canonical metadata and valid local assets',
    (id) => {
      const doc = new DOMParser().parseFromString(
        renderPublicPage(id, '/tensho-web/'),
        'text/html'
      )
      expect(doc.documentElement.lang).toBe('en')
      expect(doc.querySelectorAll('h1')).toHaveLength(1)
      expect(doc.body.textContent).toContain(
        'Practice can replace your saved Table Loop run.'
      )
      expect(
        doc.querySelectorAll('a[href="/tensho-web/en/table-loop"]')
      ).toHaveLength(2)
      expect(doc.title).toBe(`${PUBLIC_PAGES[id].title} | Tensho`)
      expect(
        doc.querySelector('meta[name="description"]')?.getAttribute('content')
      ).toBe(PUBLIC_PAGES[id].description)
      expect(
        doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
      ).toBe(`https://evgenyvinnik.github.io/tensho-web/${id}/`)
      expect(
        doc.querySelectorAll('script:not([type="application/ld+json"])')
      ).toHaveLength(0)
      const schema = JSON.parse(doc.querySelector('script')!.textContent!)
      expect(schema.name).toBe(PUBLIC_PAGES[id].title)
      expect(schema).not.toHaveProperty('aggregateRating')
      for (const link of doc.querySelectorAll('a[href^="#"]')) {
        expect(
          doc.getElementById(link.getAttribute('href')!.slice(1))
        ).not.toBeNull()
      }
      for (const link of doc.querySelectorAll('a[href^="/"]')) {
        expect(link.getAttribute('href')).toMatch(/^\/tensho-web\//)
      }
      for (const img of doc.querySelectorAll('img')) {
        const path =
          'public/' +
          decodeURI(img.getAttribute('src')!.replace('/tensho-web/', ''))
        expect(existsSync(path), path).toBe(true)
        expect(readFileSync(path).subarray(0, 8).toString('hex')).toBe(
          '89504e470d0a1a0a'
        )
        expect(img.getAttribute('alt')).toBeTruthy()
      }
    }
  )

  it('emits only the root and three canonical guides in its sitemap', () => {
    const doc = new DOMParser().parseFromString(
      renderSitemap(),
      'application/xml'
    )
    expect(doc.querySelector('parsererror')).toBeNull()
    expect([...doc.querySelectorAll('loc')].map((n) => n.textContent)).toEqual([
      'https://evgenyvinnik.github.io/tensho-web/',
      ...Object.keys(PUBLIC_PAGES).map(
        (id) => `https://evgenyvinnik.github.io/tensho-web/${id}/`
      ),
    ])
    expect(doc.querySelector('lastmod')).toBeNull()
  })

  it('supports a configured canonical origin without leaking the default origin', () => {
    expect(normalizeSiteUrl('https://example.com/game')).toBe(
      'https://example.com/game/'
    )
    const doc = new DOMParser().parseFromString(
      renderPublicPage('faq', '/game/', 'https://example.com/game/'),
      'text/html'
    )
    expect(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
    ).toBe('https://example.com/game/faq/')
    expect(renderSitemap('https://example.com/game/')).not.toContain(
      'github.io'
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
