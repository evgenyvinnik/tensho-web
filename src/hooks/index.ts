/**
 * Hooks module exports for Tensho Mahjong Roguelike
 */

export {
  useAudioManager,
  useAudio,
  AudioProvider,
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
