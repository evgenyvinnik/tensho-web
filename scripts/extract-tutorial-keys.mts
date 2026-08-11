/**
 * Extract the English source strings for the tutorial's <Trans> blocks.
 *
 * <Trans> derives its default text from its JSX children, using an index for
 * each child element. Those indices are what a translation must reproduce, and
 * they are easy to miscount by hand - so this reads them from react-i18next's
 * own serializer rather than re-deriving them.
 *
 * Usage: bunx vite-node scripts/extract-tutorial-keys.mts
 * Writes the shapes into src/i18n/locales/en.json.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { nodesToString } from 'react-i18next'
import { readFileSync, writeFileSync } from 'node:fs'
import type { ReactElement, ReactNode } from 'react'
import { Children, createElement, isValidElement } from 'react'
import { useTutorialSteps } from '../src/components/screens/tutorial/useTutorialSteps'
import '../src/i18n'

// Rendering the hook needs a React tree; walk the returned steps instead.
type TransProps = { i18nKey?: string; children?: ReactNode }

function collect(node: ReactNode, into: Map<string, string>): void {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<TransProps>
    const name =
      typeof element.type === 'function'
        ? (element.type as { name?: string }).name
        : String(element.type)

    if (name === 'Trans' && element.props.i18nKey) {
      into.set(
        element.props.i18nKey,
        nodesToString(element.props.children, {}) as unknown as string
      )
    }
    collect(element.props.children, into)
  })
}

export function extract(): Map<string, string> {
  const shapes = new Map<string, string>()
  // useTutorialSteps is a hook; render a probe component to run it.
  let steps: ReturnType<typeof useTutorialSteps> = []
  const Probe = () => {
    steps = useTutorialSteps()
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  for (const step of steps) collect(step.content, shapes)
  return shapes
}

const shapes = extract()
const path = 'src/i18n/locales/en.json'
const en = JSON.parse(readFileSync(path, 'utf8'))
for (const [key, value] of shapes) {
  const parts = key.split('.')
  let node = en
  for (const part of parts.slice(0, -1)) node = node[part] ??= {}
  node[parts.at(-1)!] = value
}
writeFileSync(path, JSON.stringify(en, null, 2) + '\n')
console.log(`extracted ${shapes.size} tutorial strings into ${path}`)
