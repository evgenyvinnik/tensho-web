/**
 * Vitest Test Setup
 *
 * Global setup for unit and integration tests.
 * Configures testing-library and mocks.
 */

import '@testing-library/jest-dom'

// Initialise i18n so components under test resolve real strings instead of
// raw keys. Tests assert on the English copy players actually see.
import '../i18n'

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock localStorage
const localStorageMock = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock

// Suppress console errors during tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {})
