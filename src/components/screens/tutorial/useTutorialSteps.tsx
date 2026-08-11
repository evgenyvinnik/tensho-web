/**
 * useTutorialSteps Hook
 *
 * Generates all tutorial step content for the Tensho codex.
 * Content is organized into 11 categories covering game mechanics.
 */

import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TileSuit } from '../../../core/Tile'
import {
  TutorialStep,
  Highlight,
  InfoBox,
  Formula,
  DataTable,
  TileLabel,
} from './TutorialComponents'

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

  return useMemo(
    () => [
      {
        id: 'welcome',
        category: 'Introduction',
        title: t('tutorial.welcome.title', 'Welcome to Tensho!'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.welcome.p1">
                <Highlight>Tensho (天翔)</Highlight> means "Heavenly Ascent" in
                Japanese. This is a{' '}
                <Highlight color="orange">roguelike game</Highlight> built
                around the classic tile game of{' '}
                <Highlight>Riichi Mahjong</Highlight>.
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
        title: t('tutorial.concept.title', 'The Core Concept'),
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
        title: t('tutorial.tilesOverview.title', 'Understanding Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.tiles_overview.p1">
                The game uses <Highlight>144 tiles</Highlight> in total:
              </Trans>
            </p>
            <DataTable
              headers={['Category', 'Types', 'Count']}
              rows={[
                ['Numbered Suits', '3 suits × 9 ranks × 4 copies', '108'],
                ['Wind Tiles', '4 winds × 4 copies', '16'],
                ['Dragon Tiles', '3 dragons × 4 copies', '12'],
                ['Bonus Tiles', '4 flowers + 4 seasons', '8'],
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
        title: t('tutorial.suits.title', 'The Three Numbered Suits'),
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
        title: t('tutorial.terminals.title', 'Terminals vs Simples'),
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
                  Terminals (端牌)
                </p>
                <p className="text-sm">
                  Tiles ranked <Highlight>1 or 9</Highlight>
                </p>
                <p className="text-sm mt-1">
                  Worth <Highlight color="orange">10 points</Highlight> each
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-[var(--color-metallic-gold)]">
                <p className="font-bold text-[var(--color-metallic-gold)] mb-2">
                  Simples (中張牌)
                </p>
                <p className="text-sm">
                  Tiles ranked <Highlight>2 through 8</Highlight>
                </p>
                <p className="text-sm mt-1">
                  Worth <Highlight color="orange">5 points</Highlight> each
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
        title: t('tutorial.winds.title', 'Wind Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.wind_tiles.p1">
                There are <Highlight>four Wind tiles</Highlight>, representing
                the cardinal directions:
              </Trans>
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <Highlight color="orange">東 (East)</Highlight> — The most
                prestigious wind
              </div>
              <div>
                <Highlight color="orange">南 (South)</Highlight> — Second in
                order
              </div>
              <div>
                <Highlight color="orange">西 (West)</Highlight> — Third in order
              </div>
              <div>
                <Highlight color="orange">北 (North)</Highlight> — Fourth in
                order
              </div>
            </div>
            <p>
              <Trans i18nKey="tutorial.wind_tiles.p2">
                Wind tiles are <Highlight>Honor tiles</Highlight> and are worth{' '}
                <Highlight color="orange">15 points</Highlight> each — the
                highest base value!
              </Trans>
            </p>
            <InfoBox type="info">
              <Trans i18nKey="tutorial.dragon_tiles.note1">
                Winds cannot form sequences. They can only form triplets or
                pairs.
              </Trans>
            </InfoBox>
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
        title: t('tutorial.dragons.title', 'Dragon Tiles'),
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
              <Trans i18nKey="tutorial.dragon_tiles.p5">
                Like Winds, Dragons are <Highlight>Honor tiles</Highlight> worth{' '}
                <Highlight color="orange">15 points</Highlight> and cannot form
                sequences.
              </Trans>
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
        title: t('tutorial.bonus.title', 'Bonus Tiles: Flowers & Seasons'),
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
                  <TileLabel suit={TileSuit.Flower} rank={1} label="Flowers" />
                </p>
                <p className="text-sm">Plum, Orchid, Chrysanthemum, Bamboo</p>
                <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
                  Persist across your entire run
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg">
                <p className="font-bold text-cyan-400 mb-2">
                  <TileLabel suit={TileSuit.Season} rank={3} label="Seasons" />
                </p>
                <p className="text-sm">Spring, Summer, Autumn, Winter</p>
                <p className="text-xs text-[var(--color-metallic-gold)] mt-1">
                  Active only for the current round
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
        title: t('tutorial.meldsOverview.title', 'What is a Meld?'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.melds_overview.p1">
                A <Highlight>meld</Highlight> (also called a "group" or "set")
                is a specific combination of tiles:
              </Trans>
            </p>
            <DataTable
              headers={['Meld Type', 'Description', 'Points']}
              rows={[
                [
                  <Highlight color="orange">Sequence</Highlight>,
                  '3 consecutive tiles of same suit',
                  '+20',
                ],
                [
                  <Highlight color="orange">Triplet</Highlight>,
                  '3 identical tiles',
                  '+30',
                ],
                [
                  <Highlight color="orange">Quad</Highlight>,
                  '4 identical tiles',
                  '+50',
                ],
                [
                  <Highlight color="orange">Pair</Highlight>,
                  '2 identical tiles',
                  '+10',
                ],
              ]}
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
        title: t('tutorial.sequences.title', 'Sequences (順子 / Shuntsu)'),
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
              <strong>Important rules:</strong>
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
        title: t('tutorial.triplets.title', 'Triplets (刻子 / Koutsu)'),
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
                Triplets are worth <Highlight>+30 points</Highlight> — more than
                sequences (+20)! However, they're harder to complete since you
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
        title: t('tutorial.quads.title', 'Quads (槓子 / Kantsu)'),
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
              <strong>Quad mechanics:</strong>
              <ul className="list-disc list-inside mt-1 text-sm">
                <li>
                  <Trans i18nKey="tutorial.winning_hand.li1">
                    Worth <Highlight>+50 points</Highlight> — the most of any
                    meld
                  </Trans>
                </li>
                <li>
                  <Trans i18nKey="tutorial.winning_hand.li2">
                    Counts as a single meld despite having 4 tiles
                  </Trans>
                </li>
                <li>
                  <Trans i18nKey="tutorial.winning_hand.li3">
                    When declared, you draw a replacement tile
                  </Trans>
                </li>
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
        title: t('tutorial.pairs.title', 'Pairs (雀頭 / Jantou)'),
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
                The pair is worth <Highlight>+10 points</Highlight>. Any tile
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
        title: t('tutorial.winningHand.title', 'The Winning Hand Structure'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.winning_hand.p1">
                A standard winning hand consists of:
              </Trans>
            </p>
            <Formula>
              <Highlight>4 Melds</Highlight> +{' '}
              <Highlight color="orange">1 Pair</Highlight> ={' '}
              <Highlight color="green">14 Tiles</Highlight>
            </Formula>
            <p className="mt-3">
              The 4 melds can be any combination of sequences, triplets, or
              quads. Here's an example:
            </p>
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
        title: t('tutorial.specialHands.title', 'Special Winning Forms'),
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
                  Seven Pairs (七対子 / Chiitoitsu)
                </p>
                <p className="text-sm mt-1">
                  Exactly <Highlight>7 different pairs</Highlight>. No melds,
                  just pairs!
                </p>
              </div>
              <div className="p-3 bg-[var(--color-forest-green)] rounded-lg border border-red-400/50">
                <p className="font-bold text-red-400">
                  Thirteen Orphans (国士無双 / Kokushi)
                </p>
                <p className="text-sm mt-1">
                  One of each terminal and honor (13 unique tiles) plus one
                  duplicate. A legendary{' '}
                  <Highlight color="orange">Yakuman</Highlight>!
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'gameplay-overview',
        category: 'How to Play',
        title: t('tutorial.gameplayOverview.title', 'How a Round Works'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.gameplay_overview.p1">
                Each round follows a simple cycle:
              </Trans>
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <Trans i18nKey="tutorial.discarding.li1">
                  <Highlight>Start</Highlight> with 13 tiles in your hand
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.discarding.li2">
                  <Highlight color="orange">Draw</Highlight> a tile from the
                  wall
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.discarding.li3">
                  Check if you can <Highlight color="green">win</Highlight>{' '}
                  (valid hand + score target)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.discarding.li4">
                  If not, <Highlight>discard</Highlight> one tile you don't need
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.shanten.li1">
                  Repeat until you win or the wall is empty
                </Trans>
              </li>
            </ol>
            <InfoBox type="warning">
              <Trans i18nKey="tutorial.scoring_overview.note1">
                If the wall empties before you complete a winning hand, the
                round ends in <Highlight color="orange">failure</Highlight> and
                your run is over!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'drawing',
        category: 'How to Play',
        title: t('tutorial.drawing.title', 'Drawing Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.drawing.p1">
                At the start of your turn, you{' '}
                <Highlight>draw one tile</Highlight> from the wall. This gives
                you 14 tiles temporarily.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.drawing.p2">
                The <Highlight color="orange">wall</Highlight> starts with 70
                drawable tiles (after the dead wall is reserved). Watch the
                remaining tiles counter!
              </Trans>
            </p>
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
        id: 'discarding',
        category: 'How to Play',
        title: t('tutorial.discarding.title', 'Discarding Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.discarding.p1">
                After drawing (if you haven't won), you must{' '}
                <Highlight>discard one tile</Highlight> to return to 13 tiles.
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.discarding.p2">
                <Highlight color="orange">How to discard:</Highlight>
              </Trans>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.base_points.li1">
                  <strong>Tap/click</strong> a tile to select it
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.base_points.li2">
                  <strong>Drag upward</strong> to the discard zone
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.base_points.li3">
                  Discarded tiles go to the <Highlight>Dead Pool</Highlight>
                </Trans>
              </li>
            </ul>
            <InfoBox type="warning">
              <Trans i18nKey="tutorial.yaku_intro.note1">
                Discarded tiles are{' '}
                <Highlight color="orange">gone forever</Highlight> — you cannot
                retrieve them! Choose carefully which tiles to discard.
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'shanten',
        category: 'How to Play',
        title: t('tutorial.shanten.title', 'Understanding Shanten'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.shanten.p1">
                <Highlight>Shanten (向聴)</Highlight> is the number of tiles you
                need to change to complete a winning hand.
              </Trans>
            </p>
            <DataTable
              headers={['Shanten', 'Meaning']}
              rows={[
                [
                  <Highlight color="orange">3-shanten</Highlight>,
                  'Need 3 more useful tiles',
                ],
                [
                  <Highlight color="orange">2-shanten</Highlight>,
                  'Getting closer!',
                ],
                [
                  <Highlight color="orange">1-shanten</Highlight>,
                  'Almost there!',
                ],
                [
                  <Highlight color="green">Tenpai (0)</Highlight>,
                  'Ready to win! Just need the right tile',
                ],
              ]}
            />
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.yaku_examples.note1">
                The game shows your current shanten. Lower is better! Aim to
                reduce your shanten quickly each turn.
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'scoring-overview',
        category: 'Scoring',
        title: t('tutorial.scoringOverview.title', 'How Scoring Works'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.scoring_overview.p1">
                Your score is calculated using this formula:
              </Trans>
            </p>
            <Formula>Score = (Base Points + Bonuses) × Multipliers</Formula>
            <p className="mt-3">There are three components:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <Trans i18nKey="tutorial.yaku_intro.li1">
                  <Highlight>Base Points</Highlight> — From your tiles
                  themselves
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.yaku_intro.li2">
                  <Highlight color="orange">Structure Points</Highlight> — From
                  your melds and pair
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.yaku_intro.li3">
                  <Highlight color="green">Multipliers</Highlight> — From Yaku,
                  Decrees, and effects
                </Trans>
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: 'base-points',
        category: 'Scoring',
        title: t('tutorial.basePoints.title', 'Base Points from Tiles'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.base_points.p1">
                Every tile in your winning hand contributes{' '}
                <Highlight>base points</Highlight>:
              </Trans>
            </p>
            <DataTable
              headers={['Tile Type', 'Points Each']}
              rows={[
                [
                  'Terminals (1, 9)',
                  <Highlight color="orange">10 points</Highlight>,
                ],
                ['Simples (2-8)', <Highlight>5 points</Highlight>],
                [
                  'Honor tiles (Winds, Dragons)',
                  <Highlight color="orange">15 points</Highlight>,
                ],
              ]}
            />
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.boss_mandates.note1">
                Honor tiles give <Highlight>3× more points</Highlight> than
                simples! A hand full of honors will have a much higher base
                score.
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'structure-points',
        category: 'Scoring',
        title: t(
          'tutorial.structurePoints.title',
          'Structure Points from Melds'
        ),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.structure_points.p1">
                Your melds add <Highlight>structure points</Highlight> to your
                base:
              </Trans>
            </p>
            <DataTable
              headers={['Structure', 'Bonus Points']}
              rows={[
                ['Pair', <Highlight>+10</Highlight>],
                ['Sequence', <Highlight>+20</Highlight>],
                ['Triplet', <Highlight color="orange">+30</Highlight>],
                ['Quad', <Highlight color="orange">+50</Highlight>],
              ]}
            />
            <p>
              <Trans i18nKey="tutorial.structure_points.p2">
                <strong>Example:</strong> A hand with 2 sequences, 2 triplets,
                and a pair:
              </Trans>
            </p>
            <p className="font-mono text-sm">
              20 + 20 + 30 + 30 + 10 ={' '}
              <Highlight color="green">+110 structure points</Highlight>
            </p>
          </div>
        ),
      },
      {
        id: 'yaku-intro',
        category: 'Scoring',
        title: t('tutorial.yakuIntro.title', 'Yaku — The Scoring Multipliers'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.yaku_intro.p1">
                <Highlight>Yaku (役)</Highlight> are special patterns that{' '}
                <Highlight color="orange">multiply your score</Highlight>. This
                is where the big points come from!
              </Trans>
            </p>
            <p>
              <Trans i18nKey="tutorial.yaku_intro.p2">
                There are <Highlight>21 yaku</Highlight> in Tensho, organized
                into 4 tiers:
              </Trans>
            </p>
            <DataTable
              headers={['Tier', 'Multiplier Range', 'Example']}
              rows={[
                ['Tier 1', '×1.2 - ×1.3', 'All Simples, Pinfu'],
                ['Tier 2', '×1.6 - ×2.2', 'All Triplets, Pure Straight'],
                ['Tier 3', '×2.5 - ×3.2', 'Half Flush, Full Flush'],
                [
                  'Tier 4 (Yakuman)',
                  '×4.0 - ×5.5',
                  'Thirteen Orphans, Nine Gates',
                ],
              ]}
            />
          </div>
        ),
      },
      {
        id: 'yaku-examples',
        category: 'Scoring',
        title: t('tutorial.yakuExamples.title', 'Common Yaku Examples'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.yaku_examples.p1">
                Here are some yaku you'll encounter often:
              </Trans>
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  All Simples (断么九 / Tanyao)
                </Highlight>{' '}
                — ×1.3
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  Hand contains only tiles 2-8, no terminals or honors
                </p>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  All Triplets (対々和 / Toitoi)
                </Highlight>{' '}
                — ×2.0
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  All 4 melds are triplets (no sequences)
                </p>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">
                  Full Flush (清一色 / Chinitsu)
                </Highlight>{' '}
                — ×3.0
                <p className="text-xs text-[var(--color-metallic-gold)]">
                  Hand contains only one suit (no honors)
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
        title: t('tutorial.actsRounds.title', 'Acts and Rounds'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.acts_rounds.p1">
                Your run is divided into <Highlight>Acts</Highlight>, and each
                Act contains <Highlight color="orange">3 Rounds</Highlight>:
              </Trans>
            </p>
            <DataTable
              headers={['Round Type', 'Japanese', 'Score Multiplier']}
              rows={[
                [
                  <Highlight>Small Round</Highlight>,
                  '小局',
                  '×1.0 (base target)',
                ],
                [<Highlight>Large Round</Highlight>, '大局', '×1.5'],
                [
                  <Highlight color="orange">Boss Round</Highlight>,
                  '親局',
                  '×2.0',
                ],
              ]}
            />
            <p>
              <Trans i18nKey="tutorial.acts_rounds.p2">
                Score targets increase with each Act. Act 1 starts easy, but by
                Act 8 you'll need powerful combos to survive!
              </Trans>
            </p>
          </div>
        ),
      },
      {
        id: 'boss-mandates',
        category: 'Progression',
        title: t('tutorial.bossMandates.title', 'Boss Mandates'),
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
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <strong>The Hook (鉤)</strong> — 2 random tiles discarded after
                each draw
              </div>
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <strong>The Wall (壁)</strong> — Score requirement is ×4 instead
                of ×2
              </div>
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <strong>The Water (水)</strong> — Start with 0 redraws this
                round
              </div>
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
        id: 'skipping',
        category: 'Progression',
        title: t('tutorial.skipping.title', 'Skipping Rounds'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.skipping.p1">
                You can <Highlight>skip</Highlight> the Small Round or Large
                Round before facing the Boss. Why would you do this?
              </Trans>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-2 bg-green-900/30 rounded border border-green-500/50">
                <p className="font-bold text-green-400">Benefits</p>
                <ul className="text-xs list-disc list-inside mt-1">
                  <li>
                    <Trans i18nKey="tutorial.decree_rarities.li1">
                      Receive an Omen Tag
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="tutorial.decree_rarities.li2">
                      Save Decrees with timers
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="tutorial.decree_rarities.li3">
                      Avoid unfavorable walls
                    </Trans>
                  </li>
                </ul>
              </div>
              <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
                <p className="font-bold text-red-400">Costs</p>
                <ul className="text-xs list-disc list-inside mt-1">
                  <li>
                    <Trans i18nKey="tutorial.decree_rarities.li4">
                      No shop access
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="tutorial.decree_rarities.li5">
                      No gold earned
                    </Trans>
                  </li>
                  <li>
                    <Trans i18nKey="tutorial.decree_rarities.li6">
                      No interest growth
                    </Trans>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'decrees-intro',
        category: 'Decrees',
        title: t('tutorial.decreesIntro.title', 'What are Decrees?'),
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
          </div>
        ),
      },
      {
        id: 'decree-categories',
        category: 'Decrees',
        title: t('tutorial.decreeCategories.title', 'Decree Categories'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.decree_categories.p1">
                Decrees are organized into <Highlight>5 categories</Highlight>:
              </Trans>
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Structural (形法令)</Highlight> —
                Alter what makes a legal hand
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Tile Identity (变牌法令)</Highlight> —
                Change how tiles are classified
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Yaku Doctrine (役变法令)</Highlight> —
                Modify yaku rules
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Entropy & Fate (天运法令)</Highlight>{' '}
                — Alter draws and tempo
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded">
                <Highlight color="orange">Scaling (修行法令)</Highlight> —
                Reward specific playstyles
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'decree-rarities',
        category: 'Decrees',
        title: t('tutorial.decreeRarities.title', 'Decree Rarities'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.decree_rarities.p1">
                Decrees come in <Highlight>4 rarity tiers</Highlight>:
              </Trans>
            </p>
            <DataTable
              headers={['Rarity', 'Name', 'Power Level']}
              rows={[
                [
                  <span className="text-gray-400">●</span>,
                  'Local Edict',
                  'Small bonuses',
                ],
                [
                  <span className="text-green-400">●</span>,
                  'Regional Mandate',
                  'Moderate effects',
                ],
                [
                  <span className="text-blue-400">●</span>,
                  'Imperial Decree',
                  'Strong rule-bending',
                ],
                [
                  <span className="text-purple-400">●</span>,
                  'Heavenly Ordinance',
                  'Run-defining power',
                ],
              ]}
            />
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.interest.note1">
                Higher rarity decrees are more expensive and rarer in the shop.
                Build synergies between multiple common decrees for powerful
                combos!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'decree-slots',
        category: 'Decrees',
        title: t('tutorial.decreeSlots.title', 'Managing Decree Slots'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.decree_slots.p1">
                You have a limited number of <Highlight>Decree Slots</Highlight>
                . You start with <Highlight color="orange">5 slots</Highlight>{' '}
                and can earn more through:
              </Trans>
            </p>
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
            <InfoBox type="info">
              <Trans i18nKey="tutorial.tips.note1">
                You can <Highlight color="orange">sell</Highlight> Decrees for
                gold. This frees up a slot and gives you half the purchase price
                back.
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'flowers-system',
        category: 'Flora',
        title: t('tutorial.flowersSystem.title', 'The Flower System'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.flowers_system.p1">
                <Highlight>Flowers</Highlight> provide{' '}
                <Highlight color="orange">permanent bonuses</Highlight> that
                last your entire run:
              </Trans>
            </p>
            <DataTable
              headers={['Flower', 'Japanese', 'Effect']}
              rows={[
                [
                  <TileLabel
                    suit={TileSuit.Flower}
                    rank={1}
                    label="Plum"
                    className="text-pink-400"
                  />,
                  '梅',
                  '+5% score per sequence',
                ],
                [
                  <TileLabel
                    suit={TileSuit.Flower}
                    rank={2}
                    label="Orchid"
                    className="text-purple-400"
                  />,
                  '兰',
                  '+5% score per honor tile',
                ],
                [
                  <TileLabel
                    suit={TileSuit.Flower}
                    rank={3}
                    label="Chrysanthemum"
                    className="text-yellow-400"
                  />,
                  '菊',
                  '+5% score per concealed meld',
                ],
                [
                  <TileLabel
                    suit={TileSuit.Flower}
                    rank={4}
                    label="Bamboo"
                    className="text-green-400"
                  />,
                  '竹',
                  '+5% score per terminal',
                ],
              ]}
            />
            <p>
              <Trans i18nKey="tutorial.flowers_system.p2">
                Collecting multiple flowers unlocks{' '}
                <Highlight>set bonuses</Highlight>: 2 flowers = +1 decree slot,
                4 flowers = double flower effectiveness!
              </Trans>
            </p>
          </div>
        ),
      },
      {
        id: 'seasons-system',
        category: 'Flora',
        title: t('tutorial.seasonsSystem.title', 'The Season System'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.seasons_system.p1">
                <Highlight>Seasons</Highlight> are{' '}
                <Highlight color="orange">temporary modifiers</Highlight> that
                last only for the current round:
              </Trans>
            </p>
            <DataTable
              headers={['Season', 'Japanese', 'Effect']}
              rows={[
                [
                  <TileLabel
                    suit={TileSuit.Season}
                    rank={1}
                    label="Spring"
                    className="text-green-300"
                  />,
                  '春',
                  '+2 draws per hand',
                ],
                [
                  <TileLabel
                    suit={TileSuit.Season}
                    rank={2}
                    label="Summer"
                    className="text-yellow-300"
                  />,
                  '夏',
                  '+30% base score, -20% wall size',
                ],
                [
                  <TileLabel
                    suit={TileSuit.Season}
                    rank={3}
                    label="Autumn"
                    className="text-orange-300"
                  />,
                  '秋',
                  '+20% yaku multipliers',
                ],
                [
                  <TileLabel
                    suit={TileSuit.Season}
                    rank={4}
                    label="Winter"
                    className="text-blue-300"
                  />,
                  '冬',
                  'Looser hand rules, -25% score',
                ],
              ]}
            />
            <InfoBox type="warning">
              <Trans i18nKey="tutorial.more_tips.note1">
                From Act 2 onward,{' '}
                <Highlight color="orange">Corrupted Seasons</Highlight> can
                appear with negative effects!
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'hierarchy',
        category: 'Flora',
        title: t('tutorial.hierarchy.title', 'The Five-Layer Hierarchy'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.hierarchy.p1">
                When effects conflict, Tensho uses a{' '}
                <Highlight>hierarchy of authority</Highlight>:
              </Trans>
            </p>
            <div className="font-mono text-sm bg-[var(--color-forest-green)] p-3 rounded text-center">
              <div className="text-cyan-400">Heaven (Seasons)</div>
              <div>↓</div>
              <div className="text-purple-400">Court (Decrees)</div>
              <div>↓</div>
              <div className="text-pink-400">Nature (Flowers)</div>
              <div>↓</div>
              <div className="text-yellow-400">Table (Tiles)</div>
              <div>↓</div>
              <div className="text-gray-400">Grammar (Yaku)</div>
            </div>
            <p className="text-sm">
              Higher layers <Highlight>override</Highlight> lower layers.
            </p>
          </div>
        ),
      },
      {
        id: 'tea-house',
        category: 'Economy',
        title: t('tutorial.teaHouse.title', 'The Tea House (Shop)'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.tea_house.p1">
                After each round, you visit the{' '}
                <Highlight>Tea House (茶寮)</Highlight> to spend your gold:
              </Trans>
            </p>
            <DataTable
              headers={['Item', 'Typical Cost']}
              rows={[
                ['Decrees', '1-10 gold (by rarity)'],
                ['Fate Seals', '3 gold'],
                ['Celestial Orbs', '3 gold'],
                ['Blessing Packs', '4-8 gold'],
                ['Imperial Charters', '10 gold'],
              ]}
            />
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.ready.note1">
                You can <Highlight color="orange">reroll</Highlight> the shop
                offerings for 5 gold. Each reroll costs +1 more.
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gold-economy',
        category: 'Economy',
        title: t('tutorial.goldEconomy.title', 'Earning Gold'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.gold_economy.p1">
                You earn <Highlight>gold</Highlight> in several ways:
              </Trans>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <Trans i18nKey="tutorial.more_tips.li1">
                  <Highlight color="orange">Winning rounds</Highlight> — Base
                  payout scales with score
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.more_tips.li2">
                  <Highlight color="orange">Interest</Highlight> — 1 gold per 5
                  gold saved (max 5/round)
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.more_tips.li3">
                  <Highlight color="orange">Selling Decrees</Highlight> — Get
                  half the purchase price
                </Trans>
              </li>
              <li>
                <Trans i18nKey="tutorial.more_tips.li4">
                  <Highlight color="orange">Decree effects</Highlight> — Some
                  generate gold
                </Trans>
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'interest',
        category: 'Economy',
        title: t('tutorial.interest.title', 'The Interest System'),
        content: (
          <div className="space-y-3">
            <p>
              <Trans i18nKey="tutorial.interest.p1">
                At the end of each round, you earn{' '}
                <Highlight>interest</Highlight> on saved gold:
              </Trans>
            </p>
            <Formula>+1 gold per 5 gold held (max +5)</Formula>
            <DataTable
              headers={['Gold Held', 'Interest Earned']}
              rows={[
                ['0-4', '+0'],
                ['5-9', '+1'],
                ['10-14', '+2'],
                ['15-19', '+3'],
                ['20-24', '+4'],
                ['25+', '+5 (max)'],
              ]}
            />
            <InfoBox type="tip">
              <Trans i18nKey="tutorial.ready.note2">
                Holding <Highlight>25+ gold</Highlight> maximizes interest! But
                spending on good decrees is usually worth more.
              </Trans>
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'tips',
        category: 'Strategy',
        title: t('tutorial.tips.title', 'Tips for Success'),
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🎯</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Focus on shanten
                  </p>
                  <p className="text-xs">
                    Reduce shanten quickly. Don't hold onto tiles hoping for
                    perfect hands.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🧩</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Build synergies
                  </p>
                  <p className="text-xs">
                    Decrees that work together are stronger than powerful
                    standalone decrees.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>💰</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Balance economy
                  </p>
                  <p className="text-xs">
                    Save for interest early, but invest in strong decrees before
                    Act 4.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🌸</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Collect flowers
                  </p>
                  <p className="text-xs">
                    Flower bonuses compound. Getting all 4 is extremely
                    powerful.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'more-tips',
        category: 'Strategy',
        title: t('tutorial.moreTips.title', 'Advanced Tips'),
        content: (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>📊</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Plan for yaku
                  </p>
                  <p className="text-xs">
                    Know which yaku you're aiming for before the round starts.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>⚖️</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Tile efficiency
                  </p>
                  <p className="text-xs">
                    Keep tiles that can complete multiple melds. Isolated
                    terminals are often safe to discard.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🎲</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Count remaining tiles
                  </p>
                  <p className="text-xs">
                    If 3 of a tile are in the dead pool, the 4th is rare.
                  </p>
                </div>
              </div>
              <div className="p-2 bg-[var(--color-forest-green)] rounded flex items-start gap-2">
                <span>🎭</span>
                <div>
                  <p className="font-bold text-[var(--color-golden-yellow)]">
                    Read mandates early
                  </p>
                  <p className="text-xs">
                    Check the Boss Mandate before entering an Act.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'ready',
        category: 'Ready!',
        title: t('tutorial.ready.title', "You're Ready to Play!"),
        content: (
          <div className="space-y-4 text-center">
            <p className="text-xl">
              <Highlight>Congratulations!</Highlight> You now understand the
              fundamentals of Tensho.
            </p>
            <p>
              <Trans i18nKey="tutorial.ready.p1">
                Don't worry about memorizing everything — you'll learn by
                playing!
              </Trans>
            </p>
            <div className="py-4">
              <p className="text-[var(--color-metallic-gold)]">
                May the tiles favor you on your heavenly ascent!
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
    ],
    [t]
  )
}
