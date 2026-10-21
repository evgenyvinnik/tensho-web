import { readFileSync } from 'node:fs'

// Explicit migration inventory: new PNGs are NOT silently excluded offline.
const sources = JSON.parse(
  readFileSync(new URL('../illustration-sources.json', import.meta.url), 'utf8')
)
// These are authored alpha repairs, not resized copies of the legacy PNGs.
// Keep legacy URLs available, but never regenerate the repaired delivery art
// from those originals. The committed WebPs are the portable source of truth.
const repairs = JSON.parse(
  readFileSync(
    new URL('../../docs/script-alpha-repair-manifest.json', import.meta.url),
    'utf8'
  )
)
const authoredPaths = new Set(
  repairs.assets.map(({ path }) => path.replace(/^public\//, ''))
)
export const illustrationCopies = sources.map((name) => ({
  source: `assets/illustrations/${name}`,
  copies: name.startsWith('site/')
    ? [768, 1536].map((size) => ({
        path: `assets/illustrations/${name.replace('.png', `-${size}.webp`)}`,
        maxDimension: size,
      }))
    : [
        {
          path: `assets/illustrations/${name.replace('.png', '.webp')}`,
          maxDimension: authoredPaths.has(
            `assets/illustrations/${name.replace('.png', '.webp')}`
          )
            ? 256
            : 512,
          preserveAuthored: authoredPaths.has(
            `assets/illustrations/${name.replace('.png', '.webp')}`
          ),
        },
      ],
}))
