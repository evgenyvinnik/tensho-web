import { withBasePath } from './basePath'
import { getGeneratedArt } from './generatedArt'

/** Keep the original Double Omen artwork and resolve every other catalog ID. */
export function getOmenIllustration(id: string): string | undefined {
  return id === 'double_omen'
    ? withBasePath('assets/illustrations/omens/double-omen.webp')
    : getGeneratedArt('omens', id)
}
