export interface WmsDataset {
  id: string;
  title: string;
  description: string;
  topicReference: string;
  connectionDetails: ConnectionDetails;
  userPermissions: string[];
  permissions: string[];
  isPublic: boolean;
  ownerId: string;
  serviceResource: WmsResourceType;
  isSelected: boolean;
  databasis: string;
  datasource: string;
  contact: string;
  note: string;
  showLegend: boolean;
  transparency: any;
}

export interface ConnectionDetails {
  id: string;
  baseUrl: string;
  layerName: string;
  serviceType: ServiceType;
}

export enum ServiceType {
  WMS = 'wms'
}

export enum WmsResourceType {
  GEORESOURCE = 'georesource',
  INDICATOR = 'indicator'
}