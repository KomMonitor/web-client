import {
  CommonMetadataType,
  DefaultClassificationMappingType,
  IndicatorOverviewType,
  IndicatorSpatialUnitJoinItem,
} from 'models/data-management-api';
import { WmsDataset } from './services.models';

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

/**
 * Indicator metadata as delivered by the Data Management API
 * (IndicatorOverviewType), plus fields the web client attaches on top.
 */
export interface IndicatorsDataset extends Omit<IndicatorOverviewType, 'precision'> {
  /** loosened vs. the API type: the backend sends explicit null when no precision is predefined */
  precision?: number | null;
  /** set client-side by IndicatorMetadataStoreService: true when the API precision was null and the env default was applied */
  defaultPrecision?: boolean;
  /** attached client-side once indicator features have been loaded */
  geoJSON?: any;
}

/** @deprecated import DefaultClassificationMappingType from 'models/data-management-api' instead */
export type IndicatorClassification = DefaultClassificationMappingType;

/** @deprecated import IndicatorSpatialUnitJoinItem from 'models/data-management-api' instead */
export type SpatialUnitDataset = IndicatorSpatialUnitJoinItem;

/** @deprecated import CommonMetadataType from 'models/data-management-api' instead */
export type IndicatorMetadata = CommonMetadataType;
