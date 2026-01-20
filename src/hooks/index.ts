/**
 * Hooks module exports for Tensho Mahjong Roguelike
 */

export {
  useAudioManager,
  useSoundEffects,
  useGameAudio,
  useAudio,
  AudioProvider,
  playSFX,
  TileSFX,
  UISFX,
  FeedbackSFX,
  type SoundEffectId,
  type MusicContext,
} from './useAudioManager'

export {
  useReducedMotion,
  useSystemReducedMotion,
  useAnimationConfig,
  useAnimationFallback,
  useConditionalAnimation,
  useAccessibleAnimation,
  useAnimationLifecycle,
  useSyncReducedMotionWithSystem,
  useAnimationState,
  type AnimationState,
} from './useReducedMotion'

export {
  useVFX,
  useScreenShake,
  useScreenFlash,
  useScorePopups,
  useButtonPressEffect,
  useHoverGlow,
  useCountUp,
  usePulseOnChange,
  VFXProvider,
  useVFXContext,
  SHAKE_PRESETS,
  FLASH_PRESETS,
  PARTICLE_PRESETS,
  type ShakeIntensity,
  type ShakeConfig,
  type FlashConfig,
  type ParticleBurstConfig,
  type ScorePopupConfig,
} from './useVFX'
