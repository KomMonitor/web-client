import {
  CommonMetadataType,
  GeoresourceOverviewType,
  PeriodOfValidityType,
} from 'models/data-management-api';

export interface GeoresourcesTopicsHierarchy {
  aoiCount: number;
  aoiData: GeoresourcesDataset[];
  level: number;
  loiCount: number;
  loiData: GeoresourcesDataset[];
  ownCount: number;
  parent: undefined;
  poiCount: number;
  poiData: GeoresourcesDataset[];
  subTopics: GeoresourcesTopicsHierarchy[];
  topicDescription: string;
  topicId: string;
  topicName: string;
  topicResource: string;
  topicType: string;
  totalCount: number;
  wfsCount: number;
  wfsData: any[];
  wmsCount: number;
  wmsData: any[];
  isSelected: boolean;
}

/**
 * Georesource metadata as delivered by the Data Management API
 * (GeoresourceOverviewType), plus fields the web client attaches on top.
 */
export interface GeoresourcesDataset extends Omit<
  GeoresourceOverviewType,
  'availablePeriodsOfValidity' | 'ownerId'
> {
  /** loosened vs. the API type: client-created temporary data layers (file imports) carry placeholder periods without dates */
  availablePeriodsOfValidity: Partial<PeriodOfValidityType>[];
  /** loosened vs. the API type: unset on client-created temporary data layers */
  ownerId?: string;
  /** legacy alias of datasetName still used in some views */
  georesourceName?: string | null;
  /** attached client-side once georesource features have been loaded */
  geoJSON?: any;
  isSelected?: boolean;
  /** client-side selection flag used by the reachability (POI-in-isochrone) analysis */
  isSelected_reachabilityAnalysis?: boolean;
  selectedDate?: PeriodOfValidityType | null;
  isTmpDataLayer?: boolean;
  displayColor?: string;
  type?: string;
  transparency?: any;
  featureSchema?: any;
  dataRows?: any;
}

/** @deprecated import CommonMetadataType from 'models/data-management-api' instead */
export type GeoresourcesMetadata = CommonMetadataType;

/** @deprecated import PeriodOfValidityType from 'models/data-management-api' instead */
export type GeoresourcesDateFormat = PeriodOfValidityType;
