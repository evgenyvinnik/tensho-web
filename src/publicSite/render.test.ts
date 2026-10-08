import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  PUBLIC_PAGES,
  PUBLIC_GUIDE_REVIEW_DATE,
  type PublicPageId,
} from './content'
import { getTileIdCounter } from '../core/Tile'
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
      if (id === 'faq') {
        const saves = doc.getElementById('saves')!
        expect(saves.textContent).toContain('Save and leave')
        expect(saves.textContent).toContain('Resume run')
        expect(saves.textContent).toContain('Unconfirmed staged tiles')
        expect(saves.textContent).not.toContain(
          'current run progress will be lost'
        )
      }
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
      expect(schema.dateModified).toBe(PUBLIC_GUIDE_REVIEW_DATE)
      expect(doc.querySelector('time')?.getAttribute('datetime')).toBe(
        PUBLIC_GUIDE_REVIEW_DATE
      )
      expect(doc.querySelector('time')?.textContent).toBe(
        PUBLIC_GUIDE_REVIEW_DATE
      )
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

  it('teaches an illustrated exchange with engine-identical Dragon art and an explicit Classic link', () => {
    const counter = getTileIdCounter()
    const doc = new DOMParser().parseFromString(
      renderPublicPage('how-to-play', '/tensho-web/'),
      'text/html'
    )
    expect(getTileIdCounter()).toBe(counter)
    const section = doc.getElementById('build-a-hand')!
    const panels = [...section.querySelectorAll('figure')]
    expect(panels.map((panel) => panel.querySelectorAll('img').length)).toEqual(
      [12, 2, 14]
    )
    const dragons = [...panels[1].querySelectorAll('img')]
    expect(dragons.map((img) => img.alt)).toEqual([
      'White Dragon',
      'Red Dragon',
    ])
    expect(dragons.map((img) => decodeURI(img.getAttribute('src')!))).toEqual([
      '/tensho-web/assets/Mahjong/file/png/tiles/Dragons (3).png',
      '/tensho-web/assets/Mahjong/file/png/tiles/Dragons (1).png',
    ])
    expect(section.querySelector('a')?.getAttribute('href')).toBe(
      '/tensho-web/en/play'
    )
    expect(section.textContent).toContain(
      'not a promised draw or guaranteed round win'
    )
    expect(section.textContent).toContain(
      'Exchanging both costs one redraw, not two'
    )
  })

  it('describes shipped Flora without presenting the whole project as finished', () => {
    const doc = new DOMParser().parseFromString(
      renderPublicPage('about'),
      'text/html'
    )
    expect(doc.getElementById('living-table')?.textContent).toContain(
      'Winter allows one-rank gaps'
    )
    expect(doc.getElementById('living-table')?.textContent).toContain(
      'Spending a Flower can remove its power'
    )
    expect(doc.getElementById('development')?.textContent).toContain(
      'There is still work to do'
    )
  })

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
