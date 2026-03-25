
export interface GeoresourcesTopicsHierarchy {
  aoiCount: number;
  aoiData: GeoresourcesDataset[];
  level: number;
  loiCount: number;
  loiData: GeoresourcesDataset[];
  ownCount: number;
  parent: undefined
  poiCount: number;
  poiData: GeoresourcesDataset[];
  subTopics: GeoresourcesTopicsHierarchy[]
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

export interface GeoresourcesDataset {
  aoiColor: string | null | undefined;
  availablePeriodsOfValidity: GeoresourcesDateFormat[] | null | undefined;
  datasetName: string | null | undefined;
  georesourceName: string | null | undefined;
  geoJSON: any | null | undefined;
  georesourceId: string | null | undefined;
  isAOI: boolean;
  isLOI: boolean;
  isPOI: boolean;
  isPublic: boolean;
  isSelected: boolean;
  loiColor: null | undefined;
  loiDashArrayString: string | null | undefined;
  loiWidth: number | null | undefined;
  metadata: GeoresourcesMetadata;
  ownerId: string | null | undefined;
  permissions: string[];
  poiMarkerColor: string | null | undefined;
  poiMarkerStyle: string | null | undefined;
  poiMarkerText: string | null | undefined;
  poiSymbolBootstrap3Name: string | null | undefined;
  poiSymbolColor: string | null | undefined;
  selectedDate: GeoresourcesDateFormat | null | undefined;
  topicReference: string;
  userPermissions: any | null | undefined;
  wfsUrl: string | null | undefined;
  wmsUrl: string | null | undefined;
  isTmpDataLayer?: boolean;
  displayColor?: string | undefined;
  type?: string | undefined;
  transparency?: any | undefined;
  featureSchema?: any | undefined;
}

export interface GeoresourcesMetadata {
  contact: string;
  databasis: any;
  datasource: string;
  description: string;
  lastUpdate: string;
  literature: any;
  note: any;
  sridEPSG: any;
  updateInterval: string;
}

export interface GeoresourcesDateFormat {
  endDate: string | undefined;
  startDate: string | undefined;
}
