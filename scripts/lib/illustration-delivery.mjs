import { readFileSync } from 'node:fs'

// Explicit migration inventory: new PNGs are NOT silently excluded offline.
const sources = JSON.parse(
  readFileSync(new URL('../illustration-sources.json', import.meta.url), 'utf8')
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
          maxDimension: 512,
        },
      ],
}))
