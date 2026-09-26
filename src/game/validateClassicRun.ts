import type {
  ClassicRunSnapshot,
  OmenRunSnapshot,
  ClassicRoundConfig,
} from './ClassicRunSnapshot'
import type { ClassicRunState } from './ClassicRunState'
import type { ShopSessionState } from './ShopSession'
import type { RunMetaSnapshot } from './RunMetaContext'
import type { RoundCashOutSummary } from './GameOrchestrator'
import type { ActiveOmenTag, OmenHistoryEntry } from '../stores/omenStore'
import type { RoundState, ActState } from '../systems/types'
import type { DebuffSource } from './DebuffSystem'
import { MeldType } from '../core/Meld'
import { FLOWER_MUTATIONS } from '../systems/FlowerSystem'
import { calculateCombinedModifiers } from '../config/stakeDefinitions'
import { resolveTableRules } from './tableStyleRules'
import { RunRandom, type RunRandomState } from './RunRandom'
import {
  type Check,
  array,
  bool,
  choice,
  count,
  entries,
  finite,
  id,
  integer,
  invalid,
  keyed,
  nonnegative,
  nullable,
  object,
  optional,
  positive,
  record,
  ruleDefinition,
  schema,
  text,
  uint32,
  uniqueIds,
} from './snapshotValidation'
import {
  boss,
  charter,
  charterId,
  consumable,
  flower,
  mandate,
  offering,
  omen,
  omenId,
  omenTrigger,
  orb,
  ownedDecree,
  pack,
  roundNumber,
  roundType,
  script,
  seal,
  season,
  seasonType,
  stake,
  tiles,
  yakuCategory,
} from './classicSaveItems'

const round = schema<RoundState>({
  actNumber: positive,
  roundNumber,
  roundType,
  scoreTarget: nonnegative,
  currentScore: nonnegative,
  handsPlayed: count,
  maxHands: count,
  discardsRemaining: count,
  maxDiscards: count,
  bossMandate: optional(boss),
  isCompleted: bool,
  isWon: bool,
})
const act = schema<ActState>({
  actNumber: positive,
  rounds: array(round, 3),
  currentRoundIndex: choice([0, 1, 2]),
  isCompleted: bool,
  baseScoreTarget: nonnegative,
})
const roundManager: Check = (v, p) => {
  const data = record(v, p)
  stake(data.stake, `${p}.stake`)
  schema<ClassicRunState['roundManager']>({
    currentAct: nullable(act),
    currentRound: nullable(round),
    stake,
    bonusHands: integer,
    bonusDiscards: integer,
    usedTileIds: uniqueIds,
    stakeModifiers: (rules, path) =>
      ruleDefinition(
        rules,
        calculateCombinedModifiers(data.stake as number),
        path
      ),
    // This legacy generator keeps an accumulating safe integer, not a uint32.
    rngState: count,
    tableTargetMultiplier: nonnegative,
  })(v, p)
}
const debuffSource: Check = (v, p) => {
  const data = record(v, p)
  const variants: Record<DebuffSource['type'], Check> = {
    mandate: object({ type: choice(['mandate']), mandateId: id }),
    season: object({ type: choice(['season']), seasonId: id }),
    script: object({ type: choice(['script']), scriptId: id }),
    sticker: object({ type: choice(['sticker']), stickerId: id }),
    system: object({ type: choice(['system']), reason: text }),
  }
  choice(Object.keys(variants))(data.type, `${p}.type`)
  variants[data.type as DebuffSource['type']](v, p)
}
const roundSummary = schema<RoundCashOutSummary>({
  actNumber: positive,
  roundNumber,
  roundType,
  score: nonnegative,
  target: nonnegative,
  baseReward: nonnegative,
  interest: nonnegative,
  decreeGold: finite,
  heldGoldMarkReward: nonnegative,
  rentalCost: nonnegative,
  netGoldChange: finite,
  goldBefore: finite,
  goldAfter: finite,
  nextRoundType: nullable(roundType),
  nextTarget: nullable(nonnegative),
})
const meld: Check = (v, p) => {
  schema<ClassicRunState['melds'][number]>({
    type: choice(Object.values(MeldType)),
    tiles,
    isConcealed: bool,
    isCalledKan: bool,
  })(v, p)
  const data = v as ClassicRunState['melds'][number]
  const length =
    data.type === MeldType.Pair ? 2 : data.type === MeldType.Quad ? 4 : 3
  if (data.tiles.length !== length) invalid(`${p}.tiles`)
  // Decrees can change legality; don't re-evaluate the meld under default rules.
}

const stateFields = {
  isRunActive: bool,
  seed: integer,
  stake,
  tableStyleId: id,
  // Resolved below using the captured table ID, never the current menu preference.
  tableModifiers: object({
    decreeSlotModifier: integer,
    flowerRateMultiplier: nonnegative,
    shopDiscountPercent: nonnegative,
    baseScoreMultiplier: nonnegative,
    yakumanMultiplierBonus: nonnegative,
    scoreTargetMultiplier: nonnegative,
    flowersDisabled: bool,
    earlyCorruptedSeasons: bool,
    grantRegionalMandate: bool,
  }),
  currentAct: positive,
  currentRound: roundNumber,
  runScore: nonnegative,
  hasWonRun: bool,
  hasEnteredEndless: bool,
  score: nonnegative,
  gold: finite,
  handsRemaining: count,
  handsAllowance: count,
  lossPreventionScorePenalty: nonnegative,
  lastHandScore: nullable(nonnegative),
  handsPlayedThisRun: count,
  discardsRemaining: count,
  redrawsRemaining: count,
  targetScore: nonnegative,
  handTiles: tiles,
  melds: array(meld),
  selectedTileIds: uniqueIds,
  faceDownTileIds: uniqueIds,
  wallTemplate: tiles,
  wall: tiles,
  summerReserve: tiles,
  deadWall: tiles,
  discards: tiles,
  drawIndex: count,
  decreeSystem: schema<ClassicRunState['decreeSystem']>({
    ownedDecrees: array(ownedDecree),
    maxSlots: count,
    currentRound: count,
  }),
  flowerSystem: schema<ClassicRunState['flowerSystem']>({
    flowers: keyed(flower, 'type'),
    unlockedMutations: array(
      choice(Object.values(FLOWER_MUTATIONS).map((m) => m.mutationId))
    ),
  }),
  seasonSystem: schema<ClassicRunState['seasonSystem']>({
    activeSeason: nullable(season),
    seasonStack: array(season),
    currentAct: positive,
    discardCount: count,
    earlyCorruption: bool,
  }),
  roundManager,
  consumableSystem: schema<ClassicRunState['consumableSystem']>({
    inventory: object({
      fateSealSlots: count,
      celestialOrbSlots: count,
      voidScriptSlots: count,
      fateSeals: keyed(seal, 'instanceId'),
      celestialOrbs: keyed(orb, 'instanceId'),
      voidScripts: keyed(script, 'instanceId'),
    }),
    currentRound: count,
    sealsUsedThisRound: count,
    scriptsUsedThisRound: count,
    maxSealsPerRound: count,
    maxScriptsPerRound: count,
  }),
  celestialOrbSystem: schema<ClassicRunState['celestialOrbSystem']>({
    orbLevels: entries(yakuCategory, positive),
    yakuTriggerCounts: entries(yakuCategory, count),
    activeOrbs: keyed(orb, 'instanceId'),
  }),
  fateSealSystem: schema<ClassicRunState['fateSealSystem']>({
    lastUsedConsumable: nullable(consumable),
  }),
  voidScriptSystem: schema<ClassicRunState['voidScriptSystem']>({
    handSizePenalty: count,
    decreeSlotsLostNextRound: count,
    allowShantenScoring: bool,
    bypassMeldValidation: bool,
    baseScoreHalved: bool,
  }),
  omenSystem: schema<ClassicRunState['omenSystem']>({
    currentAct: positive,
    currentRound: roundNumber,
    skippedRoundsThisAct: count,
    totalSkippedRounds: count,
    lockedSeasonType: nullable(seasonType),
    pendingOmens: array(omen),
    interestCapBonus: nonnegative,
    interestBoostRoundsRemaining: count,
    randomCursor: nullable(uint32),
  }),
  charterSystem: schema<ClassicRunState['charterSystem']>({
    ownedCharters: keyed(charter, 'id'),
    purchasedIds: array(charterId),
    currentAct: positive,
    currentRound: roundNumber,
    mandateRerollsUsedThisAct: count,
  }),
  debuffSystem: schema<ClassicRunState['debuffSystem']>({
    debuffedTileIds: uniqueIds,
    debuffedDecreeIds: uniqueIds,
    debuffSources: entries(id, debuffSource),
  }),
  mandateEffectSystem: schema<ClassicRunState['mandateEffectSystem']>({
    randomCursor: nullable(uint32),
    activeMandate: nullable(mandate),
    isDefeated: bool,
    scoredYakuIds: uniqueIds,
    firstYakuType: nullable(id),
    handsPlayed: count,
    lockedTileIds: uniqueIds,
    disabledDecreeIds: uniqueIds,
    decreesShuffled: bool,
    shuffledDecreeIds: array(id),
    allTilesDebuffed: bool,
    modifiedRedraws: nullable(count),
    modifiedMaxHands: nullable(count),
    requiredHandSize: nullable(count),
    usedTileIds: uniqueIds,
  }),
  fateSeals: keyed(seal, 'instanceId'),
  celestialOrbs: keyed(orb, 'instanceId'),
  voidScripts: keyed(script, 'instanceId'),
  lastCompletedRoundType: nullable(roundType),
  lastRoundSummary: nullable(roundSummary),
  temporaryDecreeSlotPenalty: count,
  omenHandSizeBonus: count,
  omenDiscardBonus: count,
  omenRedrawBonus: count,
  yakuPlayCounts: entries(id, count),
  currentRoundYakuIds: uniqueIds,
  previousRoundYakuIds: uniqueIds,
  deadWallWritUsedThisRound: bool,
  pendingActReduction: count,
  phase: choice(['gameplay', 'shop', 'gameOver']),
} satisfies { [K in keyof ClassicRunState]-?: Check }

const tag = schema<ActiveOmenTag>({
  id,
  definitionId: omenId,
  acquiredAct: positive,
  acquiredRound: roundNumber,
  isConsumed: bool,
  triggeredAt: optional(count),
  roundsSkippedThisRun: optional(count),
})
const omens = schema<OmenRunSnapshot>({
  activeTags: keyed(tag, 'id'),
  consumedTags: keyed(tag, 'id'),
  pendingShopTags: keyed(tag, 'id'),
  pendingBossTags: keyed(tag, 'id'),
  roundsSkippedThisRun: count,
  handsPlayedThisRun: count,
  unusedDiscardsThisRun: count,
  hasDoubleOmenActive: bool,
  lockedSeason: nullable(
    object({ seasonType, sourceOmenId: id, isApplied: bool })
  ),
  noInterestRounds: count,
  unlockedTagIds: array(omenId),
  currentAct: positive,
  currentRound: roundNumber,
  omenHistory: array(
    schema<OmenHistoryEntry>({
      id,
      definitionId: omenId,
      name: text,
      japaneseName: text,
      acquiredAct: positive,
      acquiredRound: roundNumber,
      consumedAct: positive,
      consumedRound: roundNumber,
      triggerCondition: omenTrigger,
      effectDescription: text,
    })
  ),
})
const shop = schema<ShopSessionState>({
  teaHouse: schema<ShopSessionState['teaHouse']>({
    flowerCountForVisit: count,
    itemSlotCount: count,
    discountPercentage: nonnegative,
    rerollDiscount: nonnegative,
    sealWeightMultiplier: nonnegative,
    orbWeightMultiplier: nonnegative,
    editionFrequencyMultiplier: nonnegative,
    canBuyTiles: bool,
    tilesHaveEditions: bool,
    purchasedCharterIds: array(charterId),
    currentStake: stake,
    itemOfferings: keyed(offering, 'id'),
    packOfferings: keyed(offering, 'id'),
    charterOffering: nullable(offering),
    rerollsThisVisit: count,
    totalRerollsRun: count,
    offeringCounter: count,
    visitDiscountPercentage: nonnegative,
    freeRerollsThisVisit: count,
  }),
  packs: schema<ShopSessionState['packs']>({
    currentOfferings: array(pack),
    skipCount: count,
    totalPacksOpened: count,
    packsPerVisit: count,
  }),
  opened: bool,
  pendingPackId: nullable(id),
  spent: nonnegative,
  purchases: count,
})
const random: Check = (v, p) => {
  schema<RunRandomState>({
    version: choice([1]),
    seed: integer,
    streams: (streams, path) => {
      const data = record(streams, path)
      for (const [key, value] of Object.entries(data))
        uint32(value, `${path}.${key}`)
    },
  })(v, p)
  RunRandom.fromState(v) // validates stream names without touching the global generator
}
const snapshot = schema<ClassicRunSnapshot>({
  version: choice([1]),
  state: object(stateFields),
  shop,
  random,
  omens,
  config: schema<ClassicRoundConfig>({
    handsPerRound: positive,
    discardsPerRound: count,
    redrawsPerRound: count,
    startingHandSize: positive,
  }),
  meta: nullable(
    schema<NonNullable<RunMetaSnapshot>>({
      stake,
      wallId: id,
      hadFlowers: bool,
      // The progression bridge records event identifiers (currently "1"…"4"),
      // not FlowerSystem's display variants such as "Plum".
      flowerTypes: uniqueIds,
      pendingCorruptedSeasons: count,
    })
  ),
  runtimeItemCounter: count,
  tileIdCounter: count,
  consumableInstanceCounter: count,
})

/** Parse a versioned JSON snapshot without side effects. Fail closed; never repair or delete it here. */
export function parseClassicRunSnapshot(value: unknown): ClassicRunSnapshot {
  snapshot(value, 'run')
  const saved = value as ClassicRunSnapshot
  const state = saved.state
  const table = resolveTableRules(state.tableStyleId)
  if (table.id !== state.tableStyleId) invalid('run.state.tableStyleId')
  ruleDefinition(
    state.tableModifiers,
    table.modifiers,
    'run.state.tableModifiers'
  )
  if (
    state.seed !== saved.random.seed ||
    state.stake !== state.roundManager.stake ||
    state.roundManager.tableTargetMultiplier !==
      table.modifiers.scoreTargetMultiplier
  )
    invalid('run.rules')
  if (
    state.isRunActive !== (state.phase !== 'gameOver') ||
    (state.hasEnteredEndless && !state.hasWonRun)
  )
    invalid('run.phase')
  if (state.drawIndex > state.wall.length) invalid('run.state.drawIndex')
  const handIds = new Set(state.handTiles.map((tile) => tile.id))
  if (
    [...state.selectedTileIds, ...state.faceDownTileIds].some(
      (tileId) => !handIds.has(tileId)
    )
  )
    invalid('run.state.selectedTileIds')

  const manager = state.roundManager
  const act = manager.currentAct
  const round = manager.currentRound
  if (
    !act ||
    !round ||
    act.rounds.length !== 3 ||
    act.actNumber !== state.currentAct ||
    act.rounds.some(
      (r, i) =>
        r.actNumber !== act.actNumber ||
        r.roundNumber !== i + 1 ||
        r.roundType !== ['Small', 'Large', 'Boss'][i]
    ) ||
    act.currentRoundIndex !== round.roundNumber - 1
  )
    invalid('run.state.roundManager')
  ruleDefinition(
    round,
    act.rounds[act.currentRoundIndex],
    'run.state.roundManager.currentRound'
  )
  // The manager advances to the next round immediately on a win; the screen
  // remains at the completed round until the player leaves its reward shop.
  if (state.phase === 'gameplay' && round.roundNumber !== state.currentRound)
    invalid('run.state.currentRound')
  if (
    saved.meta &&
    (saved.meta.stake !== state.stake ||
      saved.meta.wallId !== state.tableStyleId)
  )
    invalid('run.meta')

  const packIds = saved.shop.packs.currentOfferings.map((p) => p.pack.id)
  if (new Set(packIds).size !== packIds.length) invalid('run.shop.packs')
  const offers = saved.shop.teaHouse.packOfferings
  if (
    offers.some((o) => o.itemType !== 'BlessingPack') ||
    saved.shop.teaHouse.itemOfferings.some((o) =>
      ['BlessingPack', 'ImperialCharter'].includes(o.itemType)
    ) ||
    (saved.shop.teaHouse.charterOffering &&
      saved.shop.teaHouse.charterOffering.itemType !== 'ImperialCharter')
  )
    invalid('run.shop.teaHouse')
  for (const p of saved.shop.packs.currentOfferings) {
    const offer = offers.find((o) => o.item.id === p.pack.id)
    if (!offer || offer.isPurchased !== p.isOpened)
      invalid('run.shop.packPayment')
    ruleDefinition(p.pack, offer.item, 'run.shop.packDefinition')
  }
  if (offers.length !== packIds.length) invalid('run.shop.packs')
  const unfinished = saved.shop.packs.currentOfferings.filter(
    (p) => p.isOpened && !p.isResolved
  )
  if (
    unfinished.length !== (saved.shop.pendingPackId === null ? 0 : 1) ||
    (unfinished[0] &&
      (!saved.shop.opened ||
        unfinished[0].pack.id !== saved.shop.pendingPackId)) ||
    (saved.shop.opened && state.phase !== 'shop')
  )
    invalid('run.shop.pendingPackId')
  return structuredClone(saved)
}
