/**
 * Write docs/ART_PRODUCTION_MANIFEST.md: every item that should have its own
 * artwork, where the file goes, and a prompt to generate it.
 *
 *   bunx vite-node scripts/art-production-manifest.mts
 *
 * The list comes from the live catalogs, so it stays complete as content
 * changes. An item with its own picture (listed in
 * src/config/itemArtManifest.json, in the delivered set in
 * src/utils/generatedArt.ts, or an older portrait) is marked done.
 */
import { writeFileSync } from 'node:fs'
import en from '../src/i18n/locales/en.json'
import manifest from '../src/config/itemArtManifest.json'
import { ALL_DECREES } from '../src/systems/DecreeSystem'
import { CELESTIAL_ORBS } from '../src/systems/CelestialOrbSystem'
import { FATE_SEALS } from '../src/systems/FateSealSystem'
import { VOID_SCRIPTS } from '../src/systems/VoidScriptSystem'
import { ALL_CHARTERS } from '../src/config/charterDefinitions'
import { ALL_MANDATES } from '../src/config/mandateDefinitions'
import { ALL_OMENS } from '../src/config/omenDefinitions'
import { getItemArt, type ItemArtKind } from '../src/utils/itemArt'

type Copy = { name?: string; description?: string }
const items = (path: string): Record<string, Copy> =>
  path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown>)?.[key],
      en
    ) as Record<string, Copy>

const STYLE =
  'Style: tactile hand-painted East Asian fantasy board-game object, warm cream paper, polished gold, jade and lacquer accents, soft warm highlights, restrained painterly texture, clean silhouette readable at 64px. Composition: centered complete object on a square canvas with generous margins. Genuine transparent alpha background. No words, letters, numbers, calligraphy, UI, humans or watermark.'

const SUBJECT: Record<ItemArtKind, string> = {
  decrees:
    'a partially unrolled ivory parchment Decree scroll with lacquer rollers and a red wax seal; the painted emblem on the parchment shows',
  orbs: 'a glowing celestial orb on a small gold stand, its surface showing',
  seals: 'a round red-and-gold Fate Seal medallion with a short tassel, embossed with',
  scripts: 'a dark slate Void Script tablet with violet-glowing inlay depicting',
  charters:
    'a partially unrolled Imperial Charter with cobalt-blue rollers, gold caps and a red wax seal; the painted emblem shows',
  mandates:
    'a menacing Boss Mandate token: a black-lacquer and crimson plaque depicting',
  omens: 'a small paper omen charm hanging from a red cord, painted with',
  yakuUpgrades:
    'a jade ledger tablet with a gold upgrade ribbon, its carved emblem showing',
  tileMarks: 'an ivory Mahjong tile face ornament depicting',
  packs: 'a closed silk Blessing Pack pouch tied with cord, decorated with',
}

interface Row {
  id: string
  name: string
  effect: string
}

const sections: Array<{ kind: ItemArtKind; title: string; rows: Row[] }> = [
  {
    kind: 'decrees',
    title: 'Decrees',
    rows: ALL_DECREES.map((d) => ({
      id: d.id,
      name: items('decrees.items')[d.id]?.name ?? d.name,
      effect: items('decrees.items')[d.id]?.description ?? d.description,
    })),
  },
  {
    kind: 'orbs',
    title: 'Celestial Orbs',
    rows: Object.values(CELESTIAL_ORBS).map((o) => ({
      id: o.id,
      name: items('orbs.items')[o.id]?.name ?? o.name,
      effect: items('orbs.items')[o.id]?.description ?? o.description,
    })),
  },
  {
    kind: 'seals',
    title: 'Fate Seals',
    rows: Object.values(FATE_SEALS).map((s) => ({
      id: s.id,
      name: items('seals.items')[s.id]?.name ?? s.name,
      effect: items('seals.items')[s.id]?.description ?? s.description,
    })),
  },
  {
    kind: 'scripts',
    title: 'Void Scripts',
    rows: Object.values(VOID_SCRIPTS).map((s) => ({
      id: s.id,
      name: items('scripts.items')[s.id]?.name ?? s.name,
      effect: items('scripts.items')[s.id]?.description ?? s.description,
    })),
  },
  {
    kind: 'charters',
    title: 'Imperial Charters',
    rows: ALL_CHARTERS.map((c) => ({
      id: c.id,
      name: items('charters.items')[c.id]?.name ?? c.name,
      effect: items('charters.items')[c.id]?.description ?? c.description,
    })),
  },
  {
    kind: 'mandates',
    title: 'Boss Mandates',
    rows: ALL_MANDATES.map((m) => ({
      id: m.id,
      name: items('mandates.items')[m.id]?.name ?? m.name,
      effect: items('mandates.items')[m.id]?.description ?? m.description,
    })),
  },
  {
    kind: 'omens',
    title: 'Omens',
    rows: ALL_OMENS.map((o) => ({
      id: o.id,
      name: items('omens.items')[o.id]?.name ?? o.name,
      effect: items('omens.items')[o.id]?.description ?? o.description,
    })),
  },
  {
    kind: 'yakuUpgrades',
    title: 'Upgrade families (one token per owned upgrade)',
    rows: Object.entries(items('upgradeFamilies'))
      .filter(([, value]) => typeof value === 'object' && value?.name)
      .map(([id, value]) => ({
        id,
        name: value.name!,
        effect: value.description ?? '',
      })),
  },
  {
    kind: 'tileMarks',
    title: 'Special tiles (marks, seals and editions on the tile face)',
    rows: [
      ...Object.entries(items('tileMarks.items')).map(([id, value]) => ({
        id: `mark-${id}`,
        name: value.name ?? id,
        effect: value.description ?? '',
      })),
      ...Object.entries(items('archiveSeals.items')).map(([id, value]) => ({
        id: `seal-${id}`,
        name: value.name ?? id,
        effect: value.description ?? '',
      })),
      ...Object.entries(items('editions.items'))
        .filter(([id]) => id !== 'base')
        .map(([id, value]) => ({
          id: `edition-${id}`,
          name: value.name ?? id,
          effect: value.description ?? '',
        })),
    ],
  },
  {
    kind: 'packs',
    title: 'Blessing Packs',
    rows: ['Arcana', 'Celestial', 'Tile', 'Decree', 'Void'].map((id) => ({
      id,
      name: `${id} Pack`,
      effect: '',
    })),
  },
]

const listed = manifest as unknown as Record<string, string[]>
const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
let total = 0
let done = 0
const body = sections
  .map(({ kind, title, rows }) => {
    const lines = rows.map((row) => {
      total++
      const own = listed[kind]?.includes(row.id)
      const pictured = own || getItemArt(kind, row.id).hasOwnArt
      if (pictured) done++
      const status = own ? 'done' : pictured ? 'delivered' : 'needed'
      return `| \`${row.id}\` | ${cell(row.name)} | ${cell(row.effect)} | ${status} |`
    })
    return [
      `## ${title}`,
      '',
      `File: \`public/assets/illustrations/items/${kind}/<id>.webp\`, then add the id to \`"${kind}"\` in \`src/config/itemArtManifest.json\`.`,
      '',
      `Prompt: *${SUBJECT[kind]} [a single clear motif for the item's effect]. ${STYLE}*`,
      '',
      '| id | Name | Effect (the motif should suggest it) | Status |',
      '| --- | --- | --- | --- |',
      ...lines,
      '',
    ].join('\n')
  })
  .join('\n')

writeFileSync(
  'docs/ART_PRODUCTION_MANIFEST.md',
  `# Art production manifest

Every item that should be recognizable by its own picture. The game never
shows an emoji for an item: until an item's file lands, it uses its family's
shared artwork (see \`src/utils/itemArt.ts\`). Generated by
\`bunx vite-node scripts/art-production-manifest.mts\` from the live catalogs;
re-run it after adding art or content.

**Progress:** ${done} of ${total} items have their own art.

## How to deliver an image

1. Generate a square image with a transparent background (at least 512×512),
   following the section's prompt with one motif for the item's effect.
2. Export it as WebP: \`cwebp -q 85 -resize 512 512 in.png -o <id>.webp\`,
   preserving alpha.
3. Save it at the section's path, named exactly by the item id.
4. Add the id to the matching list in \`src/config/itemArtManifest.json\`.
5. Record the prompt and source in \`scripts/illustration-sources.json\`, as for
   existing generated art.

Names and rules stay as localized text; never paint words or numbers.

${body}`
)
console.log(`wrote ${total} items (${done} done)`)
