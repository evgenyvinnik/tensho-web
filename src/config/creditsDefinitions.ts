/**
 * Third-party audio shown under Settings → Credits.
 *
 * Titles, authors and licence names are proper nouns and stay untranslated;
 * `role` names an i18n key under `settings.credits`. Keep this in step with
 * scripts/sfx-sources/SOURCES.md, which records the files behind each entry.
 */

export interface AudioCredit {
  id: string
  /** The work's own title, as its author published it. */
  title: string
  author: string
  /** Where the work can be found. */
  url: string
  license: { name: string; url: string }
  /** What Tensho uses it for: `settings.credits.<role>`. */
  role: 'interface' | 'casino'
  /** Folder under scripts/sfx-sources holding the files used. */
  source: string
  /** CC BY asks for changes to be indicated. */
  modified?: boolean
}

const CC0 = {
  name: 'CC0 1.0',
  url: 'https://creativecommons.org/publicdomain/zero/1.0/',
}

export const SOUND_EFFECT_CREDITS: readonly AudioCredit[] = [
  {
    id: 'kenney-interface-sounds',
    title: 'Interface Sounds',
    author: 'Kenney',
    url: 'https://kenney.nl/assets/interface-sounds',
    license: CC0,
    role: 'interface',
    source: 'kenney-interface',
  },
  {
    id: 'kenney-casino-audio',
    title: 'Casino Audio',
    author: 'Kenney',
    url: 'https://kenney.nl/assets/casino-audio',
    license: CC0,
    role: 'casino',
    source: 'kenney-casino',
  },
]
