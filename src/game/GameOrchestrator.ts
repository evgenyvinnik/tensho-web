/**
 * Game Orchestrator for Tensho Mahjong Roguelike
 *
 * Central controller that owns the game loop and connects:
 * - ActionProcessor (validation + execution)
 * - Stores (state management)
 * - Game Systems (Decree, Flower, Season, RoundManager)
 * - EventBus (decoupled communication)
 * - ScoringEngine (score calculation)
 *
 * This is the missing piece that makes the game playable end-to-end.
 */

import {
  getConsumableUnlockCondition,
  isConsumableAvailable,
  type ConsumableUnlockResolver,
} from '../config/consumableUnlocks'
import {
  Tile,
  TileSuit,
  FlowerType,
  SeasonType,
  WindType,
  DragonType,
  getTileIdCounter,
  restoreTileIdCounter,
} from '../core/Tile'
import { EditionType, EnhancementType, SealType } from '../core/TileModifier'
import { Hand, ParsedHand, WaitType } from '../core/Hand'
import { Meld, MeldType } from '../core/Meld'
import {
  calculateScore,
  createScoringContext,
  ScoreBreakdown,
} from '../rules/ScoringEngine'
import {
  findLooseGroupCompletion,
  findOneAwayCompletion,
  validateHand,
} from '../rules/HandValidator'
import {
  findCompleteHandSubset,
  REGULAR_TILE_TYPES,
} from '../rules/CompleteHandSubset'
import { parsePlay, toPartialParsedHand } from '../rules/PartialHandParser'
import { classifyPlay, type PlayPatternId } from '../rules/PlayPattern'
import { eventBus } from './EventBus'
import { settleScoreEquation, type ScoreEquation } from '../rules/ScoreEquation'
import { ascendYaku } from '../rules/yakuAscension'
import { observatoryMultiplier } from '../systems/observatory'
import { ShopSession } from './ShopSession'
import {
  consumableTargetRange,
  validateConsumableTargetCount,
} from '../gameplay/consumableTargeting'
import { sealableWallTiles, wallSealTargetError } from '../gameplay/wallSeals'
import {
  ActionProcessor,
  PlayerAction,
  ActionResult,
  ValidationResult,
  Effect,
  GameStateSnapshot,
  createActionProcessor,
} from './ActionProcessor'
import { RoundManager } from '../systems/RoundManager'
import { NORMAL_RUN_ACTS } from '../config/runProgression'
import {
  applyTableStartingEnhancements,
  flowerWeightedWall,
  resolveTableRules,
} from './tableStyleRules'
import type { ActiveTableModifiers } from '../systems/TableStyleSystem'
import {
  ALL_DECREES,
  DecreeSystem,
  STARTER_DECREES,
} from '../systems/DecreeSystem'
import { FlowerSystem } from '../systems/FlowerSystem'
import { decreeKey } from '../systems/decreeIdentity'
import { hasDecreeSticker } from '../systems/decreeStickers'
import { SeasonSystem } from '../systems/SeasonSystem'
import {
  ScoringContext as SystemScoringContext,
  ScoreBreakdown as SystemScoreBreakdown,
  type Decree,
  type DecreeEdition,
  type ImperialCharter,
  type RoundType,
} from '../systems/types'
import {
  BaseConsumable,
  ConsumableEffectResult,
  ConsumableSystem,
  ConsumableType,
  getConsumableInstanceCounter,
  restoreConsumableInstanceCounter,
} from '../systems/ConsumableSystem'
import {
  CELESTIAL_ORBS,
  CelestialOrbSystem,
  CelestialOrb,
  mapYakuIdToCategory,
  playOrbCategories,
  type YakuCategory,
} from '../systems/CelestialOrbSystem'
import {
  FATE_SEALS,
  FateSealSystem,
  FateSeal,
  FateSealContext,
} from '../systems/FateSealSystem'
import {
  convertSuitedTile,
  convertSuitedTileRank,
} from '../core/tileTransformations'
import {
  VoidScriptSystem,
  VoidScript,
  VoidScriptContext,
} from '../systems/VoidScriptSystem'
import { OmenTagSystem } from '../systems/OmenTagSystem'
import { CharterSystem } from '../systems/CharterSystem'
import type { CharterUnlockResolver } from '../config/charterDefinitions'
import {
  isDecreeAvailable,
  type DecreeUnlockResolver,
} from '../config/decreeUnlocks'
import { DebuffSystem } from './DebuffSystem'
import type { TeaHouseVisitModifiers } from '../systems/TeaHouseSystem'
import {
  MandateEffectSystem,
  isFaceDebuffTarget,
} from '../systems/MandateEffectSystem'
import { getMandateById } from '../config/mandateDefinitions'
import {
  AD_TURNS_PER_ACT,
  EMERGENCY_TURN_FIRST_ACT,
  EMERGENCY_TURN_FIRST_STAKE,
  MAX_TACTICAL_PLAY_TILES,
  SWIFT_CLEAR_SPARE_TURNS,
  TURNS_PER_ROUND,
  emergencyTurnCost,
} from './playRules'
import { createSeededRandom, runRandom, RunRandom } from './RunRandom'
import { captureClassicState, restoreClassicState } from './ClassicRunState'
import {
  captureOmenRunState,
  type ClassicRunSnapshot,
} from './ClassicRunSnapshot'
import {
  captureMetaProgressionRunContext,
  restoreMetaProgressionRunContext,
  type RunMetaSnapshot,
} from './RunMetaContext'
import { useOmenStore } from '../stores/omenStore'
import { useProgressionStore } from '../stores/progressionStore'
import { takeWallTile, takeDeadWallTile } from './wallDraw'
import { applySeasonWallEffect, protectSummerWall } from './seasonWall'
import { planPlumRecursion } from './plumRecursion'
import { describeFlowerSequences } from '../rules/sequenceShapes'

// =============================================================================
// GAME ORCHESTRATOR STATE
// =============================================================================

/** Transparent payout and progression context retained for the Tea House. */
export interface RoundCashOutSummary {
  actNumber: number
  roundNumber: number
  roundType: RoundType
  score: number
  target: number
  baseReward: number
  interest: number
  decreeGold: number
  heldGoldMarkReward: number
  rentalCost: number
  netGoldChange: number
  goldBefore: number
  goldAfter: number
  nextRoundType: RoundType | null
  nextTarget: number | null
  /** Omen earned by a swift clear (Turns to spare), if any. */
  omenId?: string | null
  /** Gold the swift-clear Omen paid at once, included in netGoldChange. */
  omenGold?: number
  /**
   * Clear reward the Stake withheld (Red Stake's Small round), not paid and
   * not in netGoldChange. Absent when nothing was withheld.
   */
  stakeWithheldReward?: number
  /** Copies of that Omen earned: more than one when Double Omen was held. */
  omenCopies?: number
  /** Turns left unspent when the round was cleared. */
  spareTurns?: number
}

/**
 * Visible, temporary tile interpretation used by declaration scoring.
 */
export interface CompleteHandInterpretation {
  naturalComplete: boolean
  substitutions: { physical: Tile; effective: Tile }[]
  completionTile?: Tile
  usedShantenClemency: boolean
  allWild: boolean
}

/** Transient draw accounting; an action settles completely before saving. */
interface DrawCycle {
  orchidReplacements: number
  drawnTiles: Tile[]
  resolvingOrchid?: boolean
}

/** Complete game state managed by the orchestrator. */
export interface OrchestratorState {
  // Session
  isRunActive: boolean
  seed: number
  stake: number
  tableStyleId: string
  tableModifiers: Readonly<ActiveTableModifiers>

  // Progression
  currentAct: number
  currentRound: number
  /** Score accumulated across every round in this run. */
  runScore: number
  /** True after securing the campaign victory, including legacy longer runs. */
  hasWonRun: boolean
  /** Remains true after entering Endless, even when a Charter rewinds Acts. */
  hasEnteredEndless: boolean

  // Resources
  score: number
  gold: number

  // Round state
  /**
   * Turns left this round, shared by Play and REDRAW: the one budget the HUD
   * shows. (The field keeps its historical name for saves.)
   */
  handsRemaining: number
  /**
   * Turns granted at the start of this round. Charters, Decrees and Mandates
   * all move the allowance off the config default.
   */
  handsAllowance: number
  /** Plays made this round. Missing in legacy saves: derived on restore. */
  playsThisRound?: number
  /** Tiles REDRAW has sent to the river this round. */
  tilesRedrawnThisRound?: number
  /**
   * Emergency Turns bought with Gold this round; each doubles the next one's
   * price. Missing in older saves: none bought.
   */
  emergencyTurnsBoughtThisRound?: number
  /**
   * Turns taken for a watched rewarded ad in the current Act, with the Act
   * they belong to. Missing in older saves: none taken.
   */
  adTurns?: { actNumber: number; count: number }
  /** Missing in legacy saves: unknown eligibility until the next round. */
  honorDiscardsThisRound?: number
  /**
   * Permanent score multiplier charged by a Decree that refused a loss
   * (Immortal Decree). 1 while no such rescue has happened.
   */
  lossPreventionScorePenalty: number
  /**
   * What the previous hand of this round scored. Undefined before the round's
   * first hand, so a Decree gated on "last hand was 0" cannot fire on it.
   */
  lastHandScore: number | undefined
  /** Hands played across the whole run, for Decrees that scale with tempo. */
  handsPlayedThisRun: number
  /** Proven complete concealed plays. Absent legacy history means zero. */
  completeConcealedHandsPlayed?: number
  /** Retired Riichi pledge; legacy saves may still carry it. Ignored. */
  riichiStatus?: 'available' | 'active' | 'spent'
  /** Retired separate discard budget; always 0 (REDRAW replaced Discard). */
  discardsRemaining: number
  /**
   * Free redraws granted by items (Charters, Decrees, Omens, Autumn). A REDRAW
   * spends one of these before it spends a Turn.
   */
  redrawsRemaining: number
  targetScore: number

  // Hand state
  handTiles: Tile[]
  melds: Meld[]
  selectedTileIds: Set<string>
  /** Tile identities currently hidden from the player by a mandate. */
  faceDownTileIds: Set<string>

  // Wall state
  wallTemplate: Tile[]
  wall: Tile[]
  /** Tiles set aside by Summer for this round, not removed from the run. */
  summerReserve: Tile[]
  /** Earned by a Bamboo/Summer terminal-heavy play; cleared at round setup. */
  bambooSummerProtection: boolean
  deadWall: Tile[]
  discards: Tile[]
  drawIndex: number

  // Systems
  decreeSystem: DecreeSystem
  flowerSystem: FlowerSystem
  seasonSystem: SeasonSystem
  roundManager: RoundManager
  consumableSystem: ConsumableSystem
  celestialOrbSystem: CelestialOrbSystem
  fateSealSystem: FateSealSystem
  voidScriptSystem: VoidScriptSystem
  omenSystem: OmenTagSystem
  charterSystem: CharterSystem
  debuffSystem: DebuffSystem
  mandateEffectSystem: MandateEffectSystem

  // Consumable inventory (owned items)
  fateSeals: FateSeal[]
  celestialOrbs: CelestialOrb[]
  voidScripts: VoidScript[]

  // Transition context retained while the between-round shop is open
  lastCompletedRoundType: RoundType | null
  lastRoundSummary: RoundCashOutSummary | null

  // Void Script capacity loss that lasts for the currently active round.
  temporaryDecreeSlotPenalty: number

  // One-round Omen resource modifiers, consumed when the round begins.
  omenHandSizeBonus: number
  omenDiscardBonus: number
  omenRedrawBonus: number

  /** How often each hand type has been played this run (for The Ox). */
  patternPlayCounts: Map<PlayPatternId, number>
  /** Yaku scored in the active round and in the immediately previous round. */
  currentRoundYakuIds: Set<string>
  previousRoundYakuIds: Set<string>
  /** Completed consecutive rounds per family. Missing in legacy saves. */
  previousRoundYakuStreaks?: Record<string, number>
  /** Once-per-round interaction granted by Dead Wall Writ. */
  deadWallWritUsedThisRound: boolean
  /** One-shot Act reduction queued by Ancient/Stone Script acquisition. */
  pendingActReduction: number

  // Phase
  phase: 'menu' | 'gameplay' | 'shop' | 'gameOver'
}

/**
 * Round configuration
 */
interface RoundConfig {
  handsPerRound: number
  discardsPerRound: number
  redrawsPerRound: number
  startingHandSize: number
}

const DEFAULT_ROUND_CONFIG: RoundConfig = {
  // Turns: Play and REDRAW share this budget.
  handsPerRound: TURNS_PER_ROUND,
  // Free redraws come only from items.
  discardsPerRound: 0,
  redrawsPerRound: 0,
  startingHandSize: 14,
}

/**
 * Score a simple (2-8) as though it were a terminal, for Transmuter.
 *
 * Returns a scoring stand-in rather than mutating the tile: the player's wall
 * keeps its real tiles, and the promotion lasts only for this hand. Rank 1 is
 * the terminal the tile is promoted to; the id is preserved so retriggers,
 * debuffs, and modifier lookups still resolve.
 */
function promoteSimpleToTerminal(tile: Tile): Tile {
  if (!tile.isSimple) return tile

  return new Tile(tile.suit, 1, tile.id, tile.isRed, tile.modifiers)
}

// =============================================================================
// GAME ORCHESTRATOR CLASS
// =============================================================================

/**
 * Central game loop controller
 */
export class GameOrchestrator {
  private shopSession = new ShopSession(this)
  get shop(): ShopSession {
    return this.shopSession
  }
  private state: OrchestratorState
  private actionProcessor: ActionProcessor
  private config: RoundConfig
  private runtimeItemCounter = 0
  private actionDepth = 0
  private charterUnlockResolver: CharterUnlockResolver = () => false
  private decreeUnlockResolver: DecreeUnlockResolver = () => false
  private consumableUnlockResolver: ConsumableUnlockResolver = () => false

  setConsumableUnlockResolver(resolver: ConsumableUnlockResolver): void {
    this.consumableUnlockResolver = resolver
  }

  isConsumableUnlocked(id: string): boolean {
    return (
      isConsumableAvailable(id, this.consumableUnlockResolver) ||
      this.state.fateSeals.some((item) => item.id === id) ||
      this.state.celestialOrbs.some((item) => item.id === id) ||
      this.state.fateSealSystem.getLastUsedConsumable()?.id === id
    )
  }

  setDecreeUnlockResolver(resolver: DecreeUnlockResolver): void {
    this.decreeUnlockResolver = resolver
  }

  isDecreeUnlocked(id: string): boolean {
    return isDecreeAvailable(id, this.decreeUnlockResolver)
  }

  constructor(config: Partial<RoundConfig> = {}) {
    this.config = { ...DEFAULT_ROUND_CONFIG, ...config }
    this.actionProcessor = createActionProcessor()
    this.state = this.createInitialState()
  }

  /** Application wiring supplies persisted progress; pure engine instances default locked. */
  setCharterUnlockResolver(resolver: CharterUnlockResolver): void {
    this.charterUnlockResolver = resolver
  }

  private assertCheckpointBoundary(): void {
    if (this.actionDepth || this.shop.isBusy || eventBus.isBusy)
      throw new Error('Cannot checkpoint during a game operation')
  }

  /** Capture authoritative state, never a UI projection or a replay of rewards. */
  captureRun(): ClassicRunSnapshot {
    this.assertCheckpointBoundary()
    if (this.state.phase === 'menu')
      throw new Error('There is no Classic run to save')
    return {
      version: 3,
      state: captureClassicState(this.state),
      config: { ...this.config },
      shop: this.shop.toState(),
      random: runRandom.toState(),
      omens: captureOmenRunState(),
      meta: captureMetaProgressionRunContext(),
      runtimeItemCounter: this.runtimeItemCounter,
      tileIdCounter: getTileIdCounter(),
      consumableInstanceCounter: getConsumableInstanceCounter(),
    }
  }

  /** Internal typed restore. Stage every subsystem before touching the live run. */
  restoreRun(saved: ClassicRunSnapshot): void {
    this.assertCheckpointBoundary()
    if (saved.version !== 3) throw new Error('Unsupported Classic run snapshot')
    for (const counter of [
      saved.runtimeItemCounter,
      saved.tileIdCounter,
      saved.consumableInstanceCounter,
    ])
      if (!Number.isSafeInteger(counter) || counter < 0)
        throw new Error('Invalid run instance counter')
    const config = { ...saved.config }
    for (const value of Object.values(config))
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error('Invalid round configuration')
    const random = RunRandom.fromState(saved.random)
    const state = restoreClassicState(saved.state, (id) =>
      this.charterUnlockResolver(id)
    )
    const shop = ShopSession.fromState(this, saved.shop)
    if (shop.isOpen && state.phase !== 'shop')
      throw new Error('Open shop outside shop phase')
    if (saved.random.seed !== state.seed)
      throw new Error('Run seed and random state disagree')
    const omens = structuredClone(saved.omens)
    const meta = structuredClone(saved.meta)
    let endlessContext: NonNullable<RunMetaSnapshot> | undefined
    if (
      !meta &&
      state.hasWonRun &&
      (!state.hasEnteredEndless || state.isRunActive)
    ) {
      // Older victories discarded their context, including active Endless saves.
      // Reconnect only proven identities/Flowers and future scoring. The win was
      // already paid; neither runStart nor runEnd may be replayed on restoration.
      const flowers = state.flowerSystem.toState()
      const flowerTypes = [
        ...new Set(
          (
            flowers.collectedTypes ??
            flowers.flowers.map((flower) => flower.type)
          ).map((type) => String(FlowerType[type]))
        ),
      ]
      endlessContext = {
        stake: state.stake,
        wallId: state.tableStyleId,
        hadFlowers: flowerTypes.length > 0,
        flowerTypes,
        pendingCorruptedSeasons: 0,
        windYakuScored: 0,
      }
    }

    // Everything fallible above is staged independently. Domain events are not
    // replayed. Publish the Omen store only after all engine references are live.
    this.state = state
    this.shopSession = shop
    this.config = config
    this.runtimeItemCounter = saved.runtimeItemCounter
    runRandom.restore(random.toState())
    restoreTileIdCounter(saved.tileIdCounter)
    restoreConsumableInstanceCounter(saved.consumableInstanceCounter)
    restoreMetaProgressionRunContext(meta)
    useOmenStore.setState(omens)
    eventBus.emit('gameLoaded', {
      timestamp: Date.now(),
      ...(endlessContext ? { endlessContext } : {}),
    })
    if (state.isRunActive) this.publishWallComposition()
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Create initial orchestrator state
   */
  private createInitialState(): OrchestratorState {
    const debuffSystem = new DebuffSystem()
    const mandateEffectSystem = new MandateEffectSystem()
    mandateEffectSystem.setDebuffSystem(debuffSystem)

    return {
      isRunActive: false,
      seed: Date.now(),
      stake: 1,
      currentAct: 1,
      currentRound: 1,
      tableStyleId: 'green_felt',
      tableModifiers: resolveTableRules('green_felt').modifiers,
      runScore: 0,
      hasWonRun: false,
      hasEnteredEndless: false,
      score: 0,
      gold: 4,
      handsRemaining: this.config.handsPerRound,
      handsAllowance: this.config.handsPerRound,
      lossPreventionScorePenalty: 1,
      lastHandScore: undefined,
      handsPlayedThisRun: 0,
      discardsRemaining: this.config.discardsPerRound,
      redrawsRemaining: this.config.redrawsPerRound,
      targetScore: 300,
      handTiles: [],
      melds: [],
      selectedTileIds: new Set(),
      faceDownTileIds: new Set(),
      wallTemplate: [],
      wall: [],
      summerReserve: [],
      bambooSummerProtection: false,
      deadWall: [],
      discards: [],
      drawIndex: 0,
      decreeSystem: new DecreeSystem(),
      flowerSystem: new FlowerSystem(),
      seasonSystem: new SeasonSystem(),
      roundManager: new RoundManager(),
      consumableSystem: new ConsumableSystem(),
      celestialOrbSystem: new CelestialOrbSystem(),
      fateSealSystem: new FateSealSystem(),
      voidScriptSystem: new VoidScriptSystem(),
      omenSystem: new OmenTagSystem(),
      charterSystem: new CharterSystem((id) => this.charterUnlockResolver(id)),
      debuffSystem,
      mandateEffectSystem,
      fateSeals: [],
      celestialOrbs: [],
      voidScripts: [],
      lastCompletedRoundType: null,
      lastRoundSummary: null,
      temporaryDecreeSlotPenalty: 0,
      omenHandSizeBonus: 0,
      omenDiscardBonus: 0,
      omenRedrawBonus: 0,
      patternPlayCounts: new Map(),
      currentRoundYakuIds: new Set(),
      previousRoundYakuIds: new Set(),
      deadWallWritUsedThisRound: false,
      pendingActReduction: 0,
      phase: 'menu',
    }
  }

  /**
   * Initialize starter decrees for a new run
   * Gives player 2 random decrees from the starter pool
   */
  private initializeStarterDecrees(seed: number): void {
    // Offset so this draws differently from the wall shuffle on the same seed.
    const seededRandom = createSeededRandom(seed + 12345)

    const shuffled = [...STARTER_DECREES]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Give player 2 starter decrees
    const starterCount = 2
    for (let i = 0; i < starterCount && i < shuffled.length; i++) {
      this.state.decreeSystem.acquireDecree(shuffled[i])
    }

    if (this.state.tableModifiers.grantRegionalMandate) {
      const owned = new Set(
        this.state.decreeSystem.getOwnedDecrees().map((decree) => decree.id)
      )
      const regional = ALL_DECREES.filter(
        (decree) => decree.rarity === 'RegionalMandate' && !owned.has(decree.id)
      )
      const decree = regional[Math.floor(seededRandom() * regional.length)]
      if (decree) this.state.decreeSystem.acquireDecree(decree)
    }

    // Emit decree acquired events
    const ownedDecrees = this.state.decreeSystem.getOwnedDecrees()
    for (const decree of ownedDecrees) {
      eventBus.emit('decreeAcquired', {
        decreeId: decree.id,
        decreeName: decree.name,
        rarity: decree.rarity,
        source: 'starting',
      })
    }
  }

  /**
   * Start a new run
   */
  startNewRun(
    seed?: number,
    stake: number = 1,
    wallVariant = 'green_felt'
  ): void {
    const actualSeed = seed ?? Date.now()

    // Reset state
    this.state = this.createInitialState()
    // Bamboo Mat is the existing persisted "collect all four Flowers" unlock.
    // Capture its eligibility at run start; loading an old run never rereads it.
    this.state.flowerSystem = new FlowerSystem(
      useProgressionStore.getState().isItemUnlocked('bamboo_mat')
    )
    this.shop.reset()
    this.state.seed = actualSeed
    this.runtimeItemCounter = 0
    runRandom.start(actualSeed)
    this.state.mandateEffectSystem.setSeed(actualSeed)
    this.state.omenSystem.setSeed(actualSeed + 0x0a11ce)
    this.state.stake = stake
    const table = resolveTableRules(wallVariant)
    this.state.tableStyleId = table.id
    this.state.tableModifiers = table.modifiers
    this.state.decreeSystem = new DecreeSystem(
      5 + table.modifiers.decreeSlotModifier
    )
    this.state.seasonSystem = new SeasonSystem(
      table.modifiers.earlyCorruptedSeasons
    )
    this.state.isRunActive = true
    this.state.phase = 'gameplay'

    // Initialize round manager
    this.state.roundManager = new RoundManager(
      stake,
      actualSeed,
      table.modifiers.scoreTargetMultiplier
    )
    this.state.roundManager.startNewRun()

    // Start meta-progression before starter items are granted so they remain in
    // the current-run Archive ledger.
    eventBus.emit('runStart', {
      seed: actualSeed,
      stake,
      wallVariant: table.id,
    })

    // Give starter decrees (2 random from the starter pool)
    this.initializeStarterDecrees(actualSeed)

    // Update target score from round manager
    const roundState = this.state.roundManager.getCurrentRound()
    if (roundState) {
      this.state.targetScore = roundState.scoreTarget
      this.state.currentAct = roundState.actNumber
      this.state.currentRound = roundState.roundNumber
      this.state.omenSystem.setRoundInfo(
        this.state.currentAct,
        this.state.currentRound
      )
    }

    this.state.charterSystem.updateProgress(
      this.state.currentAct,
      this.state.currentRound
    )
    this.state.decreeSystem.onRoundStart()
    this.state.consumableSystem.onRoundStart()

    // Initialize the first round in a ready-to-play state. The Mandate goes
    // first so round resources can see the Decrees it disables.
    this.initializeWall(actualSeed)
    this.applyMandateDebuffs()
    this.initializeRoundResources()
    this.drawStartingHand()

    this.publishWallComposition()
    eventBus.emit('roundStart', {
      actNumber: this.state.currentAct,
      roundNumber: this.state.currentRound,
      roundType: roundState?.roundType ?? 'Small',
      target: this.state.targetScore,
    })

    eventBus.emit('phaseChanged', {
      previousPhase: 'menu',
      newPhase: 'gameplay',
    })
  }

  /** Reset the authoritative run state and return to the menu phase. */
  resetGame(): void {
    const previousPhase = this.state.phase
    this.state = this.createInitialState()
    this.shop.reset()
    this.runtimeItemCounter = 0
    eventBus.emit('phaseChanged', {
      previousPhase,
      newPhase: 'menu',
    })
  }

  /**
   * Calculate the resources granted for the active round.
   *
   * Turns are one budget for Play and REDRAW. Everything that used to grant
   * hands grants Turns. Everything that used to grant discards or redraws
   * grants free redraws instead, which REDRAW spends before a Turn. Every
   * penalty, whatever it used to remove, costs Turns.
   */
  private initializeRoundResources(): void {
    const charterEffects = this.state.charterSystem.calculateEffects()
    const stakePenalty =
      this.state.roundManager.getStakeModifiers().redrawPenalty
    // Amber Acorn's hidden Decrees grant no Turns or redraws this round.
    const hiddenDecrees = this.hiddenDecreeIds()
    const decreeRedrawDelta =
      this.state.decreeSystem.getAdditionalDiscards(hiddenDecrees)
    this.state.deadWallWritUsedThisRound = false
    delete this.state.riichiStatus
    this.state.playsThisRound = 0
    this.state.tilesRedrawnThisRound = 0
    this.state.emergencyTurnsBoughtThisRound = 0
    this.state.honorDiscardsThisRound = 0

    this.state.handsRemaining = Math.max(
      1,
      this.config.handsPerRound +
        charterEffects.additionalHands -
        charterEffects.handsPenalty -
        charterEffects.redrawsPenalty -
        stakePenalty +
        Math.min(0, decreeRedrawDelta) +
        this.state.decreeSystem.getAdditionalDraws(hiddenDecrees)
    )
    this.state.discardsRemaining = 0
    this.state.redrawsRemaining = Math.max(
      0,
      this.config.redrawsPerRound +
        this.config.discardsPerRound +
        this.state.omenRedrawBonus +
        this.state.omenDiscardBonus +
        charterEffects.additionalRedraws +
        Math.max(0, decreeRedrawDelta) +
        this.state.seasonSystem.getAdditionalDiscards()
    )

    // The Water: no REDRAW this round, free or paid.
    if (this.state.roundManager.checkMandateEffect('no_discards').active)
      this.state.redrawsRemaining = 0

    this.state.handsAllowance = this.state.handsRemaining
    this.state.lastHandScore = undefined
  }

  /** Plays made this round, including legacy saves without the counter. */
  private getPlaysThisRound(): number {
    return this.state.playsThisRound ?? 0
  }

  /** Shared tactical/complete sequence permission from Seasons and active Decrees. */
  getPartialHandRules() {
    return {
      allowSequenceSkip:
        this.state.seasonSystem.isHandLegalityLoosened() ||
        this.isDecreeRuleActive('sequence_skip'),
      allowTerminalAnchor:
        !this.areFlowerBonusesSuppressed() &&
        this.state.flowerSystem.hasMutation('bamboo_wild_anchor'),
      allowSequenceOverlap:
        !this.areFlowerBonusesSuppressed() &&
        this.state.flowerSystem.hasMutation('plum_overlap'),
    }
  }

  private getValidationOptions() {
    return {
      ...this.getPartialHandRules(),
      meldMayServeAsPair: this.isDecreeRuleActive('meld_as_pair'),
      wildcardCount: this.isDecreeRuleActive('wildcard_tile') ? 1 : 0,
      suitsMatchForSequences: this.isDecreeRuleActive('suits_match'),
    }
  }

  /**
   * Reality Warp: every tile counts as every suit and rank, so any fourteen
   * tiles already form a winning hand.
   *
   * The decomposition is built directly rather than searched. With no tile
   * identity left to constrain it, a search would grind through equivalent
   * permutations to reach the same answer this returns immediately.
   */
  private parseAsAllWild(tiles: Tile[]): ParsedHand | null {
    if (!this.isDecreeRuleActive('all_wild')) return null
    if (tiles.length !== 14) return null

    const melds: Meld[] = []
    for (let i = 0; i < 4; i++) {
      melds.push(
        new Meld(MeldType.Triplet, tiles.slice(i * 3, i * 3 + 3), true)
      )
    }

    return {
      melds,
      pair: new Meld(MeldType.Pair, tiles.slice(12, 14), true),
      waitType: WaitType.Tanki,
      winningTile: tiles[tiles.length - 1],
      isConcealed: true,
    }
  }

  private getHandSizeLimit(): number {
    return Math.max(
      2,
      this.config.startingHandSize +
        this.state.charterSystem.calculateEffects().handSizeBonus -
        this.state.voidScriptSystem.getHandSizePenalty() +
        this.state.omenHandSizeBonus -
        this.state.mandateEffectSystem.getHandSizeReduction() +
        this.state.decreeSystem.getHandSizeBonus(this.hiddenDecreeIds()) +
        this.state.seasonSystem.getDrawBonus()
    )
  }

  /**
   * Decrees Amber Acorn hid for the whole round. Round resources skip them;
   * Crimson Heart's per-hand pick does not reach these.
   */
  private hiddenDecreeIds(): Set<string> {
    return new Set(this.state.mandateEffectSystem.getHiddenDecreeIds())
  }

  private publishBuildProgress(): void {
    if (this.actionDepth > 0 || !this.state.isRunActive) return
    const decrees = this.state.decreeSystem.getOwnedDecrees()
    eventBus.emit('buildProgressChanged', {
      decreeCount: decrees.length,
      editionDecreeCount: decrees.filter((decree) => Boolean(decree.edition))
        .length,
      handSizeLimit: this.getHandSizeLimit(),
    })
  }

  private publishWallComposition(): void {
    // Only settled operations count; a Script may remove and create tiles.
    if (this.actionDepth > 0) return
    eventBus.emit('wallCompositionChanged', {
      tileCount: this.state.wallTemplate.length,
    })
  }

  /** Resolve a Decree rule while respecting per-hand mandate suppression. */
  private isDecreeRuleActive(ruleId: string): boolean {
    return (
      this.state.decreeSystem.getRuleContributions(
        ruleId,
        new Set(this.state.mandateEffectSystem.getDisabledDecreeIds())
      ).length > 0
    )
  }

  /** Apply the current Boss Mandate to this round's tile instances. */
  private applyMandateDebuffs(): void {
    this.state.debuffSystem.clearAllDebuffs()
    this.state.mandateEffectSystem.deactivateMandate()
    const allTiles = [...this.state.wall, ...this.state.deadWall]
    const round = this.state.roundManager.getCurrentRound()
    const mandate = round?.bossMandate

    if (!mandate) return

    const definition = getMandateById(mandate.id)
    if (definition) {
      this.state.mandateEffectSystem.activateMandate(
        definition,
        allTiles,
        this.state.decreeSystem.getOwnedDecrees(),
        this.state.patternPlayCounts
      )
    }

    if (mandate.effect.type === 'debuff_suit' && mandate.effect.target) {
      this.state.debuffSystem.applyMandateRestriction(
        allTiles,
        mandate.effect.target
      )
      return
    }

    if (mandate.effect.type === 'debuff_tile_type') {
      for (const tile of allTiles) {
        if (isFaceDebuffTarget(mandate.effect, tile)) {
          this.state.debuffSystem.debuffTile(tile.id, {
            type: 'mandate',
            mandateId: mandate.id,
          })
        }
      }
      return
    }

    if (mandate.effect.type === 'debuff_used_tiles') {
      for (const tile of allTiles) {
        if (this.state.roundManager.wasTileUsed(tile.id)) {
          this.state.debuffSystem.debuffTile(tile.id, {
            type: 'mandate',
            mandateId: mandate.id,
          })
        }
      }
    }
  }

  /**
   * Initialize the tile wall
   */
  private initializeWall(seed: number): void {
    // The wall composition persists for the run so pack additions and tile
    // transformations survive the round reshuffle.
    if (this.state.wallTemplate.length === 0) {
      this.state.wallTemplate = applyTableStartingEnhancements(
        this.createFullTileSet(),
        this.state.tableStyleId
      )
    }

    // Shuffle with seed
    const shuffled =
      this.state.tableModifiers.flowerRateMultiplier === 1
        ? this.seededShuffle(this.state.wallTemplate, seed)
        : flowerWeightedWall(
            this.state.wallTemplate,
            this.state.tableModifiers.flowerRateMultiplier,
            createSeededRandom(seed)
          )

    // Separate dead wall (last 14 tiles)
    const deadWallSize = 14
    this.state.deadWall = shuffled.slice(-deadWallSize)
    this.state.wall = shuffled.slice(0, -deadWallSize)
    this.state.summerReserve = []
    this.state.bambooSummerProtection = false
    this.state.drawIndex = 0
    this.state.discards = []
  }

  /**
   * Create full 144-tile set
   */
  private createFullTileSet(): Tile[] {
    const tiles: Tile[] = []
    let idCounter = 0

    const generateId = () => `tile_${idCounter++}`

    // Numbered suits (1-9, 4 copies each)
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    for (const suit of suits) {
      for (let rank = 1; rank <= 9; rank++) {
        for (let copy = 0; copy < 4; copy++) {
          tiles.push(new Tile(suit, rank, generateId()))
        }
      }
    }

    // Winds (4 copies each)
    const winds = [WindType.East, WindType.South, WindType.West, WindType.North]
    for (const wind of winds) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push(Tile.createWind(wind, generateId()))
      }
    }

    // Dragons (4 copies each)
    const dragons = [DragonType.White, DragonType.Green, DragonType.Red]
    for (const dragon of dragons) {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push(Tile.createDragon(dragon, generateId()))
      }
    }

    // Flowers (1 copy each)
    const flowers = [
      FlowerType.Plum,
      FlowerType.Orchid,
      FlowerType.Chrysanthemum,
      FlowerType.Bamboo,
    ]
    for (const flower of flowers) {
      tiles.push(Tile.createFlower(flower, generateId()))
    }

    // Seasons (1 copy each)
    const seasons = [
      SeasonType.Spring,
      SeasonType.Summer,
      SeasonType.Autumn,
      SeasonType.Winter,
    ]
    for (const season of seasons) {
      tiles.push(Tile.createSeason(season, generateId()))
    }

    return this.state.tableModifiers.flowersDisabled
      ? tiles.filter((tile) => !tile.isFlower)
      : tiles
  }

  /** Seeded shuffle, so the same seed always deals the same wall. */
  private seededShuffle<T>(array: T[], seed: number): T[] {
    const result = [...array]
    const random = createSeededRandom(seed)

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }

    return result
  }

  /**
   * Draw starting hand
   */
  private drawStartingHand(): void {
    const cycle: DrawCycle = { orchidReplacements: 0, drawnTiles: [] }
    this.state.handTiles = []
    this.state.faceDownTileIds.clear()

    for (let i = 0; i < this.getHandSizeLimit(); i++) {
      const tile = this.drawTileInternal()
      if (tile) {
        // Handle bonus tiles
        if (tile.isFlower || tile.isSeason) {
          this.handleBonusTile(tile, cycle)
        } else {
          this.collectDrawnTile(tile, cycle)
        }
      }
    }

    this.resolveOrchidDraws(cycle, [], false)
    // Sort hand
    this.state.handTiles.sort(Tile.compare)
    this.applyMandateDrawState(cycle.drawnTiles, [], {
      isStartingHand: true,
    })
    this.publishBuildProgress()
  }

  /**
   * Draw a tile from the wall (internal)
   */
  private drawTileInternal(): Tile | null {
    return takeWallTile(
      this.state,
      this.state.seasonSystem.areDrawsRandomized()
    )
  }

  /**
   * Draw from dead wall
   */
  private drawFromDeadWall(): Tile | null {
    return takeDeadWallTile(
      this.state,
      this.state.seasonSystem.areDrawsRandomized()
    )
  }

  /** Draw without settling a second Mandate cycle. Targets can grow mid-chain. */
  private drawToHandSize(
    target: () => number,
    effects: Effect[],
    cycle: DrawCycle,
    announceTiles: boolean = true
  ): void {
    while (this.state.handTiles.length < target()) {
      const tile = this.drawTileInternal()

      if (!tile) {
        // No more tiles in wall
        break
      }

      // Check for bonus tile
      if (tile.isFlower || tile.isSeason) {
        this.handleBonusTile(tile, cycle)
        if (announceTiles)
          effects.push({
            type: 'bonus_tile_drawn',
            description: `Drew bonus tile: ${tile.displayName}`,
            tile,
            isFlower: tile.isFlower,
          })
        // Bonus tiles don't count toward hand size, continue drawing
      } else {
        this.collectDrawnTile(tile, cycle)

        if (announceTiles)
          effects.push({
            type: 'tile_added',
            description: `Drew tile: ${tile.displayName}`,
            tile,
          })

        if (announceTiles)
          eventBus.emit('tileDrawn', {
            tileId: tile.id,
            tilesRemaining: this.state.wall.length - this.state.drawIndex,
          })
      }
    }
  }

  /** A newly drawn Spring fills only its new spaces, not other missing tiles.
   * Redraw calls this before shuffling returned tiles back into the live wall.
   */
  private fillNewSeasonSlots(
    beforeLimit: number,
    effects: Effect[],
    cycle: DrawCycle,
    announceTiles = true
  ): void {
    const countBeforeBonus = this.state.handTiles.length
    this.drawToHandSize(
      () =>
        Math.min(
          this.getHandSizeLimit(),
          countBeforeBonus + Math.max(0, this.getHandSizeLimit() - beforeLimit)
        ),
      effects,
      cycle,
      announceTiles
    )
  }

  /** Refill to the current rack capacity, including Spring drawn mid-cycle. */
  private refillHand(
    effects: Effect[],
    afterHandPlay: boolean = false,
    plumRecovery: string[] = []
  ): void {
    const cycle: DrawCycle = { orchidReplacements: 0, drawnTiles: [] }
    this.drawToHandSize(() => this.getHandSizeLimit(), effects, cycle)
    this.resolveOrchidDraws(cycle, effects)
    this.recoverPlumTiles(plumRecovery, effects)
    this.state.handTiles.sort(Tile.compare)
    this.applyMandateDrawState(cycle.drawnTiles, effects, { afterHandPlay })
  }

  /** Resolve the documented post-play/discard draw rule for the active mandate. */
  private refillAfterCycle(
    effects: Effect[],
    afterHandPlay: boolean = false,
    plumRecovery: string[] = []
  ): void {
    const fixedDrawCount = this.state.mandateEffectSystem.getFixedDrawCount()
    if (fixedDrawCount === null) {
      this.refillHand(effects, afterHandPlay, plumRecovery)
      return
    }

    const beforeLimit = this.getHandSizeLimit()
    const cycle: DrawCycle = { orchidReplacements: 0, drawnTiles: [] }

    for (let i = 0; i < fixedDrawCount; i++) {
      const tile = this.drawTileInternal()
      if (!tile) break

      if (tile.isFlower || tile.isSeason) {
        this.handleBonusTile(tile, cycle)
        effects.push({
          type: 'bonus_tile_drawn',
          description: `Drew bonus tile: ${tile.displayName}`,
          tile,
          isFlower: tile.isFlower,
        })
      } else {
        this.collectDrawnTile(tile, cycle)
        effects.push({
          type: 'tile_added',
          description: `Drew tile: ${tile.displayName}`,
          tile,
        })
        eventBus.emit('tileDrawn', {
          tileId: tile.id,
          tilesRemaining: this.state.wall.length - this.state.drawIndex,
        })
      }
    }

    this.fillNewSeasonSlots(beforeLimit, effects, cycle)
    this.resolveOrchidDraws(cycle, effects)
    this.recoverPlumTiles(plumRecovery, effects)
    this.state.handTiles.sort(Tile.compare)
    this.applyMandateDrawState(cycle.drawnTiles, effects, { afterHandPlay })
  }

  /** Apply hidden-information and post-draw mandate effects to a draw cycle. */
  private applyMandateDrawState(
    drawnTiles: Tile[],
    effects: Effect[],
    context: { isStartingHand?: boolean; afterHandPlay?: boolean } = {}
  ): void {
    if (drawnTiles.length === 0) return

    for (const tile of drawnTiles) {
      if (this.state.mandateEffectSystem.shouldTileBeFaceDown(tile, context)) {
        this.state.faceDownTileIds.add(tile.id)
      }
    }

    this.applyPostDrawMandate(drawnTiles[drawnTiles.length - 1], effects)
  }

  /**
   * Handle bonus tile (flower or season)
   */
  private handleBonusTile(tile: Tile, cycle: DrawCycle): void {
    if (tile.isFlower) {
      const previousBonusSlots = this.state.flowerSystem.getBonusDecreeSlots()
      // FlowerSystem.addFlower expects a Tile object
      this.state.flowerSystem.addFlower(tile)
      const nextBonusSlots = this.state.flowerSystem.getBonusDecreeSlots()
      for (let i = previousBonusSlots; i < nextBonusSlots; i++) {
        this.state.decreeSystem.addSlot()
      }
      eventBus.emit('flowerCollected', {
        flowerType: String(tile.flowerType ?? 'plum'),
        totalFlowers: this.state.flowerSystem.getFlowerCount(),
      })
    } else if (tile.isSeason) {
      const previousAutumnDiscards =
        this.state.seasonSystem.getAdditionalDiscards()
      const lockedSeason = this.state.omenSystem.applyLockedSeason()
      const season = this.state.seasonSystem.addSeason(
        tile,
        lockedSeason ?? undefined
      )
      applySeasonWallEffect(this.state, season)
      // Autumn's extra discard is a free REDRAW now (none under The Water).
      if (!this.state.roundManager.checkMandateEffect('no_discards').active)
        this.state.redrawsRemaining +=
          this.state.seasonSystem.getAdditionalDiscards() -
          previousAutumnDiscards
      if (season?.isCorrupted && season.corruptedType) {
        eventBus.emit('seasonCorrupted', {
          corruptedType: season.corruptedType,
          effect: season.corruptedEffect?.description ?? '',
        })
      }
      eventBus.emit('seasonActivated', {
        seasonType: lockedSeason ?? String(tile.seasonType ?? 'spring'),
        effect: 'Season effect activated',
      })
    }

    eventBus.emit('bonusTileDrawn', {
      tileId: tile.id,
      tileType: tile.isFlower ? 'flower' : 'season',
      replacementDrawn: true,
    })

    // Draw replacement from dead wall
    const replacement = this.drawFromDeadWall()
    if (replacement) {
      if (replacement.isFlower || replacement.isSeason) {
        this.handleBonusTile(replacement, cycle)
      } else {
        this.collectDrawnTile(replacement, cycle)
        this.state.handTiles.sort(Tile.compare)
      }
    }
  }

  /** Credits are earned at the actual draw, never retroactively by a later
   * Flower/Season in the batch. Bonus draws cannot recursively earn credits. */
  private collectDrawnTile(tile: Tile, cycle: DrawCycle): void {
    this.state.handTiles.push(tile)
    cycle.drawnTiles.push(tile)
    if (
      !cycle.resolvingOrchid &&
      tile.isHonor &&
      !tile.isStone &&
      this.state.flowerSystem.hasFlowerType('Orchid') &&
      !this.areFlowerBonusesSuppressed() &&
      this.state.seasonSystem
        .getSeasonStack()
        .some((season) => season.type === 'Spring' && !season.isCorrupted)
    )
      cycle.orchidReplacements++
  }

  /** Finish ordinary draws first so the extra tiles are a real selection
   * advantage, not replacements for slots the normal refill would fill anyway.
   * Earned credits survive later suppression in this same batch. */
  private resolveOrchidDraws(
    cycle: DrawCycle,
    effects: Effect[],
    announceTiles = true
  ): void {
    const credits = cycle.orchidReplacements
    if (!credits) return
    cycle.orchidReplacements = 0
    cycle.resolvingOrchid = true
    const beforeLimit = this.getHandSizeLimit()
    const previousIds = new Set(this.state.handTiles.map((tile) => tile.id))
    for (let i = 0; i < credits; i++) {
      const tile = this.drawFromDeadWall()
      if (!tile) break
      if (tile.isBonus) this.handleBonusTile(tile, cycle)
      else this.collectDrawnTile(tile, cycle)
    }
    // A Spring reached through Orchid still grants its ordinary new spaces;
    // those downstream draws are part of the non-chaining Orchid resolution.
    this.fillNewSeasonSlots(beforeLimit, effects, cycle, false)
    const drawn = this.state.handTiles.filter(
      (tile) => !previousIds.has(tile.id)
    )
    if (drawn.length) {
      effects.push({
        type: 'bonus_activated',
        description: `Orchid drew ${drawn.length} extra tiles during Spring`,
      })
      if (announceTiles)
        for (const tile of drawn) {
          effects.push({
            type: 'tile_added',
            description: `Orchid drew ${tile.displayName}`,
            tile,
          })
          eventBus.emit('tileDrawn', {
            tileId: tile.id,
            tilesRemaining: this.state.wall.length - this.state.drawIndex,
          })
        }
      eventBus.emit('orchidBloom', { count: drawn.length })
    }
  }

  // ===========================================================================
  // ACTION PROCESSING
  // ===========================================================================

  /**
   * Process a player action
   */
  processAction(action: PlayerAction): ActionResult {
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') {
      return {
        success: false,
        effects: [],
        errors: ['Gameplay actions are only available during an active round'],
      }
    }

    // Create state snapshot for validation
    const snapshot = this.createStateSnapshot()

    // Validate action
    const validation =
      action.type === 'play'
        ? this.validatePlaySelection(action.tileIds)
        : action.type === 'buyTurn'
          ? this.validateEmergencyTurn()
          : action.type === 'adTurn'
            ? this.validateAdTurn()
          : action.type === 'useSeal' ||
            action.type === 'useScript' ||
            action.type === 'useOrb'
          ? this.validateConsumableAction(action)
          : this.actionProcessor.validate(action, snapshot)
    if (!validation.isValid) {
      return {
        success: false,
        effects: [],
        errors: validation.errors,
      }
    }

    // Publish after every effect has settled. Nested generated acquisitions
    // must not award unlocks from a temporary intermediate inventory.
    this.actionDepth++
    let result: ActionResult
    try {
      result = this.executeAction(action)
    } finally {
      this.actionDepth--
    }
    if (result.success) {
      this.publishBuildProgress()
      // Include a final play's destruction even if it ended the run.
      this.publishWallComposition()
    }
    return result
  }

  /**
   * Create state snapshot for action validation
   */
  private createStateSnapshot(): GameStateSnapshot {
    return {
      roundType: this.state.roundManager.getCurrentRound()?.roundType ?? null,
      handTiles: this.state.handTiles,
      handSizeLimit: this.getHandSizeLimit(),
      melds: this.state.melds,
      selectedTileIds: Array.from(this.state.selectedTileIds),
      wallRemaining: this.state.wall.length - this.state.drawIndex,
      deadWallRemaining: this.state.deadWall.length,
      redrawReplacementCapacity: this.getRedrawReplacementCapacity(
        this.state.handTiles.length
      ),
      mandateRestrictions: {
        lockedTileIds: this.state.mandateEffectSystem.getLockedTileIds(),
        noDiscards:
          this.state.roundManager.checkMandateEffect('no_discards').active,
      },
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
      currentScore: this.state.score,
      targetScore: this.state.targetScore,
      gold: this.state.gold,
      fateSealIds: this.state.fateSeals.flatMap((seal) => [
        seal.instanceId,
        seal.id,
      ]),
      celestialOrbIds: this.state.celestialOrbs.flatMap((orb) => [
        orb.instanceId,
        orb.id,
      ]),
      voidScriptIds: this.state.voidScripts.flatMap((script) => [
        script.instanceId,
        script.id,
      ]),
    }
  }

  /**
   * Execute a validated action
   */
  private executeAction(action: PlayerAction): ActionResult {
    const effects: Effect[] = []

    switch (action.type) {
      case 'draw':
        return this.executeDraw(effects)

      case 'play':
        return this.executePlay(action.tileIds, effects)

      case 'redraw':
        return this.executeRedraw(action.tileIds, effects)

      case 'buyTurn':
        return this.executeBuyTurn(effects)

      case 'adTurn':
        return this.executeAdTurn(effects)

      case 'useSeal':
        return this.executeUseSeal(action.sealId, action.targets, effects)

      case 'useOrb':
        return this.executeUseOrb(action.orbId, effects)

      case 'useScript':
        return this.executeUseScript(action.scriptId, action.targets, effects)

      default:
        return { success: false, effects, errors: ['Unknown action type'] }
    }
  }

  /**
   * The emergency Turn on offer right now, or null when there is none: it is
   * sold only on Red Stake and above, on the last Turn of a round, from Act 2
   * on. `affordable` is false when the player is short of Gold, so the offer
   * can still be shown.
   */
  getEmergencyTurnOffer(): {
    cost: number
    affordable: boolean
    /** Short of Gold, the Turn may be taken for a rewarded ad instead. */
    adAvailable: boolean
  } | null {
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') return null
    if (this.state.stake < EMERGENCY_TURN_FIRST_STAKE) return null
    if (this.state.currentAct < EMERGENCY_TURN_FIRST_ACT) return null
    if (this.state.handsRemaining !== 1) return null
    if (this.state.score >= this.state.targetScore) return null
    const cost = emergencyTurnCost(
      this.state.currentAct,
      this.state.emergencyTurnsBoughtThisRound ?? 0
    )
    const affordable = this.state.gold >= cost
    const adTurnsThisAct =
      this.state.adTurns?.actNumber === this.state.currentAct
        ? this.state.adTurns.count
        : 0
    return {
      cost,
      affordable,
      adAvailable: !affordable && adTurnsThisAct < AD_TURNS_PER_ACT,
    }
  }

  private validateAdTurn(): ValidationResult {
    const offer = this.getEmergencyTurnOffer()
    if (!offer?.adAvailable)
      return {
        isValid: false,
        errors: [
          `An extra Turn for an ad is available only when Gold is short, ${AD_TURNS_PER_ACT} per Act`,
        ],
      }
    return { isValid: true, errors: [] }
  }

  /** One more Turn this round, for a rewarded ad the player watched. */
  private executeAdTurn(effects: Effect[]): ActionResult {
    const act = this.state.currentAct
    this.state.handsRemaining += 1
    this.state.handsAllowance += 1
    this.state.adTurns = {
      actNumber: act,
      count:
        (this.state.adTurns?.actNumber === act
          ? this.state.adTurns.count
          : 0) + 1,
    }
    effects.push({
      type: 'round_state_changed',
      description: 'Emergency Turn granted for a rewarded ad',
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
    })
    eventBus.emit('goldChanged', {
      previousGold: this.state.gold,
      newGold: this.state.gold,
      delta: 0,
      reason: 'Emergency Turn (ad)',
    })
    return { success: true, effects }
  }

  private validateEmergencyTurn(): ValidationResult {
    const offer = this.getEmergencyTurnOffer()
    if (!offer)
      return {
        isValid: false,
        errors: [
          `An extra Turn can be bought only on Stake ${EMERGENCY_TURN_FIRST_STAKE} or higher, on the last Turn of a round, from Act ${EMERGENCY_TURN_FIRST_ACT}`,
        ],
      }
    if (!offer.affordable)
      return {
        isValid: false,
        errors: [`An extra Turn costs ${offer.cost} Gold`],
      }
    return { isValid: true, errors: [] }
  }

  /** Spend Gold for one more Turn this round. */
  private executeBuyTurn(effects: Effect[]): ActionResult {
    const { cost } = this.getEmergencyTurnOffer()!
    const previousGold = this.state.gold
    this.state.gold -= cost
    this.state.handsRemaining += 1
    this.state.handsAllowance += 1
    this.state.emergencyTurnsBoughtThisRound =
      (this.state.emergencyTurnsBoughtThisRound ?? 0) + 1
    effects.push({
      type: 'gold_changed',
      description: `Emergency Turn bought for ${cost} Gold`,
      delta: -cost,
      newTotal: this.state.gold,
    })
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: -cost,
      reason: 'Emergency Turn',
    })
    return { success: true, effects }
  }

  /**
   * Execute draw action
   */
  private executeDraw(effects: Effect[]): ActionResult {
    const cycle: DrawCycle = { orchidReplacements: 0, drawnTiles: [] }
    const beforeLimit = this.getHandSizeLimit()
    const tile = this.drawTileInternal()

    if (!tile) {
      return {
        success: false,
        effects,
        errors: ['No tiles remaining in wall'],
      }
    }

    // Check for bonus tile
    if (tile.isFlower || tile.isSeason) {
      this.handleBonusTile(tile, cycle)
      effects.push({
        type: 'bonus_tile_drawn',
        description: `Drew bonus tile: ${tile.displayName}`,
        tile,
        isFlower: tile.isFlower,
      })

      // After handling bonus tile, the hand already has a replacement
    } else {
      this.collectDrawnTile(tile, cycle)
      this.state.handTiles.sort(Tile.compare)

      effects.push({
        type: 'tile_added',
        description: `Drew tile: ${tile.displayName}`,
        tile,
      })
    }

    eventBus.emit('tileDrawn', {
      tileId: tile.id,
      tilesRemaining: this.state.wall.length - this.state.drawIndex,
    })

    this.fillNewSeasonSlots(beforeLimit, effects, cycle)
    this.resolveOrchidDraws(cycle, effects)
    this.state.handTiles.sort(Tile.compare)
    this.applyMandateDrawState(cycle.drawnTiles, effects)

    return { success: true, effects }
  }

  /**
   * Return whether the selected tiles resolve as a complete hand under the
   * run's active rule-changing Decrees.
   */
  isCompleteHand(tileIds: string[]): boolean {
    const selectedTiles = this.state.handTiles.filter((tile) =>
      tileIds.includes(tile.id)
    )
    if (selectedTiles.length !== new Set(tileIds).size) return false

    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]

    return this.resolveCompleteHand(tilesToScore) !== null
  }

  /** A visible, legal declaration to stage; never spends resources or selects tiles.
   * Enlarged racks retain their spare tiles. The first accepted shape is stable,
   * not a promise of the maximum-scoring interpretation or physical copies.
   */
  findCompleteHandSelection(genuineOnly = false): string[] | null {
    if (
      !this.state.isRunActive ||
      this.state.phase !== 'gameplay' ||
      this.state.handsRemaining < 1
    )
      return null
    const visible = this.state.handTiles.filter(
      (tile) => !tile.isBonus && !this.state.faceDownTileIds.has(tile.id)
    )
    const required = this.state.mandateEffectSystem.getLockedTileIds()
    if (required.some((id) => !visible.some((t) => t.id === id))) return null
    const fixed = this.state.roundManager.checkMandateEffect('fixed_hand_size')
    if ((fixed.active && Number(fixed.value) < 11) || required.length > 14)
      return null
    const accept = (ids: string[]) =>
      this.isCompleteHand(ids) &&
      (!genuineOnly || this.isGenuineConcealedSelection(ids)) &&
      this.validatePlaySelection(ids).isValid
    const all = visible.map((tile) => tile.id)
    if (all.length <= 14 && accept(all)) return all
    const options = this.getValidationOptions()
    const minimum =
      (options.meldMayServeAsPair ? 12 : 14) -
      Number(options.allowSequenceOverlap)
    const oneAway =
      !genuineOnly &&
      (this.isDecreeRuleActive('shanten_clemency') ||
        this.state.voidScriptSystem.isShantenScoringAllowed())
    if (visible.length < minimum - Number(oneAway)) return null
    if (this.isDecreeRuleActive('all_wild') && visible.length >= 14) {
      const chosen = [...visible]
        .sort(
          (a, b) =>
            Number(required.includes(b.id)) - Number(required.includes(a.id))
        )
        .slice(0, 14)
      const ids = visible.filter((t) => chosen.includes(t)).map((t) => t.id)
      if (accept(ids)) return ids
    }
    const physical = new Set(all)
    const seen = new Set<string>()
    const search = (pool: Tile[], extraRequired: string[] = []) =>
      findCompleteHandSubset(
        pool,
        (ids) => {
          const played = ids.filter((id) => physical.has(id))
          const key = JSON.stringify(played)
          if (seen.has(key)) return false
          seen.add(key)
          return accept(played)
        },
        [...required, ...extraRequired],
        options
      )?.filter((id) => physical.has(id)) ?? null
    const variants = this.isDecreeRuleActive('honor_as_suited')
      ? [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu].map((suit) =>
          visible.map((tile) =>
            tile.isHonor
              ? new Tile(suit, tile.rank, tile.id, tile.isRed, tile.modifiers)
              : tile
          )
        )
      : [visible]
    const withWildcard = (
      pool: Tile[],
      extraRequired: string[] = []
    ): string[] | null => {
      const natural = search(pool, extraRequired)
      if (natural || !options.wildcardCount) return natural
      // Equal physical faces are structurally interchangeable. Preserve a
      // required copy when choosing which one may impersonate another face.
      const replacedTypes = new Set<string>()
      const ordered = [...pool].sort(
        (a, b) =>
          Number(required.includes(b.id)) - Number(required.includes(a.id))
      )
      for (const tile of ordered) {
        if (!physical.has(tile.id) || replacedTypes.has(tile.typeKey)) continue
        replacedTypes.add(tile.typeKey)
        for (const [suit, maximum] of REGULAR_TILE_TYPES)
          for (let rank = 1; rank <= maximum; rank++) {
            if (tile.suit === suit && tile.rank === rank) continue
            const found = search(
              pool.map((other) =>
                other.id === tile.id
                  ? new Tile(suit, rank, tile.id, tile.isRed, tile.modifiers)
                  : other
              ),
              [...extraRequired, tile.id]
            )
            if (found) return found
          }
      }
      return null
    }
    for (const variant of variants) {
      const found = withWildcard(variant)
      if (found) return found
    }
    if (oneAway)
      for (const variant of variants)
        for (const [suit, maximum] of REGULAR_TILE_TYPES)
          for (let rank = 1; rank <= maximum; rank++) {
            let id = `subset-completion-${suit}-${rank}`
            while (physical.has(id)) id += '-virtual'
            const found = withWildcard(
              [...variant, new Tile(suit, rank, id)],
              [id]
            )
            if (found) return found
          }
    return null
  }

  /** Read-only explanation of the exact declaration, never of concealed faces. */
  inspectCompleteHand(tileIds: string[]): CompleteHandInterpretation | null {
    const ids = new Set(tileIds)
    const physical = this.state.handTiles.filter((tile) => ids.has(tile.id))
    if (
      ids.size !== tileIds.length ||
      physical.length !== ids.size ||
      physical.some((tile) => this.state.faceDownTileIds.has(tile.id))
    )
      return null
    const scoringTiles = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(physical)
      : physical
    const complete = this.resolveCompleteHand(scoringTiles)
    if (!complete) return null
    return {
      naturalComplete: validateHand(new Hand(physical)).isComplete,
      substitutions: physical.flatMap((tile) => {
        const effective = complete.tilesToScore.find(
          (other) => other.id === tile.id
        )
        return effective && effective.typeKey !== tile.typeKey
          ? [{ physical: tile, effective }]
          : []
      }),
      completionTile: complete.tilesToScore.find((tile) => !ids.has(tile.id)),
      usedShantenClemency: complete.usedShantenClemency,
      allWild: this.parseAsAllWild(scoringTiles) !== null,
    }
  }

  /**
   * Side-effect-free legality shared by forecasts, controls, and committed plays.
   * Shape recognition (`isCompleteHand`) is deliberately separate: recognizing
   * Mahjong does not exempt a selection from this round's boss restrictions.
   */
  validatePlaySelection(tileIds: string[]): ValidationResult {
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') {
      return {
        isValid: false,
        errors: ['Gameplay actions are only available during an active round'],
      }
    }
    const basic = this.actionProcessor.validate(
      { type: 'play', tileIds },
      this.createStateSnapshot()
    )
    if (!basic.isValid) return basic

    const errors: string[] = []
    const fixed = this.state.roundManager.checkMandateEffect('fixed_hand_size')
    if (fixed.active && tileIds.length !== fixed.value) {
      errors.push(`Boss Mandate: Must play exactly ${fixed.value} tiles`)
    }
    const single = this.state.roundManager.checkMandateEffect('single_hand')
    if (single.active && this.getPlaysThisRound() > 0) {
      errors.push('Boss Mandate: Only one Play allowed this round')
    }
    const mandate = this.state.mandateEffectSystem.validateHandPlay(tileIds)
    if (!mandate.valid)
      errors.push(mandate.error ?? 'Boss Mandate blocks this play')
    if (
      tileIds.length > MAX_TACTICAL_PLAY_TILES &&
      !this.isCompleteHand(tileIds)
    ) {
      errors.push(
        `A play that is not a complete Mahjong hand can use at most ${MAX_TACTICAL_PLAY_TILES} tiles.`
      )
    }
    return { isValid: errors.length === 0, errors }
  }

  private isGenuineConcealedSelection(tileIds: string[]): boolean {
    const tiles = this.state.handTiles.filter((tile) =>
      tileIds.includes(tile.id)
    )
    const complete = this.resolveCompleteHand(
      this.isDecreeRuleActive('honor_as_suited')
        ? this.transmuteHonorsToDominantSuit(tiles)
        : tiles
    )
    return Boolean(
      complete &&
      !complete.usedShantenClemency &&
      !complete.completedBy &&
      complete.parsedHand.isConcealed &&
      this.state.melds.every((meld) => meld.isConcealed)
    )
  }

  /**
   * Score a prospective selection without playing it.
   *
   * Runs the same pipeline the play itself will run - the same partial parse,
   * the same Decrees, modifiers, Flowers, Seasons and Orbs - so the number the
   * player sees before committing is the number they get. Chance-based tile
   * effects resolve to their guaranteed outcome, making the preview a floor
   * rather than a promise the roll might not keep.
   *
   * Returns null when the selection can't be scored. Incomplete tactical
   * plays are limited to five tiles; larger selections must form a complete
   * hand under the active rules.
   */
  previewScore(
    tileIds: string[]
  ): (ScoreBreakdown & { equation: ScoreEquation }) | null {
    if (!this.validatePlaySelection(tileIds).isValid) return null
    const selectedTiles = this.state.handTiles.filter((tile) =>
      tileIds.includes(tile.id)
    )
    if (selectedTiles.length < 2) return null

    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]

    const completeHand = this.resolveCompleteHand(tilesToScore)

    if (completeHand) {
      const complete = this.calculateHandScore(
        completeHand.tilesToScore,
        completeHand.parsedHand,
        undefined,
        true,
        !completeHand.usedShantenClemency &&
          !completeHand.completedBy &&
          completeHand.parsedHand.isConcealed
      )
      if (completeHand.usedShantenClemency) {
        complete.finalScore = Math.floor(complete.finalScore * 0.5)
      }
      if (this.state.voidScriptSystem.isBaseScoreHalved()) {
        complete.finalScore = Math.floor(complete.finalScore / 2)
      }
      this.applyOmenScoreBonuses(complete, true)
      return complete
    }

    if (selectedTiles.length > MAX_TACTICAL_PLAY_TILES) return null

    const parse = parsePlay(tilesToScore, this.getPartialHandRules())
    const partial = this.calculateHandScore(
      tilesToScore,
      toPartialParsedHand(parse, tilesToScore),
      parse.groups,
      true
    )
    if (this.state.voidScriptSystem.isBaseScoreHalved()) {
      partial.finalScore = Math.floor(partial.finalScore / 2)
    }
    this.applyOmenScoreBonuses(partial, true)
    return partial
  }

  private resolveCompleteHand(tilesToScore: Tile[]): {
    parsedHand: ParsedHand
    tilesToScore: Tile[]
    usedShantenClemency: boolean
    /** A Void Script, not the tiles, made this hand complete. */
    completedBy?: 'script_of_eclipse' | 'script_of_silence'
  } | null {
    const validationOptions = this.getValidationOptions()
    const hand = new Hand()
    for (const tile of tilesToScore) {
      hand.addTile(tile)
    }

    const validation = validateHand(hand, undefined, validationOptions)
    const allWild = this.parseAsAllWild(tilesToScore)
    const parsedHand =
      allWild ??
      (validation.parsedHands.length > 0 ? validation.parsedHands[0] : null)

    if (parsedHand) {
      const effectiveById = new Map(
        allWild
          ? undefined
          : validation.effectiveTiles?.map((tile) => [tile.id, tile])
      )
      return {
        parsedHand,
        // Preserve physical play order while scoring the same interpretation
        // used by the meld/Yaku parser. Never rewrite the rack or saved wall.
        tilesToScore: tilesToScore.map(
          (tile) => effectiveById.get(tile.id) ?? tile
        ),
        usedShantenClemency: false,
      }
    }

    // Eclipse completes the same way as Shanten Clemency, without its
    // penalty, so it is tried first.
    const eclipse = this.state.voidScriptSystem.isShantenScoringAllowed()
    const completion =
      eclipse || this.isDecreeRuleActive('shanten_clemency')
        ? findOneAwayCompletion(
            tilesToScore,
            this.state.melds,
            validationOptions
          )
        : null
    if (completion) {
      const effectiveById = new Map(
        completion.effectiveTiles?.map((tile) => [tile.id, tile])
      )
      return {
        parsedHand: completion.parsedHand,
        tilesToScore: [...tilesToScore, completion.completionTile].map(
          (tile) => effectiveById.get(tile.id) ?? tile
        ),
        usedShantenClemency: !eclipse,
        completedBy: eclipse ? 'script_of_eclipse' : undefined,
      }
    }

    if (!this.state.voidScriptSystem.isMeldValidationBypassed()) return null
    const loose = findLooseGroupCompletion(
      tilesToScore,
      this.state.melds,
      validationOptions
    )
    if (!loose) return null
    return {
      parsedHand: loose.parsedHand,
      tilesToScore,
      usedShantenClemency: false,
      completedBy: 'script_of_silence',
    }
  }

  /**
   * Execute play action (play hand)
   */
  private executePlay(tileIds: string[], effects: Effect[]): ActionResult {
    // Get selected tiles
    const selectedTiles = this.state.handTiles.filter((t) =>
      tileIds.includes(t.id)
    )

    // processAction has already checked the shared play validator.

    // For Tensho, we use a simplified hand model:
    // The entire hand (or selected tiles) is played at once
    // We need at least a valid structure to score

    // Parse the tiles the player actually chose. The old implementation parsed
    // the entire hand, which made a five-tile selection score as a hidden
    // fourteen-tile hand and broke the core selection loop.
    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]
    const completeHand = this.resolveCompleteHand(tilesToScore)

    if (
      this.isDecreeRuleActive('honor_as_suited') &&
      selectedTiles.some((tile) => tile.isHonor && !tile.isStone)
    ) {
      effects.push({
        type: 'decree_triggered',
        description:
          'Honor Transmutation treated honors as dominant-suit tiles',
      })
    }

    if (!completeHand) {
      // Tactical selections still score their useful groups, but are kept
      // deliberately small so playing every tile is not the dominant choice.
      return this.executePartialPlay(selectedTiles, effects)
    }

    const plumRecovery = this.planPlumRecovery(
      completeHand.parsedHand.melds,
      selectedTiles
    )

    // Calculate score for complete hand
    const scoreResult = this.calculateHandScore(
      completeHand.tilesToScore,
      completeHand.parsedHand,
      undefined,
      false,
      !completeHand.usedShantenClemency &&
        !completeHand.completedBy &&
        completeHand.parsedHand.isConcealed
    )
    if (completeHand.usedShantenClemency) {
      scoreResult.finalScore = Math.floor(scoreResult.finalScore * 0.5)
      effects.push({
        type: 'decree_triggered',
        description:
          'Shanten Clemency completed the hand at a 50% score penalty',
      })
    }
    if (completeHand.completedBy === 'script_of_eclipse') {
      effects.push({
        type: 'consumable_effect',
        description: 'Script of Eclipse completed the hand',
      })
    }
    if (completeHand.completedBy === 'script_of_silence') {
      this.state.voidScriptSystem.useMeldValidationBypass()
      effects.push({
        type: 'consumable_effect',
        description: 'Script of Silence let one group stand that did not fit',
      })
    }
    if (this.state.voidScriptSystem.isBaseScoreHalved()) {
      scoreResult.finalScore = Math.floor(scoreResult.finalScore / 2)
    }
    this.applyOmenScoreBonuses(scoreResult)

    // Earn the wall reward after scoring, before refill; forecasts use the same
    // pre-play wall as payment. Count physical faces, not virtual identities.
    this.applyBambooSummerReward(selectedTiles, effects)

    // Apply score
    const previousScore = this.state.score
    this.state.score += scoreResult.finalScore
    this.state.runScore += scoreResult.finalScore
    this.state.lastHandScore = scoreResult.finalScore
    this.state.handsPlayedThisRun++
    this.state.playsThisRound = this.getPlaysThisRound() + 1
    if (
      !completeHand.usedShantenClemency &&
      !completeHand.completedBy &&
      completeHand.parsedHand.isConcealed
    )
      this.state.completeConcealedHandsPlayed =
        (this.state.completeConcealedHandsPlayed ?? 0) + 1
    this.spendTurn('play')

    if (scoreResult.goldEarned > 0) {
      const previousGold = this.state.gold
      this.state.gold += scoreResult.goldEarned
      effects.push({
        type: 'gold_changed',
        description: `Earned ${scoreResult.goldEarned} gold from tile effects`,
        delta: scoreResult.goldEarned,
        newTotal: this.state.gold,
      })
      eventBus.emit('goldChanged', {
        previousGold,
        newGold: this.state.gold,
        delta: scoreResult.goldEarned,
        reason: 'Scoring tile effect',
      })
    }

    this.applyPlayedTileMandates(
      tileIds,
      scoreResult.pattern.id,
      scoreResult.detectedYaku.map((yaku) => yaku.definition.id),
      effects
    )

    if (scoreResult.shatteredTiles.length > 0) {
      this.destroyTiles(scoreResult.shatteredTiles, effects)
    }

    if (
      this.state.score >= this.state.targetScore &&
      selectedTiles.some((tile) => tile.modifiers.seal === SealType.Blue)
    ) {
      this.createRandomConsumable('CelestialOrb', effects)
    }

    // Remove played tiles and add to discards
    for (const tileId of tileIds) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (idx !== -1) {
        const [tile] = this.state.handTiles.splice(idx, 1)
        this.state.discards.push(tile)
        this.state.faceDownTileIds.delete(tileId)
      }
    }

    this.state.selectedTileIds.clear()
    this.state.roundManager.trackUsedTiles(tileIds)

    effects.push({
      type: 'score_added',
      description: `Scored ${scoreResult.finalScore} points`,
      score: scoreResult.finalScore,
      breakdown: scoreResult,
    })

    effects.push({
      type: 'yaku_detected',
      description: `Detected ${scoreResult.detectedYaku.length} yaku`,
      yaku: scoreResult.detectedYaku,
    })

    // Emit events
    eventBus.emit('handPlayed', {
      tiles: tileIds,
      score: scoreResult.finalScore,
      glassTilesBroken: scoreResult.shatteredTiles.length,
      allPlayedTilesWild: selectedTiles.every((tile) => tile.isWild),
      windYakuScored: scoreResult.detectedYaku.filter(
        (yaku) => yaku.isApplicable && yaku.honorSource === 'wind'
      ).length,
      equation: scoreResult.equation,
      yakuIds: scoreResult.detectedYaku.map((y) => y.definition.id),
      pattern: scoreResult.pattern.id,
      blocked: scoreResult.blockedByMandate === true,
    })

    eventBus.emit('scoreUpdate', {
      previousScore,
      newScore: this.state.score,
      delta: scoreResult.finalScore,
    })

    // Check yaku events
    for (const yaku of scoreResult.detectedYaku) {
      if (yaku.definition.tier === 4) {
        eventBus.emit('yakumanScored', {
          yakuId: yaku.definition.id,
          yakuName: yaku.definition.name,
          multiplier: yaku.definition.multiplier,
        })
      } else {
        eventBus.emit('yakuScored', {
          yakuId: yaku.definition.id,
          yakuName: yaku.definition.name,
          multiplier: yaku.definition.multiplier,
        })
      }
    }

    this.state.voidScriptSystem.onHandEnd()

    // Check round completion
    this.checkRoundCompletion(effects)

    // Auto-draw to refill hand if not round completed
    if (this.state.phase === 'gameplay') {
      this.refillAfterCycle(effects, true, plumRecovery)
      this.enforcePlayability(effects)
    }

    return { success: true, effects }
  }

  /**
   * Execute partial play (for when the selection isn't a complete winning hand).
   *
   * This is the common case in Tensho: the player is paid for whatever
   * structure the selection contains. It runs the same scoring pipeline as a
   * complete hand so Decrees, tile modifiers, Flowers, Seasons and Celestial
   * Orbs all apply - only yaku are withheld, since those need a winning hand.
   */
  private executePartialPlay(
    selectedTiles: Tile[],
    effects: Effect[]
  ): ActionResult {
    const tilesToScore = this.isDecreeRuleActive('honor_as_suited')
      ? this.transmuteHonorsToDominantSuit(selectedTiles)
      : [...selectedTiles]

    const parse = parsePlay(tilesToScore, this.getPartialHandRules())
    const parsedHand = toPartialParsedHand(parse, tilesToScore)

    const plumRecovery = this.planPlumRecovery(parse.groups, selectedTiles)

    const scoreResult = this.calculateHandScore(
      tilesToScore,
      parsedHand,
      parse.groups
    )
    if (this.state.voidScriptSystem.isBaseScoreHalved()) {
      scoreResult.finalScore = Math.floor(scoreResult.finalScore / 2)
    }
    this.applyOmenScoreBonuses(scoreResult)

    const finalScore = scoreResult.finalScore
    this.applyBambooSummerReward(selectedTiles, effects)
    const previousScore = this.state.score
    this.state.score += finalScore
    this.state.runScore += finalScore
    this.state.lastHandScore = finalScore
    this.state.handsPlayedThisRun++
    this.state.playsThisRound = this.getPlaysThisRound() + 1
    this.spendTurn('play')

    if (scoreResult.goldEarned > 0) {
      const previousGold = this.state.gold
      this.state.gold += scoreResult.goldEarned
      effects.push({
        type: 'gold_changed',
        description: `Earned ${scoreResult.goldEarned} gold from tile effects`,
        delta: scoreResult.goldEarned,
        newTotal: this.state.gold,
      })
      eventBus.emit('goldChanged', {
        previousGold,
        newGold: this.state.gold,
        delta: scoreResult.goldEarned,
        reason: 'Scoring tile effect',
      })
    }

    const tileIds = selectedTiles.map((tile) => tile.id)
    this.applyPlayedTileMandates(tileIds, scoreResult.pattern.id, [], effects)

    if (scoreResult.shatteredTiles.length > 0) {
      this.destroyTiles(scoreResult.shatteredTiles, effects)
    }

    if (
      this.state.score >= this.state.targetScore &&
      selectedTiles.some((tile) => tile.modifiers.seal === SealType.Blue)
    ) {
      this.createRandomConsumable('CelestialOrb', effects)
    }

    // Remove played tiles and add to discards
    for (const tile of selectedTiles) {
      const idx = this.state.handTiles.findIndex((t) => t.id === tile.id)
      if (idx !== -1) {
        this.state.handTiles.splice(idx, 1)
        this.state.discards.push(tile)
        this.state.faceDownTileIds.delete(tile.id)
      }
    }

    this.state.selectedTileIds.clear()
    this.state.roundManager.trackUsedTiles(tileIds)

    effects.push({
      type: 'score_added',
      description: `Scored ${finalScore} points (partial hand)`,
      score: finalScore,
      breakdown: scoreResult,
    })

    eventBus.emit('handPlayed', {
      tiles: tileIds,
      score: finalScore,
      glassTilesBroken: scoreResult.shatteredTiles.length,
      equation: scoreResult.equation,
      yakuIds: [],
      pattern: scoreResult.pattern.id,
      blocked: scoreResult.blockedByMandate === true,
    })

    eventBus.emit('scoreUpdate', {
      previousScore,
      newScore: this.state.score,
      delta: finalScore,
    })

    this.state.voidScriptSystem.onHandEnd()

    this.checkRoundCompletion(effects)

    if (this.state.phase === 'gameplay') {
      this.refillAfterCycle(effects, true, plumRecovery)
      this.enforcePlayability(effects)
    }

    return { success: true, effects }
  }

  private applyOmenScoreBonuses(
    score: ScoreBreakdown & { equation: ScoreEquation },
    preview = false
  ): void {
    // A play the Boss forbade scored nothing, so no "hand scored" Omen fires.
    if (score.blockedByMandate) {
      if (!preview) this.state.omenSystem.recordHandPlayed()
      return
    }
    const omenScore = preview
      ? this.state.omenSystem.peekHandScoredOmens()
      : this.state.omenSystem.triggerHandScoredOmens()
    const passiveOmenMult = this.state.omenSystem.getPassiveMultBonus()
    score.additiveBonus += omenScore.scoreBonus
    score.finalScore = Math.floor(
      (score.finalScore + omenScore.scoreBonus) *
        (omenScore.multBonus > 0 ? omenScore.multBonus : 1) *
        (1 + passiveOmenMult)
    )
    score.equation = settleScoreEquation(
      score.equation.points,
      score.equation.multiplier,
      score.finalScore
    )
    if (!preview) this.state.omenSystem.recordHandPlayed()
  }

  private applyPlayedTileMandates(
    tileIds: string[],
    patternId: PlayPatternId,
    yakuIds: string[],
    effects: Effect[]
  ): void {
    this.state.mandateEffectSystem.onHandPlayed(
      tileIds,
      this.state.decreeSystem.getOwnedDecrees()
    )

    const goldPerTile = this.state.mandateEffectSystem.getGoldPenaltyPerTile()
    if (goldPerTile > 0) {
      this.changeGold(-goldPerTile * tileIds.length, 'The Tooth', effects)
    }

    if (this.state.mandateEffectSystem.zeroesGoldFor(patternId))
      this.changeGold(-this.state.gold, 'The Ox', effects)

    // Every committed play counts, including one a Boss kept from scoring.
    this.state.patternPlayCounts.set(
      patternId,
      (this.state.patternPlayCounts.get(patternId) ?? 0) + 1
    )
    for (const yakuId of yakuIds) this.state.currentRoundYakuIds.add(yakuId)
  }

  /**
   * Dry-run at most three replacement cycles. Bonus tiles draw from the dead
   * wall, which replenishes from the main wall's tail. Counting raw wall tiles
   * alone can promise replacements that these chains cannot actually supply.
   * A fork reproduces Monsoon picks and Season corruption without advancing
   * the live random streams, consuming Omen locks, or collecting any rewards.
   */
  /**
   * Playable replacements the wall can still supply, up to `limit`, after
   * resolving the bonus-tile and dead-wall chains a draw would trigger. Runs
   * on a forked random stream: asking never changes the run.
   */
  private getRedrawReplacementCapacity(limit: number): number {
    if (this.state.drawIndex >= this.state.wall.length) return 0
    const random = runRandom.fork()
    const draw = {
      wall: this.state.wall.slice(this.state.drawIndex),
      deadWall: [...this.state.deadWall],
      summerReserve: [...this.state.summerReserve],
      bambooSummerProtection: this.state.bambooSummerProtection,
      drawIndex: 0,
    }
    const seasons = SeasonSystem.fromState(
      this.state.seasonSystem.toState(),
      random
    )
    let lockedSeason = this.state.omenSystem.getLockedSeason()
    let capacity = 0
    while (capacity < limit && draw.drawIndex < draw.wall.length) {
      let tile = takeWallTile(draw, seasons.areDrawsRandomized(), random)
      while (tile && (tile.isFlower || tile.isSeason)) {
        if (tile.isSeason) {
          const season = seasons.addSeason(tile, lockedSeason ?? undefined)
          applySeasonWallEffect(draw, season)
          lockedSeason = null
        }
        tile = takeDeadWallTile(draw, seasons.areDrawsRandomized(), random)
      }
      if (!tile) break
      capacity++
    }
    return capacity
  }

  /** Debit before settlement so the winning play is included in run history. */
  private spendTurn(action: 'play' | 'redraw'): void {
    this.state.handsRemaining--
    eventBus.emit('paidTurnSpent', { action })
  }

  /**
   * REDRAW: the selected tiles go to the river and the rack refills. Any
   * number of tiles may go at once. A free redraw (from an item) is spent if
   * one is left; otherwise the REDRAW spends a Turn.
   */
  private executeRedraw(tileIds: string[], effects: Effect[]): ActionResult {
    const removed: Tile[] = []
    for (const tileId of tileIds) {
      const index = this.state.handTiles.findIndex((t) => t.id === tileId)
      if (index === -1) continue
      const [tile] = this.state.handTiles.splice(index, 1)
      removed.push(tile)
      this.recordHonorDiscard(tile)
      this.state.discards.push(tile)
      this.state.selectedTileIds.delete(tileId)
      this.state.faceDownTileIds.delete(tileId)
      effects.push({
        type: 'tile_removed',
        description: `Redrew ${tile.displayName}`,
        tileId,
      })
      eventBus.emit('tileDiscarded', { tileId, toDeadPool: true })
    }

    if (this.state.redrawsRemaining > 0) this.state.redrawsRemaining--
    else this.spendTurn('redraw')
    this.state.tilesRedrawnThisRound =
      (this.state.tilesRedrawnThisRound ?? 0) + removed.length
    // Decay counts each REDRAW once, however many tiles it sends.
    this.state.seasonSystem.onDiscard()

    const decreeGold = this.state.decreeSystem.calculateDiscardGold(
      removed.length,
      new Set(this.state.mandateEffectSystem.getDisabledDecreeIds())
    )
    this.changeGold(decreeGold, 'Redraw Decree effect', effects, 'decree')
    for (const tile of removed)
      if (tile.modifiers.seal === SealType.Purple)
        this.createRandomConsumable('FateSeal', effects)

    effects.push({
      type: 'round_state_changed',
      description: `Redrew ${removed.length} tiles`,
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
    })

    // Replacements follow the round's draw rule (The Serpent draws three).
    this.refillAfterCycle(effects)
    this.enforcePlayability(effects)
    return { success: true, effects }
  }

  /** Record actual discards; a Stone covers its former Honor identity. */
  private recordHonorDiscard(tile: Tile): void {
    if (
      this.state.honorDiscardsThisRound !== undefined &&
      tile.isHonor &&
      tile.modifiers.enhancement !== EnhancementType.Stone
    ) {
      this.state.honorDiscardsThisRound++
    }
  }

  /** Apply mandate effects that resolve after one completed draw cycle. */
  private applyPostDrawMandate(drawnTile: Tile, effects: Effect[]): void {
    const mandateResult = this.state.mandateEffectSystem.onDraw(
      this.state.handTiles,
      drawnTile
    )

    for (const tileId of mandateResult.discardedTileIds) {
      const index = this.state.handTiles.findIndex((tile) => tile.id === tileId)
      if (index === -1) continue
      const [tile] = this.state.handTiles.splice(index, 1)
      this.recordHonorDiscard(tile)
      this.state.discards.push(tile)
      this.state.seasonSystem.onDiscard()
      this.state.selectedTileIds.delete(tile.id)
      this.state.faceDownTileIds.delete(tile.id)
      effects.push({
        type: 'tile_removed',
        description: `Boss Mandate discarded ${tile.displayName}`,
        tileId: tile.id,
      })
      eventBus.emit('tileDiscarded', {
        tileId: tile.id,
        toDeadPool: true,
      })
    }

    if (mandateResult.lockedTileId) {
      effects.push({
        type: 'consumable_effect',
        description: `Boss Mandate locked ${mandateResult.lockedTileId}`,
      })
    }
  }

  /**
   * Execute use seal action - use a Fate Seal consumable
   */
  private executeUseSeal(
    sealId: string,
    targets: string[] | undefined,
    effects: Effect[]
  ): ActionResult {
    // Find the seal in inventory
    const sealIndex = this.state.fateSeals.findIndex(
      (seal) => seal.instanceId === sealId || seal.id === sealId
    )
    if (sealIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Seal not found in inventory'],
      }
    }

    const seal = this.state.fateSeals[sealIndex]

    // Build the context for seal usage
    const selectedTiles = (targets ?? []).map(
      (id) => this.state.handTiles.find((tile) => tile.id === id)!
    )

    const selectionError = validateConsumableTargetCount(
      seal.effect,
      selectedTiles.length
    )
    if (selectionError) {
      return { success: false, effects, errors: [selectionError] }
    }

    const context = this.createFateSealContext(seal, selectedTiles)

    // Use the seal
    const result = this.state.fateSealSystem.useSeal(seal, context)

    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    // Remove the seal from inventory
    this.state.fateSeals.splice(sealIndex, 1)

    // Apply the system's effect descriptors to authoritative run state.
    for (const effectResult of result.effects) {
      this.applyFateSealEffect(seal, effectResult, effects)
      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }

    eventBus.emit('fateSealUsed', {
      sealId: seal.id,
      effect: seal.effect.description,
      source: seal.source,
    })

    // Inspecting a tile through a consumable reveals it for the rest of the
    // current hand, as specified by the hidden-information rules.
    for (const tile of selectedTiles) {
      this.state.faceDownTileIds.delete(tile.id)
    }

    return { success: true, effects }
  }

  /** Use a held Celestial Orb and apply its permanent yaku upgrade. */
  private executeUseOrb(orbId: string, effects: Effect[]): ActionResult {
    const orbIndex = this.state.celestialOrbs.findIndex(
      (orb) => orb.instanceId === orbId || orb.id === orbId
    )
    if (orbIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Orb not found in inventory'],
      }
    }

    const orb = this.state.celestialOrbs[orbIndex]
    const before = this.state.celestialOrbSystem.getAllYakuLevels()
    const result = this.state.celestialOrbSystem.useOrb(orb)
    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    this.state.celestialOrbs.splice(orbIndex, 1)
    for (const effectResult of result.effects) {
      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }
    this.settleOrbUse(orb, before, false)

    return { success: true, effects }
  }

  /**
   * Use an Orb the moment it is acquired. The Tea House applies a bought or
   * pack-chosen Orb at once instead of holding it; only Orbs created during a
   * round still wait on the rail. The upgrade is permanent for this run.
   */
  applyCelestialOrb(
    orb: CelestialOrb,
    source: 'purchase' | 'pack_open'
  ): boolean {
    if (source !== 'pack_open' && !this.isConsumableUnlocked(orb.id)) {
      return false
    }
    const before = this.state.celestialOrbSystem.getAllYakuLevels()
    const result = this.state.celestialOrbSystem.useOrb(orb)
    if (!result.success) return false
    orb.source = source
    eventBus.emit('consumableAcquired', {
      consumableType: orb.type,
      itemId: orb.id,
      instanceId: orb.instanceId,
      name: orb.name,
      source,
    })
    this.settleOrbUse(orb, before, true)
    return true
  }

  /** The wall tiles a Tea House Seal can be laid on, in display order. */
  getSealableWallTiles(): Tile[] {
    return sealableWallTiles(this.state.wallTemplate).sort(Tile.compare)
  }

  /**
   * Why a Seal could not be used in the Tea House now, or null when it can.
   * Targets are wall tiles; with none given, this only asks whether the Seal
   * has anything to work on. `gold` is the purse after paying for it, and
   * `wall` a wall another Seal of the same pack has already changed.
   */
  validateWallSeal(
    seal: FateSeal,
    targets?: readonly string[],
    options: { gold?: number; wall?: readonly Tile[] } = {}
  ): string | null {
    const wall = options.wall ?? this.state.wallTemplate
    const targetError = wallSealTargetError(seal, wall, targets)
    if (targetError) return targetError
    if (
      seal.id === 'seal_of_the_void' &&
      !this.state.celestialOrbSystem.canUpgradeAnyYaku()
    )
      return 'All Yaku are already at max level'
    // The Fool's copy is used as it is made, so it must be able to work now.
    if (seal.effect.type === 'duplicate_consumable') {
      const copy = this.state.fateSealSystem.getLastUsedConsumable()
      if (copy?.type === 'FateSeal') {
        const copyError = this.validateWallSeal(copy as FateSeal, undefined, {
          ...options,
          wall,
        })
        if (copyError) return copyError
      }
    }
    const selected = (targets ?? []).map(
      (id) => wall.find((tile) => tile.id === id)!
    )
    const context = {
      ...this.createFateSealContext(seal, selected),
      currentGold: options.gold ?? this.state.gold,
    }
    // Before the player has chosen, a Seal that takes tiles needs only some
    // tile it can change, which the wall check above has found.
    if (!targets && consumableTargetRange(seal.effect).max > 0) return null
    return this.state.fateSealSystem.validateUse(seal, context)
  }

  /**
   * Use a Seal the moment it is acquired. No Seal is ever held: one bought or
   * chosen from a pack works at once, on the wall tiles the player chose, and
   * the change lasts for the rest of the run. A Seal the run makes uses this
   * as it is made when it needs no tiles (see `grantGeneratedSeal`).
   */
  applyFateSeal(
    seal: FateSeal,
    source: 'purchase' | 'pack_open' | 'generated',
    targets: readonly string[] = []
  ): boolean {
    if (source === 'purchase' && !this.isConsumableUnlocked(seal.id)) {
      return false
    }
    if (this.validateWallSeal(seal, targets)) return false
    seal.source = source
    return this.layFateSeal(seal, targets, true)
  }

  /**
   * Use a Seal the run made that waits on its wall tiles, the only Seal
   * `fateSeals` ever holds; the table and the Tea House ask for the tiles at
   * once. Returns why these targets were refused, or null once the Seal is
   * gone. A Seal left with nothing to work on is spent without effect.
   */
  settleHeldFateSeal(
    instanceId: string,
    targets: readonly string[] = []
  ): string | null {
    const index = this.state.fateSeals.findIndex(
      (seal) => seal.instanceId === instanceId
    )
    if (index === -1) return 'Seal not found in inventory'
    const seal = this.state.fateSeals[index]
    const workable = this.validateWallSeal(seal) === null
    if (workable) {
      const error = this.validateWallSeal(seal, targets)
      if (error) return error
    }
    this.state.fateSeals.splice(index, 1)
    if (workable) {
      this.layFateSeal(seal, targets, false)
      // A tile seen through a Seal stays revealed for the rest of the hand.
      for (const id of targets) this.state.faceDownTileIds.delete(id)
    }
    this.publishBuildProgress()
    return null
  }

  /**
   * Lay a checked Seal on these wall tiles. `acquired` announces it as taken
   * before its effects settle, as a Seal used on acquisition is.
   */
  private layFateSeal(
    seal: FateSeal,
    targets: readonly string[],
    acquired: boolean
  ): boolean {
    const selected = targets.map(
      (id) => this.state.wallTemplate.find((tile) => tile.id === id)!
    )
    const result = this.state.fateSealSystem.useSeal(
      seal,
      this.createFateSealContext(seal, selected)
    )
    if (!result.success) return false
    if (acquired)
      eventBus.emit('consumableAcquired', {
        consumableType: seal.type,
        itemId: seal.id,
        instanceId: seal.instanceId,
        name: seal.name,
        source: seal.source ?? 'generated',
      })
    const effects: Effect[] = []
    for (const effectResult of result.effects)
      this.applyFateSealEffect(seal, effectResult, effects)
    eventBus.emit('fateSealUsed', {
      sealId: seal.id,
      effect: seal.effect.description,
      source: seal.source,
    })
    if (this.state.isRunActive) this.publishWallComposition()
    return true
  }

  /**
   * Shared aftermath of a successful Orb use: history and announcement.
   * `onAcquire` marks a Tea House use as the Orb is taken; a rail use keeps
   * the Orb's provenance in `source` but is not one.
   */
  private settleOrbUse(
    orb: CelestialOrb,
    before: Map<YakuCategory, number>,
    onAcquire: boolean
  ): void {
    this.state.fateSealSystem.setLastUsedConsumable(orb)
    const levels: { yaku: YakuCategory; from: number; to: number }[] = []
    for (const [yaku, to] of this.state.celestialOrbSystem.getAllYakuLevels()) {
      const from = before.get(yaku) ?? 1
      if (to !== from) levels.push({ yaku, from, to })
    }
    eventBus.emit('celestialOrbUsed', {
      orbId: orb.id,
      source: orb.source,
      yakuCategory: orb.effect.targetYaku,
      newLevel:
        orb.effect.targetYaku === 'All'
          ? 0
          : this.state.celestialOrbSystem.getYakuLevel(orb.effect.targetYaku),
      levels,
      onAcquire,
    })
    this.announceYakuLevels()
  }

  private announceYakuLevels(): void {
    eventBus.emit('yakuLevelsChanged', {
      highestLevel: Math.max(
        1,
        ...this.state.celestialOrbSystem.getAllYakuLevels().values()
      ),
    })
  }

  /**
   * Execute use script action - use a Void Script consumable
   */
  private executeUseScript(
    scriptId: string,
    targets: string[] | undefined,
    effects: Effect[]
  ): ActionResult {
    // Find the script in inventory
    const scriptIndex = this.state.voidScripts.findIndex(
      (script) => script.instanceId === scriptId || script.id === scriptId
    )
    if (scriptIndex === -1) {
      return {
        success: false,
        effects,
        errors: ['Script not found in inventory'],
      }
    }

    const script = this.state.voidScripts[scriptIndex]

    // Build the context for script usage
    const selectedTiles = (targets ?? []).map(
      (id) => this.state.handTiles.find((tile) => tile.id === id)!
    )

    const selectionError = validateConsumableTargetCount(
      script.effect,
      selectedTiles.length
    )
    if (selectionError) {
      return { success: false, effects, errors: [selectionError] }
    }

    const context = this.createVoidScriptContext(selectedTiles)

    // Omen protection is checked before execution but consumed only after a
    // successful Script, so a failed target selection cannot waste it.
    const downsideProtected =
      this.state.omenSystem.hasVoidScriptDownsideProtection()
    const scriptToUse: VoidScript = downsideProtected
      ? {
          ...script,
          penalty: {
            type: 'none',
            description: 'Downside negated by Omen',
          },
        }
      : script

    const result = this.state.voidScriptSystem.useScript(scriptToUse, context)

    if (!result.success) {
      return {
        success: false,
        effects,
        errors: [result.message],
      }
    }

    // Remove the script from inventory
    this.state.voidScripts.splice(scriptIndex, 1)

    if (downsideProtected) {
      this.state.omenSystem.triggerVoidScriptOmens()
      effects.push({
        type: 'consumable_effect',
        description: 'Omen negated the Void Script downside',
      })
    }

    this.applyVoidScriptEffects(script, result.effects, effects)
    for (const effectResult of result.effects) {
      effects.push({
        type: 'consumable_effect',
        description: effectResult.description,
      })
    }

    eventBus.emit('voidScriptUsed', {
      scriptId: script.id,
      effect: script.effect.description,
      downside: script.penalty.description,
    })

    for (const tile of selectedTiles) {
      this.state.faceDownTileIds.delete(tile.id)
    }

    return { success: true, effects }
  }

  validateConsumableAction(
    action: Extract<PlayerAction, { type: 'useSeal' | 'useScript' | 'useOrb' }>
  ): ValidationResult {
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') {
      return {
        isValid: false,
        errors: ['Consumables can only be used during gameplay'],
      }
    }
    const validation = this.actionProcessor.validate(
      action,
      this.createStateSnapshot()
    )
    if (!validation.isValid) return validation
    if (action.type === 'useOrb') {
      const orb = this.state.celestialOrbs.find(
        (item) => item.instanceId === action.orbId || item.id === action.orbId
      )!
      const error = this.state.celestialOrbSystem.validateUse(orb)
      return error ? { isValid: false, errors: [error] } : validation
    }
    const item =
      action.type === 'useSeal'
        ? this.state.fateSeals.find(
            (seal) =>
              seal.instanceId === action.sealId || seal.id === action.sealId
          )
        : this.state.voidScripts.find(
            (script) =>
              script.instanceId === action.scriptId ||
              script.id === action.scriptId
          )
    if (!item)
      return { isValid: false, errors: ['Consumable not found in inventory'] }
    const countError = validateConsumableTargetCount(
      item.effect,
      action.targets?.length ?? 0
    )
    if (countError) return { isValid: false, errors: [countError] }
    const selected = (action.targets ?? []).map(
      (id) => this.state.handTiles.find((tile) => tile.id === id)!
    )
    const hidden = selected.some((tile) =>
      this.state.faceDownTileIds.has(tile.id)
    )
    if (
      (item.id === 'seal_of_the_void' ||
        (item.type === 'VoidScript' &&
          item.effect.type === 'upgrade_all_yaku')) &&
      !this.state.celestialOrbSystem.canUpgradeAnyYaku()
    )
      return { isValid: false, errors: ['All Yaku are already at max level'] }
    const error =
      item.type === 'FateSeal'
        ? this.state.fateSealSystem.validateUse(
            item,
            this.createFateSealContext(item, selected),
            !hidden
          )
        : this.state.voidScriptSystem.validateUse(
            item,
            this.createVoidScriptContext(selected)
          )
    if (error) return { isValid: false, errors: [error] }
    return hidden
      ? {
          ...validation,
          warnings: ['Target outcome depends on concealed tiles'],
        }
      : validation
  }

  private createFateSealContext(
    seal: FateSeal,
    selectedTiles: Tile[]
  ): FateSealContext {
    return {
      selectedTiles,
      currentGold: this.state.gold,
      currentHand: this.state.handTiles,
      currentMelds: this.state.melds,
      getDecreeCount: () => this.state.decreeSystem.getOwnedDecrees().length,
      totalDecreeSellValue: this.state.decreeSystem
        .getOwnedDecrees()
        .reduce((sum, d) => sum + (d.sellValue ?? Math.floor(d.cost / 2)), 0),
      // Only Decrees have slots; consumable inventory is unlimited.
      getAvailableSlots: () =>
        seal.id === 'seal_of_judgment' || seal.id === 'seal_of_the_immortal'
          ? this.state.decreeSystem.getAvailableSlots()
          : Number.POSITIVE_INFINITY,
    }
  }

  private createVoidScriptContext(selectedTiles: Tile[]): VoidScriptContext {
    return {
      selectedTiles,
      currentGold: this.state.gold,
      currentHand: this.state.handTiles,
      getAvailableDecreeSlots: () =>
        this.state.decreeSystem.getAvailableSlots(),
      getDecreeCount: () => this.state.decreeSystem.getOwnedDecrees().length,
    }
  }

  private applyFateSealEffect(
    seal: FateSeal,
    result: ConsumableEffectResult,
    effects: Effect[]
  ): void {
    const tileIds = result.affectedTiles ?? []

    switch (result.type) {
      case 'enhancement_applied':
        if (typeof result.value === 'string') {
          this.transformTiles(tileIds, (tile) =>
            tile.withEnhancement(result.value as EnhancementType)
          )
        }
        break
      case 'wild_conversion':
        this.transformTiles(tileIds, (tile) =>
          tile.withEnhancement(EnhancementType.Wild)
        )
        break
      case 'suit_conversion':
        if (typeof result.value === 'string') {
          this.transformTiles(tileIds, (tile) =>
            convertSuitedTile(tile, result.value as TileSuit)
          )
        }
        break
      case 'rank_modified':
        if (typeof result.value === 'number') {
          const rankChange = result.value
          this.transformTiles(tileIds, (tile) =>
            convertSuitedTileRank(tile, tile.rank + rankChange)
          )
        }
        break
      case 'tiles_destroyed':
        this.destroyTiles(tileIds, effects)
        break
      case 'tile_copied': {
        const [targetId, sourceId] = tileIds
        const source = this.findRunTile(sourceId)
        if (targetId && source) {
          this.replaceTileById(
            targetId,
            new Tile(
              source.suit,
              source.rank,
              targetId,
              source.isRed,
              source.modifiers
            )
          )
        }
        break
      }
      case 'gold_generated':
        if (typeof result.value === 'number') {
          this.changeGold(result.value, seal.name, effects)
        }
        break
      case 'consumable_created':
        this.createFromFateSeal(seal, Number(result.value ?? 1), effects)
        break
      case 'consumable_duplicated':
        if (typeof result.value === 'string') {
          this.duplicateConsumable(result.value)
        }
        break
      case 'all_yaku_upgraded':
        this.upgradeAllYaku()
        break
      case 'edition_applied':
        if (tileIds.length > 0 && typeof result.value === 'string') {
          this.transformTiles(tileIds, (tile) =>
            tile.withEdition(result.value as EditionType)
          )
        } else if (typeof result.value === 'string') {
          const edition = this.normalizeDecreeEdition(result.value)
          if (edition) this.applyRandomDecreeEdition(edition)
        }
        break
    }
  }

  private applyVoidScriptEffects(
    script: VoidScript,
    results: ConsumableEffectResult[],
    effects: Effect[]
  ): void {
    let retainedDecreeIds: string[] = []

    for (const result of results) {
      const tileIds = result.affectedTiles ?? []

      switch (result.type) {
        case 'tiles_destroyed':
          this.destroyTiles(
            tileIds.length > 0
              ? tileIds
              : this.pickRandomHandTileIds(Number(result.value ?? 1)),
            effects
          )
          break
        case 'tile_destroyed':
          this.destroyTiles(this.pickRandomHandTileIds(1), effects)
          break
        case 'tiles_created':
          for (let i = 0; i < Number(result.value ?? 1); i++) {
            this.addCreatedTile(this.createVoidTile(script.effect.createType))
          }
          break
        case 'tile_duplicated': {
          const source = this.state.handTiles.find(
            (tile) => tile.id === tileIds[0]
          )
          if (source) {
            for (let i = 0; i < Number(result.value ?? 1); i++) {
              this.addCreatedTile(
                new Tile(
                  source.suit,
                  source.rank,
                  this.nextRuntimeTileId(),
                  source.isRed,
                  source.modifiers
                )
              )
            }
          }
          break
        }
        case 'seal_applied':
          if (typeof result.value === 'string') {
            this.transformTiles(tileIds, (tile) =>
              tile.withSeal(result.value as SealType)
            )
          }
          break
        case 'edition_applied':
          if (typeof result.value === 'string') {
            this.transformTiles(tileIds, (tile) =>
              tile.withEdition(result.value as EditionType)
            )
          }
          break
        case 'edition_applied_decree':
          if (typeof result.value === 'string') {
            const edition = this.normalizeDecreeEdition(result.value)
            const target = edition
              ? this.applyRandomDecreeEdition(edition)
              : null
            if (target) retainedDecreeIds = [target]
          }
          break
        case 'suit_conversion':
          if (typeof result.value === 'string') {
            this.transformTiles(
              this.state.handTiles.map((tile) => tile.id),
              (tile) => convertSuitedTile(tile, result.value as TileSuit)
            )
          }
          break
        case 'rank_conversion':
          if (typeof result.value === 'number') {
            this.transformTiles(
              this.state.handTiles.map((tile) => tile.id),
              (tile) => convertSuitedTileRank(tile, result.value as number)
            )
          }
          break
        case 'gold_gained':
          if (typeof result.value === 'number') {
            this.changeGold(result.value, script.name, effects)
          }
          break
        case 'gold_lost':
          this.changeGold(-this.state.gold, script.name, effects)
          break
        case 'decree_created':
          this.createRandomDecree('ImperialDecree')
          break
        case 'legendary_decree_created':
          this.createRandomDecree('HeavenlyOrdinance')
          break
        case 'negative_edition_applied':
          this.applyRandomDecreeEdition('Negative')
          break
        case 'decree_copied':
          retainedDecreeIds = this.copyRandomDecree()
          break
        case 'decrees_destroyed':
          this.destroyOtherDecrees(retainedDecreeIds)
          break
        case 'all_yaku_upgraded':
          this.upgradeAllYaku()
          break
        case 'hand_size_reduced':
          this.trimHandToLimit(effects)
          break
        case 'tile_locked': {
          const [lockedId] = this.pickRandomHandTileIds(1)
          if (lockedId) this.moveHandTileToDeadPool(lockedId, effects)
          break
        }
      }
    }
  }

  /** A tile of this run: in the hand, or (for a Tea House Seal) the wall. */
  private findRunTile(tileId: string | undefined): Tile | undefined {
    return (
      this.state.handTiles.find((tile) => tile.id === tileId) ??
      this.state.wallTemplate.find((tile) => tile.id === tileId)
    )
  }

  private transformTiles(
    tileIds: string[],
    transform: (tile: Tile) => Tile
  ): void {
    for (const tileId of tileIds) {
      const tile = this.findRunTile(tileId)
      if (tile) this.replaceTileById(tileId, transform(tile))
    }
    this.state.handTiles.sort(Tile.compare)
  }

  private replaceTileById(tileId: string, replacement: Tile): void {
    const replace = (tiles: Tile[]) =>
      tiles.map((tile) => (tile.id === tileId ? replacement : tile))

    this.state.handTiles = replace(this.state.handTiles)
    this.state.wallTemplate = replace(this.state.wallTemplate)
    this.state.wall = replace(this.state.wall)
    this.state.summerReserve = replace(this.state.summerReserve)
    this.state.deadWall = replace(this.state.deadWall)
    this.state.discards = replace(this.state.discards)
    this.state.decreeSystem.syncWallSlots(this.state.wallTemplate)
    this.state.mandateEffectSystem.refreshFaceDebuffs([replacement])
  }

  private destroyTiles(tileIds: string[], effects: Effect[]): void {
    for (const tileId of new Set(tileIds)) {
      const tile = this.findRunTile(tileId)
      if (!tile) continue

      this.removeTileEverywhere(tileId)
      effects.push({
        type: 'tile_removed',
        description: `Destroyed ${tile.displayName}`,
        tileId,
      })
    }
  }

  private removeTileEverywhere(tileId: string): void {
    const wallIndex = this.state.wall.findIndex((tile) => tile.id === tileId)
    if (wallIndex !== -1) {
      this.state.wall.splice(wallIndex, 1)
      if (wallIndex < this.state.drawIndex) this.state.drawIndex--
    }

    this.state.handTiles = this.state.handTiles.filter(
      (tile) => tile.id !== tileId
    )
    this.state.wallTemplate = this.state.wallTemplate.filter(
      (tile) => tile.id !== tileId
    )
    this.state.decreeSystem.syncWallSlots(this.state.wallTemplate)
    this.state.deadWall = this.state.deadWall.filter(
      (tile) => tile.id !== tileId
    )
    this.state.summerReserve = this.state.summerReserve.filter(
      (tile) => tile.id !== tileId
    )
    this.state.discards = this.state.discards.filter(
      (tile) => tile.id !== tileId
    )
    this.state.selectedTileIds.delete(tileId)
    this.state.faceDownTileIds.delete(tileId)
  }

  private pickRandomHandTileIds(count: number): string[] {
    const candidates = [...this.state.handTiles]
    const selected: string[] = []

    while (selected.length < count && candidates.length > 0) {
      const index = Math.floor(runRandom.next('decrees') * candidates.length)
      selected.push(candidates.splice(index, 1)[0].id)
    }

    return selected
  }

  private nextRuntimeTileId(): string {
    return `runtime_${this.state.seed}_${this.runtimeItemCounter++}`
  }

  private createVoidTile(createType: string | undefined): Tile {
    const suits = [TileSuit.Manzu, TileSuit.Pinzu, TileSuit.Souzu]
    let tile: Tile

    if (createType === 'face') {
      if (runRandom.next('decrees') < 0.5) {
        tile = Tile.createWind(
          (Math.floor(runRandom.next('decrees') * 4) + 1) as WindType,
          this.nextRuntimeTileId()
        )
      } else {
        tile = Tile.createDragon(
          (Math.floor(runRandom.next('decrees') * 3) + 1) as DragonType,
          this.nextRuntimeTileId()
        )
      }
    } else {
      const suit = suits[Math.floor(runRandom.next('decrees') * suits.length)]
      const rank =
        createType === 'terminal'
          ? runRandom.next('decrees') < 0.5
            ? 1
            : 9
          : Math.floor(runRandom.next('decrees') * 7) + 2
      tile = new Tile(suit, rank, this.nextRuntimeTileId())
    }

    const enhancements = [
      EnhancementType.Bonus,
      EnhancementType.Mult,
      EnhancementType.Lucky,
    ]
    return tile.withEnhancement(
      enhancements[Math.floor(runRandom.next('decrees') * enhancements.length)]
    )
  }

  private addCreatedTile(tile: Tile): void {
    this.state.handTiles.push(tile)
    this.state.wallTemplate.push(tile)
    this.state.decreeSystem.syncWallSlots(this.state.wallTemplate)
    this.state.handTiles.sort(Tile.compare)
  }

  private moveHandTileToDeadPool(tileId: string, effects: Effect[]): void {
    const index = this.state.handTiles.findIndex((tile) => tile.id === tileId)
    if (index === -1) return

    const [tile] = this.state.handTiles.splice(index, 1)
    this.recordHonorDiscard(tile)
    this.state.discards.push(tile)
    this.state.selectedTileIds.delete(tileId)
    this.state.faceDownTileIds.delete(tileId)
    effects.push({
      type: 'tile_removed',
      description: `Locked ${tile.displayName} in the Dead Pool`,
      tileId,
    })
  }

  private trimHandToLimit(effects: Effect[]): void {
    while (this.state.handTiles.length > this.getHandSizeLimit()) {
      const [tileId] = this.pickRandomHandTileIds(1)
      if (!tileId) break
      this.moveHandTileToDeadPool(tileId, effects)
    }
  }

  /** Pure settlement shared by previews, tile/consumable rewards and cash-out.
   * Only Decree contributions weaken. Fractions combine before whole-gold rounding.
   */
  private calculateGoldReward(ordinaryGold: number, rawDecreeGold = 0) {
    const strength = this.state.seasonSystem.getDecreeEffectModifier()
    const excluded = new Set(
      this.state.mandateEffectSystem.getDisabledDecreeIds()
    )
    const rawMultiplier = this.state.decreeSystem.getGoldMultiplier(excluded)
    const multiplier = 1 + (rawMultiplier - 1) * strength
    const decreeGold = rawDecreeGold * strength
    return {
      decreeGold,
      amount: Math.floor((ordinaryGold + decreeGold) * multiplier),
    }
  }

  private changeGold(
    delta: number,
    reason: string,
    effects: Effect[],
    source: 'ordinary' | 'decree' = 'ordinary'
  ): void {
    if (delta === 0) return
    // Philosopher's Stone doubles gold gained; penalties are untouched, so a
    // gold multiplier can never deepen a loss.
    const amount =
      delta > 0
        ? this.calculateGoldReward(
            source === 'ordinary' ? delta : 0,
            source === 'decree' ? delta : 0
          ).amount
        : delta
    if (amount === 0) return
    const previousGold = this.state.gold
    this.state.gold = Math.max(0, this.state.gold + amount)
    const actualDelta = this.state.gold - previousGold

    effects.push({
      type: 'gold_changed',
      description: `${reason} changed gold by ${actualDelta}`,
      delta: actualDelta,
      newTotal: this.state.gold,
    })
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: actualDelta,
      reason,
    })
  }

  private createFromFateSeal(
    seal: FateSeal,
    count: number,
    effects: Effect[]
  ): void {
    if (seal.id === 'seal_of_judgment') {
      for (let i = 0; i < count; i++) this.createRandomDecree()
      return
    }

    if (seal.id === 'seal_of_the_immortal') {
      for (let i = 0; i < count; i++)
        this.createRandomDecree('HeavenlyOrdinance')
      return
    }

    const type = seal.effect.consumableType
    if (!type) return
    // The Emperor's Seals work at once, so it makes other Seals: no more
    // Emperors, and no Fool, which would copy it.
    for (let i = 0; i < count; i++)
      this.createRandomConsumable(type, effects, [seal.id, 'seal_of_the_fool'])
  }

  private createRandomConsumable(
    type: ConsumableType,
    effects: Effect[],
    excludeIds: string[] = []
  ): boolean {
    let consumable: BaseConsumable | null = null
    if (type === 'FateSeal') {
      // A made Seal is used as it is made: only one that can work now.
      const definition = FateSealSystem.getRandomFateSeal(
        excludeIds,
        (id) =>
          this.isConsumableUnlocked(id) &&
          !this.validateWallSeal({
            ...FATE_SEALS[id],
            instanceId: id,
            isUsed: false,
          })
      )
      if (definition)
        consumable = FateSealSystem.createFateSealInstance(definition)
    } else if (type === 'CelestialOrb') {
      const definition = CelestialOrbSystem.getRandomCelestialOrb([], (id) =>
        this.isConsumableUnlocked(id)
      )
      if (definition)
        consumable = CelestialOrbSystem.createCelestialOrbInstance(definition)
    } else {
      const definition = VoidScriptSystem.getRandomVoidScript()
      if (definition)
        consumable = VoidScriptSystem.createVoidScriptInstance(definition)
    }

    if (!consumable) return false
    const added =
      consumable.type === 'FateSeal'
        ? this.grantGeneratedSeal(consumable as FateSeal)
        : consumable.type === 'CelestialOrb'
          ? this.addCelestialOrb(consumable as CelestialOrb, 'generated')
          : this.addVoidScript(consumable as VoidScript, 'generated')

    if (added) {
      effects.push({
        type: 'consumable_effect',
        description: `Created ${consumable.name}`,
      })
    }
    return added
  }

  /**
   * A Seal the run makes (a Purple tile, the Emperor, the Fool) is used as it
   * is made, like one bought. One that needs no tiles works now; one that
   * takes tiles waits in `fateSeals` only until the player picks them on the
   * wall, which the table and the Tea House ask at once.
   */
  private grantGeneratedSeal(seal: FateSeal): boolean {
    if (consumableTargetRange(seal.effect).max === 0)
      return this.applyFateSeal(seal, 'generated')
    return this.grantConsumable(seal, 'generated')
  }

  private duplicateConsumable(definitionId: string): boolean {
    // This private path is reached only from a validated Fool use, so the
    // copy keeps the copied item's rights and skips the unlock check.
    const fateDefinition = Object.values(FATE_SEALS).find(
      (definition) => definition.id === definitionId
    )
    if (fateDefinition) {
      return this.grantGeneratedSeal(
        FateSealSystem.createFateSealInstance(fateDefinition)
      )
    }

    const orbDefinition = Object.values(CELESTIAL_ORBS).find(
      (definition) => definition.id === definitionId
    )
    if (orbDefinition) {
      return this.grantConsumable(
        CelestialOrbSystem.createCelestialOrbInstance(orbDefinition),
        'generated'
      )
    }

    // The Fool creates only the two authored families, never a Void Script.
    return false
  }

  private createRandomDecree(
    rarity?: 'ImperialDecree' | 'HeavenlyOrdinance'
  ): boolean {
    // Generated rewards must be grantable, including their Flower requirement.
    const pool = ALL_DECREES.filter(
      (decree) =>
        (!rarity || decree.rarity === rarity) && this.canAddDecree(decree)
    )
    if (pool.length === 0) return false
    const decree = pool[Math.floor(runRandom.next('decrees') * pool.length)]
    return this.addDecree(decree, 'generated')
  }

  private normalizeDecreeEdition(value: string): DecreeEdition | null {
    switch (value.toLowerCase()) {
      case 'foil':
        return 'Foil'
      case 'holographic':
      case 'holo':
        return 'Holographic'
      case 'polychrome':
      case 'prismatic':
        return 'Polychrome'
      case 'negative':
        return 'Negative'
      default:
        return null
    }
  }

  private applyRandomDecreeEdition(edition: DecreeEdition): string | null {
    const decrees = this.state.decreeSystem.getOwnedDecrees()
    if (decrees.length === 0) return null
    const decree =
      decrees[Math.floor(runRandom.next('decrees') * decrees.length)]
    const key = decreeKey(decree)
    return this.state.decreeSystem.applyEdition(key, edition) ? key : null
  }

  private copyRandomDecree(): string[] {
    const decrees = this.state.decreeSystem.getOwnedDecrees()
    if (
      decrees.length === 0 ||
      this.state.decreeSystem.getAvailableSlots() <= 0
    ) {
      return []
    }

    const decree =
      decrees[Math.floor(runRandom.next('decrees') * decrees.length)]
    const copy = this.state.decreeSystem.acquireDecree(decree)
    // Keep the chosen original and its new copy, not its whole catalog family.
    return copy ? [decreeKey(decree), decreeKey(copy)] : []
  }

  private destroyOtherDecrees(keepIds: string[]): void {
    if (keepIds.length === 0) return
    for (const decree of this.state.decreeSystem.getOwnedDecrees()) {
      const key = decreeKey(decree)
      if (!keepIds.includes(key)) this.state.decreeSystem.removeDecree(key)
    }
  }

  private upgradeAllYaku(): void {
    const blackHole = CelestialOrbSystem.createCelestialOrbInstance(
      CELESTIAL_ORBS.black_hole_orb
    )
    if (this.state.celestialOrbSystem.useOrb(blackHole).success) {
      this.announceYakuLevels()
    }
  }

  /** A Stone has no suit to count and no Honor face to transmute. */
  private transmuteHonorsToDominantSuit(tiles: Tile[]): Tile[] {
    const suitedCounts = new Map<TileSuit, number>([
      [TileSuit.Manzu, 0],
      [TileSuit.Pinzu, 0],
      [TileSuit.Souzu, 0],
    ])
    for (const tile of tiles) {
      if (tile.isSuited && !tile.isStone) {
        suitedCounts.set(tile.suit, (suitedCounts.get(tile.suit) ?? 0) + 1)
      }
    }
    const dominantSuit = [...suitedCounts.entries()].reduce(
      (dominant, candidate) =>
        candidate[1] > dominant[1] ? candidate : dominant,
      [TileSuit.Manzu, -1] as [TileSuit, number]
    )[0]

    return tiles.map((tile) =>
      tile.isHonor && !tile.isStone
        ? new Tile(dominantSuit, tile.rank, tile.id, tile.isRed, tile.modifiers)
        : tile
    )
  }

  /**
   * Calculate score for a played selection.
   *
   * `partialMelds` is supplied when the selection is not a complete winning
   * hand. Partial plays earn no yaku, but every other layer - tile modifiers,
   * Decrees, Flowers, Seasons, Celestial Orbs, Mandates - applies exactly as it
   * does for a complete hand.
   */
  private calculateHandScore(
    tiles: Tile[],
    parsedHand: ParsedHand,
    partialMelds?: Meld[],
    preview: boolean = false,
    completeConcealedHand: boolean = false
  ): ScoreBreakdown & { equation: ScoreEquation } {
    // The Mouth: once the round's first play has set the hand type, any other
    // type scores nothing. The Eye: a hand type already played this round
    // scores nothing. Nothing in a blocked play triggers - no Decree, Orb,
    // Mark, gold or Glass - and its tiles are read only to name the play.
    const patternId = partialMelds ? classifyPlay(partialMelds).id : 'mahjong'
    if (!this.state.mandateEffectSystem.allowsPlayPattern(patternId, preview)) {
      const named = calculateScore(
        createScoringContext(tiles, parsedHand, {
          partialMelds,
          previewMode: true,
        })
      )
      return {
        ...named,
        detectedYaku: [],
        retriggeredTiles: [],
        shatteredTiles: [],
        goldEarned: 0,
        finalScore: 0,
        blockedByMandate: true,
        equation: settleScoreEquation(0, 0, 0),
      }
    }

    // Build the full ScoringContext for system integrations
    const roundState = this.state.roundManager.getCurrentRound()
    // One effective decision governs direct bonuses, Decree empowerment and
    // Flower–Season interactions. Protection must itself survive Mandates.
    const flowersSuppressed = this.areFlowerBonusesSuppressed()

    const systemContext: SystemScoringContext = {
      previewMode: preview,
      hand: parsedHand,
      tiles,
      melds: parsedHand.melds,
      decrees: this.state.decreeSystem
        .getOwnedDecrees()
        .filter(
          (decree) => !this.state.mandateEffectSystem.isDecreeDisabled(decree)
        ),
      flowers: this.state.flowerSystem.getCollection(),
      flowersSuppressed,
      season: this.state.seasonSystem.getState(),
      round: {
        actNumber: this.state.currentAct,
        roundNumber: this.state.currentRound,
        roundType: roundState?.roundType ?? 'Small',
        scoreTarget: this.state.targetScore,
        currentScore: this.state.score,
        handsPlayed: this.getPlaysThisRound(),
        maxHands: this.state.handsAllowance,
        discardsRemaining: 0,
        maxDiscards: 0,
        tilesRedrawn: this.state.tilesRedrawnThisRound ?? 0,
        bossMandate: roundState?.bossMandate,
        isCompleted: false,
        isWon: false,
      },
      yakuMultipliers: new Map(),
      isConcealed: true,
      winningTile: tiles[tiles.length - 1],
      lastHandScore: this.state.lastHandScore,
      gold: this.state.gold,
      handsPlayedThisRun: this.state.handsPlayedThisRun,
      completeConcealedHand,
      completeConcealedHandsPlayed:
        this.state.completeConcealedHandsPlayed ?? 0,
    }

    // Resolve effective suppression before either base Flower bonuses or
    // Flower–Season interactions are applied. Eternal Garden's
    // protection outranks the Season that would otherwise silence Flowers -
    // Court authority overriding Heaven is the one exception the hierarchy
    // grants a Decree.
    const seasonModifiers = this.state.seasonSystem.applySeasonModifiers(
      systemContext,
      { flowersSuppressed }
    )
    const flowerBonus = flowersSuppressed
      ? 1.0
      : this.state.flowerSystem.calculateFlowerBonus(systemContext)

    // Apply yaku bonus from seasons (Autumn: +20% to yaku multipliers)
    const yakuSeasonBonus = seasonModifiers.yakuBonus

    // Calculate Celestial Orb bonuses for detected yaku
    let celestialOrbMultBonus = 0
    let celestialOrbChipsBonus = 0

    // Transmuter rewrites simples into terminals before anything is counted,
    // so every downstream layer sees the promoted tiles.
    const scoredTiles = this.isDecreeRuleActive('simples_as_terminals')
      ? tiles.map((tile) => promoteSimpleToTerminal(tile))
      : tiles

    // Create scoring context with system bonuses
    const disabledDecreeIds = new Set(
      this.state.mandateEffectSystem.getDisabledDecreeIds()
    )
    const context = createScoringContext(scoredTiles, parsedHand, {
      isConcealed: true,
      isTsumo: true,
      additiveBonus: 0,
      multiplicativeBonus: flowerBonus * seasonModifiers.scoreMultiplier,
      debuffedTileIds: this.state.debuffSystem.getDebuffedTileIds(),
      tanyaoAllowsTerminals: this.isDecreeRuleActive('tanyao_terminals'),
      partialMelds,
      previewMode: preview,
      retriggerStrength: seasonModifiers.decreeModifier,
      extraRetriggers: this.state.decreeSystem.calculateRetriggers(
        scoredTiles,
        disabledDecreeIds
      ),
      heldTiles: this.state.handTiles.filter(
        (held) => !tiles.some((played) => played.id === held.id)
      ),
    })

    // Calculate base score
    const baseBreakdown = calculateScore(context)
    // An awakened Bamboo can also form a span-three sequence, but that does
    // not mean Winter/Broken Stair granted it. Do not misattribute its legality.
    if (!this.getPartialHandRules().allowSequenceSkip)
      baseBreakdown.skippedSequences = []
    const flowerSequences = describeFlowerSequences(
      partialMelds ?? parsedHand.melds,
      this.getPartialHandRules()
    )
    // Legacy saves prove only the immediately preceding round, never a longer
    // inferred streak.
    systemContext.yakuMultipliers = new Map(
      baseBreakdown.detectedYaku.map(({ definition: { id } }) => [
        id,
        this.state.previousRoundYakuIds.has(id)
          ? (this.state.previousRoundYakuStreaks?.[id] ?? 1)
          : 0,
      ])
    )
    baseBreakdown.basePoints *= this.state.tableModifiers.baseScoreMultiplier
    // Yaku Nexus scores each yaku as if it ranked higher; Yaku Amplifier scales
    // the combined multiplier. Both are Court authority over Grammar.
    const yakuDecreeModifiers = this.state.decreeSystem.getYakuModifiers(
      disabledDecreeIds,
      this.state.flowerSystem.getFlowerCount()
    )
    const ordinaryYaku = baseBreakdown.detectedYaku
    const ascendedYaku = ordinaryYaku.map((yaku) =>
      ascendYaku(yaku, yakuDecreeModifiers.ascendAdvanced)
    )
    const yakuProduct = (tierBonus: number, yakuList = ordinaryYaku) =>
      yakuList.reduce((multiplier, yaku) => {
        // The table adds to each Yakuman's multiplier, not to every hand and
        // not as a second multiplier over the whole final score.
        const yakuMultiplier =
          yaku.definition.multiplier +
          (yaku.definition.tier === 4
            ? this.state.tableModifiers.yakumanMultiplierBonus
            : 0)
        if (tierBonus > 0) {
          // A tier is worth its share of the yaku's own multiplier, so a tier
          // bonus lifts weak yaku by the same proportion it lifts strong ones.
          const boostedTier = yaku.definition.tier + tierBonus
          const tierRatio = boostedTier / yaku.definition.tier
          return multiplier * (1 + (yakuMultiplier - 1) * tierRatio)
        }
        return multiplier * yakuMultiplier
      }, 1)
    const ordinaryYakuMultiplier = yakuProduct(0)
    const boostedYakuMultiplier =
      yakuProduct(yakuDecreeModifiers.tierBonus, ascendedYaku) *
      (baseBreakdown.detectedYaku.length > 0
        ? yakuDecreeModifiers.multiplier
        : 1)
    // Frostbite scales only the combined Decree contribution. Native Yaku and
    // table bonuses remain the baseline; tiers themselves stay discrete rather
    // than creating fractional Yaku identities.
    baseBreakdown.yakuMultiplier =
      seasonModifiers.decreeModifier === 1
        ? boostedYakuMultiplier
        : ordinaryYakuMultiplier +
          (boostedYakuMultiplier - ordinaryYakuMultiplier) *
            seasonModifiers.decreeModifier
    // The Flint halves the whole play, pattern and Dragons included. It is
    // the only halving: base points and Mult are left whole until here.
    const mandateHalving = this.state.roundManager.checkMandateEffect(
      'halve_score'
    ).active
      ? 0.5
      : 1

    // Ascension changes classification as well as score, without fabricating a
    // second pattern or moving its Orb family. Frostbite weakens numeric gain,
    // not the discrete identity.
    baseBreakdown.detectedYaku = ascendedYaku
    systemContext.detectedYakumanIds = new Set(
      ascendedYaku
        .filter((yaku) => yaku.definition.tier === 4)
        .map((yaku) => yaku.definition.id)
    )

    // Gates that ask "did this hand score X?" must see the final yaku list.
    systemContext.detectedYakuIds = new Set(
      baseBreakdown.detectedYaku.map((yaku) => yaku.definition.id)
    )

    // A tactical play levels through its pattern's families instead of Yaku.
    const playFamilies = partialMelds
      ? playOrbCategories(baseBreakdown.pattern.id, partialMelds, scoredTiles)
      : []
    // The Arm: every family this play levels loses a level before it scores.
    // Payment spends the levels; a preview prices the drop without it.
    const levelDrop = this.state.mandateEffectSystem.getPlayLevelDrop()
    const droppedFamilies = new Set<YakuCategory>(
      levelDrop > 0
        ? [
            ...baseBreakdown.detectedYaku.flatMap(
              (yaku) => mapYakuIdToCategory(yaku.definition.id) ?? []
            ),
            ...playFamilies,
          ]
        : []
    )
    if (!preview)
      for (const family of droppedFamilies)
        this.state.celestialOrbSystem.lowerYakuLevel(family, levelDrop)
    const orbBonusFor = (category: YakuCategory) =>
      this.state.celestialOrbSystem.calculateYakuBonus(
        category,
        preview && droppedFamilies.has(category) ? levelDrop : 0
      )

    // Apply celestial orb bonuses for each detected yaku
    for (const detectedYaku of baseBreakdown.detectedYaku) {
      const category = mapYakuIdToCategory(detectedYaku.definition.id)
      if (category) {
        const orbBonus = orbBonusFor(category)
        celestialOrbMultBonus += orbBonus.mult
        celestialOrbChipsBonus += orbBonus.chips

        // Record the scored occurrence (previews never advance counters).
        if (!preview) {
          this.state.celestialOrbSystem.triggerYaku(category)
        }
      }

      // Also check 'All' category (Black Hole Orb)
      const allBonus = this.state.celestialOrbSystem.calculateYakuBonus('All')
      celestialOrbMultBonus += allBonus.mult
      celestialOrbChipsBonus += allBonus.chips
    }

    for (const category of playFamilies) {
      const orbBonus = orbBonusFor(category)
      celestialOrbMultBonus += orbBonus.mult
      celestialOrbChipsBonus += orbBonus.chips
      if (!preview) this.state.celestialOrbSystem.triggerYaku(category)
    }

    // The play's own Mult: Yaku (or 1) + Orb levels + pattern + Dragons +
    // Mark/Edition "+N Mult". Decrees then work on this running Mult
    // in order, Balatro-style: a "+N Mult" Decree adds N to it and a "×N Mult"
    // Decree multiplies it.
    const seasonedYakuMultiplier =
      baseBreakdown.yakuMultiplier * (1 + yakuSeasonBonus)
    const playMult = Math.max(
      1,
      seasonedYakuMultiplier +
        celestialOrbMultBonus +
        baseBreakdown.pattern.mult +
        baseBreakdown.dragonMult +
        baseBreakdown.modifierMult
    )

    // Build system breakdown for decree application
    const systemBreakdown: SystemScoreBreakdown = {
      basePoints: baseBreakdown.basePoints,
      tilePoints: baseBreakdown.tilePoints,
      structurePoints: baseBreakdown.structurePoints,
      additiveBonus: baseBreakdown.additiveBonus,
      yakuMultiplier: seasonedYakuMultiplier,
      decreeMultiplier: playMult,
      flowerMultiplier: flowerBonus,
      seasonMultiplier: seasonModifiers.scoreMultiplier,
      finalScore: baseBreakdown.finalScore,
      bonusGold: baseBreakdown.goldEarned ?? 0,
    }

    // Neutral qualification and actual payment share all final modifiers and
    // rounding. The neutral pass never rerolls tiles or records scaling growth.
    const orbMultiplier = observatoryMultiplier(
      this.state.celestialOrbs,
      baseBreakdown.detectedYaku.map((yaku) => yaku.definition.id),
      this.state.charterSystem.calculateEffects().orbMultiplier,
      playFamilies
    )
    const settle = (decree: SystemScoreBreakdown) => {
      const finalAdditiveBonus =
        systemBreakdown.additiveBonus +
        (decree.additiveBonus - systemBreakdown.additiveBonus) *
          seasonModifiers.decreeModifier
      // What the Decrees did to the play's Mult, as one factor. Frostbite
      // weakens that factor, never the play's own Mult.
      const decreeFactor = decree.decreeMultiplier / playMult
      const finalDecreeMultiplier =
        seasonModifiers.decreeModifier === 1
          ? decreeFactor
          : 1 + (decreeFactor - 1) * seasonModifiers.decreeModifier
      const subtotal =
        baseBreakdown.basePoints + finalAdditiveBonus + celestialOrbChipsBonus
      const finalMultiplier =
        baseBreakdown.modifierMultiplier *
        playMult *
        flowerBonus *
        seasonModifiers.scoreMultiplier *
        finalDecreeMultiplier *
        orbMultiplier *
        mandateHalving
      const calculatedFinalScore = Math.max(
        0,
        Math.floor(
          subtotal * finalMultiplier * this.state.lossPreventionScorePenalty
        ) - seasonModifiers.decayPenalty
      )
      return {
        finalAdditiveBonus,
        subtotal,
        finalMultiplier,
        calculatedFinalScore,
      }
    }
    if (this.state.decreeSystem.hasScoreThresholdEffects(disabledDecreeIds)) {
      const neutral = this.state.decreeSystem.applyDecreeEffects(
        { ...systemContext, previewMode: true },
        systemBreakdown
      )
      systemContext.scoreBeforeThresholdBonuses =
        settle(neutral).calculatedFinalScore
    }
    const decreeModifiedBreakdown = this.state.decreeSystem.applyDecreeEffects(
      systemContext,
      systemBreakdown
    )
    const {
      finalAdditiveBonus,
      subtotal,
      finalMultiplier,
      calculatedFinalScore,
    } = settle(decreeModifiedBreakdown)

    // Return the breakdown in the format expected by the rest of the system
    return {
      ...baseBreakdown,
      ...(flowerSequences ? { flowerSequences } : {}),
      yakuMultiplier: decreeModifiedBreakdown.yakuMultiplier,
      additiveBonus: finalAdditiveBonus,
      goldEarned: this.calculateGoldReward(baseBreakdown.goldEarned).amount,
      finalScore: calculatedFinalScore,
      equation: settleScoreEquation(
        subtotal,
        finalMultiplier * this.state.lossPreventionScorePenalty,
        calculatedFinalScore
      ),
    }
  }

  /**
   * Check if round is complete
   */
  private checkRoundCompletion(effects: Effect[]): void {
    const roundWon = this.state.score >= this.state.targetScore
    // Out of Turns, or The Needle's single Play is spent.
    const handsExhausted =
      this.state.handsRemaining <= 0 ||
      (this.state.roundManager.checkMandateEffect('single_hand').active &&
        this.getPlaysThisRound() > 0)

    if (roundWon) {
      this.handleRoundWin(effects)
    } else if (handsExhausted) {
      this.handleRoundLoss(effects)
    }
  }

  /**
   * End the round when the player still has hands left but no legal play.
   *
   * A drained wall can leave the hand below the minimum a play requires. That
   * is mahjong's exhaustive draw: with no way left to score, the round is over
   * rather than stuck waiting for an action the player cannot take.
   */
  private enforcePlayability(effects: Effect[]): void {
    if (this.state.phase !== 'gameplay' || !this.state.isRunActive) return
    if (this.canMakeLegalPlay()) return

    if (this.state.score >= this.state.targetScore) {
      this.handleRoundWin(effects)
      return
    }

    effects.push({
      type: 'round_state_changed' as const,
      description: 'Wall exhausted - no legal play remains',
      handsRemaining: this.state.handsRemaining,
      discardsRemaining: this.state.discardsRemaining,
      redrawsRemaining: this.state.redrawsRemaining,
    })
    this.handleRoundLoss(effects)
  }

  /**
   * Let a loss-preventing Decree rescue the round.
   *
   * The round is treated as cleared and the run continues into the Tea House.
   * A single-use Decree (Phoenix) is spent doing it; a permanent one (Immortal
   * Decree) survives but applies its score penalty for the rest of the run.
   *
   * Returns true when the loss was prevented.
   */
  private tryPreventLoss(effects: Effect[]): boolean {
    const savers = this.state.decreeSystem.getRuleContributions(
      'prevent_loss',
      new Set(this.state.mandateEffectSystem.getDisabledDecreeIds())
    )
    if (savers.length === 0) return false

    // Permanent rescue first; spend a copy before destroying its source.
    // Stable sorting preserves inventory order within each priority.
    const priority = (saver: (typeof savers)[number]) =>
      saver.effect.modification.consumedOnUse === false
        ? 0
        : saver.owner !== saver.source
          ? 1
          : 2
    const ordered = savers.sort((a, b) => priority(a) - priority(b))
    for (const { owner: saver, effect } of ordered) {
      const rule = effect.modification

      // Older saves may contain an ineligible Eternal Phoenix. Keep the item
      // protected, but do not grant a one-shot rescue unless it was spent.
      if (
        rule.consumedOnUse &&
        !this.state.decreeSystem.removeDecree(decreeKey(saver))
      )
        continue

      if (typeof rule.scorePenalty === 'number') {
        this.state.lossPreventionScorePenalty = rule.scorePenalty
      }

      effects.push({
        type: 'decree_triggered',
        description: rule.consumedOnUse
          ? `${saver.name} prevented the loss and was consumed`
          : `${saver.name} prevented the loss`,
      })

      eventBus.emit('decreeTriggered', {
        decreeId: saver.id,
        effect: 'loss prevented',
      })

      // Treat the round as cleared so the run continues through the Tea House.
      this.state.score = Math.max(this.state.score, this.state.targetScore)
      this.handleRoundWin(effects)
      return true
    }
    return false
  }

  /** Destroy Decrees that do not survive a lost Boss round (Glass Cannon). */
  private destroyBossLossDecrees(effects: Effect[]): void {
    const roundState = this.state.roundManager.getCurrentRound()
    if (roundState?.roundType !== 'Boss') return

    // Snapshot copy liabilities before removing anything: physical neighbors
    // must not shift midway through settlement. Native liabilities retain
    // their existing behavior even when their owner is suppressed.
    const doomedOwners = new Set(
      this.state.decreeSystem
        .getRuleContributions(
          'destroy_on_boss_loss',
          new Set(this.state.mandateEffectSystem.getDisabledDecreeIds())
        )
        .map(({ owner }) => owner)
    )
    for (const decree of this.state.decreeSystem.getOwnedDecrees()) {
      const doomed = (
        decree.extraEffects
          ? [decree.effect, ...decree.extraEffects]
          : [decree.effect]
      ).some(
        (effect) =>
          effect.type === 'rule_modification' &&
          effect.ruleId === 'destroy_on_boss_loss'
      )
      if (doomed) doomedOwners.add(decree)
    }
    for (const decree of doomedOwners) {
      if (!this.state.decreeSystem.removeDecree(decreeKey(decree))) continue
      effects.push({
        type: 'decree_triggered',
        description: `${decree.name} shattered with the lost Boss round`,
      })
    }
  }

  /** Whether any selection of the current hand could still be played. */
  private canMakeLegalPlay(): boolean {
    const available = this.state.handTiles.length
    if (available < 2) return false

    const fixedHandMandate =
      this.state.roundManager.checkMandateEffect('fixed_hand_size')
    if (
      fixedHandMandate.active &&
      typeof fixedHandMandate.value === 'number' &&
      available < fixedHandMandate.value
    ) {
      return false
    }

    return true
  }

  /**
   * A swift clear earns the round's Omen. The award and its immediate rewards
   * are exactly what skipping the round used to grant, minus the skip.
   */
  private awardRoundOmen(roundType: 'Small' | 'Large') {
    const reward = this.state.omenSystem.handleRoundSkip(roundType)
    for (let i = 0; i < reward.decreeSlotBonus; i++)
      this.state.decreeSystem.addSlot()
    if (reward.immediateDecreeEdition) {
      const edition = this.normalizeDecreeEdition(reward.immediateDecreeEdition)
      if (edition) this.applyRandomDecreeEdition(edition)
    }
    eventBus.emit('omenEarned', {
      roundType,
      omenTagGranted: reward.omen?.id,
    })
    return reward
  }

  /**
   * Handle round win
   */
  private handleRoundWin(effects: Effect[]): void {
    // Capture the completed round before RoundManager advances its cursor.
    const completedRound = this.state.roundManager.getCurrentRound()
    if (!completedRound || completedRound.isCompleted) return
    this.state.roundManager.submitScore(this.state.score)

    const roundState = completedRound
    let goldReward = 0
    let stakeWithheldReward = 0

    if (roundState) {
      switch (roundState.roundType) {
        case 'Small':
          if (this.state.roundManager.getStakeModifiers().noSmallRoundReward)
            stakeWithheldReward = 3
          else goldReward = 3
          break
        case 'Large':
          goldReward = 5
          break
        case 'Boss':
          goldReward = 10
          break
      }
    }

    // Interest is calculated before payout, with Charter-modified caps.
    const interestCap =
      this.state.charterSystem.calculateEffects().interestCap +
      this.state.omenSystem.getInterestCapBonus()
    const goldHeldForInterest = this.state.gold
    const interest = this.state.omenSystem.isInterestBlocked()
      ? 0
      : this.state.roundManager.calculateInterest(
          goldHeldForInterest,
          interestCap
        )
    const rawDecreeGold = this.state.decreeSystem.calculateRoundEndGold(
      new Set(this.state.mandateEffectSystem.getDisabledDecreeIds()),
      this.state.handTiles,
      {
        upgradedOrbFamilies: this.state.celestialOrbSystem
          .toState()
          .orbLevels.filter(([, level]) => level > 1).length,
      }
    )
    const heldGoldMarkReward =
      this.state.handTiles.filter(
        (tile) => tile.modifiers.enhancement === EnhancementType.Gold
      ).length * 3
    const rentalCost = this.state.decreeSystem.calculateRentalCosts()
    // Philosopher's Stone doubles what the round pays in, before the costs it
    // charges out.
    const { decreeGold, amount: grossGold } = this.calculateGoldReward(
      goldReward + interest + heldGoldMarkReward,
      rawDecreeGold
    )
    const netGoldChange = grossGold - rentalCost

    const goldBefore = this.state.gold
    this.state.gold += netGoldChange
    // The last remaining round still earns this Decree's score and payout.
    this.state.decreeSystem.onRoundEnd()
    // Hidden or disabled Decrees sit out the round's payout, then return.
    this.state.mandateEffectSystem.releaseDecreeSuppression()
    // Age existing Omens first, so a newly earned one keeps its full duration.
    this.state.omenSystem.onRoundEnd()
    const swiftOmen =
      roundState.roundType !== 'Boss' &&
      this.state.handsRemaining >= SWIFT_CLEAR_SPARE_TURNS
        ? this.awardRoundOmen(roundState.roundType)
        : null
    const omenGold = swiftOmen?.immediateGold ?? 0
    this.state.gold += omenGold

    const upcomingRound = this.state.roundManager.getCurrentRound()
    const hasUpcomingRound =
      upcomingRound !== null &&
      (upcomingRound.actNumber !== roundState.actNumber ||
        upcomingRound.roundNumber !== roundState.roundNumber)
    this.state.lastRoundSummary = {
      actNumber: roundState.actNumber,
      roundNumber: roundState.roundNumber,
      roundType: roundState.roundType,
      score: this.state.score,
      target: this.state.targetScore,
      baseReward: goldReward,
      interest,
      decreeGold,
      heldGoldMarkReward,
      rentalCost,
      netGoldChange: netGoldChange + omenGold,
      goldBefore,
      goldAfter: this.state.gold,
      nextRoundType: hasUpcomingRound ? upcomingRound.roundType : null,
      nextTarget: hasUpcomingRound ? upcomingRound.scoreTarget : null,
      omenId: swiftOmen?.omen?.id ?? null,
      omenGold,
      omenCopies: swiftOmen?.omen ? swiftOmen.copies : 0,
      spareTurns: this.state.handsRemaining,
      ...(stakeWithheldReward ? { stakeWithheldReward } : {}),
    }

    eventBus.emit('roundEnd', {
      won: true,
      honorDiscards: this.state.honorDiscardsThisRound,
      score: this.state.score,
      target: this.state.targetScore,
    })

    eventBus.emit('goldChanged', {
      previousGold: goldBefore,
      newGold: this.state.gold,
      delta: netGoldChange + omenGold,
      reason: 'Round payout, interest, and Decree effects',
    })

    eventBus.emit('interestSettled', {
      amount: interest,
      cap: interestCap,
      goldHeld: goldHeldForInterest,
    })
    if (interest > 0) {
      eventBus.emit('interestEarned', {
        amount: interest,
        goldHeld: goldHeldForInterest,
      })
    }

    effects.push({
      type: 'gold_changed',
      description: `Round economy changed gold by ${netGoldChange + omenGold}`,
      delta: netGoldChange + omenGold,
      newTotal: this.state.gold,
    })

    this.state.lastCompletedRoundType = roundState.roundType
    this.state.previousRoundYakuStreaks = Object.fromEntries(
      [...this.state.currentRoundYakuIds].map((id) => [
        id,
        this.state.previousRoundYakuIds.has(id)
          ? (this.state.previousRoundYakuStreaks?.[id] ?? 1) + 1
          : 1,
      ])
    )
    this.state.previousRoundYakuIds = new Set(this.state.currentRoundYakuIds)
    this.state.currentRoundYakuIds.clear()

    // Seasons and mandate debuffs are round-scoped.
    this.state.seasonSystem.clear()
    this.state.bambooSummerProtection = false
    this.state.debuffSystem.clearRoundScopedDebuffs()

    // Every completed round leads to the Tea House. Boss completion additionally
    // marks the Act complete and enables the Charter offering.
    if (roundState?.roundType === 'Boss') {
      eventBus.emit('actComplete', {
        actNumber: this.state.currentAct,
        totalScore: this.state.runScore,
      })
    }

    // Pause at the campaign finale before optional Endless. Older in-progress
    // Act 7/8 saves finish their current Boss before securing the same win.
    if (
      roundState.roundType === 'Boss' &&
      this.state.currentAct >= NORMAL_RUN_ACTS &&
      this.state.roundManager.isGameWon() &&
      !this.state.hasWonRun
    ) {
      this.state.hasWonRun = true
      this.state.isRunActive = false
      this.state.phase = 'gameOver'

      eventBus.emit('gameOver', {
        reason: 'victory',
        finalScore: this.state.runScore,
      })
      eventBus.emit('runEnd', {
        victory: true,
        score: this.state.runScore,
        decreesOwned: this.state.decreeSystem.getOwnedDecrees().length,
        decreeIds: this.state.decreeSystem
          .getOwnedDecrees()
          .map((decree) => decree.id),
        act: this.state.currentAct,
        round: this.state.currentRound,
      })
      eventBus.emit('phaseChanged', {
        previousPhase: 'gameplay',
        newPhase: 'gameOver',
      })

      effects.push({
        type: 'round_state_changed' as const,
        description: 'Showdown defeated - run victory achieved',
        handsRemaining: this.state.handsRemaining,
        discardsRemaining: this.state.discardsRemaining,
        redrawsRemaining: this.state.redrawsRemaining,
      })
      return
    }

    this.state.phase = 'shop'
    eventBus.emit('shopEntered', {
      isAfterBoss: roundState.roundType === 'Boss',
      gold: this.state.gold,
    })
    eventBus.emit('phaseChanged', {
      previousPhase: 'gameplay',
      newPhase: 'shop',
    })
  }

  /**
   * Handle round loss
   */
  private handleRoundLoss(effects: Effect[]): void {
    // A Decree may stand between the player and defeat. Phoenix spends itself
    // to do so; Immortal Decree keeps standing but halves what the run scores.
    if (this.tryPreventLoss(effects)) {
      return
    }

    // Final defeat pays no round-end income, but held Rentals still charge.
    // Settle before loss destruction/expiry so those effects cannot waive rent.
    const round = this.state.roundManager.getCurrentRound()!
    const rentalCost = this.state.decreeSystem.calculateRentalCosts()
    const goldBefore = this.state.gold
    this.state.gold -= rentalCost
    this.state.lastRoundSummary = {
      actNumber: this.state.currentAct,
      roundNumber: this.state.currentRound,
      roundType: round.roundType,
      score: this.state.score,
      target: this.state.targetScore,
      baseReward: 0,
      interest: 0,
      decreeGold: 0,
      heldGoldMarkReward: 0,
      rentalCost,
      netGoldChange: rentalCost > 0 ? -rentalCost : 0,
      goldBefore,
      goldAfter: this.state.gold,
      nextRoundType: null,
      nextTarget: null,
    }
    if (rentalCost > 0) {
      eventBus.emit('goldChanged', {
        previousGold: goldBefore,
        newGold: this.state.gold,
        delta: -rentalCost,
        reason: 'Final round Rental costs',
      })
      effects.push({
        type: 'gold_changed',
        description: `Final round Rental costs ${rentalCost} gold`,
        delta: -rentalCost,
        newTotal: this.state.gold,
      })
    }

    this.destroyBossLossDecrees(effects)
    this.state.decreeSystem.onRoundEnd()
    this.state.bambooSummerProtection = false

    eventBus.emit('roundEnd', {
      won: false,
      honorDiscards: this.state.honorDiscardsThisRound,
      score: this.state.score,
      target: this.state.targetScore,
    })

    // Check if game is over
    this.state.isRunActive = false
    this.state.phase = 'gameOver'

    eventBus.emit('gameOver', {
      reason: 'defeat',
      finalScore: this.state.runScore,
    })

    // A post-victory Endless loss closes the ascent but must not count as a
    // second completed run in lifetime progression.
    if (!this.state.hasWonRun) {
      eventBus.emit('runEnd', {
        victory: false,
        score: this.state.runScore,
        act: this.state.currentAct,
        round: this.state.currentRound,
      })
    }

    eventBus.emit('phaseChanged', {
      previousPhase: 'gameplay',
      newPhase: 'gameOver',
    })

    effects.push({
      type: 'round_state_changed' as const,
      description: 'Game over - failed to meet score target',
      handsRemaining: 0,
      discardsRemaining: 0,
      redrawsRemaining: 0,
    })
  }

  /**
   * Advance to next round
   */
  private advanceRound(): void {
    // Get current round from manager (it auto-advances after submitScore)
    const roundState = this.state.roundManager.getCurrentRound()

    if (!roundState) {
      return
    }

    // Update state from round manager
    this.state.currentAct = roundState.actNumber
    this.state.currentRound = roundState.roundNumber
    this.state.omenSystem.setRoundInfo(
      this.state.currentAct,
      this.state.currentRound
    )
    this.state.targetScore = roundState.scoreTarget
    this.state.score = 0

    // Restore the slot that was temporarily unavailable in the completed
    // round, then apply any new Void penalty to the incoming round.
    for (let i = 0; i < this.state.temporaryDecreeSlotPenalty; i++) {
      this.state.decreeSystem.addSlot()
    }
    const nextSlotPenalty =
      this.state.voidScriptSystem.getDecreeSlotsLostNextRound()
    this.state.decreeSystem.removeSlots(nextSlotPenalty)
    this.state.temporaryDecreeSlotPenalty = nextSlotPenalty
    this.state.voidScriptSystem.onRoundEnd()
    this.state.consumableSystem.onRoundEnd()
    this.state.consumableSystem.onRoundStart()

    const omenRoundBonuses = this.state.omenSystem.triggerRoundStartOmens()
    this.state.omenHandSizeBonus = omenRoundBonuses.handSizeBonus
    this.state.omenDiscardBonus = omenRoundBonuses.discardBonus
    this.state.omenRedrawBonus = omenRoundBonuses.drawBonus

    // Notify decree system of round start
    this.state.decreeSystem.onRoundStart()
    this.state.charterSystem.updateProgress(
      this.state.currentAct,
      this.state.currentRound
    )

    // Set act number for season corruption
    this.state.seasonSystem.setAct(this.state.currentAct)

    // Reinitialize wall for new round. The Mandate goes first so round
    // resources can see the Decrees it disables.
    this.initializeWall(
      this.state.seed + this.state.currentAct * 100 + this.state.currentRound
    )
    this.applyMandateDebuffs()
    this.initializeRoundResources()
    this.drawStartingHand()

    eventBus.emit('roundStart', {
      actNumber: this.state.currentAct,
      roundNumber: this.state.currentRound,
      roundType: roundState.roundType,
      target: this.state.targetScore,
    })

    // Emit mandate info if boss round
    if (roundState.bossMandate) {
      eventBus.emit('mandateActivated', {
        mandateId: roundState.bossMandate.id,
        mandateName: roundState.bossMandate.name,
        effect: roundState.bossMandate.description,
      })
    }
  }

  // ===========================================================================
  // SHOP ACTIONS
  // ===========================================================================

  /** Consume next-shop Omens and return their visit-scoped Tea House effects. */
  prepareShopVisit(): TeaHouseVisitModifiers {
    if (this.state.phase !== 'shop') return {}

    const ownedDecreeIds = this.state.decreeSystem
      .getOwnedDecrees()
      .map((d) => d.id)
    const omenEffects = this.state.omenSystem.triggerShopOmens(({ effect }) => {
      if (
        (effect.type === 'guaranteed_item' && effect.itemType === 'Decree') ||
        effect.type === 'edition_apply'
      ) {
        return (
          DecreeSystem.getShopCandidates(
            ownedDecreeIds,
            effect.minDecreeRarity,
            this.state.flowerSystem.getFlowerCount(),
            this.decreeUnlockResolver
          ).length > 0
        )
      }
      return true
    })
    if (omenEffects.goldPenalty > 0) {
      this.changeGold(-omenEffects.goldPenalty, 'Omen trade-off', [])
    }

    return {
      flowerCount: this.state.flowerSystem.getFlowerCount(),
      discountPercentage:
        100 *
        (1 -
          (1 - omenEffects.discount / 100) *
            (1 - this.state.tableModifiers.shopDiscountPercent / 100)),
      freeRerolls: omenEffects.freeRerolls,
      guaranteedItems: omenEffects.guaranteedItems,
      decreeEditions: omenEffects.decreeEditions.map(
        ({ editionType }) => editionType as DecreeEdition
      ),
    }
  }

  /** Resume a campaign victory (including older wins) through its reward shop. */
  continueEndless(): boolean {
    if (
      this.state.phase !== 'gameOver' ||
      !this.state.hasWonRun ||
      this.state.hasEnteredEndless ||
      this.state.currentAct < NORMAL_RUN_ACTS ||
      !this.state.roundManager.isGameWon() ||
      this.state.lastCompletedRoundType !== 'Boss'
    ) {
      return false
    }

    this.state.hasEnteredEndless = true
    this.state.isRunActive = true
    this.state.phase = 'shop'
    eventBus.emit('shopEntered', {
      isAfterBoss: true,
      gold: this.state.gold,
    })
    eventBus.emit('phaseChanged', {
      previousPhase: 'gameOver',
      newPhase: 'shop',
    })
    return true
  }

  /** Destination after a Boss shop, including unspent Act-reduction Charters. */
  getNextActNumber(): number {
    return Math.max(
      1,
      this.state.currentAct + 1 - this.state.pendingActReduction
    )
  }

  /**
   * Exit shop and continue to next act
   */
  exitShop(): void {
    if (this.state.phase !== 'shop' || !this.state.lastCompletedRoundType) {
      return
    }

    if (!this.shop.close()) return
    eventBus.emit('shopExited', this.shop.visitTotals)

    this.state.phase = 'gameplay'

    if (this.state.lastCompletedRoundType === 'Boss') {
      if (this.state.pendingActReduction > 0) {
        const nextAct = this.getNextActNumber()
        this.state.pendingActReduction = 0
        this.state.roundManager.startAct(nextAct)
      } else {
        this.state.roundManager.advanceToNextAct()
      }
    }

    this.state.lastCompletedRoundType = null
    this.advanceRound()

    eventBus.emit('phaseChanged', {
      previousPhase: 'shop',
      newPhase: 'gameplay',
    })
  }

  /**
   * Purchase an item from the shop
   */
  purchaseItem(
    itemId: string,
    cost: number,
    itemType: string = 'Decree'
  ): boolean {
    if (
      this.state.phase !== 'shop' ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      this.state.gold < cost
    ) {
      return false
    }

    this.state.gold -= cost

    eventBus.emit('goldChanged', {
      previousGold: this.state.gold + cost,
      newGold: this.state.gold,
      delta: -cost,
      reason: 'Purchase',
      spendingCategory: itemType === 'Reroll' ? 'reroll' : 'purchase',
    })

    eventBus.emit('itemPurchased', {
      itemType,
      itemId,
      cost,
    })

    return true
  }

  /** Sell an owned Decree and resolve any mandate waiting on that sacrifice. */
  sellDecree(decreeId: string): ActionResult {
    if (
      !this.state.isRunActive ||
      !['gameplay', 'shop'].includes(this.state.phase)
    ) {
      return {
        success: false,
        effects: [],
        errors: ['Decrees can only be sold during an active run'],
      }
    }

    const decree = this.state.decreeSystem.getOwnedDecree(decreeId)
    if (!decree) {
      return { success: false, effects: [], errors: ['Decree not found'] }
    }
    if (hasDecreeSticker(decree, 'Eternal')) {
      return {
        success: false,
        effects: [],
        errors: ['Eternal Decrees cannot be sold'],
      }
    }

    const sellValue = this.state.decreeSystem.sellDecree(decreeId)
    const previousGold = this.state.gold
    this.state.gold += sellValue
    const clearedMandateDebuff = this.state.mandateEffectSystem.onDecreeSold([
      ...this.state.wall,
      ...this.state.deadWall,
      ...this.state.handTiles,
    ])

    const effects: Effect[] = [
      {
        type: 'gold_changed',
        description: `Sold ${decree.name} for ${sellValue} gold`,
        delta: sellValue,
        newTotal: this.state.gold,
      },
    ]
    if (clearedMandateDebuff) {
      effects.push({
        type: 'mandate_cleared',
        description: 'Verdant Leaf lifted: tile debuffs cleared',
      })
    }

    eventBus.emit('itemSold', {
      itemType: 'decree',
      itemId: decree.id,
      value: sellValue,
    })
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: sellValue,
      reason: clearedMandateDebuff
        ? 'Decree sold; Verdant Leaf cleared'
        : 'Decree sold',
    })

    this.publishBuildProgress()

    return { success: true, effects }
  }

  /** Add a purchased decree to the authoritative run inventory. */
  addDecree(
    decree: Decree,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    // A paid pack is an existing reward promise, including on legacy saves.
    // New pack contents are profile-filtered when generated. Do not confiscate
    // a persisted paid choice when eligibility changes; capacity still applies.
    if (
      source === 'pack_open'
        ? !this.state.decreeSystem.canAcquireDecree(
            decree,
            this.state.flowerSystem.getFlowerCount()
          )
        : !this.canAddDecree(decree)
    )
      return false
    const acquired = this.state.decreeSystem.acquireDecree(decree)
    if (!acquired) return false

    eventBus.emit('decreeAcquired', {
      decreeId: acquired.id,
      decreeName: acquired.name,
      rarity: acquired.rarity,
      source,
    })
    this.publishBuildProgress()
    return true
  }

  canAddDecree(decree: Decree): boolean {
    return (
      this.isDecreeUnlocked(decree.id) &&
      this.state.decreeSystem.canAcquireDecree(
        decree,
        this.state.flowerSystem.getFlowerCount()
      )
    )
  }

  /** Add a purchased Charter to the authoritative run and apply slot effects. */
  addImperialCharter(charter: ImperialCharter): boolean {
    const previousDecreeSlots =
      this.state.charterSystem.calculateEffects().decreeSlots
    const acquired = this.state.charterSystem.purchaseCharter(charter.id)
    if (!acquired) return false

    this.state.pendingActReduction += acquired.effects.reduce(
      (total, effect) =>
        effect.type === 'skip_act' ? total + Number(effect.value) : total,
      0
    )

    const nextDecreeSlots =
      this.state.charterSystem.calculateEffects().decreeSlots
    for (let i = previousDecreeSlots; i < nextDecreeSlots; i++) {
      this.state.decreeSystem.addSlot()
    }

    eventBus.emit('charterRedeemed', {
      charterId: acquired.id,
      charterName: acquired.name,
      actNumber: this.state.currentAct,
    })
    this.publishBuildProgress()
    return true
  }

  canAddImperialCharter(charter: ImperialCharter): boolean {
    return this.state.charterSystem.canPurchaseCharter(charter.id)
  }

  canRerollBossMandate(): boolean {
    const currentRound = this.state.roundManager.getCurrentRound()
    return Boolean(
      this.state.isRunActive &&
      this.state.phase === 'gameplay' &&
      currentRound &&
      currentRound.roundType !== 'Boss' &&
      this.state.gold >= this.state.charterSystem.getMandateRerollCost() &&
      this.state.charterSystem.canRerollMandate()
    )
  }

  /** Spend a Charter reroll to replace the upcoming Boss Mandate. */
  rerollBossMandate(): ActionResult {
    if (!this.canRerollBossMandate()) {
      return {
        success: false,
        effects: [],
        errors: ['Boss Mandate cannot be rerolled right now'],
      }
    }

    const replacement = this.state.roundManager.rerollBossMandate()
    if (!replacement || !this.state.charterSystem.useMandateReroll()) {
      return {
        success: false,
        effects: [],
        errors: ['No alternate Boss Mandate is available'],
      }
    }

    const cost = this.state.charterSystem.getMandateRerollCost()
    const previousGold = this.state.gold
    this.state.gold -= cost
    eventBus.emit('goldChanged', {
      previousGold,
      newGold: this.state.gold,
      delta: -cost,
      reason: `Boss Mandate rerolled to ${replacement.name}`,
      spendingCategory: 'reroll',
    })

    return {
      success: true,
      effects: [
        {
          type: 'mandate_rerolled',
          description: `Upcoming Boss Mandate is now ${replacement.name}`,
        },
        {
          type: 'gold_changed',
          description: `Spent ${cost} gold to reroll the Boss Mandate`,
          delta: -cost,
          newTotal: this.state.gold,
        },
      ],
    }
  }

  canUseDeadWallWrit(tileId?: string): boolean {
    return Boolean(
      this.state.isRunActive &&
      this.state.phase === 'gameplay' &&
      this.isDecreeRuleActive('dead_wall_draw') &&
      !this.state.deadWallWritUsedThisRound &&
      this.state.deadWall.length > 0 &&
      tileId &&
      this.state.handTiles.some((tile) => tile.id === tileId) &&
      !this.state.mandateEffectSystem.isTileLocked(tileId)
    )
  }

  /** Swap one chosen hand tile for a Dead Wall draw, once per round. */
  useDeadWallWrit(tileId: string): ActionResult {
    if (!this.canUseDeadWallWrit(tileId)) {
      return {
        success: false,
        effects: [],
        errors: ['Dead Wall Writ requires one unlocked hand tile'],
      }
    }

    const cycle: DrawCycle = { orchidReplacements: 0, drawnTiles: [] }
    const beforeLimit = this.getHandSizeLimit()
    const replacement = this.drawFromDeadWall()
    if (!replacement) {
      return { success: false, effects: [], errors: ['Dead Wall is empty'] }
    }

    const tileIndex = this.state.handTiles.findIndex(
      (tile) => tile.id === tileId
    )
    const [discarded] = this.state.handTiles.splice(tileIndex, 1)
    this.recordHonorDiscard(discarded)
    this.state.discards.push(discarded)
    this.state.faceDownTileIds.delete(tileId)
    this.state.selectedTileIds.clear()
    this.state.deadWallWritUsedThisRound = true

    const effects: Effect[] = [
      {
        type: 'tile_removed',
        description: `Returned ${discarded.displayName} for a Dead Wall draw`,
        tileId,
      },
    ]
    if (replacement.isFlower || replacement.isSeason) {
      this.handleBonusTile(replacement, cycle)
      effects.push({
        type: 'bonus_tile_drawn',
        description: `Drew bonus tile from Dead Wall: ${replacement.displayName}`,
        tile: replacement,
        isFlower: replacement.isFlower,
      })
    } else {
      this.collectDrawnTile(replacement, cycle)
      effects.push({
        type: 'tile_added',
        description: `Dead Wall Writ drew ${replacement.displayName}`,
        tile: replacement,
      })
    }
    this.fillNewSeasonSlots(beforeLimit, effects, cycle, false)
    this.resolveOrchidDraws(cycle, effects, false)
    this.state.handTiles.sort(Tile.compare)

    const drawnTiles = cycle.drawnTiles
    this.applyMandateDrawState(drawnTiles, effects)
    eventBus.emit('tileDiscarded', { tileId, toDeadPool: true })
    for (const tile of drawnTiles) {
      eventBus.emit('tileDrawn', {
        tileId: tile.id,
        tilesRemaining: this.state.wall.length - this.state.drawIndex,
      })
    }

    return { success: true, effects }
  }

  /** Add a Tile Pack reward to the persistent wall composition. */
  addTileToWall(tile: Tile): boolean {
    if (!(tile instanceof Tile)) return false
    if (tile.isFlower && this.state.tableModifiers.flowersDisabled) return false
    this.state.wallTemplate.push(tile)
    this.state.decreeSystem.syncWallSlots(this.state.wallTemplate)
    if (this.state.isRunActive) this.publishWallComposition()
    return true
  }

  // ===========================================================================
  // TILE SELECTION
  // ===========================================================================

  /**
   * Select a tile
   */
  selectTile(tileId: string): void {
    if (this.state.handTiles.some((t) => t.id === tileId)) {
      this.state.selectedTileIds.add(tileId)

      eventBus.emit('tileSelected', {
        tileId,
        selectedCount: this.state.selectedTileIds.size,
      })
    }
  }

  /**
   * Deselect a tile
   */
  deselectTile(tileId: string): void {
    this.state.selectedTileIds.delete(tileId)

    eventBus.emit('tileDeselected', {
      tileId,
      selectedCount: this.state.selectedTileIds.size,
    })
  }

  /**
   * Toggle tile selection
   */
  toggleTileSelection(tileId: string): void {
    if (this.state.selectedTileIds.has(tileId)) {
      this.deselectTile(tileId)
    } else {
      this.selectTile(tileId)
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.state.selectedTileIds.clear()
  }

  /**
   * Select all tiles
   */
  selectAllTiles(): void {
    for (const tile of this.state.handTiles) {
      this.state.selectedTileIds.add(tile.id)
    }
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /** Shared by scoring and the read-only Flora inspector. */
  private areFlowerBonusesSuppressed(): boolean {
    return (
      this.state.seasonSystem.areFlowersSuppressed() &&
      !this.isDecreeRuleActive('flowers_protected')
    )
  }

  private planPlumRecovery(groups: Meld[], played: Tile[]): string[] {
    if (
      this.areFlowerBonusesSuppressed() ||
      !this.state.flowerSystem.hasFlowerType('Plum') ||
      !this.state.seasonSystem
        .getSeasonStack()
        .some((season) => season.type === 'Autumn' && !season.isCorrupted)
    )
      return []
    return planPlumRecursion(groups, played, this.state.discards)
  }

  /** Paid, continuing plays only. Resolve after draws, before their one boss
   * reaction. Recovery is public river movement, not a fresh draw/Orchid trigger.
   */
  private recoverPlumTiles(ids: string[], effects: Effect[]): void {
    let count = 0
    for (const id of ids) {
      const index = this.state.discards.findIndex((tile) => tile.id === id)
      if (index < 0 || this.state.handTiles.some((tile) => tile.id === id))
        continue
      const [tile] = this.state.discards.splice(index, 1)
      this.state.handTiles.push(tile)
      this.state.faceDownTileIds.delete(id)
      effects.push({
        type: 'tile_added',
        description: `Plum returned ${tile.displayName} from the river`,
        tile,
      })
      count++
    }
    if (count > 0) eventBus.emit('plumRecovery', { count })
  }

  private applyBambooSummerReward(tiles: Tile[], effects: Effect[]): void {
    if (
      this.state.bambooSummerProtection ||
      this.areFlowerBonusesSuppressed() ||
      !this.state.flowerSystem.hasFlowerType('Bamboo') ||
      !this.state.seasonSystem
        .getSeasonStack()
        .some((s) => s.type === 'Summer' && !s.isCorrupted) ||
      tiles.filter((tile) => tile.isTerminal && !tile.isStone).length < 4
    )
      return
    const restored = protectSummerWall(this.state)
    effects.push({
      type: 'bonus_activated',
      description: `Bamboo sheltered the wall from Summer: ${restored} tiles returned`,
    })
  }

  getFloraState() {
    const suppressed = this.areFlowerBonusesSuppressed()
    return {
      flowers: this.state.flowerSystem.getCollection(),
      seasons: this.state.seasonSystem.getSeasonStack(),
      flowersSuppressed: suppressed,
      flowersProtected:
        this.state.seasonSystem.areFlowersSuppressed() && !suppressed,
      decayPenalty: this.state.seasonSystem.getDecayPenalty(),
      bambooSummerProtection: this.state.bambooSummerProtection,
    }
  }

  /** Public, detached run progress; never previews or scores a hidden hand. */
  getYakuUpgradeState() {
    return this.state.celestialOrbSystem
      .getYakuBonusSummary()
      .map((upgrade) => ({
        ...upgrade,
        timesScored: this.state.celestialOrbSystem.getYakuTriggerCount(
          upgrade.yaku
        ),
      }))
  }

  /**
   * Every family the Tea House lists, in catalog order: the nine whose Orbs
   * any run can find, from level 1, and a secret family (its Orb earned on
   * the profile) only once an upgrade has reached it. Detached like
   * `getYakuUpgradeState`.
   */
  getYakuFamilyState() {
    const orbs = this.state.celestialOrbSystem
    return Object.values(CELESTIAL_ORBS)
      .filter((orb) => orb.effect.targetYaku !== 'All')
      .map((orb) => ({
        orb,
        upgrade: {
          yaku: orb.effect.targetYaku,
          level: orbs.getYakuLevel(orb.effect.targetYaku),
          mult: orbs.calculateYakuMult(orb.effect.targetYaku),
          chips: orbs.calculateYakuChips(orb.effect.targetYaku),
          timesScored: orbs.getYakuTriggerCount(orb.effect.targetYaku),
        },
      }))
      .filter(
        ({ orb, upgrade }) =>
          upgrade.level > 1 || !getConsumableUnlockCondition(orb.id)
      )
      .map(({ upgrade }) => upgrade)
  }

  /** Get current state (for UI binding). */
  getState(): Readonly<OrchestratorState> {
    return this.state
  }

  /**
   * Get hand tiles
   */
  getHandTiles(): Tile[] {
    return [...this.state.handTiles]
  }

  /**
   * Get selected tile IDs
   */
  getSelectedTileIds(): string[] {
    return Array.from(this.state.selectedTileIds)
  }

  getFaceDownTileIds(): string[] {
    return Array.from(this.state.faceDownTileIds)
  }

  /**
   * Get available actions
   */
  getAvailableActions(): PlayerAction['type'][] {
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') return []
    const available = this.actionProcessor.getAvailableActions(
      this.createStateSnapshot()
    )
    if (this.getEmergencyTurnOffer()?.affordable) available.push('buyTurn')
    return available
  }

  /**
   * Check if an action is valid
   */
  canPerformAction(action: PlayerAction): boolean {
    if (!this.state.isRunActive || this.state.phase !== 'gameplay') return false
    if (action.type === 'play')
      return this.validatePlaySelection(action.tileIds).isValid
    if (
      action.type === 'useSeal' ||
      action.type === 'useScript' ||
      action.type === 'useOrb'
    )
      return this.validateConsumableAction(action).isValid
    return this.actionProcessor.canPerform(action, this.createStateSnapshot())
  }

  // ===========================================================================
  // CONSUMABLE MANAGEMENT
  // ===========================================================================

  /**
   * Add a Fate Seal to inventory
   */
  addFateSeal(
    seal: FateSeal,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    if (source !== 'pack_open' && !this.isConsumableUnlocked(seal.id)) {
      return false
    }
    return this.grantConsumable(seal, source)
  }

  /**
   * Add a Void Script to inventory
   */
  addVoidScript(
    script: VoidScript,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    script.source = source
    this.state.voidScripts.push(script)
    eventBus.emit('consumableAcquired', {
      consumableType: 'VoidScript',
      itemId: script.id,
      instanceId: script.instanceId,
      name: script.name,
      source,
    })
    return true
  }

  /**
   * Add a Celestial Orb to inventory
   */
  addCelestialOrb(
    orb: CelestialOrb,
    source: 'purchase' | 'pack_open' | 'generated' = 'purchase'
  ): boolean {
    if (source !== 'pack_open' && !this.isConsumableUnlocked(orb.id)) {
      return false
    }
    return this.grantConsumable(orb, source)
  }

  /** Grant an eligible acquisition or a previously paid/owned reward. */
  private grantConsumable(
    item: FateSeal | CelestialOrb,
    source: 'purchase' | 'pack_open' | 'generated'
  ): boolean {
    item.source = source
    if (item.type === 'FateSeal') this.state.fateSeals.push(item)
    else this.state.celestialOrbs.push(item)
    eventBus.emit('consumableAcquired', {
      consumableType: item.type,
      itemId: item.id,
      instanceId: item.instanceId,
      name: item.name,
      source,
    })
    return true
  }

  /**
   * Get Fate Seals in inventory
   */
  getFateSeals(): FateSeal[] {
    return [...this.state.fateSeals]
  }

  /**
   * Get Void Scripts in inventory
   */
  getVoidScripts(): VoidScript[] {
    return [...this.state.voidScripts]
  }

  /**
   * Get Celestial Orbs in inventory
   */
  getCelestialOrbs(): CelestialOrb[] {
    return [...this.state.celestialOrbs]
  }

  /**
   * Get consumable counts
   */
  getConsumableCounts(): {
    fateSeals: number
    celestialOrbs: number
    voidScripts: number
  } {
    return {
      fateSeals: this.state.fateSeals.length,
      celestialOrbs: this.state.celestialOrbs.length,
      voidScripts: this.state.voidScripts.length,
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global game orchestrator instance
 */
export const gameOrchestrator = new GameOrchestrator()
