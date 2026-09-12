import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, renderHook } from '@testing-library/react'
import { AudioSystem, audioSystem } from './AudioSystem'
import {
  ALL_SOUND_IDS,
  SOUND_EFFECT_CONFIG,
  MUSIC_CONFIG,
  TILE_SOUNDS,
  GAME_SOUNDS,
} from '../config/audioDefinitions'
import { eventBus } from '../game/EventBus'
import { useAudioLifecycle } from '../hooks/useAudioLifecycle'
import { useSettingsStore } from '../stores/settingsStore'

class MockAudio extends EventTarget {
  static all: MockAudio[] = []
  src: string
  preload = ''
  volume = 1
  playbackRate = 1
  currentTime = 0
  paused = true
  play = vi.fn((): Promise<void> => {
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  constructor(src = '') {
    super()
    this.src = src
    MockAudio.all.push(this)
  }
  getAttribute(name: string) {
    return name === 'src' ? this.src : null
  }
  removeAttribute(name: string) {
    if (name === 'src') this.src = ''
  }
}

let audio: AudioSystem
let time = 0
let frameId = 0
let frames: Map<number, FrameRequestCallback>
const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
}
const advance = (milliseconds: number) => {
  time += milliseconds
  const queued = [...frames.values()]
  frames.clear()
  queued.forEach((callback) => callback(time))
}
const effects = () => MockAudio.all.filter((a) => a.src.includes('/sfx/'))
const playedEffects = () => effects().filter((a) => a.play.mock.calls.length)

beforeEach(() => {
  MockAudio.all = []
  time = 0
  frameId = 0
  frames = new Map()
  vi.stubGlobal('Audio', MockAudio)
  vi.spyOn(performance, 'now').mockImplementation(() => time)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  audio = new AudioSystem()
})
afterEach(() => {
  audio.destroy()
  audioSystem.destroy()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('sound assets', () => {
  it('ships non-silent, bounded PCM audio for every declared sound and existing music paths', () => {
    expect(ALL_SOUND_IDS).toHaveLength(55)
    for (const id of ALL_SOUND_IDS) {
      const bytes = readFileSync(
        resolve('public', SOUND_EFFECT_CONFIG[id].path.replace(/^\//, ''))
      )
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
      expect(bytes.toString('ascii', 8, 12)).toBe('WAVE')
      expect(bytes.readUInt16LE(20)).toBe(1)
      expect(bytes.readUInt16LE(22)).toBe(1)
      expect(bytes.readUInt32LE(24)).toBe(24000)
      expect(bytes.readUInt32LE(40)).toBe(bytes.length - 44)
      let peak = 0
      for (let i = 44; i < bytes.length; i += 2)
        peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)))
      expect(peak, id).toBeGreaterThan(1000)
      expect(peak, id).toBeLessThan(24000)
      expect(bytes.length / 48000, id).toBeLessThan(2.5)
    }
    for (const track of MUSIC_CONFIG)
      expect(
        readFileSync(resolve('public', track.path.replace(/^\//, ''))).length
      ).toBeGreaterThan(1000)
  })
})

describe('audio lifetime and effects', () => {
  it('waits for a gesture and subscribes to gameplay exactly once', () => {
    audio.initialize()
    audio.initialize()
    eventBus.emit('tileSelected', { tileId: 'tile', selectedCount: 1 })
    expect(playedEffects()).toHaveLength(0)
    audio.unlock()
    eventBus.emit('tileSelected', { tileId: 'tile', selectedCount: 1 })
    expect(playedEffects()).toHaveLength(1)
    expect(playedEffects()[0].play).toHaveBeenCalledTimes(1)
    audio.destroy()
    eventBus.emit('tileSelected', { tileId: 'tile', selectedCount: 1 })
    expect(audio.getState().isInitialized).toBe(false)
  })

  it('applies volume to already playing effects and mutes them immediately', () => {
    audio.initialize()
    audio.unlock()
    audio.play(TILE_SOUNDS.select)
    const voice = playedEffects()[0]
    audio.setSfxVolume(0.5)
    audio.setMasterVolume(0.4)
    expect(voice.volume).toBeCloseTo(0.35 * 0.5 * 0.4)
    audio.setSfxMuted(true)
    expect(voice.paused).toBe(true)
    advance(100)
    audio.play(TILE_SOUNDS.select)
    expect(voice.play).toHaveBeenCalledTimes(1)
    audio.setSfxMuted(false)
    audio.play(TILE_SOUNDS.select)
    expect(voice.play).toHaveBeenCalledTimes(2)
    expect(voice.currentTime).toBe(0)
  })

  it('releases a rejected non-overlapping effect so it can be retried', async () => {
    audio.initialize()
    audio.unlock()
    const voice = effects().find((a) =>
      a.src.endsWith('/game_hand_played.wav')
    )!
    voice.play.mockRejectedValueOnce(
      new DOMException('blocked', 'NotAllowedError')
    )
    audio.play(GAME_SOUNDS.handPlayed)
    await flush()
    advance(100)
    audio.play(GAME_SOUNDS.handPlayed)
    expect(voice.play).toHaveBeenCalledTimes(2)
  })

  it('collapses event bursts, bounds voices and admits a high-priority payoff', () => {
    audio.initialize()
    audio.unlock()
    for (let i = 0; i < 14; i++) audio.play(TILE_SOUNDS.draw)
    expect(
      playedEffects().reduce((sum, a) => sum + a.play.mock.calls.length, 0)
    ).toBe(1)
    for (const id of ALL_SOUND_IDS) {
      advance(50)
      audio.play(id)
    }
    expect(effects().filter((a) => !a.paused).length).toBeLessThanOrEqual(10)
    expect(
      effects().some(
        (a) =>
          a.src.endsWith('/special_yakuman.wav') && a.play.mock.calls.length
      )
    ).toBe(true)
  })

  it('rejects invalid volume/pitch without throwing or exceeding browser bounds', () => {
    audio.initialize()
    audio.unlock()
    audio.setSfxVolume(Infinity)
    audio.play(TILE_SOUNDS.draw)
    expect(playedEffects()).toHaveLength(0)
    audio.setSfxVolume(1)
    audio.play(TILE_SOUNDS.draw, { volume: 10, pitch: NaN })
    expect(playedEffects()[0].volume).toBe(1)
    expect(playedEffects()[0].playbackRate).toBe(1)
  })

  it('does not let a browser media setter exception interrupt a tile action or cleanup', () => {
    audio.initialize()
    audio.unlock()
    const voice = effects().find((a) => a.src.endsWith('/tile_select.wav'))!
    Object.defineProperty(voice, 'currentTime', {
      configurable: true,
      get: () => 0,
      set: () => { throw new DOMException('Media is not ready', 'InvalidStateError') },
    })
    expect(() => audio.play(TILE_SOUNDS.select)).not.toThrow()
    expect(() => audio.setSfxMuted(true)).not.toThrow()
    expect(() => audio.destroy()).not.toThrow()
  })
})

describe('music and settings', () => {
  it('does not claim playback succeeded when the browser rejects it', async () => {
    audio.initialize()
    MockAudio.all[0].play.mockRejectedValueOnce(
      new DOMException('blocked', 'NotAllowedError')
    )
    audio.playMusic('menu')
    audio.unlock()
    await flush()
    expect(audio.getState().isPlaying).toBe(false)
    audio.unlock()
    await flush()
    expect(audio.getState().isPlaying).toBe(true)
  })

  it('does not allow a late play promise to undo mute', async () => {
    audio.initialize()
    let resolvePlay!: () => void
    MockAudio.all[0].play.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePlay = resolve
        })
    )
    audio.playMusic('menu')
    audio.unlock()
    audio.setMusicMuted(true)
    resolvePlay()
    await flush()
    expect(audio.getState().isPlaying).toBe(false)
    expect(MockAudio.all.slice(0, 2).every((a) => a.paused)).toBe(true)
  })

  it('changes both fade volumes live and keeps both silent after mute', async () => {
    audio.initialize()
    audio.playMusic('menu')
    audio.unlock()
    await flush()
    audio.playMusic('boss')
    await flush()
    advance(300)
    expect(audio.getState().isCrossfading).toBe(true)
    audio.setMusicVolume(0.2)
    expect(MockAudio.all[0].volume + MockAudio.all[1].volume).toBeCloseTo(0.14)
    audio.setMusicMuted(true)
    advance(2000)
    expect(MockAudio.all.slice(0, 2).every((a) => a.paused)).toBe(true)
    expect(audio.getState().isPlaying).toBe(false)
    audio.setMusicMuted(false)
    await flush()
    expect(MockAudio.all.slice(0, 2).filter((a) => !a.paused)).toHaveLength(1)
    expect(audio.getState().isPlaying).toBe(true)
  })

  it('silences hidden tabs without replaying old effects when visible', async () => {
    audio.initialize()
    audio.unlock()
    await flush()
    audio.play(TILE_SOUNDS.draw)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(MockAudio.all.every((a) => a.paused)).toBe(true)
    advance(100)
    audio.play(TILE_SOUNDS.select)
    expect(playedEffects()).toHaveLength(1)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    await flush()
    expect(audio.getState().isPlaying).toBe(true)
    expect(playedEffects()[0].play).toHaveBeenCalledTimes(1)
  })

  it('cleans up a pending crossfade and can initialize again', async () => {
    audio.initialize()
    audio.unlock()
    await flush()
    audio.playMusic('boss')
    await flush()
    audio.destroy()
    advance(3000)
    expect(MockAudio.all.every((a) => a.paused)).toBe(true)
    audio.initialize()
    audio.unlock()
    await flush()
    expect(audio.getState().isPlaying).toBe(true)
  })

  it('connects persisted preferences before any gesture and reacts to settings', async () => {
    useSettingsStore.setState({
      musicEnabled: false,
      sfxEnabled: false,
      musicVolume: 0.3,
      sfxVolume: 0.2,
    })
    const hook = renderHook(useAudioLifecycle)
    act(() => {
      document.dispatchEvent(new Event('pointerdown'))
    })
    expect(playedEffects()).toHaveLength(0)
    expect(audioSystem.getState()).toMatchObject({
      musicMuted: true,
      sfxMuted: true,
      musicVolume: 0.3,
      sfxVolume: 0.2,
    })
    await act(async () => {
      useSettingsStore.getState().toggleMusic()
      await flush()
    })
    // Context may not yet be set on a direct route; the default menu playlist works.
    act(() => {
      document.dispatchEvent(new Event('pointerdown'))
    })
    await flush()
    expect(audioSystem.getState().isPlaying).toBe(true)
    act(() => {
      useSettingsStore.getState().toggleMusic()
    })
    expect(MockAudio.all.slice(0, 2).every((a) => a.paused)).toBe(true)
    hook.unmount()
    useSettingsStore.getState().resetSettings()
  })
})
