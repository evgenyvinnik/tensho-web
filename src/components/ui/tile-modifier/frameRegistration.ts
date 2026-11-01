/**
 * Alpha-bounds registration of the edition layers, measured from the
 * generated PNG masters. Marks need none: a marked tile is drawn from its own
 * finished artwork.
 */
export const FRAME_REGISTRATION: Readonly<
  Record<string, { left: string; top: string; width: string; height: string }>
> = {
  'edition:foil': {
    left: '-5.7597%',
    top: '-6.6015%',
    width: '111.4201%',
    height: '114.2624%',
  },
  'edition:holographic': {
    left: '-8.5239%',
    top: '-7.3859%',
    width: '116.6320%',
    height: '116.3485%',
  },
  'edition:polychrome': {
    left: '-3.4253%',
    top: '-3.6406%',
    width: '106.7555%',
    height: '108.5980%',
  },
  'edition:negative': {
    left: '-3.1250%',
    top: '-4.1731%',
    width: '106.2500%',
    height: '108.3462%',
  },
}
