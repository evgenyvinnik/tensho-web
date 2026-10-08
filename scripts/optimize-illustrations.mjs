/** Rebuild committed delivery copies with cwebp (libwebp 1.6.0).
 * Originals remain published for older clients. Never scan-and-exclude new art.
 * Run from the repository root: node scripts/optimize-illustrations.mjs
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { illustrationCopies } from './lib/illustration-delivery.mjs'

for (const { source, copies } of illustrationCopies) {
  const png = readFileSync(`public/${source}`)
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  for (const copy of copies) {
    const scale = Math.min(1, copy.maxDimension / Math.max(width, height))
    execFileSync('cwebp', [
      '-quiet',
      '-q',
      '85',
      '-m',
      '6',
      '-alpha_q',
      '100',
      '-resize',
      String(Math.round(width * scale)),
      String(Math.round(height * scale)),
      `public/${source}`,
      '-o',
      `public/${copy.path}`,
    ])
    console.log(copy.path)
  }
}
