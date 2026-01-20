/**
 * Codex Types
 *
 * Shared types for the Codex encyclopedia component.
 */

import React from 'react'

/**
 * Codex category definition
 */
export interface CodexCategory {
  id: string
  title: string
  icon: string
  sections: CodexSection[]
}

/**
 * Codex section within a category
 */
export interface CodexSection {
  id: string
  title: string
  content: React.ReactNode
}

/**
 * Codex props
 */
export interface CodexProps {
  isOpen: boolean
  onClose: () => void
}
