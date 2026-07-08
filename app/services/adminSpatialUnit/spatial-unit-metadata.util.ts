/**
 * Pure spatial-unit metadata helpers extracted from the former
 * `adminSpatialUnit/KommonitorDataExchangeService` god service (step 4 of the
 * admin refactoring — see documentation/ADMIN_REFACTORING_ANALYSIS.md). The
 * facade delegates to these; new code can import them directly.
 */

/** Convert empty strings/undefined to null for API payloads. */
export function convertEmptyToNull(value: any): any {
  return value === '' || value === undefined || value === null ? null : value;
}

/** PATCH body for a spatial-unit metadata update. */
export function buildSpatialUnitMetadataPatchBody(
  spatialUnitLevel: string,
  metadata: any,
  nextLowerHierarchyLevel: string | null,
  nextUpperHierarchyLevel: string | null,
  isOutlineLayer: boolean,
  outlineColor: string,
  outlineWidth: number,
  outlineDashArrayString: string | null
): any {
  return {
    datasetName: spatialUnitLevel.trim(),
    metadata: {
      note: convertEmptyToNull(metadata.note),
      literature: convertEmptyToNull(metadata.literature),
      updateInterval:
        metadata.updateInterval && metadata.updateInterval.apiName
          ? metadata.updateInterval.apiName
          : null,
      sridEPSG: metadata.sridEPSG || 4326,
      datasource: convertEmptyToNull(metadata.datasource),
      contact: convertEmptyToNull(metadata.contact),
      lastUpdate: convertEmptyToNull(metadata.lastUpdate),
      description: convertEmptyToNull(metadata.description),
      databasis: convertEmptyToNull(metadata.databasis),
    },
    nextLowerHierarchyLevel,
    nextUpperHierarchyLevel,
    isOutlineLayer,
    outlineColor: outlineColor || '#bf3d2c',
    outlineWidth: outlineWidth || 2,
    outlineDashArrayString,
  };
}

/** Export structure for a spatial-unit metadata file download. */
export function buildSpatialUnitMetadataExport(
  metadata: any,
  spatialUnitLevel: string,
  nextLowerHierarchyLevel: string | null,
  nextUpperHierarchyLevel: string | null,
  isOutlineLayer: boolean,
  outlineColor: string,
  outlineWidth: number,
  outlineDashArrayString: string | null
): any {
  return {
    metadata: {
      note: convertEmptyToNull(metadata.note),
      literature: convertEmptyToNull(metadata.literature),
      updateInterval: metadata.updateInterval ? metadata.updateInterval.apiName : null,
      sridEPSG: metadata.sridEPSG || 4326,
      datasource: convertEmptyToNull(metadata.datasource),
      contact: convertEmptyToNull(metadata.contact),
      lastUpdate: convertEmptyToNull(metadata.lastUpdate),
      description: convertEmptyToNull(metadata.description),
      databasis: convertEmptyToNull(metadata.databasis),
    },
    allowedRoles: ['roleId'],
    spatialUnitLevel: spatialUnitLevel || null,
    nextLowerHierarchyLevel,
    nextUpperHierarchyLevel,
    isOutlineLayer,
    outlineColor,
    outlineWidth,
    outlineDashArrayString,
  };
}

/** Example structure shown next to the metadata import in the modals. */
export const SPATIAL_UNIT_METADATA_STRUCTURE = {
  metadata: {
    note: 'an optional note',
    literature: 'optional text about literature',
    updateInterval: 'YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY',
    sridEPSG: 4326,
    datasource: 'text about data source',
    contact: 'text about contact details',
    lastUpdate: 'YYYY-MM-DD',
    description: 'description about spatial unit dataset',
    databasis: 'text about data basis',
  },
  allowedRoles: ['roleId'],
  nextLowerHierarchyLevel: 'Name of lower hierarchy level',
  spatialUnitLevel: 'Name of spatial unit dataset',
  nextUpperHierarchyLevel: 'Name of upper hierarchy level',
};

/** Minimal required-field validation for the spatial-unit metadata form. */
export function validateSpatialUnitMetadata(
  _metadata: any,
  spatialUnitLevel: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!spatialUnitLevel || spatialUnitLevel.trim() === '') {
    errors.push('Raumebene Name ist erforderlich.');
  }
  return { isValid: errors.length === 0, errors };
}

/** Both dates are optional; when both parse, start must lie before end. */
export function validatePeriodOfValidity(
  startDate: string,
  endDate: string
): { isValid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { isValid: true };
  }

  const startTime = new Date(startDate as any).getTime();
  const endTime = new Date(endDate as any).getTime();
  if (isNaN(startTime) || isNaN(endTime)) {
    return { isValid: true };
  }

  if (startTime >= endTime) {
    return {
      isValid: false,
      error: 'Start date must be before end date and they cannot be the same',
    };
  }

  return { isValid: true };
}

/** Export structure for an importer mapping-config file download. */
export function buildMappingConfigExport(
  converterDefinition: any,
  datasourceTypeDefinition: any,
  propertyMappingDefinition: any,
  periodOfValidity: any
): any {
  return {
    converter: converterDefinition,
    dataSource: datasourceTypeDefinition,
    propertyMapping: propertyMappingDefinition,
    periodOfValidity,
  };
}

/**
 * Flatten GeoJSON features into their properties for ag-grid display,
 * attaching the geometry and record id under kommonitor* keys.
 */
export function transformFeaturesForGrid(features: any[]): any[] {
  return (features || []).map((feature: any) => {
    if (feature.properties) {
      feature.properties.kommonitorGeometry = feature.geometry;
      feature.properties.kommonitorRecordId = feature.id;
      return feature.properties;
    }
    return feature;
  });
}

/** Property names of the first feature minus the fixed KomMonitor columns. */
export function extractRemainingHeaders(features: any[]): string[] {
  if (!features || features.length === 0) return [];

  const firstFeature = features[0];
  if (!firstFeature.properties) return [];

  const komMonitorProperties = ['ID', 'NAME', 'validStartDate', 'validEndDate'];
  return Object.keys(firstFeature.properties).filter(
    (property) => !komMonitorProperties.includes(property)
  );
}

/**
 * LOI/outline dash-array presets with display labels (aligned with the legacy
 * AngularJS values so persisted datasets map correctly).
 */
export const LABELED_LOI_DASH_ARRAY_OBJECTS = [
  {
    label: 'Durchgezogen',
    dashArrayValue: '',
    svgString:
      '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black"/></svg>',
  },
  {
    label: 'Gestrichelt (20)',
    dashArrayValue: '20',
    svgString:
      '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20"/></svg>',
  },
  {
    label: 'Gestrichelt (20 10)',
    dashArrayValue: '20 10',
    svgString:
      '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10"/></svg>',
  },
  {
    label: 'Strich-Punkt (20 10 5 10)',
    dashArrayValue: '20 10 5 10',
    svgString:
      '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="20 10 5 10"/></svg>',
  },
  {
    label: 'Gepunktet (5)',
    dashArrayValue: '5',
    svgString:
      '<svg width=150 height=10 xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="150" y2="5" stroke="black" stroke-dasharray="5"/></svg>',
  },
];
