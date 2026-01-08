export interface WmsDataset {
  id: string;
  title: string;
  description: string;
  url: string;
  topicReference: string;
  layerName: string;
  userPermissions: string[];
  permissions: string[];
  isPublic: boolean;
  ownerId: string;
  resourceType: WmsResourceType;
  isSelected: boolean;
  databasis: string;
  datasource: string;
  contact: string;
  note: string;
  showLegend: boolean;
  transparency: any;
}

export enum WmsResourceType {
  GEORESOURCE = 'georesource',
  INDICATOR = 'incicator'
}