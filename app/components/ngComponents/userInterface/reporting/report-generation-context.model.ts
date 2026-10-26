// Shared shape for the per-page state `indicator-add.component.ts` and `reporting-overview.component.ts`
// read while generating a report page's map/chart/datatable. Introduced as Phase C2 of the preview-logic
// dedup (see documentation/OFFENE_PUNKTE.md / the reporting-preview-dedup plan): the generation methods
// still read `this.X` directly today, not `context.X` — this interface and the `buildGenerationContext()`
// methods that populate it are plumbing for a later phase that moves the generation pipeline into a
// shared service. Most fields are optional since each component only populates the subset it uses.
export interface ReportGenerationContext {
  // Shared by both components
  pages: any[]; // indicator-add: clonedTemplate.pages, reporting-overview: workingTemplate.pages
  mercatorProjection_d3: any; // d3.GeoProjection

  // indicator-add only
  selectedIndicator?: any;
  selectedAreas?: any[];
  selectedSpatialUnit?: any;
  selectedPoiLayer?: any;
  selectedBaseMap?: any;
  pageConfig?: any;
  echartsOptions?: any; // component-level per-timestamp option cache (distinct from pageElement.echartsOptions)
  geoJsonForReachability?: any;
  isochrones?: any;
  isochronesSeriesData?: any;
  isochronesRangeType?: any;
  isochronesRangeUnits?: any;
  reachabilityTemplateGeoMapOptions?: any;
  selectedIndicatorIsCategorical?: boolean;
  availableFeaturesBySpatialUnit?: any;
  geoJsonForSelectedIndicator_byFeatureName?: Map<string, any>;
  // Shared array references - mutations through context ARE visible on `this` since arrays are by-reference.
  echartsRegisteredMapNames?: string[];
  absoluteLabelPositions?: any[];
  draggingLabelForFeature?: any;

  // reporting-overview only
  currentSpatialUnit?: any;
  geoJsonForReachability_byFeatureName?: Map<string, any>; // used by both components, but populated independently
  featureLookupCache?: Map<string, any>;
  lastPageOfAddedSectionPrepared?: boolean;
  pagePreparationIndex?: number;
  pagePreparationSize?: number;
  loadingData?: boolean;
  echartsImgPixelRatio?: number;
}
