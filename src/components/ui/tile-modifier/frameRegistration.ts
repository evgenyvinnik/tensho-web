/**
 * Alpha-bounds registration measured from the generated PNG masters.
 * Percentages are relative to the 526×661 front-face viewport, NOT the full
 * 569×711 tile image (which includes its sidewall and red backing).
 * The source tile family varies by at most one horizontal pixel.
 */
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
