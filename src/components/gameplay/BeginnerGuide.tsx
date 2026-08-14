import { useTranslation } from 'react-i18next'
import { Tile, TileSuit } from '../../core/Tile'
import { Popup } from '../ui/Popup'
import { TileImage } from '../tiles/TileImage'

interface BeginnerGuideProps {
  isOpen: boolean
  onClose: () => void
}

interface PatternExampleProps {
  label: string
  description: string
  tiles: Tile[]
  points: number
}

function PatternExample({
  label,
  description,
  tiles,
  points,
}: PatternExampleProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-[var(--color-beige-white)]">{label}</h4>
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-black text-amber-200">
            +{points}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-beige-white)]/65">
          {description}
        </p>
      </div>
      <div className="flex items-end gap-1" aria-hidden="true">
        {tiles.map((tile) => (
          <TileImage
            key={tile.id}
            tile={tile}
            size="small"
            showTooltip={false}
          />
        ))}
      </div>
    </div>
  )
}

const exampleTile = (suit: TileSuit, rank: number, id: string) =>
  new Tile(suit, rank, `beginner-${id}`)

export function BeginnerGuide({ isOpen, onClose }: BeginnerGuideProps) {
  const { t } = useTranslation()

  const suitExamples = [
    {
      label: t('tiles.manzu', 'Characters'),
      tile: exampleTile(TileSuit.Manzu, 4, 'characters'),
    },
    {
      label: t('tiles.pinzu', 'Circles'),
      tile: exampleTile(TileSuit.Pinzu, 4, 'circles'),
    },
    {
      label: t('tiles.souzu', 'Bamboo'),
      tile: exampleTile(TileSuit.Souzu, 4, 'bamboo'),
    },
    {
      label: t('tiles.winds', 'Winds'),
      tile: exampleTile(TileSuit.Wind, 1, 'wind'),
    },
    {
      label: t('tiles.dragons', 'Dragons'),
      tile: exampleTile(TileSuit.Dragon, 3, 'dragon'),
    },
  ]

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={t('gameplay.beginnerGuideTitle', 'Mahjong in one minute')}
      className="w-[min(94vw,620px)]"
    >
      <div
        data-beginner-guide
        className="max-h-[min(68dvh,680px)] overflow-y-auto pr-1"
      >
        <p className="text-center text-sm leading-relaxed text-[var(--color-beige-white)]/80 sm:text-base">
          {t(
            'gameplay.beginnerGuideIntro',
            'You do not need to know a full Mahjong hand yet. In Tensho, begin by spotting one small shape and playing it for points.'
          )}
        </p>

        <section className="mt-5">
          <h3 className="text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--color-metallic-gold)]">
            {t('gameplay.beginnerFamiliesTitle', 'Read the tile families')}
          </h3>
          <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-3">
            {suitExamples.map(({ label, tile }) => (
              <div
                key={tile.id}
                className="flex min-w-0 flex-col items-center gap-1.5"
              >
                <TileImage tile={tile} size="small" showTooltip={false} />
                <span className="w-full truncate text-center text-[10px] font-semibold text-[var(--color-beige-white)]/75 sm:text-xs">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-[var(--color-beige-white)]/60">
            {t(
              'gameplay.beginnerFamiliesHelp',
              'Characters, Circles, and Bamboo run from 1 to 9. Winds and Dragons are Honors: match them, but never place them in a sequence.'
            )}
          </p>
        </section>

        <section className="mt-5">
          <h3 className="text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--color-metallic-gold)]">
            {t('gameplay.beginnerShapesTitle', 'The shapes to spot')}
          </h3>
          <div className="mt-3 space-y-2">
            <PatternExample
              label={t('melds.pair', 'Pair')}
              description={t(
                'gameplay.beginnerPairHelp',
                'Two identical tiles. The easiest shape to recognize.'
              )}
              points={10}
              tiles={[
                exampleTile(TileSuit.Pinzu, 5, 'pair-a'),
                exampleTile(TileSuit.Pinzu, 5, 'pair-b'),
              ]}
            />
            <PatternExample
              label={t('melds.sequence', 'Sequence')}
              description={t(
                'gameplay.beginnerSequenceHelp',
                'Three consecutive numbers in the same suit.'
              )}
              points={20}
              tiles={[
                exampleTile(TileSuit.Souzu, 2, 'sequence-a'),
                exampleTile(TileSuit.Souzu, 3, 'sequence-b'),
                exampleTile(TileSuit.Souzu, 4, 'sequence-c'),
              ]}
            />
            <PatternExample
              label={t('melds.triplet', 'Triplet')}
              description={t(
                'gameplay.beginnerTripletHelp',
                'Three identical tiles. Harder to find, but worth more.'
              )}
              points={30}
              tiles={[
                exampleTile(TileSuit.Manzu, 7, 'triplet-a'),
                exampleTile(TileSuit.Manzu, 7, 'triplet-b'),
                exampleTile(TileSuit.Manzu, 7, 'triplet-c'),
              ]}
            />
            <PatternExample
              label={t('melds.quad', 'Quad')}
              description={t(
                'gameplay.beginnerQuadHelp',
                'Four identical tiles. Rare, valuable, and easy to recognize.'
              )}
              points={50}
              tiles={[
                exampleTile(TileSuit.Pinzu, 9, 'quad-a'),
                exampleTile(TileSuit.Pinzu, 9, 'quad-b'),
                exampleTile(TileSuit.Pinzu, 9, 'quad-c'),
                exampleTile(TileSuit.Pinzu, 9, 'quad-d'),
              ]}
            />
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-[var(--color-metallic-gold)]/30 bg-[var(--color-forest-green)]/35 p-3">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-golden-yellow)]">
            {t('gameplay.beginnerFlowTitle', 'Your turn, every time')}
          </h3>
          <ol className="mt-2 grid gap-2 text-sm text-[var(--color-beige-white)]/80 sm:grid-cols-3">
            <li>
              <strong className="text-white">1.</strong>{' '}
              {t('gameplay.beginnerFlowSelect', 'Tap a useful shape.')}
            </li>
            <li>
              <strong className="text-white">2.</strong>{' '}
              {t('gameplay.beginnerFlowPreview', 'Read the exact forecast.')}
            </li>
            <li>
              <strong className="text-white">3.</strong>{' '}
              {t('gameplay.beginnerFlowPlay', 'Play it and draw replacements.')}
            </li>
          </ol>
        </section>

        <p className="mt-4 text-center text-xs leading-relaxed text-[var(--color-metallic-gold)]">
          {t(
            'gameplay.beginnerFullHand',
            'Later, four shapes plus one pair form a complete hand and unlock powerful Yaku multipliers.'
          )}
        </p>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border-2 border-[var(--color-golden-yellow)] bg-[var(--color-vibrant-orange)] px-6 py-2 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            {t('gameplay.showGuidedMove', 'Show me a move')}
          </button>
        </div>
      </div>
    </Popup>
  )
}
