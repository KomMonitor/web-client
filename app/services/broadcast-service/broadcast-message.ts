/**
 * Centralized, typed names for the messages sent through `BroadcastService`.
 *
 * Using a `const` object + derived union type (instead of a numeric enum) keeps
 * the values as real strings, so it stays compatible with every existing
 * `=== '...'` comparison and can be migrated incrementally call-site by
 * call-site. The IDE benefit (autocomplete, find-usages, rename) is identical
 * to an `enum`.
 *
 * Migration plan and inventory: see
 * `documentation/BROADCAST_SERVICE_ENUM.md`.
 *
 * NOTE: values are the literal strings currently on the bus and are kept
 * verbatim — including the historical typo in `IndicatortMapDisplayFinished`
 * ('indicatortMapDisplayFinished'). Renaming a value requires updating its
 * sender(s) and receiver(s) together.
 */
export const BroadcastMessage = {
  AbortReportGeneration: 'abortReportGeneration',
  // NOTE: the name below contains spaces — kept verbatim as it is on the bus.
  AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupCompleted:
    'allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed',
  AppendExportButtonsForTable: 'AppendExportButtonsForTable',
  ApplyNoDataDisplay: 'applyNoDataDisplay',
  AvailableRolesUpdate: 'availableRolesUpdate',
  BatchUpdateCompleted: 'batchUpdateCompleted',
  CSVFromFileFinishedIndicatorRegionalReferenceValues:
    'CSVFromFileFinished_indicatorRegionalReferenceValues',
  ChangeIndicatorDate: 'changeIndicatorDate',
  ChangeStartPointsSourceFromLayer: 'changeStartPointsSource_fromLayer',
  // BUG: kommonitor-data-setup currently sends the mis-cased 'DisableBalance';
  // the only receiver listens for 'disableBalance'. Fix sender when migrating.
  DisableBalance: 'disableBalance',
  DisablePointDrawTool: 'disablePointDrawTool',
  FavItemsStored: 'favItemsStored',
  FileLayerError: 'FileLayerError',
  GeoFavItemsStored: 'geoFavItemsStored',
  GeoresourceGeoJSONUpdated: 'georesourceGeoJSONUpdated',
  GeoresourceGeoJSONUpdatedAddSingleFeature: 'georesourceGeoJSONUpdated_addSingleFeature',
  GeoresourceGeoJSONUpdatedDeleteSingleFeature: 'georesourceGeoJSONUpdated_deleteSingleFeature',
  GeoresourceGeoJSONUpdatedEditSingleFeature: 'georesourceGeoJSONUpdated_editSingleFeature',
  IndicatortMapDisplayFinished: 'indicatortMapDisplayFinished',
  IsochronesCalculationFinished: 'isochronesCalculationFinished',
  OnAddedFeatureToSelection: 'onAddedFeatureToSelection',
  OnChangeSelectedIndicator: 'onChangeSelectedIndicator',
  OnEditGeoresourceFeatures: 'onEditGeoresourceFeatures',
  OnOpenAddFilterModal: 'onOpenAddFilterModal',
  OnRemovedFeatureFromSelection: 'onRemovedFeatureFromSelection',
  OnUpdateSingleFeatureGeometry: 'onUpdateSingleFeatureGeometry',
  RefreshAdminFilterOverview: 'refreshAdminFilterOverview',
  RefreshGeoresourceOverviewTable: 'refreshGeoresourceOverviewTable',
  RefreshIndicatorOverviewTable: 'refreshIndicatorOverviewTable',
  RefreshIndicatorOverviewTableCompleted: 'refreshIndicatorOverviewTableCompleted',
  RefreshSpatialUnitOverviewTable: 'refreshSpatialUnitOverviewTable',
  RefreshTopicsOverview: 'refreshTopicsOverview',
  ReinitIndicatorStatisticsConfiguration: 'reinitIndicatorStatisticsConfiguration',
  ReinitPoisInReachabilityMap: 'reinitPoisInReachabilityMap',
  ReinitReachabilityConfiguration: 'reinitReachabilityConfiguration',
  ReinitSingleFeatureEdit: 'reinitSingleFeatureEdit',
  RemoveAllDrawnPoints: 'removeAllDrawnPoints',
  RemovePotentialDrawnStartingPoints: 'removePotentialDrawnStartingPoints',
  RemoveRangeFilter: 'removeRangeFilter',
  ReopenBatchUpdateResultModal: 'reopenBatchUpdateResultModal',
  ReportingIsochronesCalculationFinished: 'reportingIsochronesCalculationFinished',
  ReportingIsochronesCalculationStarted: 'reportingIsochronesCalculationStarted',
  ReportingPoiLayerSelected: 'reportingPoiLayerSelected',
  ResetPoisInIsochrone: 'resetPoisInIsochrone',
  ResetReachabilityIndicatorStatistics: 'resetReachabilityIndicatorStatistics',
  ResetReachabilityScenarioConfiguration: 'resetReachabilityScenarioConfiguration',
  ResetSingleFeatureEdit: 'resetSingleFeatureEdit',
  ResetTimeseriesMapping: 'resetTimeseriesMapping',
  ScreenshotsForCurrentSpatialUnitUpdate: 'screenshotsForCurrentSpatialUnitUpdate',
  SelectedIndicatorDateHasChanged: 'selectedIndicatorDateHasChanged',
  SingleFeatureSelected: 'singleFeatureSelected',
  UpdateBalanceSlider: 'updateBalanceSlider',
  UpdateClassificationComponent: 'updateClassificationComponent',
  UpdateDatePickerAvailableDates: 'updateDatePickerAvailableDates',
  UpdateDatePickerSelectedDate: 'updateDatePickerSelectedDate',
  UpdateDiagrams: 'updateDiagrams',
  UpdateDiagramsForHoveredFeature: 'updateDiagramsForHoveredFeature',
  UpdateDiagramsForUnhoveredFeature: 'updateDiagramsForUnhoveredFeature',
  UpdateIndicatorValueRangeFilter: 'updateIndicatorValueRangeFilter',
  UpdateLegendDisplay: 'updateLegendDisplay',
  UpdateMeasureOfValueBar: 'updateMeasureOfValueBar',
} as const;

export type BroadcastMessage = (typeof BroadcastMessage)[keyof typeof BroadcastMessage];

/**
 * Shape of every message on the bus. `msg` accepts the typed names plus an
 * arbitrary string: the receiver side still compares against a handful of
 * intentionally-kept legacy "dead receiver" names (no live sender) and the
 * initial seed value is the empty string. The `& {}` keeps literal autocomplete
 * for the known names while still permitting any string. `values` is the
 * heterogeneous payload and stays untyped.
 */
export interface BroadcastEnvelope {
  msg: BroadcastMessage | (string & {});
  values?: any;
}
