import { Injectable } from '@angular/core';

/**
 * Bootstrap-3 glyphicon name → Font Awesome 6 Free (solid) name.
 *
 * The Data Management API stores POI symbols as Bootstrap-3 glyphicon names
 * (`poiSymbolBootstrap3Name`, see the generated contract), and that field is not
 * the client's to change. This map is the single place where such a name is
 * turned into something renderable, since *Glyphicons Halflings* is not shipped
 * any more — Bootstrap dropped it in 4.
 *
 * All 206 glyphicon names are mapped. Before, 142 of them resolved to `null`
 * and fell through to the fallback, so most POI symbols rendered as a question
 * mark — on the map, in the sidebar lists and in the admin grid alike. Where
 * Font Awesome has no distinct counterpart the closest available icon is used
 * on purpose rather than left empty: all five `sound-*` variants share
 * `volume-high`, the five `floppy-*` variants share `floppy-disk`.
 *
 * Names are the Font Awesome 6 canonical ones (`arrows-rotate`, not the v4/v5
 * aliases `refresh`/`sync`), verified against
 * `@fortawesome/fontawesome-free/css/all.min.css`.
 */
const GLYPHICON_TO_FONT_AWESOME: Readonly<Record<string, string>> = {
  // Core
  asterisk: 'asterisk',
  plus: 'plus',
  euro: 'euro-sign',
  minus: 'minus',
  cloud: 'cloud',
  envelope: 'envelope',
  pencil: 'pencil',
  glass: 'martini-glass',
  music: 'music',
  search: 'magnifying-glass',
  heart: 'heart',
  star: 'star',
  user: 'user',
  film: 'film',
  'th-large': 'table-cells-large',
  th: 'table-cells',
  'th-list': 'list',
  ok: 'check',
  remove: 'xmark',
  'zoom-in': 'magnifying-glass-plus',
  'zoom-out': 'magnifying-glass-minus',
  off: 'power-off',
  signal: 'signal',
  cog: 'gear',
  trash: 'trash-can',

  // Navigation
  home: 'house',
  file: 'file',
  time: 'clock',
  road: 'road',
  'download-alt': 'download',
  download: 'download',
  upload: 'upload',
  inbox: 'inbox',
  'play-circle': 'circle-play',
  repeat: 'rotate-right',
  refresh: 'arrows-rotate',
  'list-alt': 'rectangle-list',
  lock: 'lock',
  flag: 'flag',
  headphones: 'headphones',
  'volume-off': 'volume-xmark',
  'volume-down': 'volume-low',
  'volume-up': 'volume-high',
  qrcode: 'qrcode',
  barcode: 'barcode',
  tag: 'tag',
  tags: 'tags',
  book: 'book',
  bookmark: 'bookmark',
  print: 'print',
  camera: 'camera',
  font: 'font',
  bold: 'bold',
  italic: 'italic',
  'text-height': 'text-height',
  'text-width': 'text-width',
  'align-left': 'align-left',
  'align-center': 'align-center',
  'align-right': 'align-right',
  'align-justify': 'align-justify',
  list: 'list',
  'indent-left': 'outdent',
  'indent-right': 'indent',
  'facetime-video': 'video',
  picture: 'image',

  // Media / status
  'map-marker': 'location-dot',
  adjust: 'circle-half-stroke',
  tint: 'droplet',
  edit: 'pen-to-square',
  share: 'share-from-square',
  check: 'square-check',
  move: 'arrows-up-down-left-right',
  'step-backward': 'backward-step',
  'fast-backward': 'backward-fast',
  backward: 'backward',
  play: 'play',
  pause: 'pause',
  stop: 'stop',
  forward: 'forward',
  'fast-forward': 'forward-fast',
  'step-forward': 'forward-step',
  eject: 'eject',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'plus-sign': 'circle-plus',
  'minus-sign': 'circle-minus',
  'remove-sign': 'circle-xmark',
  'ok-sign': 'circle-check',
  'question-sign': 'circle-question',
  'info-sign': 'circle-info',
  screenshot: 'crosshairs',
  'remove-circle': 'circle-xmark',
  'ok-circle': 'circle-check',
  'ban-circle': 'ban',

  // Arrows / misc
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'share-alt': 'share-nodes',
  'resize-full': 'expand',
  'resize-small': 'compress',
  'exclamation-sign': 'circle-exclamation',
  gift: 'gift',
  leaf: 'leaf',
  fire: 'fire',
  'eye-open': 'eye',
  'eye-close': 'eye-slash',
  'warning-sign': 'triangle-exclamation',
  plane: 'plane-up',
  calendar: 'calendar',
  random: 'shuffle',
  comment: 'comment',
  magnet: 'magnet',
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',
  retweet: 'retweet',
  'shopping-cart': 'cart-shopping',
  'folder-close': 'folder',
  'folder-open': 'folder-open',
  'resize-vertical': 'arrows-up-down',
  'resize-horizontal': 'arrows-left-right',

  // Extended
  hdd: 'hard-drive',
  bullhorn: 'bullhorn',
  bell: 'bell',
  certificate: 'certificate',
  'thumbs-up': 'thumbs-up',
  'thumbs-down': 'thumbs-down',
  'hand-right': 'hand-point-right',
  'hand-left': 'hand-point-left',
  'hand-up': 'hand-point-up',
  'hand-down': 'hand-point-down',
  'circle-arrow-right': 'circle-arrow-right',
  'circle-arrow-left': 'circle-arrow-left',
  'circle-arrow-up': 'circle-arrow-up',
  'circle-arrow-down': 'circle-arrow-down',
  globe: 'globe',
  wrench: 'wrench',
  tasks: 'list-check',
  filter: 'filter',
  briefcase: 'briefcase',
  fullscreen: 'expand',
  dashboard: 'gauge',
  paperclip: 'paperclip',
  'heart-empty': 'heart',
  link: 'link',
  phone: 'phone',
  pushpin: 'thumbtack',
  usd: 'dollar-sign',
  gbp: 'sterling-sign',
  sort: 'sort',
  'sort-by-alphabet': 'arrow-down-a-z',
  'sort-by-alphabet-alt': 'arrow-down-z-a',
  'sort-by-order': 'arrow-down-1-9',
  'sort-by-order-alt': 'arrow-down-9-1',
  'sort-by-attributes': 'arrow-down-short-wide',
  'sort-by-attributes-alt': 'arrow-down-wide-short',
  unchecked: 'square',
  expand: 'square-plus',
  'collapse-down': 'square-minus',
  'collapse-up': 'square-minus',
  'log-in': 'right-to-bracket',
  flash: 'bolt',
  'log-out': 'right-from-bracket',
  'new-window': 'arrow-up-right-from-square',
  record: 'record-vinyl',
  save: 'floppy-disk',
  open: 'folder-open',
  saved: 'floppy-disk',
  import: 'file-import',
  export: 'file-export',
  send: 'paper-plane',
  'floppy-disk': 'floppy-disk',
  'floppy-saved': 'floppy-disk',
  'floppy-remove': 'floppy-disk',
  'floppy-save': 'floppy-disk',
  'floppy-open': 'floppy-disk',
  'credit-card': 'credit-card',
  transfer: 'right-left',
  cutlery: 'utensils',
  header: 'heading',
  compressed: 'file-zipper',
  earphone: 'phone',
  'phone-alt': 'mobile-screen',
  tower: 'tower-broadcast',
  stats: 'chart-bar',
  'sd-video': 'video',
  'hd-video': 'video',
  subtitles: 'closed-captioning',
  'sound-stereo': 'volume-high',
  'sound-dolby': 'volume-high',
  'sound-5-1': 'volume-high',
  'sound-6-1': 'volume-high',
  'sound-7-1': 'volume-high',
  'copyright-mark': 'copyright',
  'registration-mark': 'registered',
  'cloud-download': 'cloud-arrow-down',
  'cloud-upload': 'cloud-arrow-up',
  'tree-conifer': 'tree',
  'tree-deciduous': 'tree',
  education: 'graduation-cap',
  thumbtack: 'thumbtack',
  blackboard: 'chalkboard',
  bed: 'bed',
  tent: 'campground',
  ice: 'ice-cream',
  'ice-lolly': 'ice-cream',
};

/** Shown when the API holds a symbol name that is not a glyphicon at all. */
const FALLBACK = 'circle-question';

/** One entry of the table, in the shape a symbol picker needs. */
export interface GlyphiconIcon {
  /** Bootstrap-3 glyphicon name — this is what the API stores. */
  name: string;
  /** Font Awesome 6 Free (solid) name. */
  faName: string;
  /** Ready-to-use CSS class, `fas fa-<faName>`. */
  faClass: string;
}

/**
 * The table as a list, derived once. Insertion order is kept on purpose: the
 * table is grouped by the original glyphicon cheat-sheet categories, which
 * reads better in a picker grid than 206 alphabetised tiles.
 */
const GLYPHICON_ICONS: readonly GlyphiconIcon[] = Object.freeze(
  Object.entries(GLYPHICON_TO_FONT_AWESOME).map(([name, faName]) =>
    Object.freeze({ name, faName, faClass: `fas fa-${faName}` })
  )
);

const ICONS_BY_NAME: ReadonlyMap<string, GlyphiconIcon> = new Map(
  GLYPHICON_ICONS.map((icon) => [icon.name, icon])
);

/** Bare glyphicon name from a stored value: lower case, no `glyphicon-` prefix. */
function normalizeName(glyphicon: string | undefined | null): string | undefined {
  return glyphicon?.toLowerCase().replace(/^glyphicon-/, '') || undefined;
}

@Injectable({
  providedIn: 'root',
})
export class IconTranslateService {
  /**
   * Takes a bare glyphicon name (`map-marker`), not the CSS class
   * (`glyphicon-map-marker`), and returns a bare Font Awesome name
   * (`location-dot`) — the `fas fa-` prefix is added by the caller, either the
   * `iconTranslate` pipe or Leaflet's AwesomeMarkers (which takes `icon` and
   * `prefix` separately).
   */
  translate(glyphicon: string | undefined | null): string {
    return this.findIcon(glyphicon)?.faName ?? FALLBACK;
  }

  /**
   * Every glyphicon name the client can render, for pickers that offer them.
   * The list is the same data `translate()` reads, so the two cannot drift.
   */
  availableIcons(): readonly GlyphiconIcon[] {
    return GLYPHICON_ICONS;
  }

  /**
   * Resolves a stored value to its table entry, applying the same
   * normalisation as `translate()`. Returns `undefined` for an empty value and
   * for a name the table does not know — callers decide what to show for those
   * rather than getting a silent fallback entry.
   */
  findIcon(glyphicon: string | undefined | null): GlyphiconIcon | undefined {
    const normalized = normalizeName(glyphicon);

    return normalized ? ICONS_BY_NAME.get(normalized) : undefined;
  }
}
