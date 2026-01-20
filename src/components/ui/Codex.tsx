/**
 * Codex (Encyclopedia) Component for Tensho Mahjong Roguelike
 *
 * A comprehensive wiki-style guide explaining all game systems in depth.
 * Features sidebar navigation and detailed content sections.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated } from '@react-spring/web'

// Import from extracted codex modules
import { CodexProps, CodexSidebar } from './codex/CodexComponents'
import { useCodexContent } from './codex/useCodexContent'

const AnimatedDiv = animated('div')

/**
 * Main Codex component
 */
export function Codex({ isOpen, onClose }: CodexProps) {
  const { t } = useTranslation()
  const categories = useCodexContent()
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  const [activeSection, setActiveSection] = useState(categories[0]?.sections[0]?.id || '')

  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0%)' : 'translateY(5%)',
    config: { tension: 300, friction: 25 },
  })

  const handleSelectSection = useCallback((categoryId: string, sectionId: string) => {
    setActiveCategory(categoryId)
    setActiveSection(sectionId)
  }, [])

  // Find current section content
  const currentCategory = categories.find((c) => c.id === activeCategory)
  const currentSection = currentCategory?.sections.find((s) => s.id === activeSection)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <AnimatedDiv
        className="w-[95vw] max-w-5xl h-[90vh] bg-[var(--color-dark-forest)] border-2 border-[var(--color-saddle-brown)] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={spring}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-metallic-gold)]/30 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[var(--color-golden-yellow)] flex items-center gap-2">
            📚 {t('codex.title', 'Tensho Codex')}
          </h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[var(--color-forest-green)] hover:bg-[var(--color-vibrant-orange)]
                       border-2 border-[var(--color-metallic-gold)] text-[var(--color-beige-white)]
                       transition-all hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <CodexSidebar
            categories={categories}
            activeCategory={activeCategory}
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
          />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            {currentSection && (
              <article>
                <h2 className="text-xl font-bold text-[var(--color-golden-yellow)] mb-4 pb-2 border-b border-[var(--color-metallic-gold)]/30">
                  {currentSection.title}
                </h2>
                <div className="text-[var(--color-beige-white)] leading-relaxed">
                  {currentSection.content}
                </div>
              </article>
            )}
          </main>
        </div>
      </AnimatedDiv>
    </div>
  )
}

/**
 * Hook to manage Codex state
 */
export function useCodex() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
    toggle: useCallback(() => setIsOpen((v) => !v), []),
  }
}

export default Codex
