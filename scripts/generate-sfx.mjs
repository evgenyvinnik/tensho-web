/** Original, deterministic PCM sound design. No samples, downloads or dependencies.
 * Run: node scripts/generate-sfx.mjs. --check verifies committed assets byte-for-byte.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const definitions = readFileSync(
  new URL('src/config/audioDefinitions.ts', root),
  'utf8'
)
const ids = [
  ...new Set(
    [
      ...definitions.matchAll(
        /:\s*'((?:tile|ui|game|special|feedback|consumable|shop|ambient)_[a-z_]+)'/g
      ),
    ].map((m) => m[1])
  ),
]
const rate = 24000
const check = process.argv.includes('--check')
const directory = new URL('public/assets/sfx/', root)
if (!check) mkdirSync(directory, { recursive: true })

function render(id) {
  const dramatic = /victory|yakuman|act_complete|legendary/.test(id)
  const reward =
    /complete|success|acquired|collected|reveal|purchase|redeemed|confirm/.test(
      id
    )
  const negative = /failed|over$|error|invalid|warning|cant_afford|cancel/.test(
    id
  )
  const tile = id.startsWith('tile_')
  const ui = id.startsWith('ui_')
  const ambient = id.startsWith('ambient_')
  const duration = ambient
    ? 2.4
    : dramatic
      ? 1.6
      : reward
        ? 0.75
        : negative
          ? 0.4
          : tile
            ? 0.13
            : ui
              ? 0.08
              : 0.28
  const data = new Float64Array(Math.ceil(rate * duration))
  let seed = [...id].reduce(
    (h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0,
    2166136261
  )
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const offset = (seed % 5) * 12
  // Pentatonic bell/wood resonances; short negative cues descend rather than blare.
  const notes = dramatic
    ? [262, 330, 392, 524, 660]
    : reward
      ? [392, 440, 587]
      : negative
        ? [262, 196]
        : [tile ? 780 : ui ? 620 : 440]
  for (let n = 0; n < notes.length; n++) {
    const start = n * (dramatic ? 0.14 : 0.09)
    for (let i = Math.floor(start * rate); i < data.length; i++) {
      const t = i / rate - start
      const envelope =
        Math.min(1, t / 0.003) *
        Math.exp(-t * (tile ? 45 : ui ? 55 : dramatic ? 5 : 9))
      const frequency = notes[n] + offset
      const tone =
        Math.sin(2 * Math.PI * frequency * t) +
        0.32 * Math.sin(2 * Math.PI * frequency * (tile ? 2.71 : 2) * t) +
        0.15 * Math.sin(2 * Math.PI * frequency * 3.97 * t)
      const noise =
        (random() * 2 - 1) * (tile ? 0.55 : 0.035) * Math.exp(-t * 70)
      data[i] += (tone * 0.2 + noise) * envelope
    }
  }
  if (
    id === 'ambient_rain' ||
    id === 'tile_slide' ||
    /pack_opening|reroll|void_script/.test(id)
  ) {
    let filtered = 0
    for (let i = 0; i < data.length; i++) {
      filtered = filtered * 0.82 + (random() * 2 - 1) * 0.18
      data[i] += filtered * 0.7 * Math.sin((Math.PI * i) / data.length) ** 2
    }
  }
  const peak = data.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  const gain = Math.min(1, 0.72 / peak)
  const wav = Buffer.alloc(44 + data.length * 2)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(rate, 24)
  wav.writeUInt32LE(rate * 2, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(data.length * 2, 40)
  for (let i = 0; i < data.length; i++) {
    const tail = Math.min(1, (data.length - 1 - i) / (rate * 0.012))
    wav.writeInt16LE(Math.round(data[i] * gain * tail * 32767), 44 + i * 2)
  }
  return wav
}

let total = 0
for (const id of ids) {
  const path = new URL(`${id}.wav`, directory)
  const wav = render(id)
  if (check) {
    if (!readFileSync(path).equals(wav))
      throw new Error(`Outdated sound: ${fileURLToPath(path)}`)
  } else writeFileSync(path, wav)
  total += wav.length
}
console.log(
  `${check ? 'Verified' : 'Generated'} ${ids.length} original sounds; ${Math.round(total / 1024)} KiB`
)
