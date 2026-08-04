import { Injectable } from '@angular/core';

/**
 * Centralized access to runtime environment configuration (window.__env).
 * Inject this service instead of reading window.__env directly.
 */
@Injectable({
  providedIn: 'root',
})
export class EnvConfigService {
  // --- Branding & UI ---
  get appTitle(): string {
    return window.__env.appTitle;
  }
  get loginInfoText(): any {
    return window.__env.loginInfoText;
  }
  get customLandingPage(): boolean {
    return window.__env.customLandingPage;
  }
  get customLogoURL(): any {
    return window.__env.customLogoURL;
  }
  get customLogo_onClickURL(): any {
    return window.__env.customLogo_onClickURL;
  }
  get customLogoWidth(): any {
    return window.__env.customLogoWidth;
  }
  get customGreetingsContact_name(): any {
    return window.__env.customGreetingsContact_name;
  }
  get customGreetingsContact_organisation(): any {
    return window.__env.customGreetingsContact_organisation;
  }
  get customGreetingsContact_mail(): any {
    return window.__env.customGreetingsContact_mail;
  }
  get customGreetingsTextInfoMessage(): any {
    return window.__env.customGreetingsTextInfoMessage;
  }

  // --- Diagrams / Charts ---
  get showBarChartLabel(): any {
    return window.__env.showBarChartLabel;
  }
  get showBarChartAverageLine(): any {
    return window.__env.showBarChartAverageLine;
  }
  get customReportFontSize(): any {
    return window.__env.customReportFontSize;
  }
  get enableMeanDataDisplayInLegend(): any {
    return window.__env.enableMeanDataDisplayInLegend;
  }
  get configMeanDataDisplay(): any {
    return window.__env.configMeanDataDisplay || 'both';
  }
  get enableScatterPlotRegression(): any {
    return window.__env.enableScatterPlotRegression;
  }
  get enableBilanceTrend(): any {
    return window.__env.enableBilanceTrend;
  }

  // --- Indicator display ---
  get numberOfDecimals(): any {
    return window.__env.numberOfDecimals;
  }
  get indicatorDatePrefix(): any {
    return window.__env.indicatorDatePrefix;
  }
  get useOutlierDetectionOnIndicator(): any {
    return window.__env.useOutlierDetectionOnIndicator;
  }
  set useOutlierDetectionOnIndicator(value: any) {
    window.__env.useOutlierDetectionOnIndicator = value;
  }
  get classifyZeroSeparately(): any {
    return window.__env.classifyZeroSeparately;
  }
  set classifyZeroSeparately(value: any) {
    window.__env.classifyZeroSeparately = value;
  }
  get classifyUsingWholeTimeseries(): any {
    return window.__env.classifyUsingWholeTimeseries;
  }
  set classifyUsingWholeTimeseries(value: any) {
    window.__env.classifyUsingWholeTimeseries = value;
  }
  get useNoDataToggle(): any {
    return window.__env.useNoDataToggle;
  }
  get arrayOfNameSubstringsForHidingIndicators(): any {
    return window.__env.arrayOfNameSubstringsForHidingIndicators;
  }
  get arrayOfNameSubstringsForHidingGeoresources(): any {
    return window.__env.arrayOfNameSubstringsForHidingGeoresources;
  }

  // --- Colors ---
  get defaultColorForZeroValues(): any {
    return window.__env.defaultColorForZeroValues;
  }
  get defaultColorForNoDataValues(): any {
    return window.__env.defaultColorForNoDataValues;
  }
  get defaultColorForFilteredValues(): any {
    return window.__env.defaultColorForFilteredValues;
  }
  get defaultColorForHoveredFeatures(): any {
    return window.__env.defaultColorForHoveredFeatures;
  }
  get defaultColorForClickedFeatures(): any {
    return window.__env.defaultColorForClickedFeatures;
  }
  get defaultColorForOutliers_high(): any {
    return window.__env.defaultColorForOutliers_high;
  }
  get defaultBorderColorForOutliers_high(): any {
    return window.__env.defaultBorderColorForOutliers_high;
  }
  get defaultFillOpacityForOutliers_high(): any {
    return window.__env.defaultFillOpacityForOutliers_high;
  }
  get defaultColorForOutliers_low(): any {
    return window.__env.defaultColorForOutliers_low;
  }
  get defaultBorderColorForOutliers_low(): any {
    return window.__env.defaultBorderColorForOutliers_low;
  }
  get defaultFillOpacityForOutliers_low(): any {
    return window.__env.defaultFillOpacityForOutliers_low;
  }
  get defaultBorderColor(): any {
    return window.__env.defaultBorderColor;
  }
  get defaultBorderColorForNoDataValues(): any {
    return window.__env.defaultBorderColorForNoDataValues;
  }
  get defaultBorderColorForFilteredValues(): any {
    return window.__env.defaultBorderColorForFilteredValues;
  }
  get defaultFillOpacity(): any {
    return window.__env.defaultFillOpacity;
  }
  get defaultFillOpacityForFilteredFeatures(): any {
    return window.__env.defaultFillOpacityForFilteredFeatures;
  }
  get defaultFillOpacityForHighlightedFeatures(): any {
    return window.__env.defaultFillOpacityForHighlightedFeatures;
  }
  get defaultFillOpacityForZeroFeatures(): any {
    return window.__env.defaultFillOpacityForZeroFeatures;
  }
  get defaultFillOpacityForNoDataFeatures(): any {
    return window.__env.defaultFillOpacityForNoDataFeatures;
  }
  get defaultFillOpacityForNoDataValues(): any {
    return window.__env.defaultFillOpacityForNoDataValues;
  }
  get defaultColorBrewerPaletteForBalanceIncreasingValues(): any {
    return window.__env.defaultColorBrewerPaletteForBalanceIncreasingValues;
  }
  get defaultColorBrewerPaletteForBalanceDecreasingValues(): any {
    return window.__env.defaultColorBrewerPaletteForBalanceDecreasingValues;
  }
  get defaultColorBrewerPaletteForGtMovValues(): any {
    return window.__env.defaultColorBrewerPaletteForGtMovValues;
  }
  get defaultColorBrewerPaletteForLtMovValues(): any {
    return window.__env.defaultColorBrewerPaletteForLtMovValues;
  }
  get customColorSchemes(): any {
    return window.__env.customColorSchemes;
  }

  // --- Admin / Dropdown options ---
  get updateIntervalOptions(): any {
    return window.__env.updateIntervalOptions;
  }
  get indicatorTypeOptions(): any {
    return window.__env.indicatorTypeOptions;
  }
  get indicatorUnitOptions(): any {
    // Optional chaining so a missing config value yields undefined instead of
    // throwing on `.sort()` of undefined.
    return window.__env.indicatorUnitOptions?.sort();
  }
  get indicatorCreationTypeOptions(): any {
    return window.__env.indicatorCreationTypeOptions;
  }
  get geodataSourceFormats(): any {
    return window.__env.geodataSourceFormats;
  }
  get simplifyGeometriesOptions(): any {
    return window.__env.simplifyGeometriesOptions;
  }
  get simplifyGeometriesParameterName(): any {
    return window.__env.simplifyGeometriesParameterName;
  }
  get simplifyGeometries(): any {
    return window.__env.simplifyGeometries;
  }
  get enabledGeoresourcesInfrastructure(): any {
    return window.__env.enabledGeoresourcesInfrastructure;
  }
  get enabledGeoresourcesGeoservices(): any {
    return window.__env.enabledGeoresourcesGeoservices;
  }
  get defaultClassifyMethod(): any {
    return window.__env.defaultClassifyMethod;
  }

  // --- API URLs ---
  get apiUrl(): string {
    return window.__env.apiUrl;
  }
  get basePath(): string {
    return window.__env.basePath;
  }
  get targetUrlToProcessingEngine(): any {
    return window.__env.targetUrlToProcessingEngine;
  }
  get targetUrlToReachabilityService_ORS(): any {
    return window.__env.targetUrlToReachabilityService_ORS;
  }
  get targetUrlToReachabilityService_OTP(): any {
    return window.__env.targetUrlToReachabilityService_OTP;
  }
  get targetUrlToImporterService(): any {
    return window.__env.targetUrlToImporterService;
  }
  get targetUrlToGeocoderService(): any {
    return window.__env.targetUrlToGeocoderService;
  }

  // --- GeoData / Feature properties ---
  get wfsDatasets(): any {
    return window.__env.wfsDatasets;
  }
  get FEATURE_ID_PROPERTY_NAME(): any {
    return window.__env.FEATURE_ID_PROPERTY_NAME;
  }
  get FEATURE_NAME_PROPERTY_NAME(): any {
    return window.__env.FEATURE_NAME_PROPERTY_NAME;
  }
  get VALID_START_DATE_PROPERTY_NAME(): any {
    return window.__env.VALID_START_DATE_PROPERTY_NAME;
  }
  get VALID_END_DATE_PROPERTY_NAME(): any {
    return window.__env.VALID_END_DATE_PROPERTY_NAME;
  }

  // --- Auth / Keycloak ---
  get enableKeycloakSecurity(): any {
    return window.__env.enableKeycloakSecurity;
  }
  get keycloakKomMonitorAdminRoleName(): any {
    return window.__env.keycloakKomMonitorAdminRoleName;
  }

  get keycloakKomMonitorGroupsEditRoleNames(): any {
    return window.__env.keycloakKomMonitorGroupsEditRoleNames;
  }
  set keycloakKomMonitorGroupsEditRoleNames(value: any) {
    window.__env.keycloakKomMonitorGroupsEditRoleNames = value;
  }

  get keycloakKomMonitorThemesEditRoleNames(): any {
    return window.__env.keycloakKomMonitorThemesEditRoleNames;
  }
  set keycloakKomMonitorThemesEditRoleNames(value: any) {
    window.__env.keycloakKomMonitorThemesEditRoleNames = value;
  }

  get keycloakKomMonitorGeodataEditRoleNames(): any {
    return window.__env.keycloakKomMonitorGeodataEditRoleNames;
  }
  set keycloakKomMonitorGeodataEditRoleNames(value: any) {
    window.__env.keycloakKomMonitorGeodataEditRoleNames = value;
  }

  // --- Storage ---
  get localStoragePrefix(): any {
    return window.__env.localStoragePrefix;
  }
  get configStorageServerConfig(): any {
    return window.__env.configStorageServerConfig;
  }

  // --- Map / Geo ---
  get initialLatitude(): any {
    return window.__env.initialLatitude;
  }
  set initialLatitude(value: any) {
    window.__env.initialLatitude = value;
  }

  get initialLongitude(): any {
    return window.__env.initialLongitude;
  }
  set initialLongitude(value: any) {
    window.__env.initialLongitude = value;
  }

  get initialZoomLevel(): any {
    return window.__env.initialZoomLevel;
  }
  set initialZoomLevel(value: any) {
    window.__env.initialZoomLevel = value;
  }

  get minZoomLevel(): any {
    return window.__env.minZoomLevel;
  }
  get maxZoomLevel(): any {
    return window.__env.maxZoomLevel;
  }

  get centerMapInitially(): any {
    return window.__env.centerMapInitially;
  }
  set centerMapInitially(value: any) {
    window.__env.centerMapInitially = value;
  }

  // --- Sharing / Deep links ---
  get initialIndicatorId(): any {
    return window.__env.initialIndicatorId;
  }
  set initialIndicatorId(value: any) {
    window.__env.initialIndicatorId = value;
  }

  get initialSpatialUnitName(): any {
    return window.__env.initialSpatialUnitName;
  }
  set initialSpatialUnitName(value: any) {
    window.__env.initialSpatialUnitName = value;
  }

  get controlsConfig(): any {
    return window.__env.controlsConfig;
  }

  // --- Filters ---
  get filterConfig(): any {
    return window.__env.filterConfig;
  }
  get filterModes(): any {
    return window.__env.filterModes;
  }

  // --- Element visibility / advanced mode ---
  get isAdvancedMode(): any {
    return window.__env.isAdvancedMode;
  }
  get showAdvancedModeSwitch(): any {
    return window.__env.showAdvancedModeSwitch;
  }
  get showFavoriteSelection(): any {
    return window.__env.showFavoriteSelection;
  }
  get config(): any {
    return window.__env.config;
  }

  // --- Map layers ---
  get baseLayers(): any {
    return window.__env.baseLayers;
  }
  get sortableLayers(): any {
    return window.__env.sortableLayers;
  }

  // --- Transparency ---
  get useTransparencyOnIndicator(): any {
    return window.__env.useTransparencyOnIndicator;
  }

  // --- Auth / Keycloak extended ---
  get keycloakConfig(): any {
    return window.__env.keycloakConfig;
  }

  // --- Spatial unit notification ---
  get enableSpatialUnitNotificationSelection(): any {
    return window.__env.enableSpatialUnitNotificationSelection;
  }
  get enableSpatialUnitNotificationButton(): any {
    return window.__env.enableSpatialUnitNotificationButton;
  }
  get spatialUnitNotificationSelection(): any {
    return window.__env.spatialUnitNotificationSelection;
  }
  get spatialUnitNotificationTitle(): any {
    return window.__env.spatialUnitNotificationTitle;
  }
  get spatialUnitNotificationMessage(): any {
    return window.__env.spatialUnitNotificationMessage;
  }

  // --- Info modal ---
  get standardInfoModalTabTitle(): any {
    return window.__env.standardInfoModalTabTitle;
  }
  get enableExtendedInfoModal(): any {
    return window.__env.enableExtendedInfoModal;
  }
  get extendedInfoModalTabTitle(): any {
    return window.__env.extendedInfoModalTabTitle;
  }
  get extendedInfoModalHTMLMessage(): any {
    return window.__env.extendedInfoModalHTMLMessage;
  }
  get customLandinPage(): any {
    return window.__env.customLandinPage;
  }
  get customLandinPageTitle(): any {
    return window.__env.customLandinPageTitle;
  }

  // --- Classification ---
  get disableManualClassification(): any {
    return window.__env.disableManualClassification;
  }

  // --- Spatial data processor ---
  get targetUrlToSpatialDataProcessorInstance(): any {
    return window.__env.targetUrlToSpatialDataProcessorInstance;
  }

  // --- Reachability scenario modal ---
  get reachabilityScenarioMaxTextWidth(): any {
    return window.__env.reachabilityScenarioMaxTextWidth;
  }
  get spatialDataProcessor_processName_indicatorReachabilityStatistics(): any {
    return window.__env.spatialDataProcessor_processName_indicatorReachabilityStatistics;
  }

  // --- Computed ---
  get baseUrlToKomMonitorDataAPI(): string {
    return window.__env.apiUrl + window.__env.basePath;
  }

  // --- Misc ---
  get enableDebug(): any {
    return window.__env.enableDebug;
  }
}
