import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { PUBLIC_PAGES, type PublicPageId } from '../src/publicSite/content'
import { gameShellEntries } from '../src/publicSite/gameRoutes'
import {
  normalizeSiteUrl,
  renderPublicPage,
  renderSitemap,
} from '../src/publicSite/render'

/** Real static HTML files on Pages; the dev server serves the same generator. */
export function publicSitePlugin(base: string, siteUrl?: string): Plugin {
  const origin = normalizeSiteUrl(siteUrl)
  let root = process.cwd()
  const files = () =>
    new Map([
      ...Object.keys(PUBLIC_PAGES).map(
        (id) =>
          [
            `${id}/index.html`,
            renderPublicPage(id as PublicPageId, base, origin),
          ] as const
      ),
      [
        'learn.css',
        readFileSync(resolve(root, 'src/publicSite/site.css'), 'utf8'),
      ],
      ['sitemap.xml', renderSitemap(origin)],
    ])
  return {
    name: 'tensho-public-guides',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '/').split('?')[0]
        const relative = pathname.startsWith(base)
          ? pathname.slice(base.length)
          : pathname.replace(/^\//, '')
        const key = relative.endsWith('/') ? relative + 'index.html' : relative
        if (Object.hasOwn(PUBLIC_PAGES, relative)) {
          res.writeHead(302, { Location: base + relative + '/' })
          res.end()
          return
        }
        // Avoid reading CSS and rendering all guides for game/module/asset requests.
        if (
          key !== 'learn.css' &&
          key !== 'sitemap.xml' &&
          !Object.keys(PUBLIC_PAGES).some((id) => key === `${id}/index.html`)
        ) {
          next()
          return
        }
        const content = files().get(key)
        if (content === undefined) {
          next()
          return
        }
        res.setHeader(
          'Content-Type',
          key.endsWith('.css')
            ? 'text/css; charset=utf-8'
            : key.endsWith('.xml')
              ? 'application/xml; charset=utf-8'
              : 'text/html; charset=utf-8'
        )
        res.end(content)
      })
    },
    generateBundle: {
      // Vite's HTML hook must finish first: copying source index.html would
      // publish /src/main.tsx rather than the actual hashed production entry.
      order: 'post',
      handler(_options, bundle) {
        const shell = bundle['index.html']
        if (
          !shell ||
          shell.type !== 'asset' ||
          typeof shell.source !== 'string'
        )
          throw new Error('Missing built game shell for static route entries')
        for (const [fileName, source] of [
          ...files(),
          ...gameShellEntries(shell.source),
        ])
          this.emitFile({ type: 'asset', fileName, source })
      },
    },
  }
}
