import type { Plugin } from 'vite'
import { gameShellEntries } from '../src/publicSite/gameRoutes'
import { normalizeSiteUrl, renderSitemap } from '../src/publicSite/sitemap'

/** Real static route entries and sitemap on Pages; the dev server serves the sitemap too. */
export function publicSitePlugin(base: string, siteUrl?: string): Plugin {
  const origin = normalizeSiteUrl(siteUrl)
  return {
    name: 'tensho-static-routes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '/').split('?')[0]
        if (pathname !== base + 'sitemap.xml') {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/xml; charset=utf-8')
        res.end(renderSitemap(origin))
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
          ['sitemap.xml', renderSitemap(origin)],
          ...gameShellEntries(shell.source),
        ])
          this.emitFile({ type: 'asset', fileName, source })
      },
    },
  }
}
