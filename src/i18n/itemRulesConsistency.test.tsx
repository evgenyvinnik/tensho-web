import { cleanup, renderHook } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../router/routeManifest'
import { ALL_DECREES } from '../systems/DecreeSystem'
import { FATE_SEALS } from '../systems/FateSealSystem'
import { VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { MERCHANTS_OMEN } from '../config/omenDefinitions'
import { useItemText } from './useItemText'
import en from './locales/en.json'

// Reviewed translations: a recharge-at-Act-end description can pass both key
// coverage and placeholder checks. Preserve the intended scoring-tile meaning.
const scoringTileRetriggers: Record<string, string> = {
  es: 'Reactiva todas las fichas que puntúan 3 veces.',
  fr: 'Redéclenche 3 fois toutes les tuiles qui marquent des points.',
  id: 'Picu ulang semua ubin yang mencetak skor 3 kali.',
  it: 'Riattiva tutte le tessere che segnano punti 3 volte.',
  ru: 'Повторно активирует все кости, приносящие очки, 3 раза.',
  tr: 'Puan kazandıran tüm taşları 3 kez yeniden tetikler.',
  tl: 'Muling pinapagana nang 3 beses ang lahat ng tile na nagbibigay ng puntos.',
  th: 'กระตุ้นไพ่ที่ทำคะแนนทั้งหมดซ้ำ 3 ครั้ง',
  en: 'Retrigger all scoring tiles 3 times',
  ja: '全ての得点牌を3回再発動',
  ko: '모든 득점패 3회 재발동',
  'zh-Hans': '所有得分牌重新触发3次',
  'zh-Hant': '所有得分牌重新觸發3次',
}

afterEach(cleanup)

it('ties the reviewed copy to three scoring-tile retriggers and a 25% discount', () => {
  expect(
    ALL_DECREES.find((item) => item.id === 'decree-infinite-loop')?.effect
  ).toMatchObject({
    type: 'retrigger',
    trigger: 'OnScored',
    target: 'all',
    times: 3,
  })
  expect(MERCHANTS_OMEN.effect).toMatchObject({ type: 'discount', value: 0.25 })
})

it.each(SUPPORTED_LANGUAGES)(
  'keeps visible item rules and edition names consistent in %s',
  async (language) => {
    const { default: copy } = await import(`./locales/${language}.json`)
    const instance = createInstance()
    await instance.init({
      lng: language,
      fallbackLng: false,
      resources: { [language]: { translation: copy } },
      interpolation: { escapeValue: false },
    })
    const { result } = renderHook(() => useItemText(), {
      wrapper: ({ children }) => (
        <I18nextProvider i18n={instance}>{children}</I18nextProvider>
      ),
    })
    const text = result.current
    const loop = ALL_DECREES.find((item) => item.id === 'decree-infinite-loop')!
    expect(text.description('decrees', loop)).toBe(
      scoringTileRetriggers[language]
    )

    const fortune = text.description('seals', FATE_SEALS.seal_of_fortune)
    const aura = text.description('scripts', VOID_SCRIPTS.script_of_aura)
    const hex = text.description('scripts', VOID_SCRIPTS.script_of_the_hex)
    for (const edition of ['foil', 'holographic', 'polychrome']) {
      const name = text.name('editions', {
        id: edition,
        name: 'MISSING EDITION TRANSLATION',
      })
      expect(name).toBe(copy.editions.items[edition].name)
      expect(fortune).toContain(name)
      expect(aura).toContain(name)
    }
    expect(hex).toContain(copy.editions.items.polychrome.name)
    if (language === 'zh-Hans' || language === 'zh-Hant') {
      expect(text.description('omens', MERCHANTS_OMEN)).toBe(
        '下次商店全部商品打7.5折。'
      )
    }
  }
)

it('keeps authored English fallbacks identical to localized consumable descriptions', () => {
  expect(FATE_SEALS.seal_of_fortune.description).toBe(
    en.seals.items.seal_of_fortune.description
  )
  expect(VOID_SCRIPTS.script_of_aura.description).toBe(
    en.scripts.items.script_of_aura.description
  )
  expect(VOID_SCRIPTS.script_of_the_hex.description).toBe(
    en.scripts.items.script_of_the_hex.description
  )
})
