/** App-lifetime audio. Presentation never consumes gameplay RNG. */
import {
  SOUND_EFFECT_CONFIG,
  MUSIC_CONFIG,
  getMusicForContext,
  getPreloadSounds,
  TILE_SOUNDS,
  UI_SOUNDS,
  GAME_SOUNDS,
  SPECIAL_SOUNDS,
  FEEDBACK_SOUNDS,
  SHOP_SOUNDS,
  CONSUMABLE_SOUNDS,
  type SoundEffectId,
  type SoundEffectConfig,
  type MusicContext,
} from '../config/audioDefinitions'
import { eventBus, type GameEvent } from '../game/EventBus'

interface Voice {
  element: HTMLAudioElement
  active: boolean
  gain: number
  generation: number
  started: number
  config: SoundEffectConfig
}
const clamp = (n: number) =>
  Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0

export class AudioSystem {
  private state = {
    masterVolume: 1,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    musicMuted: false,
    sfxMuted: false,
    isTabVisible: true,
    currentMusicContext: null as MusicContext | null,
    isInitialized: false,
    currentTrack: null as string | null,
    isPlaying: false,
    isCrossfading: false,
  }
  private unlocked = false
  private musicWanted = false
  private music: HTMLAudioElement[] = []
  private active = 0
  private epoch = 0
  private pendingMusic = false
  private frame: number | null = null
  private fade = 1
  private queue: string[] = []
  private pools = new Map<SoundEffectId, Voice[]>()
  private lastPlayed = new Map<SoundEffectId, number>()
  private unsubscribeEvents: (() => void)[] = []
  private listeners = new Set<() => void>()
  private revision = 0

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getRevision = () => this.revision
  private notify() {
    this.revision++
    this.listeners.forEach((listener) => listener())
  }
  getState() {
    return { ...this.state }
  }
  isAudioSupported() {
    return typeof Audio !== 'undefined'
  }

  initialize() {
    if (this.state.isInitialized || !this.isAudioSupported()) return
    this.music = [new Audio(), new Audio()]
    this.music.forEach((audio) => {
      audio.preload = 'none'
      audio.addEventListener('ended', this.onMusicEnded)
    })
    this.state.isTabVisible = document.visibilityState !== 'hidden'
    document.addEventListener('visibilitychange', this.onVisibility)
    this.state.isInitialized = true
    for (const id of getPreloadSounds()) this.pool(id)
    this.connectEvents()
    this.notify()
  }

  /** Synchronous gesture entry point. Never replay stale effects after unlocking. */
  unlock() {
    if (!this.state.isInitialized) return
    this.unlocked = true
    if (!this.state.musicMuted && !this.state.isPlaying && !this.pendingMusic)
      this.resumeMusic()
  }

  destroy() {
    this.stopMusic(false)
    this.stopEffects()
    this.music.forEach((audio) => {
      audio.removeEventListener('ended', this.onMusicEnded)
      audio.removeAttribute('src')
    })
    this.pools.forEach((voices) =>
      voices.forEach((v) => v.element.removeAttribute('src'))
    )
    this.pools.clear()
    this.lastPlayed.clear()
    this.music = []
    this.active = 0
    this.unlocked = false
    this.unsubscribeEvents.forEach((off) => off())
    this.unsubscribeEvents = []
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.state.isInitialized = false
    this.notify()
  }

  private pool(id: SoundEffectId) {
    let voices = this.pools.get(id)
    if (!voices) {
      voices = [this.createVoice(SOUND_EFFECT_CONFIG[id])]
      this.pools.set(id, voices)
    }
    return voices
  }
  private createVoice(config: SoundEffectConfig): Voice {
    const element = new Audio(config.path)
    element.preload = config.preload ? 'auto' : 'none'
    const voice: Voice = {
      element,
      active: false,
      gain: config.volume,
      generation: 0,
      started: 0,
      config,
    }
    const release = () => {
      voice.active = false
    }
    element.addEventListener('ended', release)
    element.addEventListener('error', release)
    return voice
  }
  private release(voice: Voice) {
    voice.generation++
    voice.active = false
    try {
      voice.element.pause()
      voice.element.currentTime = 0
    } catch {
      // Media may be unavailable during loading/teardown. Never block the game.
    }
  }
  private stopEffects() {
    this.pools.forEach((voices) => voices.forEach((v) => this.release(v)))
  }
  private updateEffects() {
    this.pools.forEach((voices) =>
      voices.forEach((v) => {
        v.element.volume = clamp(
          v.gain * this.state.sfxVolume * this.state.masterVolume
        )
      })
    )
  }

  play(id: SoundEffectId, options?: { volume?: number; pitch?: number }) {
    if (
      !this.state.isInitialized ||
      !this.unlocked ||
      this.state.sfxMuted ||
      !this.state.isTabVisible ||
      !this.state.sfxVolume ||
      !this.state.masterVolume
    )
      return
    const config = SOUND_EFFECT_CONFIG[id]
    if (!config) return
    const now = performance.now()
    // A deal's burst of draw events should not produce fourteen simultaneous clacks.
    if (now - (this.lastPlayed.get(id) ?? -Infinity) < 45) return
    const voices = this.pool(id)
    if (!config.allowOverlap && voices.some((v) => v.active)) return
    let voice = voices.find((v) => !v.active)
    if (!voice && voices.length < config.maxInstances) {
      voice = this.createVoice(config)
      voices.push(voice)
    }
    if (!voice) {
      voice = [...voices].sort((a, b) => a.started - b.started)[0]
      this.release(voice)
    }
    const active = [...this.pools.values()].flat().filter((v) => v.active)
    if (active.length >= 10) {
      const oldest = active.sort(
        (a, b) => a.config.priority - b.config.priority || a.started - b.started
      )[0]
      if (oldest.config.priority > config.priority) return
      this.release(oldest)
    }
    this.lastPlayed.set(id, now)
    const generation = ++voice.generation
    const current = voice
    const rejected = () => {
      if (current.generation === generation) current.active = false
    }
    try {
      // Setters can throw synchronously too, before play() has a promise.
      voice.gain = clamp(options?.volume ?? config.volume)
      voice.element.volume = clamp(
        voice.gain * this.state.sfxVolume * this.state.masterVolume
      )
      const [min, max] = config.pitchVariation ?? [1, 1]
      const pitch = options?.pitch ?? min + Math.random() * (max - min)
      voice.element.playbackRate = Number.isFinite(pitch)
        ? Math.max(0.5, Math.min(2, pitch))
        : 1
      voice.element.currentTime = 0
      voice.started = now
      voice.active = true
      void voice.element.play()?.catch(rejected)
    } catch {
      rejected()
    }
  }

  private canPlayMusic() {
    return (
      this.state.isInitialized &&
      this.unlocked &&
      this.musicWanted &&
      !this.state.musicMuted &&
      this.state.isTabVisible
    )
  }
  private cancelFade() {
    ++this.epoch
    this.pendingMusic = false
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.frame = null
    if (this.state.isCrossfading) {
      this.music[this.active]?.pause()
      this.active = 1 - this.active
    }
    this.state.isCrossfading = false
    this.fade = 1
    this.music[1 - this.active]?.pause()
  }
  private musicGain() {
    const track = MUSIC_CONFIG.find(
      (track) => track.path === this.state.currentTrack
    )
    return this.state.musicMuted || !this.state.isTabVisible
      ? 0
      : clamp(
          this.state.musicVolume *
            this.state.masterVolume *
            (track?.volume ?? 0.7)
        )
  }
  private updateMusicVolume() {
    const gain = this.musicGain()
    if (this.music[this.active])
      this.music[this.active].volume =
        gain * (this.state.isCrossfading ? 1 - this.fade : 1)
    if (this.music[1 - this.active])
      this.music[1 - this.active].volume =
        gain * (this.state.isCrossfading ? this.fade : 0)
  }
  playMusic(context: MusicContext) {
    if (
      context === this.state.currentMusicContext &&
      (this.state.isPlaying || this.state.isCrossfading)
    )
      return
    this.state.currentMusicContext = context
    this.queue = this.shuffle(
      getMusicForContext(context).map((track) => track.path)
    )
    this.musicWanted = true
    if (!this.queue.length) {
      this.stopMusic(false)
      return
    }
    if (this.canPlayMusic()) this.nextTrack()
  }
  playTrack(path: string) {
    if (!MUSIC_CONFIG.some((track) => track.path === path)) return
    this.musicWanted = true
    if (this.canPlayMusic()) this.startTrack(path)
  }
  private refillQueue() {
    this.queue = this.shuffle(
      getMusicForContext(this.state.currentMusicContext ?? 'menu').map(
        (t) => t.path
      )
    )
    if (this.queue.length > 1 && this.queue[0] === this.state.currentTrack)
      this.queue.push(this.queue.shift()!)
  }
  nextTrack() {
    if (!this.canPlayMusic()) return
    if (!this.queue.length) this.refillQueue()
    const path = this.queue.shift()
    if (path) this.startTrack(path)
  }
  private startTrack(path: string) {
    this.cancelFade()
    const outgoing = this.music[this.active]
    if (!outgoing) return
    const wasPlaying = this.state.isPlaying && !outgoing.paused
    const incomingIndex = wasPlaying ? 1 - this.active : this.active
    const incoming = this.music[incomingIndex]
    const epoch = this.epoch
    this.pendingMusic = true
    incoming.src = path
    incoming.currentTime = 0
    incoming.volume = wasPlaying ? 0 : this.musicGain()
    void incoming
      .play()
      .then(() => {
        if (epoch !== this.epoch || !this.canPlayMusic()) return
        this.pendingMusic = false
        this.state.isPlaying = true
        this.state.currentTrack = path
        if (!wasPlaying) {
          this.updateMusicVolume()
          this.notify()
          return
        }
        this.state.isCrossfading = true
        this.fade = 0
        const start = performance.now()
        const animate = (time: number) => {
          if (epoch !== this.epoch) return
          this.fade = Math.max(0, Math.min(1, (time - start) / 1200))
          this.updateMusicVolume()
          if (this.fade < 1) this.frame = requestAnimationFrame(animate)
          else {
            outgoing.pause()
            this.active = incomingIndex
            this.state.isCrossfading = false
            this.frame = null
            this.updateMusicVolume()
            this.notify()
          }
        }
        this.frame = requestAnimationFrame(animate)
        this.notify()
      })
      .catch(() => {
        if (epoch === this.epoch) {
          this.pendingMusic = false
          this.state.isPlaying = wasPlaying
          this.notify()
        }
      })
  }
  pauseMusic() {
    this.musicWanted = false
    this.pausePlayback()
  }
  private pausePlayback() {
    this.cancelFade()
    this.music.forEach((audio) => audio.pause())
    this.state.isPlaying = false
    this.notify()
  }
  resumeMusic() {
    this.musicWanted = true
    if (!this.canPlayMusic() || this.pendingMusic || this.state.isPlaying)
      return
    const audio = this.music[this.active]
    if (!audio) return
    if (!this.state.currentTrack || !audio.getAttribute('src')) {
      this.nextTrack()
      return
    }
    const epoch = this.epoch
    this.pendingMusic = true
    this.updateMusicVolume()
    void audio
      .play()
      .then(() => {
        if (epoch !== this.epoch || !this.canPlayMusic()) return
        this.pendingMusic = false
        this.state.isPlaying = true
        this.notify()
      })
      .catch(() => {
        if (epoch === this.epoch) {
          this.pendingMusic = false
          this.state.isPlaying = false
          this.notify()
        }
      })
  }
  /** Stop both sides immediately so no outgoing track survives a mute/stop. */
  stopMusic(_fadeOut = true) {
    this.pauseMusic()
    this.music.forEach((audio) => {
      audio.currentTime = 0
    })
    this.state.currentTrack = null
    this.queue = []
    this.notify()
  }
  private onMusicEnded = () => {
    if (this.canPlayMusic() && !this.state.isCrossfading) this.nextTrack()
  }
  private onVisibility = () => {
    this.state.isTabVisible = document.visibilityState !== 'hidden'
    if (!this.state.isTabVisible) {
      this.stopEffects()
      this.pausePlayback()
    } else if (this.musicWanted) this.resumeMusic()
  }

  setMasterVolume(volume: number) {
    this.state.masterVolume = clamp(volume)
    this.updateEffects()
    this.updateMusicVolume()
    this.notify()
  }
  setMusicVolume(volume: number) {
    this.state.musicVolume = clamp(volume)
    this.updateMusicVolume()
    this.notify()
  }
  setSfxVolume(volume: number) {
    this.state.sfxVolume = clamp(volume)
    this.updateEffects()
    this.notify()
  }
  setMusicMuted(muted: boolean) {
    if (this.state.musicMuted === muted) return
    this.state.musicMuted = muted
    if (muted) this.pausePlayback()
    else if (this.musicWanted) this.resumeMusic()
    this.notify()
  }
  setSfxMuted(muted: boolean) {
    this.state.sfxMuted = muted
    if (muted) this.stopEffects()
    this.notify()
  }
  toggleMusicMute() {
    this.setMusicMuted(!this.state.musicMuted)
  }
  toggleSfxMute() {
    this.setSfxMuted(!this.state.sfxMuted)
  }

  private connectEvents() {
    const cues: Partial<Record<GameEvent, SoundEffectId>> = {
      tileDrawn: TILE_SOUNDS.draw,
      tileDiscarded: TILE_SOUNDS.discard,
      tileSelected: TILE_SOUNDS.select,
      tileDeselected: TILE_SOUNDS.deselect,
      handPlayed: GAME_SOUNDS.handPlayed,
      yakuScored: SPECIAL_SOUNDS.yakuScored,
      yakumanScored: SPECIAL_SOUNDS.yakumanScored,
      actComplete: GAME_SOUNDS.actComplete,
      itemPurchased: SHOP_SOUNDS.purchase,
      itemSold: SHOP_SOUNDS.sell,
      shopRerolled: SHOP_SOUNDS.reroll,
      shopEntered: SHOP_SOUNDS.shopEnter,
      decreeTriggered: SPECIAL_SOUNDS.decreeTriggered,
      flowerCollected: SPECIAL_SOUNDS.flowerCollected,
      seasonActivated: SPECIAL_SOUNDS.seasonActivated,
      packOpened: SPECIAL_SOUNDS.packOpening,
      charterRedeemed: SPECIAL_SOUNDS.charterRedeemed,
      fateSealUsed: CONSUMABLE_SOUNDS.fateSealUsed,
      celestialOrbUsed: CONSUMABLE_SOUNDS.celestialOrbUsed,
      voidScriptUsed: CONSUMABLE_SOUNDS.voidScriptUsed,
      error: FEEDBACK_SOUNDS.invalidAction,
    }
    for (const [event, cue] of Object.entries(cues))
      this.unsubscribeEvents.push(
        eventBus.on(event as GameEvent, () => this.play(cue))
      )
    this.unsubscribeEvents.push(
      eventBus.on('decreeAcquired', ({ source }) => {
        if (source !== 'starting') this.play(SPECIAL_SOUNDS.decreeAcquired)
      }),
      eventBus.on('roundEnd', ({ won }) =>
        this.play(won ? GAME_SOUNDS.roundComplete : GAME_SOUNDS.roundFailed)
      ),
      eventBus.on('gameOver', ({ reason }) => {
        this.play(
          reason === 'victory' ? GAME_SOUNDS.victory : GAME_SOUNDS.gameOver
        )
        this.playMusic(reason === 'victory' ? 'victory' : 'gameOver')
      }),
      eventBus.on('goldChanged', ({ delta }) => {
        if (delta)
          this.play(delta > 0 ? GAME_SOUNDS.goldEarned : GAME_SOUNDS.goldSpent)
      }),
      eventBus.on('phaseChanged', ({ newPhase }) => {
        if (newPhase === 'gameplay' || newPhase === 'shop')
          this.playMusic(newPhase)
      })
    )
  }
  private shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}

export const audioSystem = new AudioSystem()
export const playSFX = (
  id: SoundEffectId,
  options?: { volume?: number; pitch?: number }
) => audioSystem.play(id, options)
export const TileSFX = {
  draw: () => playSFX(TILE_SOUNDS.draw),
  discard: () => playSFX(TILE_SOUNDS.discard),
  select: () => playSFX(TILE_SOUNDS.select),
  deselect: () => playSFX(TILE_SOUNDS.deselect),
  slide: () => playSFX(TILE_SOUNDS.slide),
}
export const UISFX = {
  click: () => playSFX(UI_SOUNDS.buttonClick),
  hover: () => playSFX(UI_SOUNDS.buttonHover),
  menuOpen: () => playSFX(UI_SOUNDS.menuOpen),
  menuClose: () => playSFX(UI_SOUNDS.menuClose),
}
export const FeedbackSFX = {
  error: () => playSFX(FEEDBACK_SOUNDS.error),
  invalid: () => playSFX(FEEDBACK_SOUNDS.invalidAction),
  success: () => playSFX(FEEDBACK_SOUNDS.success),
}
export default audioSystem
