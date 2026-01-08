import { WmsDataset } from "./services.models";


export interface IndicatorsTopicsHierarchy {
  indicatorCount: number;
  indicatorData: IndicatorsDataset[];
  subTopics: IndicatorsTopicsHierarchy[];
  level: number;
  parent: any | undefined;
  topicDescription: string;
  topicId: string;
  topicName: string;
  topicResource: string;
  topicType: string;
  displayOrder: number;
  wmsData: WmsDataset[];
  wmsCount: number;
}

export interface IndicatorsDataset {
  abbreviation: string;
  applicableDates: string[];
  applicableSpatialUnits: SpatialUnitDataset[];
  characteristicValue: null;
  creationType: string;
  defaultClassificationMapping: IndicatorClassification;
  defaultPrecision: boolean;
  displayOrder: 0;
  indicatorId: string;
  indicatorName: string;
  indicatorType: string;
  interpretation: string;
  isHeadlineIndicator: boolean;
  isPublic: boolean;
  lowestSpatialUnitForComputation: any | null;
  metadata: IndicatorMetadata;
  ogcServices: any[];
  ownerId: string;
  permissions: string[];
  precision: number;
  processDescription: string;
  referenceDateNote: string;
  referencedGeoresources: any | null;
  referencedIndicators: any | null;
  regionalReferenceValues: any[];
  tags: string[];
  topicReference: string;
  unit: string;
  userPermissions: string[];
  geoJSON: any;
}

export interface IndicatorClassification {
  classificationMethod: string;
  colorBrewerSchemeName: string;
  items: any[];
  numClasses: number;
}

export interface SpatialUnitDataset {
  isPublic: boolean;
  ownerId: string;
  permissions: string[];
  spatialUnitId: string;
  spatialUnitName: string;
  userPermissions: null;
}

export interface IndicatorMetadata {
  contact: string;
  databasis: any | null;
  datasource: string;
  description: string;
  lastUpdate: string;
  literature: any | null;
  note: any | null;
  sridEPSG: any | null;
  updateInterval: string;
}