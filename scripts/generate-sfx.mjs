/** Original, deterministic PCM sound design. No samples, downloads or dependencies.
 *
 * Every cue is assembled from a few physically-inspired voices instead of
 * sine beeps, so ordinary actions sound like objects rather than synthesizers:
 *
 *   clack  resin tile impact: broadband contact click + very short damped modes
 *   thump  felt-muffled table body under a landing tile
 *   tick   light wood/paper tick for interface feedback
 *   bead   soroban (abacus) bead for score counting
 *   wood   hollow woodblock; gentle "no" instead of a buzzer
 *   clap   hyoshigi wooden clappers for round and act accents
 *   coin   small metal disc with beating inharmonic partials
 *   koto   plucked string (Karplus-Strong) for rewards, pentatonic
 *   bell   small rin bell; glass for Celestial Orbs
 *   taiko  low drum with a pitch drop for the biggest moments
 *   noise  friction, curtain swish, paper tear, tile shuffle
 *
 * Loudness is matched on a K-weighted short-term RMS, capped by a peak ceiling,
 * so a 30 ms click and a one-second phrase land at intended relative levels.
 *
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
export const RATE = 44100
const PEAK = 0.7
const TAU = 2 * Math.PI
const check = process.argv.includes('--check')
const directory = new URL('public/assets/sfx/', root)

// =============================================================================
// Context, randomness and filters
// =============================================================================

function hash(text) {
  return [...text].reduce(
    (h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0,
    2166136261
  )
}

function context(id, duration) {
  let seed = hash(id)
  const random = () => {
    // mulberry32
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    data: new Float64Array(Math.ceil(RATE * duration)),
    random,
    /** 1 ± amount, uniformly. */
    jitter: (amount) => 1 + (random() * 2 - 1) * amount,
    range: (min, max) => min + random() * (max - min),
  }
}

/** RBJ biquad. `set` retunes in place so sweeps keep their state. */
function biquad(type, frequency, q = 0.707, gainDb = 0) {
  let b0, b1, b2, a1, a2
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0
  const set = (f) => {
    const w = (TAU * Math.min(f, RATE * 0.45)) / RATE
    const cos = Math.cos(w)
    const alpha = Math.sin(w) / (2 * q)
    let c0, c1, c2, d0, d1, d2
    if (type === 'lowpass') {
      c0 = (1 - cos) / 2
      c1 = 1 - cos
      c2 = c0
      d0 = 1 + alpha
      d1 = -2 * cos
      d2 = 1 - alpha
    } else if (type === 'highpass') {
      c0 = (1 + cos) / 2
      c1 = -(1 + cos)
      c2 = c0
      d0 = 1 + alpha
      d1 = -2 * cos
      d2 = 1 - alpha
    } else if (type === 'bandpass') {
      c0 = alpha
      c1 = 0
      c2 = -alpha
      d0 = 1 + alpha
      d1 = -2 * cos
      d2 = 1 - alpha
    } else {
      // highshelf, slope 1
      const A = 10 ** (gainDb / 40)
      const s = 2 * Math.sqrt(A) * alpha
      c0 = A * (A + 1 + (A - 1) * cos + s)
      c1 = -2 * A * (A - 1 + (A + 1) * cos)
      c2 = A * (A + 1 + (A - 1) * cos - s)
      d0 = A + 1 - (A - 1) * cos + s
      d1 = 2 * (A - 1 - (A + 1) * cos)
      d2 = A + 1 - (A - 1) * cos - s
    }
    b0 = c0 / d0
    b1 = c1 / d0
    b2 = c2 / d0
    a1 = d1 / d0
    a2 = d2 / d0
  }
  set(frequency)
  const process = (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
    x2 = x1
    x1 = x
    y2 = y1
    y1 = y
    return y
  }
  process.set = set
  return process
}

const at = (t) => Math.max(0, Math.round(t * RATE))

// =============================================================================
// Primitive voices
// =============================================================================

/** Damped sinusoid with an optional downward pitch glide and soft attack. */
function mode(ctx, t, frequency, amplitude, tau, options = {}) {
  const { glide = 0, glideTau = 0.01, attack = 0 } = options
  const { data } = ctx
  const start = at(t)
  const end = Math.min(data.length, start + Math.ceil(tau * 9 * RATE))
  let phase = 0
  for (let i = start; i < end; i++) {
    const time = (i - start) / RATE
    const f = frequency * (1 + glide * Math.exp(-time / glideTau))
    const rise = attack > 0 ? Math.min(1, time / attack) : 1
    if (f < RATE * 0.45)
      data[i] += amplitude * rise * Math.exp(-time / tau) * Math.sin(phase)
    phase += (TAU * f) / RATE
  }
}

/** Filtered noise with an exponential or shaped envelope. */
function noise(ctx, t, duration, amplitude, options = {}) {
  const { decay, attack = 0, filters = [], shape } = options
  const { data, random } = ctx
  const start = at(t)
  const length = Math.min(data.length - start, Math.ceil(duration * RATE))
  const chain = filters.map(([type, f, q]) => biquad(type, f, q))
  for (let i = 0; i < length; i++) {
    const time = i / RATE
    let x = random() * 2 - 1
    for (const filter of chain) x = filter(x)
    let envelope = decay ? Math.exp(-time / decay) : 1
    if (attack > 0) envelope *= Math.min(1, time / attack)
    if (shape) envelope *= shape(i / length)
    data[start + i] += amplitude * envelope * x
  }
}

/** A resin tile meeting another hard surface. */
function clack(
  ctx,
  t,
  { pitch = 1, gain = 1, hardness = 1, bounce = 0.22 } = {}
) {
  const { jitter, range } = ctx
  // Contact: a sub-millisecond broadband snap, brighter for harder hits.
  noise(ctx, t, 0.004, 0.3 * gain * hardness, {
    decay: 0.0004 + 0.0003 * (1 - hardness),
    filters: [['highpass', 1500 + 1500 * hardness, 0.7]],
  })
  const modes = [
    [1150, 0.32, 0.011],
    [2390, 1.0, 0.0072],
    [3570, 0.7, 0.0055],
    [4820, 0.45, 0.0042],
    [6340, 0.28 * hardness, 0.0032],
    [8150, 0.14 * hardness, 0.0024],
  ]
  for (const [f, a, tau] of modes)
    mode(
      ctx,
      t,
      f * pitch * jitter(0.03),
      0.3 * a * gain * jitter(0.15),
      tau * jitter(0.12)
    )
  // Modal density: a cluster of weaker modes makes it an object, not a tone.
  for (let k = 0; k < 8; k++)
    mode(
      ctx,
      t,
      1600 * 4.5 ** ctx.random() * pitch,
      0.1 * gain * range(0.4, 1),
      range(0.002, 0.006)
    )
  // Hard objects rarely land once: a quieter micro-bounce a few ms later.
  if (bounce > 0)
    clack(ctx, t + ctx.range(0.005, 0.009), {
      pitch: pitch * 1.03,
      gain: gain * bounce,
      hardness: hardness * 0.8,
      bounce: 0,
    })
}

/** Felt-covered table under a landing tile: short, muffled, low. */
function thump(ctx, t, { frequency = 160, gain = 1 } = {}) {
  mode(ctx, t, frequency, 0.55 * gain, 0.02, { glide: 0.6, glideTau: 0.005 })
  mode(ctx, t, frequency * 2.3, 0.18 * gain, 0.008)
  noise(ctx, t, 0.03, 0.35 * gain, {
    decay: 0.006,
    filters: [['lowpass', 700, 0.7]],
  })
}

/** Friction: tiles or coins sliding on felt or wood. */
function friction(ctx, t, duration, { gain = 1, center = 2600, q = 0.9 } = {}) {
  const { data, random } = ctx
  const start = at(t)
  const length = Math.min(data.length - start, Math.ceil(duration * RATE))
  const band = biquad('bandpass', center, q)
  const grain = biquad('lowpass', 260, 0.7)
  for (let i = 0; i < length; i++) {
    const p = i / length
    const envelope = Math.min(1, p / 0.15) * Math.min(1, (1 - p) / 0.35)
    const roughness = 0.45 + 2.2 * Math.abs(grain(random() * 2 - 1))
    data[start + i] +=
      0.5 * gain * envelope * roughness * band(random() * 2 - 1)
  }
}

/** Interface tick: a dry, tiny wood/paper contact. */
function tick(ctx, t, { frequency = 1900, gain = 1, tau = 0.005 } = {}) {
  noise(ctx, t, 0.002, 0.2 * gain, {
    decay: 0.0003,
    filters: [['highpass', 1800, 0.7]],
  })
  mode(ctx, t, frequency * ctx.jitter(0.02), 0.5 * gain, tau)
  mode(ctx, t, frequency * 2.31, 0.2 * gain, tau * 0.55)
  mode(ctx, t, frequency * 0.52, 0.12 * gain, tau * 1.3)
}

/** Soroban bead: hard little wood bead snapping against its neighbour. */
function bead(ctx, t, { pitch = 1, gain = 1 } = {}) {
  noise(ctx, t, 0.002, 0.2 * gain, {
    decay: 0.0003,
    filters: [['highpass', 2500, 0.7]],
  })
  mode(ctx, t, 2650 * pitch, 0.5 * gain, 0.0068)
  mode(ctx, t, 1330 * pitch, 0.2 * gain, 0.0095)
  mode(ctx, t, 5150 * pitch, 0.16 * gain, 0.003)
}

/** Hollow woodblock (mokugyo). Two of these say "no" without a buzzer. */
function wood(ctx, t, frequency, { gain = 1, tau = 0.03 } = {}) {
  noise(ctx, t, 0.004, 0.15 * gain, {
    decay: 0.0006,
    filters: [['lowpass', 4500, 0.7]],
  })
  mode(ctx, t, frequency, 0.6 * gain, tau, { glide: 0.04, glideTau: 0.004 })
  mode(ctx, t, frequency * 2.43, 0.2 * gain, tau * 0.45)
  mode(ctx, t, frequency * 3.92, 0.08 * gain, tau * 0.25)
}

/** Hyoshigi: two hardwood bars cracked together. */
function clap(ctx, t, { pitch = 1, gain = 1 } = {}) {
  noise(ctx, t, 0.006, 0.45 * gain, {
    decay: 0.0006,
    filters: [['highpass', 1200, 0.7]],
  })
  mode(ctx, t, 1870 * pitch, 0.5 * gain, 0.022)
  mode(ctx, t, 2640 * pitch, 0.32 * gain, 0.016)
  mode(ctx, t, 3420 * pitch, 0.2 * gain, 0.011)
  mode(ctx, t, 980 * pitch, 0.14 * gain, 0.012)
}

/** Small metal coin. Close partial pairs beat for a lively shimmer. */
function coin(ctx, t, { pitch = 1, gain = 1, ring = 1 } = {}) {
  const { jitter } = ctx
  noise(ctx, t, 0.003, 0.2 * gain, {
    decay: 0.0004,
    filters: [['highpass', 3000, 0.7]],
  })
  const base = 2480 * pitch * jitter(0.01)
  const partials = [
    [1, 1, 0.16],
    [1.009, 0.6, 0.16],
    [1.59, 0.5, 0.11],
    [2.14, 0.42, 0.085],
    [2.3, 0.28, 0.07],
    [2.65, 0.22, 0.055],
    [3.16, 0.12, 0.04],
  ]
  for (const [ratio, a, tau] of partials)
    mode(ctx, t, base * ratio, 0.28 * a * gain, tau * ring)
}

/** Karplus-Strong plucked string with a tuned fractional delay. */
function koto(ctx, t, frequency, options = {}) {
  const { gain = 1, sustain = 1.1, brightness = 0.55, pick = 0.18 } = options
  const { data, random } = ctx
  const start = at(t)
  const delay = RATE / frequency - 0.5
  // Keep the allpass fraction away from 0, where its pole sits at Nyquist.
  const length = Math.floor(delay - 0.1)
  const fraction = delay - length
  const allpass = (1 - fraction) / (1 + fraction)
  const loop = 0.001 ** (1 / (frequency * sustain))
  // Excitation: noise smoothed twice (12 dB/oct), plucked near the bridge, no DC.
  const raw = Float64Array.from({ length }, () => random() * 2 - 1)
  for (let pass = 0; pass < 2; pass++) {
    let smooth = 0
    for (let i = 0; i < length; i++) {
      smooth += brightness * (raw[i] - smooth)
      raw[i] = smooth
    }
  }
  const offset = Math.max(1, Math.round(length * pick))
  const buffer = raw.map((x, i) => x - raw[(i + length - offset) % length])
  const mean = buffer.reduce((sum, x) => sum + x, 0) / length
  for (let i = 0; i < length; i++) buffer[i] -= mean
  // Tsume (plectrum) click on top.
  noise(ctx, t, 0.003, 0.07 * gain, {
    decay: 0.0005,
    filters: [['highpass', 2500, 0.7]],
  })
  let index = 0,
    previous = 0,
    apIn = 0,
    apOut = 0
  const end = Math.min(data.length, start + Math.ceil(sustain * 1.3 * RATE))
  for (let i = start; i < end; i++) {
    const out = buffer[index]
    const average = 0.5 * (out + previous)
    previous = out
    const shifted = allpass * average + apIn - allpass * apOut
    apIn = average
    apOut = shifted
    buffer[index] = shifted * loop
    index = index + 1 === length ? 0 : index + 1
    const release = Math.min(1, (end - i) / (0.03 * RATE))
    data[i] += 0.55 * gain * release * out
  }
}

/** Small rin bell: inharmonic, slightly detuned pairs, soft mallet. */
function bell(ctx, t, frequency, { gain = 1, tau = 0.7 } = {}) {
  const partials = [
    [1, 1, 1],
    [1.0035, 0.6, 1],
    [2.76, 0.42, 0.45],
    [2.772, 0.26, 0.45],
    [5.4, 0.16, 0.22],
    [8.93, 0.07, 0.12],
  ]
  // Partials above 12 kHz only add a piercing edge.
  for (const [ratio, a, decay] of partials)
    if (frequency * ratio < 12000)
      mode(ctx, t, frequency * ratio, 0.3 * a * gain, tau * decay, {
        attack: 0.0015,
      })
  noise(ctx, t, 0.01, 0.06 * gain, {
    decay: 0.002,
    filters: [['bandpass', frequency * 2, 1.5]],
  })
}

/** Glass chime: purer, near-harmonic partials. */
function glass(ctx, t, frequency, { gain = 1, tau = 0.55 } = {}) {
  mode(ctx, t, frequency, 0.32 * gain, tau, { attack: 0.002 })
  mode(ctx, t, frequency * 2.008, 0.14 * gain, tau * 0.55, { attack: 0.002 })
  mode(ctx, t, frequency * 3.03, 0.07 * gain, tau * 0.3, { attack: 0.002 })
  mode(ctx, t, frequency * 1.0025, 0.12 * gain, tau, { attack: 0.002 })
}

/** Taiko: low membrane with a pitch drop and a stick slap. */
function taiko(ctx, t, { frequency = 78, gain = 1 } = {}) {
  mode(ctx, t, frequency, 0.7 * gain, 0.2, { glide: 0.5, glideTau: 0.03 })
  // Upper membrane modes give it presence on phone speakers.
  mode(ctx, t, frequency * 1.59, 0.32 * gain, 0.09, {
    glide: 0.3,
    glideTau: 0.02,
  })
  mode(ctx, t, frequency * 2.14, 0.22 * gain, 0.06)
  mode(ctx, t, frequency * 2.65, 0.14 * gain, 0.04)
  noise(ctx, t, 0.05, 0.3 * gain, {
    decay: 0.008,
    filters: [['lowpass', 1400, 0.7]],
  })
}

/** Swept band-passed noise: noren curtain, page turn, void. */
function whoosh(
  ctx,
  t,
  duration,
  { from = 600, to = 2400, gain = 1, q = 1.1 } = {}
) {
  const { data, random } = ctx
  const start = at(t)
  const length = Math.min(data.length - start, Math.ceil(duration * RATE))
  const band = biquad('bandpass', from, q)
  for (let i = 0; i < length; i++) {
    const p = i / length
    if (i % 32 === 0) band.set(from * (to / from) ** p)
    const envelope = Math.sin(Math.PI * p ** 0.8) ** 1.6
    data[start + i] += 0.9 * gain * envelope * band(random() * 2 - 1)
  }
}

/** Paper tear: a dense, accelerating crackle over soft friction. */
function paperTear(ctx, t, duration, { gain = 1 } = {}) {
  friction(ctx, t, duration, { gain: 0.35 * gain, center: 3200, q: 0.6 })
  const count = 46
  for (let k = 0; k < count; k++) {
    const p = (k / count) ** 0.75
    noise(ctx, t + p * duration * 0.92, 0.004, gain * ctx.range(0.15, 0.6), {
      decay: ctx.range(0.0004, 0.0012),
      filters: [['bandpass', ctx.range(1800, 6000), 1.2]],
    })
  }
}

/** Washing tiles: many small clacks over friction. */
function shuffle(ctx, t, duration, { gain = 1, count = 14 } = {}) {
  friction(ctx, t, duration, { gain: 0.25 * gain, center: 2200, q: 0.8 })
  for (let k = 0; k < count; k++)
    clack(ctx, t + ctx.range(0, duration * 0.9), {
      pitch: ctx.range(0.85, 1.25),
      gain: gain * ctx.range(0.25, 0.8),
      hardness: ctx.range(0.5, 0.9),
      bounce: 0,
    })
}

/** Hanko seal pressed onto paper. */
function stamp(ctx, t, { gain = 1 } = {}) {
  thump(ctx, t, { frequency: 120, gain: 0.9 * gain })
  wood(ctx, t, 820, { gain: 0.35 * gain, tau: 0.012 })
  noise(ctx, t + 0.004, 0.06, 0.18 * gain, {
    decay: 0.015,
    filters: [['bandpass', 3500, 0.8]],
  })
}

function chimes(ctx, t, duration, { count = 8, gain = 1 } = {}) {
  for (let k = 0; k < count; k++)
    bell(
      ctx,
      t + ctx.range(0, duration * 0.8),
      yo(10 + Math.floor(ctx.range(0, 6))),
      {
        gain: gain * ctx.range(0.25, 0.6),
        tau: ctx.range(0.4, 0.8),
      }
    )
}

function chirp(
  ctx,
  t,
  { from = 3200, to = 4800, duration = 0.05, gain = 1 } = {}
) {
  const { data } = ctx
  const start = at(t)
  const length = Math.min(data.length - start, Math.ceil(duration * RATE))
  let phase = 0
  for (let i = 0; i < length; i++) {
    const p = i / length
    phase += (TAU * (from + (to - from) * Math.sin((Math.PI / 2) * p))) / RATE
    data[start + i] +=
      0.25 * gain * Math.sin(Math.PI * p) ** 2 * Math.sin(phase)
  }
}

// =============================================================================
// Scales
// =============================================================================

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)
const degree = (base, steps) => (i) => {
  const octave = Math.floor(i / steps.length)
  return hz(
    base +
      12 * octave +
      steps[((i % steps.length) + steps.length) % steps.length]
  )
}
/** Bright "yo" pentatonic from D4: D E G A B. Rewards. */
const yo = degree(62, [0, 2, 5, 7, 9])
/** Dark "in" (miyako-bushi) from E3: E F A B C. Losses and the void. */
const dark = degree(52, [0, 1, 5, 7, 8])

const arpeggio = (ctx, t, notes, spacing, options = {}) =>
  notes.forEach((n, k) =>
    koto(ctx, t + k * spacing, yo(n), {
      ...options,
      gain: (options.gain ?? 1) * (1 - k * (options.fall ?? 0.06)),
    })
  )

// =============================================================================
// Recipes: [duration seconds, target K-weighted short-term RMS dBFS, builder]
// =============================================================================

const RECIPES = {
  // --- Tiles: no pitched tone, just resin on resin or felt -------------------
  tile_select: [
    0.09,
    -19,
    (c) => clack(c, 0, { pitch: 1.18, hardness: 0.75, bounce: 0 }),
  ],
  tile_deselect: [
    0.1,
    -21,
    (c) => {
      clack(c, 0, { pitch: 0.98, hardness: 0.6, bounce: 0.15 })
      thump(c, 0, { gain: 0.25 })
    },
  ],
  tile_draw: [
    0.11,
    -20,
    (c) => {
      friction(c, 0, 0.04, { gain: 0.3, center: 3000 })
      clack(c, 0.032, { pitch: 1.08, hardness: 0.8 })
    },
  ],
  tile_discard: [
    0.13,
    -17,
    (c) => {
      thump(c, 0, { frequency: 170, gain: 0.6 })
      clack(c, 0, { pitch: 0.92 })
    },
  ],
  tile_place: [
    0.12,
    -18,
    (c) => {
      clack(c, 0, { pitch: 1.0, bounce: 0 })
      clack(c, 0.027, { pitch: 1.07, gain: 0.7, bounce: 0.15 })
    },
  ],
  tile_slide: [
    0.22,
    -21,
    (c) => {
      friction(c, 0, 0.16, { gain: 0.8, center: 2300 })
      clack(c, 0.15, { pitch: 1.04, gain: 0.6, hardness: 0.7 })
    },
  ],
  tile_flip: [
    0.12,
    -19,
    (c) => {
      clack(c, 0, { pitch: 1.25, gain: 0.5, hardness: 0.6, bounce: 0 })
      clack(c, 0.052, { pitch: 0.98, gain: 0.9 })
    },
  ],

  // --- Interface: small, dry and quiet; heard on every button ---------------
  ui_button_click: [0.04, -25, (c) => tick(c, 0, { frequency: 1750 })],
  ui_button_hover: [
    0.04,
    -33,
    (c) => tick(c, 0, { frequency: 2600, gain: 0.6, tau: 0.003 }),
  ],
  ui_menu_open: [
    0.13,
    -25,
    (c) => {
      whoosh(c, 0, 0.09, { from: 700, to: 2600, gain: 0.5 })
      tick(c, 0.07, { frequency: 2100, gain: 0.8 })
    },
  ],
  ui_menu_close: [
    0.12,
    -26,
    (c) => {
      whoosh(c, 0, 0.08, { from: 2400, to: 700, gain: 0.5 })
      tick(c, 0.06, { frequency: 1500, gain: 0.8 })
    },
  ],
  ui_navigate: [0.05, -26, (c) => tick(c, 0, { frequency: 2250, gain: 0.9 })],
  ui_toggle: [
    0.07,
    -25,
    (c) => {
      tick(c, 0, { frequency: 1650 })
      tick(c, 0.028, { frequency: 2450, gain: 0.65 })
    },
  ],
  ui_slider: [
    0.035,
    -29,
    (c) => tick(c, 0, { frequency: 3100, gain: 0.8, tau: 0.0028 }),
  ],
  ui_tab_switch: [
    0.06,
    -25,
    (c) => {
      tick(c, 0, { frequency: 2050 })
      friction(c, 0, 0.035, { gain: 0.15, center: 4200 })
    },
  ],

  // --- Game ------------------------------------------------------------------
  game_hand_played: [
    0.22,
    -15,
    (c) => {
      // Tiles slapped down as a group, then one rocks and settles.
      thump(c, 0, { frequency: 140, gain: 0.8 })
      ;[0, 0.014, 0.03, 0.048].forEach((t, k) =>
        clack(c, t, {
          pitch: [0.95, 1.08, 0.9, 1.15][k],
          gain: [1, 0.8, 0.65, 0.5][k],
          bounce: 0,
        })
      )
      clack(c, 0.105, { pitch: 1.12, gain: 0.25, hardness: 0.6, bounce: 0 })
    },
  ],
  game_score_chip: [0.05, -22, (c) => bead(c, 0)],
  game_score_tally: [
    0.26,
    -21,
    (c) =>
      [0, 0.045, 0.085, 0.12, 0.15, 0.176, 0.198].forEach((t, k) =>
        bead(c, t, { pitch: 1 + k * 0.015, gain: 1 - k * 0.06 })
      ),
  ],
  game_gold_earned: [
    0.5,
    -19,
    (c) => {
      coin(c, 0)
      coin(c, 0.06, { pitch: 1.07, gain: 0.7 })
      coin(c, 0.11, { pitch: 0.96, gain: 0.5 })
    },
  ],
  game_gold_spent: [
    0.4,
    -21,
    (c) => {
      friction(c, 0, 0.07, { gain: 0.3, center: 3600 })
      coin(c, 0.05, { pitch: 0.88, gain: 0.8, ring: 0.8 })
    },
  ],
  game_round_complete: [
    1.2,
    -18,
    (c) => {
      clap(c, 0)
      arpeggio(c, 0.05, [3, 5, 6, 8], 0.08, { sustain: 0.9 })
      bell(c, 0.29, yo(10), { gain: 0.45, tau: 0.6 })
    },
  ],
  game_round_failed: [
    0.95,
    -21,
    (c) => {
      koto(c, 0, dark(5), { sustain: 0.8, brightness: 0.4 })
      koto(c, 0.17, dark(3), { sustain: 0.9, brightness: 0.35, gain: 0.9 })
      taiko(c, 0.17, { frequency: 70, gain: 0.35 })
    },
  ],
  game_act_complete: [
    1.9,
    -17,
    (c) => {
      clap(c, 0)
      clap(c, 0.12, { pitch: 1.04 })
      arpeggio(c, 0.24, [5, 6, 7, 8, 10], 0.075, { sustain: 1.1 })
      bell(c, 0.6, yo(10), { gain: 0.5, tau: 0.8 })
      bell(c, 0.6, yo(12), { gain: 0.3, tau: 0.7 })
    },
  ],
  game_over: [
    2.1,
    -19,
    (c) => {
      taiko(c, 0, { frequency: 70 })
      ;[5, 4, 3, 2].forEach((n, k) =>
        koto(c, 0.1 + k * 0.23, dark(n), {
          sustain: 1.1,
          brightness: 0.35,
          gain: 1 - k * 0.12,
        })
      )
    },
  ],
  game_victory: [
    2.3,
    -16,
    (c) => {
      taiko(c, 0, { frequency: 82 })
      taiko(c, 0.18, { frequency: 82, gain: 0.7 })
      clap(c, 0, { gain: 0.7 })
      arpeggio(c, 0.25, [5, 6, 7, 8, 9, 10, 11, 12], 0.06, {
        sustain: 0.9,
        fall: 0.04,
      })
      ;[5, 7, 10].forEach((n) =>
        koto(c, 0.78, yo(n), { sustain: 1.4, gain: 0.7 })
      )
      bell(c, 0.78, yo(10), { gain: 0.45, tau: 0.9 })
      bell(c, 0.78, yo(12), { gain: 0.3, tau: 0.8 })
    },
  ],

  // --- Special ---------------------------------------------------------------
  special_yaku_scored: [
    0.75,
    -19,
    (c) => {
      arpeggio(c, 0, [5, 7, 8], 0.065, { sustain: 0.6 })
      bell(c, 0.13, yo(13), { gain: 0.25, tau: 0.4 })
    },
  ],
  special_yakuman: [
    1.8,
    -16,
    (c) => {
      taiko(c, 0, { frequency: 78 })
      clap(c, 0, { gain: 0.8 })
      arpeggio(c, 0.08, [5, 6, 7, 8, 9, 10, 11, 12], 0.04, {
        sustain: 0.9,
        fall: 0.03,
      })
      bell(c, 0.45, yo(10), { gain: 0.5, tau: 0.9 })
      bell(c, 0.45, yo(15), { gain: 0.25, tau: 0.6 })
    },
  ],
  special_yakuman_dramatic: [
    2.4,
    -16,
    (c) => {
      taiko(c, 0, { frequency: 72 })
      taiko(c, 0.22, { frequency: 72, gain: 0.8 })
      taiko(c, 0.44, { frequency: 96, gain: 0.9 })
      arpeggio(c, 0.5, [5, 6, 7, 8, 9, 10, 11, 12, 13], 0.04, {
        sustain: 1,
        fall: 0.03,
      })
      bell(c, 0.5, yo(0), { gain: 0.6, tau: 1.2 })
      bell(c, 0.86, yo(10), { gain: 0.4, tau: 0.9 })
    },
  ],
  special_decree_acquired: [
    0.9,
    -19,
    (c) => {
      clap(c, 0, { gain: 0.7 })
      koto(c, 0.04, yo(3), { sustain: 0.8 })
      koto(c, 0.12, yo(6), { sustain: 0.8 })
      bell(c, 0.12, yo(11), { gain: 0.3, tau: 0.5 })
    },
  ],
  special_decree_triggered: [
    0.35,
    -21,
    (c) => {
      koto(c, 0, yo(8), { sustain: 0.3, brightness: 0.7 })
      tick(c, 0, { frequency: 2400, gain: 0.5 })
    },
  ],
  special_flower_collected: [
    0.8,
    -20,
    (c) => {
      arpeggio(c, 0, [8, 10, 11], 0.07, {
        sustain: 0.55,
        brightness: 0.4,
        gain: 0.8,
      })
      bell(c, 0.14, yo(13), { gain: 0.3, tau: 0.45 })
    },
  ],
  special_season_activated: [
    1.2,
    -21,
    (c) => {
      whoosh(c, 0, 0.5, { from: 400, to: 1500, gain: 0.3 })
      chimes(c, 0.02, 0.9, { count: 7 })
    },
  ],
  special_pack_opening: [0.34, -19, (c) => paperTear(c, 0, 0.3)],
  special_item_reveal: [
    0.8,
    -20,
    (c) => {
      whoosh(c, 0, 0.18, { from: 600, to: 3000, gain: 0.4 })
      koto(c, 0.14, yo(7), { sustain: 0.6 })
      bell(c, 0.16, yo(12), { gain: 0.4, tau: 0.45 })
    },
  ],
  special_legendary_reveal: [
    1.9,
    -17,
    (c) => {
      whoosh(c, 0, 0.35, { from: 300, to: 4000, gain: 0.5 })
      bell(c, 0.3, yo(5), { gain: 0.6, tau: 1 })
      bell(c, 0.3, yo(10), { gain: 0.4, tau: 0.8 })
      arpeggio(c, 0.32, [5, 7, 8, 10, 12], 0.07, { sustain: 1 })
      chimes(c, 0.5, 0.6, { count: 5, gain: 0.6 })
    },
  ],
  special_charter_redeemed: [
    0.9,
    -19,
    (c) => {
      stamp(c, 0)
      koto(c, 0.12, yo(5), { sustain: 0.8 })
      bell(c, 0.12, yo(9), { gain: 0.5, tau: 0.6 })
    },
  ],

  // --- Feedback: refusals knock on wood; nothing buzzes ----------------------
  feedback_error: [
    0.24,
    -22,
    (c) => {
      wood(c, 0, 520)
      wood(c, 0.085, 390, { gain: 0.85 })
    },
  ],
  feedback_invalid: [
    0.22,
    -23,
    (c) => {
      wood(c, 0, 470)
      wood(c, 0.075, 360, { gain: 0.8 })
    },
  ],
  feedback_warning: [0.15, -22, (c) => wood(c, 0, 560)],
  feedback_success: [
    0.6,
    -20,
    (c) => arpeggio(c, 0, [5, 7], 0.07, { sustain: 0.55 }),
  ],
  feedback_confirm: [
    0.45,
    -21,
    (c) => {
      clap(c, 0, { pitch: 1.1, gain: 0.5 })
      koto(c, 0.01, yo(7), { sustain: 0.45 })
    },
  ],
  feedback_cancel: [
    0.09,
    -25,
    (c) => {
      tick(c, 0, { frequency: 2000 })
      tick(c, 0.04, { frequency: 1500, gain: 0.8 })
    },
  ],
  feedback_notification: [
    0.7,
    -22,
    (c) => {
      bell(c, 0, yo(10), { tau: 0.4 })
      bell(c, 0.09, yo(12), { tau: 0.35, gain: 0.7 })
    },
  ],

  // --- Consumables -----------------------------------------------------------
  consumable_fate_seal: [0.3, -18, (c) => stamp(c, 0)],
  consumable_celestial_orb: [
    0.9,
    -20,
    (c) => {
      glass(c, 0, yo(10))
      glass(c, 0.08, yo(12), { gain: 0.8 })
      ;[0.16, 0.22, 0.27].forEach((t, k) =>
        glass(c, t, yo(14 + k), { gain: 0.25, tau: 0.25 })
      )
    },
  ],
  consumable_void_script: [
    0.8,
    -19,
    (c) => {
      whoosh(c, 0, 0.45, { from: 3000, to: 300, gain: 0.7 })
      koto(c, 0.1, dark(0), { sustain: 0.7, brightness: 0.3 })
      koto(c, 0.1, dark(1), { sustain: 0.7, brightness: 0.3, gain: 0.6 })
    },
  ],

  // --- Shop ------------------------------------------------------------------
  shop_enter: [
    0.8,
    -21,
    (c) => {
      whoosh(c, 0, 0.2, { from: 500, to: 1800, gain: 0.5 })
      bell(c, 0.12, yo(12), { tau: 0.35 })
      bell(c, 0.2, yo(10), { tau: 0.4 })
    },
  ],
  shop_exit: [
    0.3,
    -23,
    (c) => {
      whoosh(c, 0, 0.18, { from: 1800, to: 500, gain: 0.5 })
      tick(c, 0.15, { frequency: 1500, gain: 0.5 })
    },
  ],
  shop_purchase: [
    0.6,
    -19,
    (c) => {
      coin(c, 0)
      coin(c, 0.05, { pitch: 1.08, gain: 0.6 })
      koto(c, 0.08, yo(7), { sustain: 0.5, gain: 0.6 })
    },
  ],
  shop_reroll: [0.4, -19, (c) => shuffle(c, 0, 0.32)],
  shop_sell: [
    0.45,
    -20,
    (c) => {
      friction(c, 0, 0.05, { gain: 0.3, center: 3600 })
      coin(c, 0.02, { pitch: 0.95 })
      coin(c, 0.09, { pitch: 1.04, gain: 0.7 })
    },
  ],
  shop_cant_afford: [
    0.24,
    -22,
    (c) => {
      coin(c, 0, { pitch: 0.75, gain: 0.5, ring: 0.25 })
      wood(c, 0.06, 340, { gain: 0.9 })
    },
  ],

  // --- Ambient (optional beds) -----------------------------------------------
  ambient_wind_chimes: [2.4, -24, (c) => chimes(c, 0, 2.2, { count: 10 })],
  ambient_rain: [
    2.4,
    -26,
    (c) => {
      noise(c, 0, 2.4, 0.5, {
        filters: [
          ['lowpass', 2500, 0.6],
          ['highpass', 300, 0.6],
        ],
        shape: (p) => Math.min(1, p / 0.15, (1 - p) / 0.15),
      })
      for (let k = 0; k < 70; k++)
        mode(
          c,
          c.range(0.05, 2.3),
          c.range(2200, 5200),
          c.range(0.05, 0.2),
          0.004
        )
    },
  ],
  ambient_birds: [
    2.4,
    -26,
    (c) => {
      ;[0.1, 0.17, 0.24, 0.9, 0.98, 1.7, 1.76, 1.82, 1.88].forEach((t, k) =>
        chirp(c, t, {
          from: 2800 + (k % 3) * 300,
          to: 4600 + (k % 2) * 500,
          duration: 0.045,
          gain: c.range(0.5, 1),
        })
      )
    },
  ],
}

// =============================================================================
// Mastering and encoding
// =============================================================================

/** Highest K-weighted RMS over 50 ms windows: a short-term loudness proxy. */
function shortTermRms(data) {
  const shelf = biquad('highshelf', 1681, 0.707, 4)
  const highpass = biquad('highpass', 38, 0.5)
  const weighted = data.map((x) => shelf(highpass(x)))
  const window = Math.round(0.05 * RATE)
  let sum = 0,
    best = 0
  for (let i = 0; i < weighted.length; i++) {
    sum += weighted[i] ** 2
    if (i >= window) sum -= weighted[i - window] ** 2
    best = Math.max(best, sum / window)
  }
  return Math.sqrt(best)
}

export function render(id) {
  const recipe = RECIPES[id]
  if (!recipe) throw new Error(`No sound recipe for ${id}`)
  const [duration, loudness, build] = recipe
  const ctx = context(id, duration)
  build(ctx)
  const { data } = ctx
  const peak = data.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  // Up to ~4 dB of a contact spike may ride into the soft knee instead of
  // dragging the whole cue down; everything below half the ceiling is untouched.
  const gain = Math.min(
    (PEAK * 1.6) / peak,
    10 ** (loudness / 20) / shortTermRms(data)
  )
  const knee = PEAK / 2
  for (let i = 0; i < data.length; i++) {
    const x = data[i] * gain
    const magnitude = Math.abs(x)
    data[i] =
      magnitude <= knee
        ? x
        : Math.sign(x) *
          (knee + (PEAK - knee) * Math.tanh((magnitude - knee) / (PEAK - knee)))
  }
  // Trim inaudible tails so files hold only sound, then fade the last 8 ms.
  let length = data.length
  while (length > 1 && Math.abs(data[length - 1]) < 0.0006) length--
  const fade = Math.round(0.008 * RATE)
  const wav = Buffer.alloc(44 + length * 2)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(RATE, 24)
  wav.writeUInt32LE(RATE * 2, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(length * 2, 40)
  for (let i = 0; i < length; i++) {
    const tail = Math.min(1, (length - 1 - i) / fade)
    wav.writeInt16LE(Math.round(data[i] * tail * 32767), 44 + i * 2)
  }
  return wav
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!check) mkdirSync(directory, { recursive: true })
  const unused = Object.keys(RECIPES).filter((id) => !ids.includes(id))
  if (unused.length)
    throw new Error(`Recipes without a cue: ${unused.join(', ')}`)
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
}
