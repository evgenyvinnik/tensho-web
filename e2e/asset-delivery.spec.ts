import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

test('serves every delivery image byte-for-byte and retains legacy source URLs', async ({
  request,
  baseURL,
}) => {
  const sources: string[] = JSON.parse(
    readFileSync('scripts/illustration-sources.json', 'utf8')
  )
  // Bounded batches avoid saturating a hosted origin. No user browser/save state.
  for (let index = 0; index < sources.length; index += 4) {
    await Promise.all(
      sources.slice(index, index + 4).map(async (name) => {
        const source = `assets/illustrations/${name}`
        const legacy = await request.head(new URL(source, baseURL).href)
        expect(legacy.status(), source).toBe(200)
        expect(legacy.headers()['content-type'], source).toContain('image/png')
        const copies = [source.replace('.png', '.webp')]
        for (const path of copies) {
          const response = await request.get(new URL(path, baseURL).href)
          expect(response.status(), path).toBe(200)
          expect(response.headers()['content-type'], path).toContain(
            'image/webp'
          )
          const hash = (body: Buffer) =>
            createHash('sha256').update(body).digest('hex')
          expect(hash(await response.body()), path).toBe(
            hash(readFileSync(`public/${path}`))
          )
        }
      })
    )
  }
})
