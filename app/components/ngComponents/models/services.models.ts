export interface WmsDataset {
  id: string;
  title: string;
  description: string;
  url: string;
  topicReference: string;
  layerName: string;
  userPermissions: string[];
  resourceType: WmsResourceType;
  isSelected: boolean;
}

export enum WmsResourceType {
  GEORESOURCE = 'georesource',
  INDICATOR = 'incicator'
}