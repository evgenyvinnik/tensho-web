/**
 * useCodexContent Hook
 *
 * Generates all codex encyclopedia content for Tensho.
 */

import { useTranslation } from 'react-i18next'
import { TileSuit } from '../../../core/Tile'
import { CodexCategory, TileGroup, InfoBox, DataTable } from './CodexComponents'

/**
 * Build codex categories and content
 */
export function useCodexContent(): CodexCategory[] {
  const { t } = useTranslation()

  const categories: CodexCategory[] = [
    {
      id: 'overview',
      title: t('codex.overview.title', 'Game Overview'),
      icon: '📖',
      sections: [
        {
          id: 'what-is-tensho',
          title: t('codex.overview.whatIs.title', 'What is Tensho?'),
          content: (
            <div className="space-y-4">
              <p>
                {t(
                  'codex.overview.whatIs.p1',
                  'Tensho (天翔 "Heavenly Ascent") is a single-player roguelike that reinterprets Riichi Mahjong as a scoring-driven optimization game, inspired by games like Balatro.'
                )}
              </p>
              <p>
                {t(
                  'codex.overview.whatIs.p2',
                  'Instead of competing against other players, you face escalating score targets across a series of Acts. Build powerful combinations of Yaku (scoring patterns) and Decrees (rule modifiers) to achieve massive scores.'
                )}
              </p>
              <InfoBox title={t('codex.overview.whatIs.coreLoop', 'Core Loop')} variant="tip">
                {t(
                  'codex.overview.whatIs.coreLoopText',
                  'Draw tiles → Build winning hands → Score points → Buy upgrades → Repeat with higher targets'
                )}
              </InfoBox>
            </div>
          ),
        },
        {
          id: 'five-layers',
          title: t('codex.overview.layers.title', 'Five-Layer Authority System'),
          content: (
            <div className="space-y-4">
              <p>
                {t(
                  'codex.overview.layers.intro',
                  'Tensho is built on five internally consistent layers that govern how effects interact:'
                )}
              </p>
              <DataTable
                headers={[
                  t('codex.layer', 'Layer'),
                  t('codex.system', 'System'),
                  t('codex.role', 'Role'),
                  t('codex.scope', 'Scope'),
                ]}
                rows={[
                  [
                    t('codex.heaven', 'HEAVEN (天)'),
                    t('codex.seasons', 'Seasons'),
                    t('codex.time', 'Temporal effects'),
                    t('codex.round', 'Round'),
                  ],
                  [
                    t('codex.court', 'COURT (廷)'),
                    t('codex.decrees', 'Decrees'),
                    t('codex.law', 'Rule modifications'),
                    t('codex.runWide', 'Run-wide'),
                  ],
                  [
                    t('codex.nature', 'NATURE (自然)'),
                    t('codex.flowers', 'Flowers'),
                    t('codex.growth', 'Passive scaling'),
                    t('codex.runWide', 'Run-wide'),
                  ],
                  [
                    t('codex.table', 'TABLE (卓)'),
                    t('codex.tiles', 'Tiles'),
                    t('codex.material', 'Physical components'),
                    t('codex.hand', 'Hand'),
                  ],
                  [
                    t('codex.grammar', 'GRAMMAR (文法)'),
                    t('codex.yaku', 'Yaku'),
                    t('codex.language', 'Scoring patterns'),
                    t('codex.hand', 'Hand'),
                  ],
                ]}
              />
              <InfoBox variant="info">
                {t(
                  'codex.overview.layers.conflict',
                  'Higher layers override lower layers when effects conflict. Seasons can temporarily override Decrees, which can modify how Flowers, Tiles, and Yaku work.'
                )}
              </InfoBox>
            </div>
          ),
        },
      ],
    },
    {
      id: 'progression',
      title: t('codex.progression.title', 'Runs & Progression'),
      icon: '🎯',
      sections: [
        {
          id: 'runs',
          title: t('codex.progression.runs.title', 'Runs & Sessions'),
          content: (
            <div className="space-y-4">
              <p>
                {t(
                  'codex.progression.runs.p1',
                  'Each game is a "run" - a single session where you progress through increasingly difficult Acts. Your goal is to complete all 8 Acts to win.'
                )}
              </p>
              <p>
                {t(
                  'codex.progression.runs.p2',
                  'If you fail to reach a score target in any round, your run ends immediately. You keep meta-progression unlocks but lose all Decrees, Gold, and progress.'
                )}
              </p>
              <InfoBox title={t('codex.progression.runs.roguelike', 'Roguelike Philosophy')} variant="tip">
                {t(
                  'codex.progression.runs.roguelikeText',
                  'Each run is unique. Random tile draws, shop offerings, and Mandate combinations create different challenges. Adapt your strategy to what you find!'
                )}
              </InfoBox>
            </div>
          ),
        },
        {
          id: 'acts',
          title: t('codex.progression.acts.title', 'Acts & Score Targets'),
          content: (
            <div className="space-y-4">
              <p>
                {t('codex.progression.acts.p1', 'The game is divided into 8 Acts, each with escalating score requirements:')}
              </p>
              <DataTable
                headers={[t('codex.act', 'Act'), t('codex.baseTarget', 'Base Target'), t('codex.notes', 'Notes')]}
                rows={[
                  ['1', '300', t('codex.progression.acts.intro', 'Introduction')],
                  ['2', '800', ''],
                  ['3', '2,000', ''],
                  ['4', '5,000', t('codex.progression.acts.midGame', 'Mid-game')],
                  ['5', '11,000', ''],
                  ['6', '20,000', ''],
                  ['7', '35,000', t('codex.progression.acts.lateGame', 'Late-game')],
                  ['8', '50,000', t('codex.progression.acts.showdown', 'Showdown')],
                ]}
              />
              <p>
                {t(
                  'codex.progression.acts.endless',
                  'After completing Act 8, you enter Endless Mode with rapidly scaling targets. How far can you go?'
                )}
              </p>
            </div>
          ),
        },
        {
          id: 'rounds',
          title: t('codex.progression.rounds.title', 'Round Types'),
          content: (
            <div className="space-y-4">
              <p>
                {t('codex.progression.rounds.p1', 'Each Act contains 3 rounds with different score multipliers:')}
              </p>
              <DataTable
                headers={[t('codex.roundType', 'Round'), t('codex.multiplier', 'Multiplier'), t('codex.special', 'Special')]}
                rows={[
                  [t('codex.small', 'Small (小局)'), '1.0×', t('codex.progression.rounds.canSkip', 'Can skip for Omen')],
                  [t('codex.large', 'Large (大局)'), '1.5×', t('codex.progression.rounds.canSkip', 'Can skip for Omen')],
                  [t('codex.boss', 'Boss (親局)'), '2.0×', t('codex.progression.rounds.mandate', 'Has Boss Mandate')],
                ]}
              />
              <InfoBox title={t('codex.progression.rounds.mandates', 'Boss Mandates')} variant="warning">
                {t(
                  'codex.progression.rounds.mandatesText',
                  'Boss rounds impose special restrictions called Mandates. Examples: "All simples debuffed", "No sequences allowed", "Reduced draws". Plan accordingly!'
                )}
              </InfoBox>
            </div>
          ),
        },
        {
          id: 'teahouse',
          title: t('codex.progression.teahouse.title', 'The Tea House (Shop)'),
          content: (
            <div className="space-y-4">
              <p>
                {t('codex.progression.teahouse.p1', 'After each round, visit the Tea House to spend Gold on upgrades:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>{t('codex.decrees', 'Decrees')}</strong> -{' '}
                  {t('codex.progression.teahouse.decrees', 'Persistent rule modifiers (1-10 Gold)')}
                </li>
                <li>
                  <strong>{t('codex.fateSeals', 'Fate Seals')}</strong> -{' '}
                  {t('codex.progression.teahouse.seals', 'One-time effects (3 Gold)')}
                </li>
                <li>
                  <strong>{t('codex.celestialOrbs', 'Celestial Orbs')}</strong> -{' '}
                  {t('codex.progression.teahouse.orbs', 'Permanent Yaku upgrades (3 Gold)')}
                </li>
                <li>
                  <strong>{t('codex.blessingPacks', 'Blessing Packs')}</strong> -{' '}
                  {t('codex.progression.teahouse.packs', 'Random item bundles (4-8 Gold)')}
                </li>
                <li>
                  <strong>{t('codex.imperialCharters', 'Imperial Charters')}</strong> -{' '}
                  {t('codex.progression.teahouse.charters', 'Permanent upgrades after Boss rounds (10 Gold)')}
                </li>
              </ul>
              <InfoBox title={t('codex.progression.teahouse.interest', 'Interest')} variant="tip">
                {t(
                  'codex.progression.teahouse.interestText',
                  'You earn 1 Gold interest per 5 Gold held, up to 5 Gold per round. Saving to 25 Gold maximizes interest income!'
                )}
              </InfoBox>
            </div>
          ),
        },
      ],
    },
    {
      id: 'tiles',
      title: t('codex.tiles.title', 'Tiles'),
      icon: '🀄',
      sections: [
        {
          id: 'suits',
          title: t('codex.tiles.suits.title', 'Suited Tiles'),
          content: (
            <div className="space-y-4">
              <p>
                {t(
                  'codex.tiles.suits.p1',
                  'There are three suits, each numbered 1-9 with 4 copies of each tile (108 suited tiles total):'
                )}
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.tiles.suits.manzu', 'Characters (萬子 Manzu)')}
                  </h4>
                  <TileGroup
                    tiles={[
                      { suit: TileSuit.Manzu, rank: 1 },
                      { suit: TileSuit.Manzu, rank: 2 },
                      { suit: TileSuit.Manzu, rank: 3 },
                      { suit: TileSuit.Manzu, rank: 4 },
                      { suit: TileSuit.Manzu, rank: 5 },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.tiles.suits.pinzu', 'Circles (筒子 Pinzu)')}
                  </h4>
                  <TileGroup
                    tiles={[
                      { suit: TileSuit.Pinzu, rank: 1 },
                      { suit: TileSuit.Pinzu, rank: 2 },
                      { suit: TileSuit.Pinzu, rank: 3 },
                      { suit: TileSuit.Pinzu, rank: 4 },
                      { suit: TileSuit.Pinzu, rank: 5 },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.tiles.suits.souzu', 'Bamboo (索子 Souzu)')}
                  </h4>
                  <TileGroup
                    tiles={[
                      { suit: TileSuit.Souzu, rank: 1 },
                      { suit: TileSuit.Souzu, rank: 2 },
                      { suit: TileSuit.Souzu, rank: 3 },
                      { suit: TileSuit.Souzu, rank: 4 },
                      { suit: TileSuit.Souzu, rank: 5 },
                    ]}
                    size="sm"
                  />
                </div>
              </div>
              <InfoBox variant="info">
                {t(
                  'codex.tiles.suits.terminals',
                  'Tiles ranked 1 and 9 are called "Terminals" and are worth more base points (10 vs 5). Tiles 2-8 are called "Simples".'
                )}
              </InfoBox>
            </div>
          ),
        },
        {
          id: 'honors',
          title: t('codex.tiles.honors.title', 'Honor Tiles'),
          content: (
            <div className="space-y-4">
              <p>{t('codex.tiles.honors.p1', 'Honor tiles cannot form sequences - only triplets and pairs:')}</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.tiles.honors.winds', 'Winds (風牌)')}
                  </h4>
                  <p className="text-sm mb-2">
                    {t('codex.tiles.honors.windsDesc', 'East, South, West, North - 4 copies each (16 total)')}
                  </p>
                  <TileGroup
                    tiles={[
                      { suit: TileSuit.Wind, rank: 1 },
                      { suit: TileSuit.Wind, rank: 2 },
                      { suit: TileSuit.Wind, rank: 3 },
                      { suit: TileSuit.Wind, rank: 4 },
                    ]}
                    size="sm"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.tiles.honors.dragons', 'Dragons (三元牌)')}
                  </h4>
                  <p className="text-sm mb-2">
                    {t('codex.tiles.honors.dragonsDesc', 'White, Green, Red - 4 copies each (12 total)')}
                  </p>
                  <TileGroup
                    tiles={[
                      { suit: TileSuit.Dragon, rank: 1 },
                      { suit: TileSuit.Dragon, rank: 2 },
                      { suit: TileSuit.Dragon, rank: 3 },
                    ]}
                    size="sm"
                  />
                </div>
              </div>
              <InfoBox variant="tip">
                {t('codex.tiles.honors.value', 'Honor tiles are worth 15 base points each - the highest of any tile type!')}
              </InfoBox>
            </div>
          ),
        },
        {
          id: 'bonus',
          title: t('codex.tiles.bonus.title', 'Bonus Tiles'),
          content: (
            <div className="space-y-4">
              <p>
                {t('codex.tiles.bonus.p1', 'The wall contains 8 bonus tiles that trigger special effects when drawn:')}
              </p>
              <DataTable
                headers={[t('codex.type', 'Type'), t('codex.tiles', 'Tiles'), t('codex.scope', 'Scope'), t('codex.effect', 'Effect')]}
                rows={[
                  [
                    t('codex.flowers', 'Flowers'),
                    t('codex.tiles.bonus.flowerNames', 'Plum, Orchid, Chrysanthemum, Bamboo'),
                    t('codex.runWide', 'Run-wide'),
                    t('codex.tiles.bonus.flowerEffect', 'Persistent scaling bonuses'),
                  ],
                  [
                    t('codex.seasons', 'Seasons'),
                    t('codex.tiles.bonus.seasonNames', 'Spring, Summer, Autumn, Winter'),
                    t('codex.round', 'Round'),
                    t('codex.tiles.bonus.seasonEffect', 'Temporary rule modifications'),
                  ],
                ]}
              />
              <InfoBox variant="info">
                {t(
                  'codex.tiles.bonus.draw',
                  "When you draw a bonus tile, it's immediately revealed, added to your Flora Track, and you draw a replacement tile."
                )}
              </InfoBox>
            </div>
          ),
        },
      ],
    },
    {
      id: 'hands',
      title: t('codex.hands.title', 'Hands & Yaku'),
      icon: '✋',
      sections: [
        {
          id: 'winning',
          title: t('codex.hands.winning.title', 'Winning Hands'),
          content: (
            <div className="space-y-4">
              <p>{t('codex.hands.winning.p1', 'A standard winning hand consists of:')}</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>4 {t('codex.groups', 'Groups')}</strong> -{' '}
                  {t('codex.hands.winning.groups', 'Sequences or Triplets')}
                </li>
                <li>
                  <strong>1 {t('codex.pair', 'Pair')}</strong> -{' '}
                  {t('codex.hands.winning.pair', 'Two identical tiles')}
                </li>
              </ul>
              <div className="mt-4">
                <p className="font-bold text-[var(--color-golden-yellow)] mb-2">
                  {t('codex.hands.winning.sequence', 'Sequence (順子)')}
                </p>
                <p className="text-sm">
                  {t('codex.hands.winning.sequenceDesc', 'Three consecutive tiles of the same suit (e.g., 2-3-4)')}
                </p>
                <TileGroup
                  tiles={[
                    { suit: TileSuit.Pinzu, rank: 2 },
                    { suit: TileSuit.Pinzu, rank: 3 },
                    { suit: TileSuit.Pinzu, rank: 4 },
                  ]}
                />
              </div>
              <div>
                <p className="font-bold text-[var(--color-golden-yellow)] mb-2">
                  {t('codex.hands.winning.triplet', 'Triplet (刻子)')}
                </p>
                <p className="text-sm">{t('codex.hands.winning.tripletDesc', 'Three identical tiles')}</p>
                <TileGroup
                  tiles={[
                    { suit: TileSuit.Souzu, rank: 7 },
                    { suit: TileSuit.Souzu, rank: 7 },
                    { suit: TileSuit.Souzu, rank: 7 },
                  ]}
                />
              </div>
            </div>
          ),
        },
        {
          id: 'yaku',
          title: t('codex.hands.yaku.title', 'Yaku (Scoring Patterns)'),
          content: (
            <div className="space-y-4">
              <p>
                {t(
                  'codex.hands.yaku.p1',
                  "Yaku are special patterns that multiply your score. They're organized into 4 tiers:"
                )}
              </p>
              <DataTable
                headers={[t('codex.tier', 'Tier'), t('codex.examples', 'Examples'), t('codex.multiplierRange', 'Multiplier')]}
                rows={[
                  ['1', t('codex.hands.yaku.tier1', 'Tanyao, Yakuhai, Pinfu'), '×1.2 - ×1.3'],
                  ['2', t('codex.hands.yaku.tier2', 'Ittsu, Toitoi, Sanshoku'), '×1.6 - ×2.2'],
                  ['3', t('codex.hands.yaku.tier3', 'Honitsu, Chinitsu, Ryanpeikou'), '×2.5 - ×3.2'],
                  ['4', t('codex.hands.yaku.tier4', 'Kokushi, Suu Ankou, Chuuren'), '×4.0 - ×5.5'],
                ]}
              />
              <InfoBox title={t('codex.hands.yaku.stacking', 'Yaku Stacking')} variant="tip">
                {t(
                  'codex.hands.yaku.stackingText',
                  'Multiple Yaku stack multiplicatively! A hand with ×1.3 Tanyao and ×2.5 Honitsu scores ×3.25 total.'
                )}
              </InfoBox>
            </div>
          ),
        },
      ],
    },
    {
      id: 'items',
      title: t('codex.items.title', 'Items & Upgrades'),
      icon: '🎴',
      sections: [
        {
          id: 'decrees',
          title: t('codex.items.decrees.title', 'Decrees (法令)'),
          content: (
            <div className="space-y-4">
              <p>
                {t(
                  'codex.items.decrees.p1',
                  'Decrees are persistent modifiers that bend the rules and boost your score. They come in 5 categories:'
                )}
              </p>
              <DataTable
                headers={[t('codex.category', 'Category'), t('codex.effect', 'Effect Type'), t('codex.example', 'Example')]}
                rows={[
                  [
                    t('codex.items.decrees.structural', 'Structural (形法令)'),
                    t('codex.items.decrees.structuralDesc', 'Alter legal hand structures'),
                    t('codex.items.decrees.structuralEx', 'Sequences may skip one rank'),
                  ],
                  [
                    t('codex.items.decrees.identity', 'Tile Identity (变牌法令)'),
                    t('codex.items.decrees.identityDesc', 'Change what tiles represent'),
                    t('codex.items.decrees.identityEx', 'Honors count as any suit'),
                  ],
                  [
                    t('codex.items.decrees.doctrine', 'Yaku Doctrine (役变法令)'),
                    t('codex.items.decrees.doctrineDesc', 'Modify Yaku rules'),
                    t('codex.items.decrees.doctrineEx', 'Terminals allowed in Tanyao'),
                  ],
                  [
                    t('codex.items.decrees.entropy', 'Entropy & Fate (天运法令)'),
                    t('codex.items.decrees.entropyDesc', 'Alter probability/tempo'),
                    t('codex.items.decrees.entropyEx', '+3 draws before failure'),
                  ],
                  [
                    t('codex.items.decrees.scaling', 'Scaling (修行法令)'),
                    t('codex.items.decrees.scalingDesc', 'Reward commitment'),
                    t('codex.items.decrees.scalingEx', '+5% per terminal used'),
                  ],
                ]}
              />
              <InfoBox variant="info">
                {t(
                  'codex.items.decrees.rarity',
                  'Decrees come in 4 rarities: Local Edict (common), Regional Mandate (uncommon), Imperial Decree (rare), and Heavenly Ordinance (mythic).'
                )}
              </InfoBox>
            </div>
          ),
        },
        {
          id: 'consumables',
          title: t('codex.items.consumables.title', 'Consumables'),
          content: (
            <div className="space-y-4">
              <p>{t('codex.items.consumables.p1', 'One-time use items that provide powerful effects:')}</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.items.consumables.seals', 'Fate Seals (運命符)')}
                  </h4>
                  <p className="text-sm">
                    {t(
                      'codex.items.consumables.sealsDesc',
                      'Manipulate tiles in your hand. Convert suits, add enhancements, transform tiles.'
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.items.consumables.orbs', 'Celestial Orbs (天球)')}
                  </h4>
                  <p className="text-sm">
                    {t(
                      'codex.items.consumables.orbsDesc',
                      "Permanently upgrade a specific Yaku. Each use increases that Yaku's multiplier."
                    )}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-golden-yellow)]">
                    {t('codex.items.consumables.scripts', 'Void Scripts (虚無書)')}
                  </h4>
                  <p className="text-sm">
                    {t('codex.items.consumables.scriptsDesc', 'Powerful effects with drawbacks. High risk, high reward.')}
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'marks',
          title: t('codex.items.marks.title', 'Tile Marks & Editions'),
          content: (
            <div className="space-y-4">
              <p>{t('codex.items.marks.p1', 'Tiles can be enhanced with Marks, Seals, and Editions:')}</p>
              <DataTable
                headers={[t('codex.type', 'Type'), t('codex.examples', 'Examples'), t('codex.effect', 'Effect')]}
                rows={[
                  [
                    t('codex.items.marks.enhancement', 'Marks'),
                    t('codex.items.marks.enhancementEx', 'Bonus, Mult, Wild, Glass, Steel, Stone, Gold, Lucky'),
                    t('codex.items.marks.enhancementEf', 'Stat bonuses when scored'),
                  ],
                  [
                    t('codex.items.marks.seal', 'Seals'),
                    t('codex.items.marks.sealEx', 'Gold, Red, Blue, Purple'),
                    t('codex.items.marks.sealEf', 'Special triggers'),
                  ],
                  [
                    t('codex.items.marks.edition', 'Editions'),
                    t('codex.items.marks.editionEx', 'Foil, Holographic, Polychrome, Negative'),
                    t('codex.items.marks.editionEf', 'Rare powerful bonuses'),
                  ],
                ]}
              />
              <InfoBox variant="tip">
                {t(
                  'codex.items.marks.stacking',
                  'A tile can have ONE Mark, ONE Seal, and ONE Edition simultaneously for massive bonuses!'
                )}
              </InfoBox>
            </div>
          ),
        },
      ],
    },
    {
      id: 'scoring',
      title: t('codex.scoring.title', 'Scoring'),
      icon: '💯',
      sections: [
        {
          id: 'formula',
          title: t('codex.scoring.formula.title', 'Scoring Formula'),
          content: (
            <div className="space-y-4">
              <div className="bg-[var(--color-forest-green)] p-4 rounded-lg text-center">
                <p className="font-mono text-lg text-[var(--color-golden-yellow)]">
                  {t('codex.scoring.formula.equation', 'Final Score = (Base Points + Bonuses) × Multipliers')}
                </p>
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-[var(--color-golden-yellow)] mb-2">
                  {t('codex.scoring.formula.base', 'Base Points')}
                </h4>
                <DataTable
                  headers={[t('codex.source', 'Source'), t('codex.points', 'Points')]}
                  rows={[
                    [t('codex.scoring.formula.terminals', 'Terminal tiles (1, 9)'), '10'],
                    [t('codex.scoring.formula.simples', 'Simple tiles (2-8)'), '5'],
                    [t('codex.scoring.formula.honors', 'Honor tiles'), '15'],
                    [t('codex.scoring.formula.pair', 'Pair'), '+10'],
                    [t('codex.scoring.formula.sequence', 'Sequence'), '+20'],
                    [t('codex.scoring.formula.triplet', 'Triplet'), '+30'],
                    [t('codex.scoring.formula.quad', 'Quad'), '+50'],
                  ]}
                />
              </div>
              <InfoBox variant="info">
                {t(
                  'codex.scoring.formula.order',
                  'Multipliers apply in order: Yaku first, then Decrees (left to right), then Season effects.'
                )}
              </InfoBox>
            </div>
          ),
        },
      ],
    },
  ]

  return categories
}
