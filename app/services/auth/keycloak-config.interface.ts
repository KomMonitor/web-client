export interface KeycloakConfig {
  'auth-server-url': string;
  realm: string;
  resource: string;
}

export interface KeycloakRole {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
  attributes?: { [key: string]: string[] };
}

export interface KeycloakGroup {
  id: string;
  name: string;
  path?: string;
  subGroupCount?: number;
  subGroups?: KeycloakGroup[];
  attributes?: { [key: string]: string[] };
}

export interface OrganizationalUnit {
  organizationalUnitId: string;
  name: string;
  mandant: string;
  parentId?: string;
  keycloakId?: string;
}

export interface RoleBody {
  name: string;
  description?: string;
  composite?: boolean;
  composites?: KeycloakRole[];
  attributes?: { [key: string]: string[] };
}

export interface GroupBody {
  id?: string;
  name: string;
  attributes?: { [key: string]: string[] };
}

export interface FineGrainedPermissionResource {
  enabled: boolean;
  resource: string;
  scopePermissions: { [key: string]: string };
}

export interface PolicyBody {
  name: string;
  description: string;
  roles: Array<{
    id: string;
    required: boolean;
  }>;
  logic: 'POSITIVE' | 'NEGATIVE';
}

export interface ScopePermissionBody {
  id: string;
  name: string;
  type: string;
  logic: 'POSITIVE' | 'NEGATIVE';
  decisionStrategy: 'UNANIMOUS' | 'AFFIRMATIVE' | 'CONSENSUS';
  resources: string[];
  policies: string[];
  scopes: string[];
  description: string;
} 