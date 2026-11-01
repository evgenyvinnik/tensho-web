/**
 * The "?" guide: Tensho on one page. Tiles, the hands you can play with an
 * example of each, how a score is made, Turns, and what special tiles look
 * like. Every number shown comes from the scoring tables themselves. A secret
 * hand joins the list only once this profile has played it.
 */

import { useTranslation } from 'react-i18next'
import { Tile, TileSuit } from '../../core/Tile'
import { honorSetRanks, Meld, MeldType } from '../../core/Meld'
import {
  getMeldStructurePoints,
  WIND_GROUP_POINTS,
  WIND_TILE_POINTS,
} from '../../rules/ScoringEngine'
import {
  classifyPlay,
  DRAGON_GROUP_MULT,
  DRAGON_MULT,
  MAHJONG_PATTERN_MULT,
  SECRET_PATTERNS,
  TAUGHT_PATTERNS,
  type PlayPatternId,
} from '../../rules/PlayPattern'
import { useProgressionStore } from '../../stores/progressionStore'
import {
  DEFAULT_MODIFIERS,
  EditionType,
  EnhancementType,
  SealType,
  type TileModifiers,
} from '../../core/TileModifier'
import { illustrationAssets } from '../../utils/assets'
import { Popup } from '../ui/Popup'
import { TileImage } from '../tiles/TileImage'
import { TURNS_PER_ROUND, SWIFT_CLEAR_SPARE_TURNS } from '../../game/playRules'

interface BeginnerGuideProps {
  isOpen: boolean
  onClose: () => void
}

let exampleId = 0
const tile = (suit: TileSuit, rank: number) =>
  new Tile(suit, rank, `guide-${++exampleId}`)
const run = (suit: TileSuit, from: number, length: number) =>
  Array.from({ length }, (_, i) => tile(suit, from + i))
const same = (suit: TileSuit, rank: number, count: number) =>
  Array.from({ length: count }, () => tile(suit, rank))
const honors = (suit: TileSuit) =>
  new Meld(
    MeldType.Honors,
    honorSetRanks(suit).map((rank) => tile(suit, rank))
  )

const M = TileSuit.Manzu
const P = TileSuit.Pinzu
const S = TileSuit.Souzu

/** One example per taught pattern, as the groups it is made of. */
const EXAMPLES: Record<PlayPatternId, Meld[]> = {
  pair: [new Meld(MeldType.Pair, same(P, 5, 2))],
  sequence: [new Meld(MeldType.Sequence, run(S, 2, 3))],
  two_pairs: [
    new Meld(MeldType.Pair, same(M, 3, 2)),
    new Meld(MeldType.Pair, same(P, 7, 2)),
  ],
  triplet: [new Meld(MeldType.Triplet, same(M, 7, 3))],
  straight4: [new Meld(MeldType.Straight, run(S, 3, 4))],
  sequence_pair: [
    new Meld(MeldType.Sequence, run(P, 1, 3)),
    new Meld(MeldType.Pair, same(S, 9, 2)),
  ],
  two_sequences: [
    new Meld(MeldType.Sequence, run(M, 2, 3)),
    new Meld(MeldType.Sequence, run(M, 6, 3)),
  ],
  triplet_pair: [
    new Meld(MeldType.Triplet, same(S, 5, 3)),
    new Meld(MeldType.Pair, same(M, 2, 2)),
  ],
  straight5: [new Meld(MeldType.Straight, run(P, 4, 5))],
  quad: [new Meld(MeldType.Quad, same(P, 9, 4))],
  mahjong: [
    new Meld(MeldType.Sequence, run(M, 1, 3)),
    new Meld(MeldType.Sequence, run(M, 4, 3)),
    new Meld(MeldType.Triplet, same(P, 6, 3)),
    new Meld(MeldType.Sequence, run(S, 7, 3)),
    new Meld(MeldType.Pair, same(TileSuit.Dragon, 3, 2)),
  ],
  loose: [],
  three_pairs: [],
  two_triplets: [],
  triplet_sequence: [],
  quad_pair: [],
  straight_pair: [],
  three_dragons: [honors(TileSuit.Dragon)],
  four_winds: [honors(TileSuit.Wind)],
  combination: [],
}

function PatternRow({ id }: { id: PlayPatternId }) {
  const { t, i18n } = useTranslation()
  const groups = EXAMPLES[id]
  const structure = groups.reduce(
    (sum, group) => sum + getMeldStructurePoints(group),
    0
  )
  const mult =
    1 + (id === 'mahjong' ? MAHJONG_PATTERN_MULT : classifyPlay(groups).mult)
  const number = (value: number) => value.toLocaleString(i18n.language)
  return (
    <li
      data-guide-pattern={id}
      className="rounded-xl border border-white/10 bg-black/20 p-2.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="font-bold text-[var(--color-beige-white)]">
          {t(`patterns.${id}.name`)}
        </h4>
        <span className="flex gap-1 font-mono text-xs font-black">
          <span className="rounded bg-sky-700/80 px-1.5 py-0.5 text-white">
            +{number(structure)}
          </span>
          <span className="rounded bg-red-700/80 px-1.5 py-0.5 text-white">
            ×{number(mult)}
          </span>
        </span>
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-beige-white)]/90">
        {t(`patterns.${id}.explain`)}
      </p>
      <div
        aria-hidden="true"
        className="mt-1.5 flex flex-wrap items-end gap-2"
      >
        {groups.map((group, index) => (
          // A five-tile run wraps rather than overflow a 320px phone with
          // large text.
          <span key={index} className="flex flex-wrap gap-0.5">
            {group.tiles.map((example) => (
              <TileImage
                key={example.id}
                tile={example}
                size="small"
                showTooltip={false}
              />
            ))}
          </span>
        ))}
      </div>
    </li>
  )
}

/**
 * Every look a tile can carry, each with the name and effect its own tile
 * details show. Phones have no hover, so this list is where they learn them.
 */
const SPECIAL_LOOKS = [
  {
    title: 'marks',
    kind: 'tileMarks',
    looks: Object.values(EnhancementType)
      .filter((id) => id !== EnhancementType.None)
      .map((id) => ({ id, modifiers: { enhancement: id } })),
  },
  {
    title: 'seals',
    kind: 'archiveSeals',
    looks: Object.values(SealType)
      .filter((id) => id !== SealType.None)
      .map((id) => ({ id, modifiers: { seal: id } })),
  },
  {
    title: 'editions',
    kind: 'editions',
    looks: Object.values(EditionType)
      .filter((id) => id !== EditionType.Base)
      .map((id) => ({ id, modifiers: { edition: id } })),
  },
] as const

function SpecialLook({
  kind,
  id,
  modifiers,
}: {
  kind: (typeof SPECIAL_LOOKS)[number]['kind']
  id: string
  modifiers: Partial<TileModifiers>
}) {
  const { t } = useTranslation()
  const example = new Tile(P, 5, `guide-${kind}-${id}`, false, {
    ...DEFAULT_MODIFIERS,
    ...modifiers,
  })
  return (
    <li
      data-guide-special={`${kind}.${id}`}
      className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2"
    >
      <span aria-hidden="true" className="shrink-0">
        <TileImage tile={example} size="small" showTooltip={false} />
      </span>
      <span className="min-w-0 text-[13px] leading-snug text-[var(--color-beige-white)]/90">
        <strong className="block text-sm text-[var(--color-golden-yellow)]">
          {t(`${kind}.items.${id}.name`)}
        </strong>
        {t(`${kind}.items.${id}.description`)}
      </span>
    </li>
  )
}

export function BeginnerGuide({ isOpen, onClose }: BeginnerGuideProps) {
  const { t } = useTranslation()
  const discovered = useProgressionStore((state) => state.discoveredPatterns)
  const secrets = SECRET_PATTERNS.filter((id) => discovered.includes(id))

  const families = [
    { label: t('tiles.manzu', 'Characters'), tile: tile(M, 4) },
    { label: t('tiles.pinzu', 'Circles'), tile: tile(P, 4) },
    { label: t('tiles.souzu', 'Bamboo'), tile: tile(S, 4) },
    { label: t('tiles.winds', 'Winds'), tile: tile(TileSuit.Wind, 1) },
    { label: t('tiles.dragons', 'Dragons'), tile: tile(TileSuit.Dragon, 3) },
  ]

  // Full-strength 14px text: dimmed 12px copy fades into the red scroll.
  const heading =
    'text-center text-sm font-black uppercase tracking-[0.14em] text-[var(--color-golden-yellow)]'
  const body = 'text-sm leading-relaxed text-[var(--color-beige-white)]'

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={t('guide.title', 'How to play')}
      className="w-[min(94vw,640px)]"
    >
      <div data-beginner-guide className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
        <div className="flex items-center gap-3">
          <img
            data-guide-art
            src={illustrationAssets.beginnerGuidebook}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <p className={body}>
            {t('guide.intro')}
          </p>
        </div>

        <section>
          <h3 className={heading}>{t('guide.turnsTitle', 'Your turn')}</h3>
          <ol className={`mt-2 grid gap-2 sm:grid-cols-2 ${body}`}>
            <li className="rounded-lg bg-black/20 p-2">
              <strong className="text-[var(--color-golden-yellow)]">
                {t('gameplay.playHand', 'Play hand')}
              </strong>{' '}
              {t('guide.playHelp')}
            </li>
            <li className="rounded-lg bg-black/20 p-2">
              <strong className="text-[var(--color-golden-yellow)]">
                {t('gameplay.redraw', 'REDRAW')}
              </strong>{' '}
              {t('guide.redrawHelp')}
            </li>
          </ol>
          <p className={`mt-2 ${body}`}>
            {t('guide.turnsHelp', {
              turns: TURNS_PER_ROUND,
              spare: SWIFT_CLEAR_SPARE_TURNS,
            })}
          </p>
        </section>

        <section>
          <h3 className={heading}>{t('guide.scoreTitle', 'Your score')}</h3>
          <p className="mt-2 text-center text-sm">
            <span className="rounded bg-sky-700/80 px-1.5 py-0.5 font-mono font-black text-white">
              {t('guide.points', 'Points')}
            </span>{' '}
            ×{' '}
            <span className="rounded bg-red-700/80 px-1.5 py-0.5 font-mono font-black text-white">
              {t('guide.mult', 'Mult')}
            </span>{' '}
            = {t('guide.score', 'Score')}
          </p>
          <p className={`mt-2 ${body}`}>
            {t('guide.scoreHelp')}
          </p>
        </section>

        <section>
          <h3 className={heading}>{t('guide.handsTitle', 'The hands')}</h3>
          <ul className="mt-2 space-y-2">
            {TAUGHT_PATTERNS.map((id) => (
              <PatternRow key={id} id={id} />
            ))}
          </ul>
          <p className={`mt-2 ${body}`}>
            {t('guide.patternRule')}
          </p>
          {secrets.length > 0 && (
            <div data-guide-secrets>
              <h4 className={`${heading} mt-4`}>{t('guide.secretTitle')}</h4>
              <ul className="mt-2 space-y-2">
                {secrets.map((id) => (
                  <PatternRow key={id} id={id} />
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h3 className={heading}>{t('guide.tilesTitle', 'The tiles')}</h3>
          {/* Each family is as wide as its name, so names wrap only between
              words, even on the narrowest phone. */}
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {families.map(({ label, tile: example }) => (
              <div
                key={example.id}
                data-guide-tile-family
                className="flex max-w-full flex-col items-center gap-1"
              >
                <TileImage tile={example} size="small" showTooltip={false} showIndex />
                <span className="text-center text-xs leading-tight text-[var(--color-beige-white)] [overflow-wrap:normal]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className={`mt-2 ${body}`}>
            {t('guide.tilesHelp')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-golden-yellow)]">
            {t('guide.honorsHelp', {
              wind: WIND_TILE_POINTS,
              windGroup: WIND_GROUP_POINTS,
              dragon: DRAGON_MULT,
              dragonGroup: DRAGON_GROUP_MULT,
            })}
          </p>
        </section>

        <section>
          <h3 className={heading}>{t('guide.specialTitle', 'Special tiles')}</h3>
          <p className={`mt-2 ${body}`}>{t('guide.specialHelp')}</p>
          {SPECIAL_LOOKS.map(({ title, kind, looks }) => (
            <div key={kind} data-guide-special-group={title}>
              <h4 className="mt-4 text-sm font-bold text-[var(--color-golden-yellow)]">
                {t(`guide.${title}`)}
              </h4>
              <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {looks.map((look) => (
                  <SpecialLook key={look.id} kind={kind} {...look} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-6 py-2 font-bold text-white shadow-lg"
          >
            {t('guide.close', 'Let’s play')}
          </button>
        </div>
      </div>
    </Popup>
  )
}
