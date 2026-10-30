/** Compose the App Store screenshots from iOS Simulator captures.
 * Needs ImageMagick 7 (`magick`) and macOS's Georgia Bold.
 * Run from the repo root: node scripts/compose-store-screenshots.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const store = resolve('app-store')
const out = resolve(store, 'screenshots/en-US')
const background = resolve(store, 'art/store-background.png')
const serif = '/System/Library/Fonts/Supplemental/Georgia Bold.ttf'
const sans = resolve('public/assets/NotoSansJP-Regular.ttf')

// The 6.9" and 6.3" iPhone slots. Each set scales the same captures.
const sizes = [
  [1320, 2868],
  [1206, 2622],
]

// Captures come from the iPhone 17 Pro simulator (1206 × 2622).
const panels = [
  {
    slug: '01_build-your-hand',
    capture: '01-full-house.png',
    title: ['Build your hand.', 'Find your edge.'],
    sub: 'A fresh take on mahjong strategy',
  },
  {
    slug: '02_shape-your-run',
    capture: '02-tea-house.png',
    title: ['Shape your run.', 'Choose your path.'],
    sub: 'Pick upgrades for your next challenge',
  },
  {
    slug: '03_bend-the-rules',
    capture: '03-decree-details.png',
    title: ['Bend the rules.', 'Build your strategy.'],
    sub: 'Discover powerful Decree combinations',
  },
  {
    slug: '04_learn-the-patterns',
    capture: '04-codex-sequences.png',
    title: ['Learn the patterns.', 'Find your own way.'],
    sub: 'Explore the in-game Codex',
  },
]

for (const file of [background, serif, sans])
  if (!existsSync(file)) throw new Error(`Missing ${file}`)
mkdirSync(out, { recursive: true })

const text = (font, size, color, kerning, top, value) => [
  '-font', font, '-pointsize', `${size}`, '-fill', color,
  '-kerning', `${kerning}`, '-annotate', `+0+${top}`, value,
]

for (const [width, height] of sizes) {
  const s = width / 1320
  const px = (value) => Math.round(value * s)
  // The capture fills the space under the headline at the phone's own aspect.
  const imageHeight = height - px(650) - px(215)
  const imageWidth = Math.round((imageHeight * 1206) / 2622)
  const x = Math.round((width - imageWidth) / 2)
  const y = px(650)
  const border = px(10)
  // iPhone screens have rounded corners of about 55 pt on a 402 pt width.
  const radius = Math.round(imageWidth * 0.137)

  for (const panel of panels) {
    const capture = resolve(store, 'captures', panel.capture)
    if (!existsSync(capture)) throw new Error(`Missing ${capture}`)
    const target = resolve(out, `iphone-${width}x${height}-${panel.slug}.png`)
    execFileSync('magick', [
      background, '-resize', `${width}x${height}^`, '-gravity', 'center',
      '-extent', `${width}x${height}`,
      '-fill', '#002b20', '-colorize', '22',
      '-gravity', 'north',
      ...text(sans, px(40), '#e3c57e', px(14), px(110), 'TENSHO'),
      ...text(serif, px(88), '#fff7e1', 0, px(255), panel.title[0]),
      ...text(serif, px(88), '#fff7e1', 0, px(365), panel.title[1]),
      ...text(sans, px(40), '#e6ebdc', 0, px(495), panel.sub),
      ...text(sans, px(29), '#dfc88e', px(4), height - px(160), 'MAHJONG ROGUELIKE'),
      '-gravity', 'northwest',
      // Gold frame, then the capture clipped to the screen's rounded corners.
      '-fill', '#d3b46a', '-draw',
      `roundrectangle ${x - border},${y - border} ${x + imageWidth + border - 1},${y + imageHeight + border - 1} ${radius + border},${radius + border}`,
      '(', capture, '-resize', `${imageWidth}x${imageHeight}!`,
      '(', '-size', `${imageWidth}x${imageHeight}`, 'xc:black', '-fill', 'white',
      '-draw', `roundrectangle 0,0 ${imageWidth - 1},${imageHeight - 1} ${radius},${radius}`, ')',
      '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', ')',
      '-compose', 'over', '-geometry', `+${x}+${y}`, '-composite',
      // App Store Connect rejects screenshots with an alpha channel.
      '-alpha', 'off', '-strip', `PNG24:${target}`,
    ])
    console.log(`${target.slice(store.length + 1)} ${width}×${height}`)
  }
}
