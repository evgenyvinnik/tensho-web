/**
 * useTutorialSteps Hook
 *
 * Generates all tutorial step content for the Tensho codex.
 * Content is organized into 11 categories covering game mechanics.
 */

import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TileSuit } from '../../../core/Tile'
import { MeldType } from '../../../core/Meld'
import {
  DRAGON_TILE_POINTS,
  STRAIGHT_5_POINTS,
  STRUCTURE_POINTS_BY_TYPE,
  WIND_GROUP_POINTS,
  WIND_TILE_POINTS,
} from '../../../rules/ScoringEngine'
import {
  DRAGON_GROUP_MULT,
  DRAGON_MULT,
  GROUP_MULT,
  MAHJONG_PATTERN_MULT,
  TAUGHT_PATTERNS,
} from '../../../rules/PlayPattern'
import { ALL_YAKU, CHINITSU, TANYAO, TOITOI } from '../../../rules/YakuDetector'
import { ROUND_TYPE_DEFINITIONS } from '../../../config/mandateDefinitions'
import {
  MAX_TACTICAL_PLAY_TILES,
  SWIFT_CLEAR_SPARE_TURNS,
  TURNS_PER_ROUND,
} from '../../../game/playRules'
import {
  TutorialStep,
  Highlight,
  InfoBox,
  Formula,
  DataTable,
  TileLabel,
  TileGroups,
} from './TutorialComponents'
import { PavilionIcon } from '../../ui/PavilionIcon'
import { FloraCodex, FLORA_CODEX_SECTIONS } from './FloraCodex'
import { EconomyCodex, ECONOMY_CODEX_SECTIONS } from './EconomyCodex'
import { HAND_BUILDING_EXAMPLE } from './handBuildingExample'
import { NORMAL_RUN_ACTS } from '../../../config/runProgression'
import { DecreeBuildGuide } from '../../shop/DecreeBuildGuide'

/**
 * useTutorialSteps - Hook that generates all tutorial step content
 *
 * Creates a memoized array of 40+ tutorial steps organized into 11 categories,
 * covering everything from basic tile knowledge to advanced strategy.
 * Content is internationalized using react-i18next.
 *
 * @returns Array of TutorialStep objects with localized content
 */
export function useTutorialSteps(): TutorialStep[] {
  const { t } = useTranslation()

  return useMemo(() => {
    const bonus = (points: number) => `+${points}`
    const groupRows = [
      [MeldType.Pair, 'pair'],
      [MeldType.Sequence, 'sequence'],
      [MeldType.Triplet, 'triplet'],
      [MeldType.Straight, 'straight4'],
      [MeldType.Straight, 'straight5'],
      [MeldType.Quad, 'quad'],
    ].map(([type, pattern]) => [
      <Highlight color="orange">{t(`patterns.${pattern}.name`)}</Highlight>,
      t(`patterns.${pattern}.explain`),
      bonus(
        pattern === 'straight5'
          ? STRAIGHT_5_POINTS
          : STRUCTURE_POINTS_BY_TYPE[type as MeldType]
      ),
    ])
    return [
      {
        id: 'welcome',
        category: 'Introduction',
        title: t('tutorial.welcome.title'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.welcome.p1">
                <Highlight>Tensho (天翔)</Highlight> means "Heavenly Ascent" in
                Japanese. It is a{' '}
                <Highlight color="orange">roguelike game</Highlight> of{' '}
                <Highlight>poker-style hands</Highlight> played with Mahjong
                tiles.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.welcome.p2">
                Your goal is simple:{' '}
                <Highlight color="orange">build scoring hands</Highlight> and
                reach the target score each round. Fail to reach the target, and
                your run ends.
              </Trans>
            </p>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.welcome.note1">
                Don't worry if you've never played Mahjong before! This tutorial
                will teach you everything you need to know, step by step.
              </Trans>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'game-concept',
        category: 'Introduction',
        title: t('codexReference.titleConcept'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.game_concept.p1">
                Unlike traditional Mahjong which is played against opponents,
                Tensho is a <Highlight>single-player puzzle game</Highlight>.
                You're racing against the score target, not other players.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.game_concept.p2">
                Each run consists of multiple{' '}
                <Highlight color="orange">Acts</Highlight>, and each Act has{' '}
                <Highlight>3 Rounds</Highlight>. The score targets increase as
                you progress.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.game_concept.p3">
                Between rounds, you'll visit the{' '}
                <Highlight>Tea House</Highlight> (shop) to acquire powerful{' '}
                <Highlight color="orange">Decrees</Highlight> that modify the
                rules and boost your scoring potential.
              </Trans>
            </p>
          </div>
        ),
      },
      {
        id: 'tiles-overview',
        category: 'Tiles',
        title: t('codexReference.titleTilesOverview'),
        content: (
          <div className="space-y-3">
            <p>{t('codexReference.tileSet')}</p>
            <DataTable
              headers={[
                t('codexReference.category'),
                t('codexReference.types'),
                t('codexReference.count'),
              ]}
              rows={[
                [
                  t('codexReference.numberedSuits'),
                  t('codexReference.numberedComposition'),
                  '108',
                ],
                [t('tiles.winds'), t('codexReference.windComposition'), '16'],
                [
                  t('tiles.dragons'),
                  t('codexReference.dragonComposition'),
                  '12',
                ],
                [
                  t('codexReference.bonusTiles'),
                  t('codexReference.bonusComposition'),
                  '8',
                ],
              ]}
            />
            <InfoBox type="info">
              <Trans i18nKey="tutorial.numbered_suits.note1">
                Each standard tile appears <Highlight>4 times</Highlight> in the
                game. This is important for planning your hand!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'numbered-suits',
        category: 'Tiles',
        title: t('codexReference.titleSuits'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.numbered_suits.p1">
                There are <Highlight>three numbered suits</Highlight>, each with
                tiles ranked 1-9:
              </Trans>
            </p>
            <div className="space-y-2">
              <p>
                <Trans i18nKey="tutorial.numbered_suits.p2">
                  <Highlight color="orange">
                    Characters (萬子 / Manzu)
                  </Highlight>{' '}
                  — Feature Chinese numerals with the character 萬 (wan, meaning
                  "ten thousand")
                </Trans>
              </p>
              <p>
                <Trans i18nKey="tutorial.numbered_suits.p3">
                  <Highlight color="orange">Circles (筒子 / Pinzu)</Highlight> —
                  Show circular patterns representing coins or dots
                </Trans>
              </p>
              <p>
                <Trans i18nKey="tutorial.numbered_suits.p4">
                  <Highlight color="orange">Bamboo (索子 / Souzu)</Highlight> —
                  Depict bamboo sticks (the 1 of Bamboo shows a bird instead)
                </Trans>
              </p>
            </div>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Manzu, rank: 1 },
          { suit: TileSuit.Manzu, rank: 5 },
          { suit: TileSuit.Manzu, rank: 9 },
          { suit: TileSuit.Pinzu, rank: 1 },
          { suit: TileSuit.Pinzu, rank: 5 },
          { suit: TileSuit.Pinzu, rank: 9 },
          { suit: TileSuit.Souzu, rank: 1 },
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 9 },
        ],
      },
      {
        id: 'terminals-simples',
        category: 'Tiles',
        title: t('codexReference.titleTerminals'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.terminals_simples.p1">
                Numbered tiles are divided into two important categories:
              </Trans>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-[var(--color-golden-yellow)]">
                <p className="font-bold text-[var(--color-golden-yellow)] mb-2">
                  {t('tutorial.points.terminals')}
                </p>
                <p className="text-sm">
                  <Trans
                    i18nKey="codexReference.terminalRanks"
                    components={{ strong: <Highlight>{null}</Highlight> }}
                  />
                </p>
                <p className="text-sm mt-1">
                  <Trans
                    i18nKey="codexReference.tileValue"
                    values={{ points: 10 }}
                    components={{
                      strong: <Highlight color="orange">{null}</Highlight>,
                    }}
                  />
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-[var(--color-metallic-gold)]">
                <p className="font-bold text-[var(--color-metallic-gold)] mb-2">
                  {t('tutorial.points.simples')}
                </p>
                <p className="text-sm">
                  <Trans
                    i18nKey="codexReference.simpleRanks"
                    components={{ strong: <Highlight>{null}</Highlight> }}
                  />
                </p>
                <p className="text-sm mt-1">
                  <Trans
                    i18nKey="codexReference.tileValue"
                    values={{ points: 5 }}
                    components={{
                      strong: <Highlight color="orange">{null}</Highlight>,
                    }}
                  />
                </p>
              </div>
            </div>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.wind_tiles.note1">
                Terminals are worth double the points of simples! Many yaku also
                specifically require or exclude terminals.
              </Trans>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Pinzu, rank: 1 },
          { suit: TileSuit.Pinzu, rank: 9 },
          { suit: TileSuit.Souzu, rank: 2 },
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 8 },
        ],
      },
      {
        id: 'wind-tiles',
        category: 'Tiles',
        title: t('codexReference.titleWinds'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.wind_tiles.p1">
                There are <Highlight>four Wind tiles</Highlight>, representing
                the cardinal directions:
              </Trans>
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(['east', 'south', 'west', 'north'] as const).map(
                (wind, index) => (
                  <div key={wind}>
                    <Highlight color="orange">
                      <TileLabel
                        suit={TileSuit.Wind}
                        rank={index + 1}
                        label={t(`tiles.${wind}`)}
                      />
                    </Highlight>
                  </div>
                )
              )}
            </div>
            <p>{t('codexReference.windOrder')}</p>
            <p>
              {t('codexReference.windPoints', {
                points: WIND_TILE_POINTS,
                groupPoints: WIND_GROUP_POINTS,
              })}
            </p>
            <InfoBox type="info">{t('codexReference.honorGroups')}</InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Wind, rank: 1 },
          { suit: TileSuit.Wind, rank: 2 },
          { suit: TileSuit.Wind, rank: 3 },
          { suit: TileSuit.Wind, rank: 4 },
        ],
      },
      {
        id: 'dragon-tiles',
        category: 'Tiles',
        title: t('codexReference.titleDragons'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.dragon_tiles.p1">
                There are <Highlight>three Dragon tiles</Highlight>:
              </Trans>
            </p>
            <div className="space-y-2">
              <p>
                <Trans i18nKey="tutorial.dragon_tiles.p2">
                  <Highlight color="orange">白 (White Dragon / Haku)</Highlight>{' '}
                  — A blank or framed tile, representing purity or emptiness
                </Trans>
              </p>
              <p>
                <Trans i18nKey="tutorial.dragon_tiles.p3">
                  <Highlight color="green">發 (Green Dragon / Hatsu)</Highlight>{' '}
                  — The character 發 in green, meaning "prosperity" or "to emit"
                </Trans>
              </p>
              <p>
                <Trans i18nKey="tutorial.dragon_tiles.p4">
                  <Highlight color="orange">中 (Red Dragon / Chun)</Highlight> —
                  The character 中 in red, meaning "center" or "middle"
                </Trans>
              </p>
            </div>
            <p>
              {t('codexReference.dragonPoints', {
                points: DRAGON_TILE_POINTS,
                mult: DRAGON_MULT,
                groupMult: DRAGON_GROUP_MULT,
              })}
            </p>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'bonus-tiles',
        category: 'Tiles',
        title: t('codexReference.titleBonus'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.bonus_tiles.p1">
                <Highlight>Bonus tiles</Highlight> are special tiles that don't
                form part of your hand:
              </Trans>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg">
                <p className="font-bold text-pink-400 mb-2">
                  <TileLabel
                    suit={TileSuit.Flower}
                    rank={1}
                    label={t('flora.flowers')}
                  />
                </p>
                <p className="text-sm">
                  {['plum', 'orchid', 'chrysanthemum', 'bamboo']
                    .map((flower) => t(`flora.${flower}`))
                    .join(' · ')}
                </p>
                <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
                  {t('codexReference.flowerDuration')}
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg">
                <p className="font-bold text-cyan-400 mb-2">
                  <TileLabel
                    suit={TileSuit.Season}
                    rank={3}
                    label={t('flora.seasons')}
                  />
                </p>
                <p className="text-sm">
                  {['spring', 'summer', 'autumn', 'winter']
                    .map((season) => t(`flora.${season}`))
                    .join(' · ')}
                </p>
                <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
                  {t('codexReference.seasonDuration')}
                </p>
              </div>
            </div>
            <InfoBox type="info">
              <Trans i18nKey="tutorial.sequences.note1">
                When you draw a bonus tile, it's immediately revealed and you
                draw a replacement tile. Flowers and Seasons provide scaling
                bonuses and effects!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'melds-overview',
        category: 'Hand Building',
        title: t('codexReference.titleMeldsOverview'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.melds_overview.p1">
                A <Highlight>meld</Highlight> (also called a "group" or "set")
                is a specific combination of tiles:
              </Trans>
            </p>
            <DataTable
              headers={[
                t('tutorial.groups.headerGroup'),
                t('tutorial.groups.headerMeaning'),
                t('tutorial.groups.headerBonus'),
              ]}
              rows={groupRows}
            />
            <p>
              <Trans i18nKey="tutorial.melds_overview.p2">
                Understanding melds is <Highlight>essential</Highlight> — your
                winning hand is made up of these building blocks!
              </Trans>
            </p>
          </div>
        ),
      },
      {
        id: 'sequences',
        category: 'Hand Building',
        title: t('codexReference.titleSequences'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.sequences.p1">
                A <Highlight>sequence</Highlight> is{' '}
                <Highlight color="orange">
                  3 consecutive tiles of the same suit
                </Highlight>
                .
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.sequences.p2">
                Examples of valid sequences:
              </Trans>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.triplets.li1">1-2-3 of Circles</Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.triplets.li2">
                  4-5-6 of Characters
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.triplets.li3">7-8-9 of Bamboo</Trans>
              </li>
            </ul>
            <InfoBox type="warning">
              <strong>{t('codexReference.importantRules')}</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>
                  <Trans i18nKey="tutorial.quads.li1">
                    Sequences must be in the <Highlight>same suit</Highlight>
                  </Trans>
                </li>
                <li>
                  <Trans i18nKey="tutorial.quads.li2">
                    They{' '}
                    <Highlight color="orange">cannot wrap around</Highlight> (no
                    9-1-2)
                  </Trans>
                </li>
                <li>
                  <Trans i18nKey="tutorial.quads.li3">
                    Honor tiles{' '}
                    <Highlight color="orange">cannot form sequences</Highlight>
                  </Trans>
                </li>
              </ul>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Pinzu, rank: 2 },
          { suit: TileSuit.Pinzu, rank: 3 },
          { suit: TileSuit.Pinzu, rank: 4 },
        ],
      },
      {
        id: 'triplets',
        category: 'Hand Building',
        title: t('codexReference.titleTriplets'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.triplets.p1">
                A <Highlight>triplet</Highlight> is{' '}
                <Highlight color="orange">3 identical tiles</Highlight>.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.triplets.p2">
                Examples of valid triplets:
              </Trans>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.pairs.li1">Three 5s of Bamboo</Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.pairs.li2">Three East Winds</Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.pairs.li3">Three Red Dragons</Trans>
              </li>
            </ul>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.winning_hand.note1">
                Triplets are worth <Highlight>+40 points</Highlight> — more than
                sequences (+30)! However, they're harder to complete since you
                need 3 of the same tile, and each tile only appears 4 times in
                the game.
              </Trans>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 5 },
          { suit: TileSuit.Souzu, rank: 5 },
        ],
      },
      {
        id: 'quads',
        category: 'Hand Building',
        title: t('codexReference.titleQuads'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.quads.p1">
                A <Highlight>quad</Highlight> (also called "kong" or "kan") is{' '}
                <Highlight color="orange">4 identical tiles</Highlight>.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.quads.p2">
                Quads are the rarest meld type since you need all 4 copies of a
                tile!
              </Trans>
            </p>
            <InfoBox type="info">
              <strong>{t('codexReference.quadMechanics')}</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>
                  {t('codexReference.quadBonus', {
                    points: STRUCTURE_POINTS_BY_TYPE[MeldType.Quad],
                    mult: GROUP_MULT.quad,
                  })}
                </li>
                <li>
                  <Trans i18nKey="tutorial.winning_hand.li2">
                    Counts as a single meld despite having 4 tiles
                  </Trans>
                </li>
                <li>{t('codexReference.quadRefill')}</li>
              </ul>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Manzu, rank: 7 },
          { suit: TileSuit.Manzu, rank: 7 },
          { suit: TileSuit.Manzu, rank: 7 },
          { suit: TileSuit.Manzu, rank: 7 },
        ],
      },
      {
        id: 'pairs',
        category: 'Hand Building',
        title: t('codexReference.titlePairs'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.pairs.p1">
                A <Highlight>pair</Highlight> is simply{' '}
                <Highlight color="orange">2 identical tiles</Highlight>.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.pairs.p2">
                Every standard winning hand requires{' '}
                <Highlight>exactly one pair</Highlight>. This is sometimes
                called the "head" (雀頭) of the hand.
              </Trans>
            </p>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.gameplay_overview.note1">
                The pair is worth <Highlight>+15 points</Highlight>. Any tile
                can form a pair — numbered tiles, winds, or dragons.
              </Trans>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 3 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
      {
        id: 'winning-hand',
        category: 'Hand Building',
        title: t('codexReference.titleWinningHand'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.winning_hand.p1">
                A standard winning hand consists of:
              </Trans>
            </p>
            <Formula>
              <Trans
                i18nKey="codexReference.winningFormula"
                components={{
                  melds: <Highlight>{null}</Highlight>,
                  pair: <Highlight color="orange">{null}</Highlight>,
                  tiles: <Highlight color="green">{null}</Highlight>,
                }}
              />
            </Formula>
            <p className="mt-3">{t('codexReference.winningExample')}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.gameplay_overview.li1">
                  1-2-3 Circles (sequence)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.gameplay_overview.li2">
                  5-5-5 Bamboo (triplet)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.gameplay_overview.li3">
                  6-7-8 Characters (sequence)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.gameplay_overview.li4">
                  East-East-East (triplet)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.gameplay_overview.li5">
                  Red Dragon pair
                </Trans>
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'special-hands',
        category: 'Hand Building',
        title: t('codexReference.titleSpecialHands'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.special_hands.p1">
                Two special hand structures don't follow the 4 melds + 1 pair
                rule:
              </Trans>
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-purple-400/50">
                <p className="font-bold text-purple-400">
                  {t('yaku.chiitoitsu')}
                </p>
                <p className="text-sm mt-1">
                  <Trans
                    i18nKey="codexReference.sevenPairs"
                    components={{ strong: <Highlight>{null}</Highlight> }}
                  />
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-red-400/50">
                <p className="font-bold text-red-400">
                  {t('yaku.kokushiMusou')}
                </p>
                <p className="text-sm mt-1">
                  <Trans
                    i18nKey="codexReference.thirteenOrphans"
                    components={{
                      strong: <Highlight color="orange">{null}</Highlight>,
                    }}
                  />
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'gameplay-overview',
        category: 'How to Play',
        title: t('tutorial.turns.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.turns.p1', { turns: TURNS_PER_ROUND })}</p>
            <ul className="space-y-2">
              <li>
                <Highlight color="orange">{t('gameplay.playHand')}</Highlight> —{' '}
                {t('tutorial.turns.play', { max: MAX_TACTICAL_PLAY_TILES })}
              </li>
              <li>
                <Highlight>{t('gameplay.redraw')}</Highlight> —{' '}
                {t('tutorial.turns.redraw')}
              </li>
            </ul>
            <p>{t('tutorial.turns.p2')}</p>
            <InfoBox type="warning">{t('tutorial.turns.warning')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'selecting',
        category: 'How to Play',
        title: t('tutorial.select.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.select.p1')}</p>
            <p>{t('tutorial.select.p2')}</p>
            <InfoBox type="tip">{t('tutorial.select.note')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'drawing',
        category: 'How to Play',
        title: t('tutorial.refill.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.refill.p1')}</p>
            <p>{t('codexReference.wallSize')}</p>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.base_points.note1">
                When you draw a <Highlight>bonus tile</Highlight> (Flower or
                Season), it's automatically revealed and you draw a replacement.
                This doesn't cost a turn!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'redraw',
        category: 'How to Play',
        title: t('tutorial.redraw.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.redraw.p1')}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>{t('tutorial.redraw.li1')}</li>
              <li>{t('tutorial.redraw.li2')}</li>
              <li>{t('tutorial.redraw.li3')}</li>
            </ul>
            <InfoBox type="tip">{t('tutorial.redraw.note')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'hands',
        category: 'How to Play',
        title: t('tutorial.hands.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.hands.p1', { max: MAX_TACTICAL_PLAY_TILES })}</p>
            <DataTable
              headers={[
                t('tutorial.hands.headerHand'),
                t('tutorial.hands.headerMeaning'),
              ]}
              rows={TAUGHT_PATTERNS.map((id) => [
                <Highlight color="orange">
                  {t(`patterns.${id}.name`)}
                </Highlight>,
                t(`patterns.${id}.explain`),
              ])}
            />
            <InfoBox type="info">
              {t('guide.patternRule')}{' '}
              {t('tutorial.hands.mahjong', { mult: MAHJONG_PATTERN_MULT })}
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'saving',
        category: 'How to Play',
        title: t('tutorial.saving.title'),
        content: (
          <div className="space-y-3">
            <p>
              {t('tutorial.saving.p1', {
                saveLeave: t('classicSave.saveLeave'),
                resume: t('classicSave.resume'),
              })}
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                {t('tutorial.saving.li1', {
                  saved: t('classicSave.saved'),
                  retry: t('classicSave.retry'),
                })}
              </li>
              <li>{t('tutorial.saving.li2')}</li>
              <li>{t('tutorial.saving.li3')}</li>
            </ul>
          </div>
        ),
      },
      {
        id: 'scoring-overview',
        category: 'Scoring',
        title: t('tutorial.score.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.score.p1')}</p>
            <Formula>
              {t('guide.points')} × {t('guide.mult')} = {t('guide.score')}
            </Formula>
            <p>{t('guide.scoreHelp')}</p>
            <InfoBox type="tip">{t('tutorial.score.note')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'base-points',
        category: 'Scoring',
        title: t('tutorial.points.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.points.p1')}</p>
            <DataTable
              headers={[
                t('tutorial.points.headerTile'),
                t('tutorial.points.headerPoints'),
              ]}
              rows={[
                [t('tutorial.points.simples'), <Highlight>5</Highlight>],
                [
                  t('tutorial.points.terminals'),
                  <Highlight color="orange">10</Highlight>,
                ],
                [
                  t('tiles.winds'),
                  <Highlight color="orange">
                    {t('tutorial.points.windValue', {
                      points: WIND_TILE_POINTS,
                      groupPoints: WIND_GROUP_POINTS,
                    })}
                  </Highlight>,
                ],
                [
                  t('tiles.dragons'),
                  <Highlight color="green">
                    {t('tutorial.points.dragonValue', {
                      points: DRAGON_TILE_POINTS,
                      mult: DRAGON_MULT,
                      groupMult: DRAGON_GROUP_MULT,
                    })}
                  </Highlight>,
                ],
              ]}
            />
            <InfoBox type="tip">{t('tutorial.points.note')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'structure-points',
        category: 'Scoring',
        title: t('tutorial.groups.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.groups.p1')}</p>
            <DataTable
              headers={[
                t('tutorial.groups.headerGroup'),
                t('tutorial.groups.headerMeaning'),
                t('tutorial.groups.headerBonus'),
              ]}
              rows={groupRows}
            />
            <p className="font-mono text-sm">
              {t('tutorial.groups.example', {
                pair: STRUCTURE_POINTS_BY_TYPE[MeldType.Pair],
                total: 2 * STRUCTURE_POINTS_BY_TYPE[MeldType.Pair],
              })}
            </p>
          </div>
        ),
      },
      {
        id: 'yaku-intro',
        category: 'Scoring',
        title: t('codexReference.titleYakuIntro'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.yaku_intro.p1">
                <Highlight>Yaku (役)</Highlight> are special patterns that{' '}
                <Highlight color="orange">multiply your score</Highlight>. This
                is where the big points come from!
              </Trans>
            </p>
            <p>{t('codexReference.yakuTiers', { count: ALL_YAKU.length })}</p>
            <DataTable
              headers={[
                t('codexReference.tier'),
                t('codexReference.multiplierRange'),
                t('codexReference.example'),
              ]}
              rows={[
                ['tanyao', 'pinfu'],
                ['toitoi', 'ittsu'],
                ['honitsu', 'chinitsu'],
                ['kokushiMusou', 'chuurenPoutou'],
              ].map((examples, index) => {
                const tier = index + 1
                const multipliers = ALL_YAKU.filter(
                  (yaku) => yaku.tier === tier
                ).map((yaku) => yaku.multiplier)
                return [
                  t(
                    tier === 4
                      ? 'codexReference.yakumanTier'
                      : 'codexReference.tierNumber',
                    { tier }
                  ),
                  `×${Math.min(...multipliers)} – ×${Math.max(...multipliers)}`,
                  examples.map((id) => t(`yaku.${id}`)).join(' · '),
                ]
              })}
            />
          </div>
        ),
      },
      {
        id: 'yaku-examples',
        category: 'Scoring',
        title: t('codexReference.titleYakuExamples'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.yaku_examples.p1">
                Here are some yaku you'll encounter often:
              </Trans>
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">{t('yaku.tanyao')}</Highlight> — ×
                {TANYAO.multiplier}
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  {t('codexReference.allSimples')}
                </p>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">{t('yaku.toitoi')}</Highlight> — ×
                {TOITOI.multiplier}
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  {t('codexReference.allTriplets')}
                </p>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">{t('yaku.chinitsu')}</Highlight> — ×
                {CHINITSU.multiplier}
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  {t('codexReference.fullFlush')}
                </p>
              </div>
            </div>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.decree_categories.note1">
                Yaku <Highlight>stack multiplicatively</Highlight>! A hand with
                ×1.3 and ×2.0 yaku gets ×2.6 total. Build combos for massive
                scores!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'acts-rounds',
        category: 'Progression',
        title: t('codexReference.titleActsRounds'),
        content: (
          <div className="space-y-3">
            <InfoBox type="tip">
              {t('runJourney.optional', { total: NORMAL_RUN_ACTS })}
            </InfoBox>
            <p>
              <Trans i18nKey="tutorial.acts_rounds.p1">
                Your run is divided into <Highlight>Acts</Highlight>, and each
                Act contains <Highlight color="orange">3 Rounds</Highlight>:
              </Trans>
            </p>
            <DataTable
              headers={[
                t('codexReference.roundType'),
                t('codexReference.japanese'),
                t('codexReference.targetMultiplier'),
              ]}
              rows={[
                [
                  <Highlight>{t('rounds.small')}</Highlight>,
                  t('rounds.smallJp'),
                  t('codexReference.baseTarget', {
                    mult: ROUND_TYPE_DEFINITIONS.Small.scoreMultiplier,
                  }),
                ],
                [
                  <Highlight>{t('rounds.large')}</Highlight>,
                  t('rounds.largeJp'),
                  `×${ROUND_TYPE_DEFINITIONS.Large.scoreMultiplier}`,
                ],
                [
                  <Highlight color="orange">{t('rounds.boss')}</Highlight>,
                  t('rounds.bossJp'),
                  `×${ROUND_TYPE_DEFINITIONS.Boss.scoreMultiplier}`,
                ],
              ]}
            />
            <p>
              <Trans i18nKey="tutorial.acts_rounds.p2">
                Score targets increase with each Act. Act 1 starts easy, but by
                the final Showdown you'll need powerful combos to survive!
              </Trans>
            </p>
          </div>
        ),
      },
      {
        id: 'boss-mandates',
        category: 'Progression',
        title: t('codexReference.titleBossMandates'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.boss_mandates.p1">
                Every <Highlight color="orange">Boss Round</Highlight> has a
                special <Highlight>Mandate</Highlight> — a restriction or
                challenge:
              </Trans>
            </p>
            <div className="space-y-2 text-sm">
              {['the_hook', 'the_wall', 'the_water'].map((id) => (
                <div
                  key={id}
                  className="p-2 bg-red-900/30 rounded border border-red-500/50"
                >
                  <strong>{t(`mandates.items.${id}.name`)}</strong> —{' '}
                  {t(`mandates.items.${id}.description`)}
                </div>
              ))}
            </div>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.decree_slots.note1">
                Some Decrees can help counter specific mandates. Plan your build
                accordingly!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'swift-clear',
        category: 'Progression',
        title: t('tutorial.swift.title'),
        content: (
          <div className="space-y-3">
            <p>{t('tutorial.swift.p1', { spare: SWIFT_CLEAR_SPARE_TURNS })}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>{t('tutorial.swift.li1')}</li>
              <li>{t('tutorial.swift.li2')}</li>
            </ul>
            <InfoBox type="info">{t('tutorial.swift.note')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'decrees-intro',
        category: 'Decrees',
        title: t('codexReference.titleDecreesIntro'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.decrees_intro.p1">
                <Highlight>Decrees (法令)</Highlight> are rule-modifying cards
                that persist throughout your run. Think of them as Tensho's
                equivalent of "Jokers" in Balatro.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.decrees_intro.p2">Decrees can:</Trans>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.decree_slots.li1">
                  <Highlight color="orange">Modify scoring</Highlight> — Add
                  multipliers or flat bonuses
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.decree_slots.li2">
                  <Highlight color="orange">Bend rules</Highlight> — Change what
                  makes a legal hand
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.decree_slots.li3">
                  <Highlight color="orange">Grant abilities</Highlight> — Extra
                  draws, redraws, or effects
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.flowers_system.li1">
                  <Highlight color="orange">Generate gold</Highlight> — Economy
                  boosters
                </Trans>
              </li>
            </ul>
            <InfoBox type="tip">{t('codexReference.decreeScrolls')}</InfoBox>
            <DecreeBuildGuide />
          </div>
        ),
      },
      {
        id: 'decree-categories',
        category: 'Decrees',
        title: t('codexReference.titleDecreeCategories'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.decree_categories.p1">
                Decrees are organized into <Highlight>5 categories</Highlight>:
              </Trans>
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  {t('codexReference.structural')}
                </Highlight>{' '}
                — {t('codexReference.structuralHelp')}
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  {t('codexReference.tileIdentity')}
                </Highlight>{' '}
                — {t('codexReference.tileIdentityHelp')}
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  {t('codexReference.yakuDoctrine')}
                </Highlight>{' '}
                — {t('codexReference.yakuDoctrineHelp')}
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  {t('codexReference.entropy')}
                </Highlight>{' '}
                — {t('codexReference.entropyHelp')}
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  {t('codexReference.scaling')}
                </Highlight>{' '}
                — {t('codexReference.scalingHelp')}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'decree-rarities',
        category: 'Decrees',
        title: t('codexReference.titleDecreeRarities'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.decree_rarities.p1">
                Decrees come in <Highlight>4 rarity tiers</Highlight>:
              </Trans>
            </p>
            <DataTable
              headers={[
                t('codexReference.rarity'),
                t('codexReference.name'),
                t('codexReference.powerLevel'),
              ]}
              rows={[
                [
                  <span className="text-gray-400">●</span>,
                  t('decrees.rarity.common'),
                  t('codexReference.localPower'),
                ],
                [
                  <span className="text-green-400">●</span>,
                  t('decrees.rarity.uncommon'),
                  t('codexReference.regionalPower'),
                ],
                [
                  <span className="text-blue-400">●</span>,
                  t('decrees.rarity.rare'),
                  t('codexReference.imperialPower'),
                ],
                [
                  <span className="text-purple-400">●</span>,
                  t('decrees.rarity.mythic'),
                  t('codexReference.heavenlyPower'),
                ],
              ]}
            />
            <InfoBox type="tip">{t('codexReference.raritySources')}</InfoBox>
          </div>
        ),
      },
      {
        id: 'decree-slots',
        category: 'Decrees',
        title: t('codexReference.titleDecreeSlots'),
        content: (
          <div className="space-y-3">
            <p>{t('codexReference.slotBaseline')}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.hierarchy.li1">
                  Collecting <Highlight>Flower sets</Highlight> (2+ flowers = +1
                  slot)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.hierarchy.li2">
                  Purchasing <Highlight>Imperial Charters</Highlight>
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.hierarchy.li3">
                  Certain <Highlight>Decree effects</Highlight>
                </Trans>
              </li>
            </ul>
            <InfoBox type="info">{t('codexEconomy.sale')}</InfoBox>
          </div>
        ),
      },
      ...FLORA_CODEX_SECTIONS.map(([id, titleKey, section]) => ({
        id,
        category: 'Flora',
        title: t(titleKey),
        content: <FloraCodex section={section} />,
      })),
      {
        id: 'hierarchy',
        category: 'Flora',
        title: t('codexReference.titleHierarchy'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.hierarchy.p1">
                When effects conflict, Tensho uses a{' '}
                <Highlight>hierarchy of authority</Highlight>:
              </Trans>
            </p>
            <div className="font-mono text-sm bg-[var(--color-forest-green)] p-3 rounded text-center">
              <div className="text-cyan-400">{t('codexReference.heaven')}</div>
              <div>↓</div>
              <div className="text-purple-400">{t('codexReference.court')}</div>
              <div>↓</div>
              <div className="text-pink-400">{t('codexReference.nature')}</div>
              <div>↓</div>
              <div className="text-yellow-400">{t('codexReference.table')}</div>
              <div>↓</div>
              <div className="text-gray-400">{t('codexReference.grammar')}</div>
            </div>
            <p className="text-sm">{t('codexReference.hierarchyOverride')}</p>
            <InfoBox type="info">{t('guide.specialHelp')}</InfoBox>
          </div>
        ),
      },
      ...ECONOMY_CODEX_SECTIONS.map(([id, titleKey, section]) => ({
        id,
        category: 'Economy',
        title: t(titleKey),
        content: <EconomyCodex section={section} />,
      })),
      {
        id: 'bigger-hand',
        category: 'Strategy',
        title: t('codexReference.titleBiggerHand'),
        content: (
          <div className="space-y-3">
            <p>{t('codexReference.biggerHandP1')}</p>
            <p>
              {t('codexReference.biggerHandRack', {
                circles: t('tiles.pinzu'),
                east: t('tiles.east'),
              })}
            </p>
            <TileGroups
              groups={[
                ...HAND_BUILDING_EXAMPLE.keep,
                ...HAND_BUILDING_EXAMPLE.exchange,
              ]}
            />
            <p>
              {t('codexReference.biggerHandComplete', {
                circles: t('tiles.pinzu'),
              })}
            </p>
            <TileGroups groups={HAND_BUILDING_EXAMPLE.complete} />
            <InfoBox type="warning">
              {t('codexReference.biggerHandWarning')}
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'tips',
        category: 'Strategy',
        title: t('codexReference.titleTips'),
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="target" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipScoreTitle')}
                  </p>
                  <p className="text-xs">
                    {t('codexReference.tipScore', {
                      max: MAX_TACTICAL_PLAY_TILES,
                    })}
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="puzzle" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipSynergyTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipSynergy')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="collection" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipPurposeTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipPurpose')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="coin" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipEconomyTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipEconomy')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="flower" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipFlowersTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipFlowers')}</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'more-tips',
        category: 'Strategy',
        title: t('codexReference.titleMoreTips'),
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="chart" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipYakuTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipYaku')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="scales" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipEfficiencyTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipEfficiency')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="dice" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipWallTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipWall')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="mask" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipMandateTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipMandate')}</p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>
                  <PavilionIcon name="archive" />
                </span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codexReference.tipLossTitle')}
                  </p>
                  <p className="text-xs">{t('codexReference.tipLoss')}</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'ready',
        category: 'Ready!',
        title: t('tutorial.ready.title'),
        content: (
          <div className="space-y-4 text-center">
            <p className="text-xl">
              <Trans
                i18nKey="codexReference.congratulations"
                components={{ strong: <Highlight>{null}</Highlight> }}
              />
            </p>
            <p>
              <Trans i18nKey="tutorial.ready.p1">
                Don't worry about memorizing everything — you'll learn by
                playing!
              </Trans>
            </p>
            <div className="py-4">
              <p className="text-[var(--color-metallic-gold)]">
                {t('codexReference.farewell')}
              </p>
            </div>
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.ready.note3">
                You can always return to this codex from the Settings menu if
                you need a refresher.
              </Trans>
            </InfoBox>
          </div>
        ),
        showTiles: [
          { suit: TileSuit.Dragon, rank: 1 },
          { suit: TileSuit.Dragon, rank: 2 },
          { suit: TileSuit.Dragon, rank: 3 },
        ],
      },
    ]
  }, [t])
}
