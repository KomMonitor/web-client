
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
  wmsData: any[]
}

export interface GeoresourcesDataset {
  aoiColor: string | null | undefined;
  availablePeriodsOfValidity: GeoresourcesDateFormat[];
  datasetName: string;
  geoJSON: any;
  georesourceId: string;
  isAOI: false;
  isLOI: false;
  isPOI: true;
  isPublic: true;
  isSelected: true;
  loiColor: null;
  loiDashArrayString: null;
  loiWidth: 3;
  metadata: GeoresourcesMetadata;
  ownerId: string;
  permissions: string[];
  poiMarkerColor: string;
  poiMarkerStyle: string;
  poiMarkerText: string;
  poiSymbolBootstrap3Name: string;
  poiSymbolColor: string;
  selectedDate: GeoresourcesDateFormat;
  topicReference: string;
  userPermissions: null;
  wfsUrl: string;
  wmsUrl: string;
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
  endData: string;
  startDate: string;
}
