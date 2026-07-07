/**
 * Named TypeScript types for the KomMonitor Data Management API.
 *
 * The underlying definitions are generated from the backend's OpenAPI spec
 * (api-specs/kommonitor_dataAccessAPI.yaml) via `npm run generate:api-types`
 * into data-management-api.generated.ts. This file only re-exports the raw
 * schema types under their spec names so application code can import them
 * without going through the `components['schemas'][...]` indirection.
 *
 * Client-side extensions of these types (fields the web client attaches to
 * API objects, e.g. `defaultPrecision` on indicators) live in
 * app/components/ngComponents/models/*.models.ts and extend these types.
 */
import type { components } from './data-management-api.generated';

export type ApiSchemas = components['schemas'];

// --- shared / metadata ---
export type CommonMetadataType = ApiSchemas['CommonMetadataType'];
export type PeriodOfValidityType = ApiSchemas['PeriodOfValidityType'];
export type LastModificationOverviewType = ApiSchemas['LastModificationOverviewType'];
export type OgcServicesType = ApiSchemas['OgcServicesType'];
export type ResourceFilterType = ApiSchemas['ResourceFilterType'];

// --- indicators ---
export type IndicatorOverviewType = ApiSchemas['IndicatorOverviewType'];
export type IndicatorSpatialUnitJoinItem = ApiSchemas['IndicatorSpatialUnitJoinItem'];
export type IndicatorPOSTInputType = ApiSchemas['IndicatorPOSTInputType'];
export type IndicatorPUTInputType = ApiSchemas['IndicatorPUTInputType'];
export type IndicatorMetadataPATCHInputType = ApiSchemas['IndicatorMetadataPATCHInputType'];
export type IndicatorPATCHDisplayOrderInputType = ApiSchemas['IndicatorPATCHDisplayOrderInputType'];
export type IndicatorPropertiesWithoutGeomType = ApiSchemas['IndicatorPropertiesWithoutGeomType'];
export type IndicatorReferenceType = ApiSchemas['IndicatorReferenceType'];
export type GeoresourceReferenceType = ApiSchemas['GeoresourceReferenceType'];
export type DefaultClassificationMappingType = ApiSchemas['DefaultClassificationMappingType'];
export type DefaultClassificationMappingItemType =
  ApiSchemas['DefaultClassificationMappingItemType'];
export type RegionalReferenceValueType = ApiSchemas['RegionalReferenceValueType'];
export type IndicatorTypeEnum = ApiSchemas['IndicatorTypeEnum'];
export type CreationTypeEnum = ApiSchemas['CreationTypeEnum'];

// --- georesources ---
export type GeoresourceOverviewType = ApiSchemas['GeoresourceOverviewType'];
export type GeoresourcePOSTInputType = ApiSchemas['GeoresourcePOSTInputType'];
export type GeoresourcePUTInputType = ApiSchemas['GeoresourcePUTInputType'];
export type GeoresourcePATCHInputType = ApiSchemas['GeoresourcePATCHInputType'];
export type PoiMarkerStyleEnum = ApiSchemas['PoiMarkerStyleEnum'];
export type ColorType = ApiSchemas['ColorType'];

// --- spatial units ---
export type SpatialUnitOverviewType = ApiSchemas['SpatialUnitOverviewType'];
export type SpatialUnitPOSTInputType = ApiSchemas['SpatialUnitPOSTInputType'];
export type SpatialUnitPUTInputType = ApiSchemas['SpatialUnitPUTInputType'];
export type SpatialUnitPATCHInputType = ApiSchemas['SpatialUnitPATCHInputType'];

// --- topics ---
export type TopicOverviewType = ApiSchemas['TopicOverviewType'];
export type TopicInputType = ApiSchemas['TopicInputType'];
export type TopicDisplayOrderInputType = ApiSchemas['TopicDisplayOrderInputType'];
export type TopicDisplayOrderModeOverviewType = ApiSchemas['TopicDisplayOrderModeOverviewType'];
export type TopicDisplayOrderModeInputType = ApiSchemas['TopicDisplayOrderModeInputType'];
export type TopicResourceEnum = ApiSchemas['TopicResourceEnum'];
export type TopicTypeEnum = ApiSchemas['TopicTypeEnum'];
export type TopicOrderModeEnum = ApiSchemas['TopicOrderModeEnum'];

// --- process scripts ---
export type ProcessScriptOverviewType = ApiSchemas['ProcessScriptOverviewType'];
export type ProcessScriptPOSTInputType = ApiSchemas['ProcessScriptPOSTInputType'];
export type ProcessScriptPUTInputType = ApiSchemas['ProcessScriptPUTInputType'];
export type ProcessInputType = ApiSchemas['ProcessInputType'];

// --- access control / organizational units ---
export type OrganizationalUnitOverviewType = ApiSchemas['OrganizationalUnitOverviewType'];
export type OrganizationalUnitInputType = ApiSchemas['OrganizationalUnitInputType'];
export type OrganizationalUnitPermissionOverviewType =
  ApiSchemas['OrganizationalUnitPermissionOverviewType'];
export type OrganizationalUnitRoleAuthorityType = ApiSchemas['OrganizationalUnitRoleAuthorityType'];
export type OrganizationalUnitRoleDelegateType = ApiSchemas['OrganizationalUnitRoleDelegateType'];
export type GroupAdminRolesType = ApiSchemas['GroupAdminRolesType'];
export type GroupAdminRolesPUTInputType = ApiSchemas['GroupAdminRolesPUTInputType'];
export type PermissionOverviewType = ApiSchemas['PermissionOverviewType'];
export type PermissionLevelType = ApiSchemas['PermissionLevelType'];
export type PermissionLevelInputType = ApiSchemas['PermissionLevelInputType'];
export type PermissionResourceType = ApiSchemas['PermissionResourceType'];
export type AdminRoleType = ApiSchemas['AdminRoleType'];
export type OwnerInputType = ApiSchemas['OwnerInputType'];
export type ResourceType = ApiSchemas['ResourceType'];

// --- users ---
export type UserInfoOverviewType = ApiSchemas['UserInfoOverviewType'];
export type UserInfoInputType = ApiSchemas['UserInfoInputType'];

// --- web services (WMS/WFS) ---
export type WebServiceType = ApiSchemas['WebServiceType'];
export type WebServiceCreationType = ApiSchemas['WebServiceCreationType'];
export type WebServiceOverviewType = ApiSchemas['WebServiceOverviewType'];
export type ConnectionInfoType = ApiSchemas['ConnectionInfoType'];
export type WmsConnectionInfoType = ApiSchemas['WmsConnectionInfoType'];
export type ServiceResourceEnum = ApiSchemas['ServiceResourceEnum'];
export type ServiceTypeEnum = ApiSchemas['ServiceTypeEnum'];
