/** Alpha-bounds registration measured from the generated PNG masters. */
export const FRAME_REGISTRATION: Readonly<
  Record<string, { left: string; top: string; width: string; height: string }>
> = {
  'enhancement:gold': {
    left: '-14.2564%',
    top: '-1.0961%',
    width: '128.6154%',
    height: '105.7336%',
  },
  'enhancement:bonus': {
    left: '-15.0415%',
    top: '-1.9360%',
    width: '130.0830%',
    height: '105.5556%',
  },
  'enhancement:mult': {
    left: '-16.2791%',
    top: '-2.7004%',
    width: '132.5581%',
    height: '105.8228%',
  },
  'enhancement:wild': {
    left: '-15.9832%',
    top: '-2.3057%',
    width: '131.8612%',
    height: '107.0880%',
  },
  'enhancement:glass': {
    left: '-20.2235%',
    top: '-0.5838%',
    width: '140.1117%',
    height: '104.5872%',
  },
  'enhancement:steel': {
    left: '-16.2619%',
    top: '-4.9123%',
    width: '132.4182%',
    height: '110.0000%',
  },
  'enhancement:stone': {
    left: '-15.2966%',
    top: '-2.7397%',
    width: '130.4891%',
    height: '107.3630%',
  },
  'enhancement:lucky': {
    left: '-20.4494%',
    top: '-5.5705%',
    width: '140.8989%',
    height: '112.6685%',
  },
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

/** Insets of a rectangle from the tile box's edges, in percent of that box. */
export interface FrameWindow {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * The opening of each Mark frame: where its alpha crosses 50%, flood-filled
 * from the centre of the delivered art and placed by FRAME_REGISTRATION
 * above. The openings differ (Gold, Sapphire, Ruby and Lucky carry a heavy
 * lower crest), so the tile face is fitted to each one rather than padded by
 * one shared amount. Re-measure when a frame's art or registration changes.
 */
export const FRAME_WINDOW: Readonly<Record<string, FrameWindow>> = {
  gold: { left: 17.9, top: 14.87, right: 17.79, bottom: 21.8 },
  bonus: { left: 17.48, top: 15.66, right: 17.48, bottom: 20.02 },
  mult: { left: 14.79, top: 13.28, right: 14.79, bottom: 20.03 },
  wild: { left: 17.67, top: 16.1, right: 17.77, bottom: 16.41 },
  glass: { left: 14.8, top: 15.21, right: 15.14, bottom: 14.52 },
  steel: { left: 15.46, top: 11.7, right: 15.57, bottom: 15.54 },
  stone: { left: 16.65, top: 14.04, right: 16.75, bottom: 14.39 },
  lucky: { left: 13.31, top: 9.69, right: 13.31, bottom: 19.9 },
}
