/**
 * The "?" guide: Tensho on one page. Tiles, the hands you can play with an
 * example of each, how a score is made, Turns, and what special tiles look
 * like. Every number shown comes from the scoring tables themselves.
 */

import { useTranslation } from 'react-i18next'
import { Tile, TileSuit } from '../../core/Tile'
import { Meld, MeldType } from '../../core/Meld'
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
  TAUGHT_PATTERNS,
  type PlayPatternId,
} from '../../rules/PlayPattern'
import {
  EditionType,
  EnhancementType,
  SealType,
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
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-beige-white)]/70">
        {t(`patterns.${id}.explain`)}
      </p>
      <div
        aria-hidden="true"
        className="mt-1.5 flex flex-wrap items-end gap-2"
      >
        {groups.map((group, index) => (
          <span key={index} className="flex gap-0.5">
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

function SpecialTile({
  label,
  enhancement = EnhancementType.None,
  seal = SealType.None,
  edition = EditionType.Base,
}: {
  label: string
  enhancement?: EnhancementType
  seal?: SealType
  edition?: EditionType
}) {
  const example = new Tile(P, 5, `guide-special-${label}`, false, {
    enhancement,
    seal,
    edition,
  })
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <TileImage tile={example} size="small" showTooltip={false} />
      <span className="w-full text-center text-[11px] leading-tight text-[var(--color-beige-white)]/75">
        {label}
      </span>
    </div>
  )
}

export function BeginnerGuide({ isOpen, onClose }: BeginnerGuideProps) {
  const { t } = useTranslation()

  const families = [
    { label: t('tiles.manzu', 'Characters'), tile: tile(M, 4) },
    { label: t('tiles.pinzu', 'Circles'), tile: tile(P, 4) },
    { label: t('tiles.souzu', 'Bamboo'), tile: tile(S, 4) },
    { label: t('tiles.winds', 'Winds'), tile: tile(TileSuit.Wind, 1) },
    { label: t('tiles.dragons', 'Dragons'), tile: tile(TileSuit.Dragon, 3) },
  ]

  const heading =
    'text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--color-metallic-gold)]'

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
          <p className="text-sm leading-relaxed text-[var(--color-beige-white)]/85">
            {t('guide.intro')}
          </p>
        </div>

        <section>
          <h3 className={heading}>{t('guide.turnsTitle', 'Your turn')}</h3>
          <ol className="mt-2 grid gap-2 text-sm text-[var(--color-beige-white)]/85 sm:grid-cols-2">
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
          <p className="mt-2 text-center text-xs text-[var(--color-beige-white)]/70">
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
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-beige-white)]/75">
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
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-beige-white)]/70">
            {t('guide.patternRule')}
          </p>
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
                <span className="text-center text-[11px] leading-tight text-[var(--color-beige-white)]/75 [overflow-wrap:normal]">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-beige-white)]/75">
            {t('guide.tilesHelp')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-golden-yellow)]">
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
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            <SpecialTile label={t('tileMarks.items.gold.name')} enhancement={EnhancementType.Gold} />
            <SpecialTile label={t('tileMarks.items.bonus.name')} enhancement={EnhancementType.Bonus} />
            <SpecialTile label={t('tileMarks.items.mult.name')} enhancement={EnhancementType.Mult} />
            <SpecialTile label={t('tileMarks.items.glass.name')} enhancement={EnhancementType.Glass} />
            <SpecialTile label={t('archiveSeals.items.red.name')} seal={SealType.Red} />
            <SpecialTile label={t('editions.items.holographic.name')} edition={EditionType.Holographic} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-beige-white)]/75">
            {t('guide.specialHelp')}
          </p>
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
