/** Side-effect-free route catalog shared by the browser and static Pages build. */
export const SUPPORTED_LANGUAGES = [
  'en',
  'ru',
  'tr',
  'id',
  'es',
  'ja',
  'ko',
  'zh-Hant',
  'zh-Hans',
  'fr',
  'it',
  'tl',
  'th',
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const ROUTES = {
  MENU: '',
  PLAY: 'play',
  TABLE_LOOP: 'table-loop',
  SHOP: 'shop',
  GAME_OVER: 'game-over',
  CODEX: 'codex',
  TUTORIAL: 'tutorial',
  COLLECTION: 'collection',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
