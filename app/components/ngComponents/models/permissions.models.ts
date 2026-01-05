export interface AccessControlMetadata {
  organizationalUnitId: string;
  name: string;
  permissions: Array<{
    permissionId: string;
    permissionLevel: string;
    isChecked: boolean;
  }>;
  datasetOwner?: boolean;
  children?: string[];
  parentId?: string;
  description?: string;
  contact?: string;
  mandant?: boolean;
  keycloakId?: string;
}