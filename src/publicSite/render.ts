import { PUBLIC_PAGES, type PublicPageId, type GuideSection } from './content'

export const PUBLIC_SITE_URL = 'https://evgenyvinnik.github.io/tensho-web/'
const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function normalizeSiteUrl(value = PUBLIC_SITE_URL): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Public site URL must be an HTTPS URL without credentials, query or fragment')
  return url.href.endsWith('/') ? url.href : url.href + '/'
}

export function renderPublicPage(id: PublicPageId, base = '/', siteUrl = PUBLIC_SITE_URL): string {
  const page = PUBLIC_PAGES[id]
  const canonical = new URL(id + '/', normalizeSiteUrl(siteUrl)).href
  const href = (path: string) => escape(base + path)
  const nav = Object.entries(PUBLIC_PAGES).map(([key, entry]) => `<a href="${href(key + '/')}"${key === id ? ' aria-current="page"' : ''}>${entry.label}</a>`).join('')
  const schema = { '@context': 'https://schema.org', '@type': id === 'about' ? 'AboutPage' : 'WebPage', name: page.title, description: page.description, url: canonical, inLanguage: 'en' }
  const sections = (page.sections as readonly GuideSection[]).map((section) => `<section id="${section.id}"><h2>${escape(section.title)}</h2>${section.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}${section.tiles ? `<figure class="tile-example"><div>${section.tiles.map(({ suit, rank }) => `<img src="${href(encodeURI(`assets/Mahjong/file/png/tiles/${suit} (${rank}).png`))}" alt="${suit} ${rank}" width="70" height="96" loading="lazy" decoding="async">`).join('')}</div><figcaption>Bamboo 3–4–5: three consecutive ranks in one suit.</figcaption></figure>` : ''}</section>`).join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escape(page.title)} | Tensho</title><meta name="description" content="${escape(page.description)}"><meta name="robots" content="index, follow">
<link rel="canonical" href="${escape(canonical)}"><meta name="theme-color" content="#123b2d"><link rel="icon" href="${href('icon-192x192.png')}">
<meta property="og:type" content="website"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:site_name" content="Tensho">
<link rel="stylesheet" href="${href('learn.css')}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script></head>
<body><a class="skip-link" href="#content">Skip to content</a><header class="site-header"><a class="wordmark" href="${href('en/')}">TENSHO <span>天翔</span></a><nav aria-label="Main navigation">${nav}<a class="play-link" href="${href('en/')}">Play Tensho</a></nav></header>
<main id="content"><div class="hero${id === 'about' ? ' hero-art' : ''}"><div><p class="eyebrow">The Tensho field guide · English</p><h1>${escape(page.title)}</h1><p class="intro">${escape(page.intro)}</p><a class="play-link" href="${href('en/table-loop?practice=1')}">Try the practice table</a></div>${id === 'about' ? `<figure><img src="${href('assets/illustrations/site/tensho-table-story.png')}" alt="Ivory Mahjong tiles and a jade Decree scroll on an emerald table in a lamplit tea house" width="1536" height="1024" fetchpriority="high"><figcaption>Illustrated game-world art, not a gameplay screenshot.</figcaption></figure>` : ''}</div>
<div class="reading-layout"><aside><nav aria-label="On this page"><p>On this page</p>${page.sections.map((s) => `<a href="#${s.id}">${escape(s.title)}</a>`).join('')}</nav></aside><article>${sections}<section class="next-step"><h2>Take a seat</h2><p>Try one recognizable group, then see what the next draw makes possible.</p><a class="play-link" href="${href('en/table-loop?practice=1')}">Open Table Loop practice</a><a href="${href('en/play')}">Play Classic</a></section></article></div></main>
<footer><p>Tensho · A Mahjong-inspired game in active development.</p><nav aria-label="Further reading">${nav}<a href="https://github.com/evgenyvinnik/tensho-web">Source and implementation notes</a><a href="https://github.com/evgenyvinnik/tensho-web/issues">Report a problem</a></nav><p>These public guides are currently in English. The game offers language selection in its settings.</p></footer></body></html>`
}

export function renderSitemap(siteUrl = PUBLIC_SITE_URL): string {
  const root = normalizeSiteUrl(siteUrl)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...Object.keys(PUBLIC_PAGES).map((id) => id + '/')].map((path) => `<url><loc>${escape(new URL(path, root).href)}</loc></url>`).join('')}</urlset>\n`
}
