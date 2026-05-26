export enum MetadataLoadingState {
  NONE,
  INPROGRESS,
  COMPLETE,
  ERROR
}

export interface PoiSize {
  id: number;
  label: string;
  iconClassName: string;
  scaleFactor: number;
}

export interface LoiDashArrayObject {
  svgString: string;
  dashArrayValue: string;
}

export interface PoiMarkerColor {
  colorName: string;
  colorValue: string;
}

export const POI_SIZES: PoiSize[] = [
  { id: 0, label: 'sehr klein', iconClassName: 'vector-marker-icon-extra-small', scaleFactor: 5 },
  { id: 1, label: 'klein', iconClassName: 'vector-marker-icon-small', scaleFactor: 0.75 },
  { id: 2, label: 'mittel', iconClassName: 'vector-marker-icon-middlesized', scaleFactor: 1 },
  { id: 3, label: 'groß', iconClassName: 'vector-marker-icon-large', scaleFactor: 1.25 },
];

export const DEFAULT_POI_SIZE: PoiSize = POI_SIZES[2];

export const LOI_DASH_ARRAY_OBJECTS: LoiDashArrayObject[] = [
  {
    svgString: '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black"/></svg>',
    dashArrayValue: '',
  },
  {
    svgString: '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20"/></svg>',
    dashArrayValue: '20',
  },
  {
    svgString: '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10"/></svg>',
    dashArrayValue: '20 10',
  },
  {
    svgString: '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10 5 10"/></svg>',
    dashArrayValue: '20 10 5 10',
  },
  {
    svgString: '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
    dashArrayValue: '5',
  },
];

export const POI_MARKER_COLORS: PoiMarkerColor[] = [
  { colorName: 'red', colorValue: 'rgb(205,59,40)' },
  { colorName: 'white', colorValue: 'rgb(255,255,255)' },
  { colorName: 'orange', colorValue: 'rgb(235,144,46)' },
  { colorName: 'beige', colorValue: 'rgb(255,198,138)' },
  { colorName: 'green', colorValue: 'rgb(108,166,36)' },
  { colorName: 'blue', colorValue: 'rgb(53,161,209)' },
  { colorName: 'purple', colorValue: 'rgb(198,77,175)' },
  { colorName: 'pink', colorValue: 'rgb(255,138,232)' },
  { colorName: 'gray', colorValue: 'rgb(163,163,163)' },
  { colorName: 'black', colorValue: 'rgb(47,47,47)' },
];

export const UPDATE_INTERVAL_LABELS = new Map<string, string>([
  ['ARBITRARY', 'beliebig'],
  ['YEARLY', 'jährlich'],
  ['HALF_YEARLY', 'halbjährig'],
  ['MONTHLY', 'monatlich'],
  ['QUARTERLY', 'vierteljährlich'],
]);

export const DATE_PICKER_OPTIONS = {
  autoclose: true,
  language: 'de',
  format: 'yyyy-mm-dd',
} as const;
