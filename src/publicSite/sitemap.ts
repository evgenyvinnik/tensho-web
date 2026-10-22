export const PUBLIC_SITE_URL = 'https://evgenyvinnik.github.io/tensho-web/'
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!
  )

export function normalizeSiteUrl(value = PUBLIC_SITE_URL): string {
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      'Public site URL must be an HTTPS URL without credentials, query or fragment'
    )
  return url.href.endsWith('/') ? url.href : url.href + '/'
}

/** robots.txt points here; the game's root is the only indexed page. */
export function renderSitemap(siteUrl = PUBLIC_SITE_URL): string {
  const root = normalizeSiteUrl(siteUrl)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(root)}</loc></url></urlset>\n`
}
