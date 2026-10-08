import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { SUPPORTED_LANGUAGES } from './routeManifest'
import { useDocumentLanguage } from './useDocumentLanguage'

afterEach(() => {
  cleanup()
  document.documentElement.lang = 'en'
})

describe('document language', () => {
  it.each(SUPPORTED_LANGUAGES)(
    'announces %s on every game screen',
    (language) => {
      renderHook(() => useDocumentLanguage(language))
      expect(document.documentElement.lang).toBe(language)
    }
  )

  it('updates after an in-app language switch and falls back for unknown codes', () => {
    const { rerender } = renderHook(useDocumentLanguage, { initialProps: 'ru' })
    expect(document.documentElement.lang).toBe('ru')
    rerender('ja')
    expect(document.documentElement.lang).toBe('ja')
    rerender('unknown')
    expect(document.documentElement.lang).toBe('en')
  })
})
