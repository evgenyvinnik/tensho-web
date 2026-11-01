import { withBasePath } from './basePath'

export const teachingIllustrations = {
  synergy: withBasePath('assets/illustrations/teaching/decree-synergy.webp'),
  awakening: withBasePath(
    'assets/illustrations/teaching/flower-awakening.webp'
  ),
  journey: withBasePath('assets/illustrations/teaching/victory-endless.webp'),
} as const
