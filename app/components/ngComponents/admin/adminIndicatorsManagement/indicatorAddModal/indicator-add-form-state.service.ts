import { Injectable, inject } from '@angular/core';
import { StepperStep } from 'components/ngComponents/common/stepper/stepper.component';
import { mergeColorSchemes } from 'components/ngComponents/userInterface/kommonitorClassification/colors';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { downloadJson, readJsonFile } from 'util/json-file.util';

/**
 * Holds the entire form state and state-manipulating logic for the
 * "add indicator" wizard. Provided at the modal-component level (not root),
 * so each opened modal gets a fresh instance that is discarded with the modal.
 * The step child components and the modal shell all share this single instance.
 */
@Injectable()
export class IndicatorAddFormStateService {
  protected accessControlService = inject(AccessControlService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private envConfigService = inject(EnvConfigService);

  // Multi-step form
  currentStep = 1;
  totalSteps = 7; // Will be adjusted based on security settings

  // Stepper labels — the security step is only present when Keycloak is enabled,
  // mirroring the conditional fieldset below. References are stable so the
  // stepper only re-evaluates when the security flag actually changes.
  private readonly stepsWithSecurity: StepperStep[] = [
    { label: 'Metadaten des Indikators' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Themenhierarchie' },
    { label: 'Referenzen zu Indikatoren/Georessourcen' },
    { label: 'Klassifizierungsoptionen' },
    { label: 'regionale Vergleichswerte' },
    { label: 'Zugriffsschutz und Eigentümerschaft' },
  ];
  private readonly stepsWithoutSecurity: StepperStep[] = [
    { label: 'Metadaten des Indikators' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Themenhierarchie' },
    { label: 'Referenzen zu Indikatoren/Georessourcen' },
    { label: 'Klassifizierungsoptionen' },
    { label: 'regionale Vergleichswerte' },
  ];
  get steps(): StepperStep[] {
    return this.envConfigService.enableKeycloakSecurity
      ? this.stepsWithSecurity
      : this.stepsWithoutSecurity;
  }

  // Form data
  loadingData = false;

  // Basic form data
  datasetName = '';
  datasetNameInvalid = false;
  indicatorAbbreviation = '';
  indicatorType: any = null;
  isHeadlineIndicator = false;
  indicatorUnit = '';
  enableFreeTextUnit = false;
  indicatorProcessDescription = '';
  indicatorTagsString_withCommas = '';
  indicatorInterpretation = '';
  indicatorCreationType: any = null;
  indicatorLowestSpatialUnitMetadataObjectForComputation: any = null;
  enableLowestSpatialUnitSelect = false;
  indicatorPrecision: any = null;
  showCustomCommaValue = false;

  // Metadata
  metadata: any = {
    description: '',
    databasis: '',
    datasource: '',
    contact: '',
    updateInterval: null,
    lastUpdate: '',
    literature: '',
    note: '',
    sridEPSG: 4326,
  };

  // References
  indicatorReferences_adminView: any[] = [];
  indicatorReferences_apiRequest: any[] = [];
  georesourceReferences_adminView: any[] = [];
  georesourceReferences_apiRequest: any[] = [];

  // Topic hierarchy
  indicatorTopic_mainTopic: any = null;
  indicatorTopic_subTopic: any = null;
  indicatorTopic_subsubTopic: any = null;
  indicatorTopic_subsubsubTopic: any = null;

  // Step 3: Topic Hierarchy
  selectedTopic: any = null;
  selectedSubTopic: any = null;
  selectedSubSubTopic: any = null;
  selectedSubSubSubTopic: any = null;
  availableSubTopics: any[] = [];
  availableSubSubTopics: any[] = [];
  availableSubSubSubTopics: any[] = [];
  additionalTopic: any = null;
  additionalSubTopic: any = null;
  additionalSubTopics: any[] = [];
  additionalTopicAssignments: Array<{ topic: any; subTopic: any }> = [];

  // Classification
  numClassesArray = [3, 4, 5, 6, 7, 8];
  numClassesPerSpatialUnit = 5;
  classificationMethod = 'regional_default';
  selectedColorBrewerPaletteEntry: any = null;
  spatialUnitClassification: any[] = [];
  classBreaksInvalid = false;
  tabClasses: string[] = [];

  // Role management
  roleManagementTableOptions: any = null;
  ownerOrganization: any = null;
  ownerOrgFilter = '';
  isPublic = false;

  // Import/Export functionality
  metadataImportSettings: any = null;
  indicatorMetadataImportError = '';

  // Success/Error data
  successMessage = '';
  errorMessage = '';
  successMessagePart = '';
  errorMessagePart = '';

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  indicatorTypeOptions: any[] = [];
  colorbrewerPalettes: any[] = [];
  colorbrewerSchemes: any = {};
  availableIndicators: any[] = [];
  availableGeoresources: any[] = [];
  availableTopics: any[] = [];
  accessControl: any[] = [];
  colorbreweSchemeName_dynamicIncrease = 'Blues';
  colorbreweSchemeName_dynamicDecrease = 'Reds';

  // Step 5: Classification Options
  currentClassificationTab = 0;

  // Step 6: Regional Comparison Values
  comparisonValueType: string | null = null;
  comparisonValue: number | null = null;
  comparisonRegion: string | null = null;
  comparisonTimeframe: string | null = null;
  comparisonDescription = '';
  evaluationDirection: string | null = null;
  toleranceRange: number | null = null;

  // Additional comparison values
  additionalComparisonType: string | null = null;
  additionalComparisonValue: number | null = null;
  additionalComparisonDescription = '';
  additionalComparisonValues: Array<{ type: string; value: number; description: string }> = [];

  // Benchmarking configuration
  enableBenchmarking = false;
  benchmarkingVisualizationType: string | null = null;
  greenThreshold: number | null = null;
  yellowThreshold: number | null = null;
  redThreshold: number | null = null;

  // Step 7: Access Control and Ownership
  filteredOrganizations: any[] = [];
  roleFilter = '';
  filteredRoles: any[] = [];
  selectedRoles: any[] = [];

  // Advanced access control
  enableTimeRestrictedAccess = false;
  enableGeographicRestriction = false;
  accessStartDate = '';
  accessEndDate = '';
  allowedRegions: any[] = [];
  availableRegions: any[] = [];
  enableAccessLogging = false;

  // Temporary variables for references
  indicatorNameFilter = '';
  tmpIndicatorReference_selectedIndicatorMetadata: any = null;
  tmpIndicatorReference_referenceDescription = '';
  georesourceNameFilter = '';
  tmpGeoresourceReference_selectedGeoresourceMetadata: any = null;
  tmpGeoresourceReference_referenceDescription = '';

  // Step 4: Filtered lists for references
  filteredIndicators: any[] = [];
  filteredGeoresources: any[] = [];

  // Post body
  postBody_indicators: any = null;

  // Reference date
  indicatorReferenceDateNote = '';
  displayOrder = 0;

  loadInitialData() {
    this.loadingData = true;

    // Load available spatial units
    if (this.spatialUnitStore.availableSpatialUnits) {
      this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits;
      this.indicatorLowestSpatialUnitMetadataObjectForComputation =
        this.availableSpatialUnits.length > 0 ? this.availableSpatialUnits[0] : null;
    }

    // Load update interval options
    if (this.envConfigService && this.envConfigService.updateIntervalOptions) {
      this.updateIntervalOptions = this.envConfigService.updateIntervalOptions;
    }

    // Load indicator type options
    if (this.envConfigService && this.envConfigService.indicatorTypeOptions) {
      this.indicatorTypeOptions = this.envConfigService.indicatorTypeOptions;
      this.indicatorType =
        this.indicatorTypeOptions.length > 0 ? this.indicatorTypeOptions[0] : null;
    }

    // Load available indicators
    if (this.indicatorStore.availableIndicators) {
      this.availableIndicators = this.indicatorStore.availableIndicators;
    }

    // Load available georesources
    if (this.georesourceStore.availableGeoresources) {
      this.availableGeoresources = this.georesourceStore.availableGeoresources;
    }

    // Load available topics
    if (this.topicStore.availableTopics) {
      this.availableTopics = this.topicStore.availableTopics;
    }

    // Load access control
    if (this.accessControlService.accessControl) {
      this.accessControl = this.accessControlService.accessControl;
    }

    // Load color brewer schemes
    this.loadColorBrewerSchemes();

    // Initialize filtered lists for Step 4
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];

    // Initialize data for Step 7
    this.filteredOrganizations = this.accessControl || [];
    this.filteredRoles = this.accessControl || [];
    this.availableRegions = this.availableSpatialUnits || [];

    this.loadingData = false;
  }

  initializeMultiStepForm() {
    // Initialize multi-step form based on security settings
    if (this.envConfigService.enableKeycloakSecurity) {
      this.totalSteps = 7; // Include role management step
    } else {
      this.totalSteps = 6;
    }

    // Initialize role management if available
    if (this.accessControlService.accessControl && this.roleManagementHelper) {
      this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
        'indicatorAddRoleManagementTable',
        this.roleManagementTableOptions,
        this.accessControlService.accessControl,
        []
      );
    }

    // Initialize classification
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  private loadColorBrewerSchemes() {
    // Build the colorbrewer schemes from the bundled palettes merged with any custom
    // schemes from config — the same reliable source app-color-palette-select uses.
    // (window.colorbrewer is not loaded globally in the migrated app, so reading it
    // here left the schemes/palettes empty and the selected palette unset.)
    this.colorbrewerSchemes = mergeColorSchemes(this.envConfigService.customColorSchemes);

    this.instantiateColorBrewerPalettes();
  }

  private instantiateColorBrewerPalettes() {
    this.colorbrewerPalettes = [];

    for (const key in this.colorbrewerSchemes) {
      if (Object.prototype.hasOwnProperty.call(this.colorbrewerSchemes, key)) {
        const colorPalettes = this.colorbrewerSchemes[key];

        const paletteEntry = {
          paletteName: key,
          paletteArrayObject: colorPalettes,
        };

        this.colorbrewerPalettes.push(paletteEntry);
      }
    }

    // Instantiate with palette 'Blues'
    this.selectedColorBrewerPaletteEntry =
      this.colorbrewerPalettes[13] || this.colorbrewerPalettes[0];
  }

  checkDatasetName() {
    this.datasetNameInvalid = false;

    if (this.datasetName && this.indicatorType && this.indicatorStore.availableIndicators) {
      this.indicatorStore.availableIndicators.forEach((indicator: any) => {
        if (
          indicator.datasetName === this.datasetName &&
          indicator.indicatorType === this.indicatorType.apiName
        ) {
          this.datasetNameInvalid = true;
          return;
        }
      });
    }
  }

  // Reference management methods
  onAddOrUpdateIndicatorReference() {
    if (
      this.tmpIndicatorReference_selectedIndicatorMetadata &&
      this.tmpIndicatorReference_referenceDescription
    ) {
      const tmpReference = {
        indicatorMetadata: this.tmpIndicatorReference_selectedIndicatorMetadata,
        referenceDescription: this.tmpIndicatorReference_referenceDescription,
      };

      let processed = false;
      for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
        const indicatorReference = this.indicatorReferences_adminView[index];
        if (
          indicatorReference.indicatorMetadata.indicatorId ===
          tmpReference.indicatorMetadata.indicatorId
        ) {
          // replace object
          this.indicatorReferences_adminView[index] = tmpReference;
          processed = true;
          break;
        }
      }

      if (!processed) {
        // new entry
        this.indicatorReferences_adminView.push(tmpReference);
      }

      this.tmpIndicatorReference_selectedIndicatorMetadata = null;
      this.tmpIndicatorReference_referenceDescription = '';
    }
  }

  onClickEditIndicatorReference(indicatorReference: any) {
    this.tmpIndicatorReference_selectedIndicatorMetadata = indicatorReference.indicatorMetadata;
    this.tmpIndicatorReference_referenceDescription = indicatorReference.referenceDescription;
  }

  onClickDeleteIndicatorReference(indicatorReference: any) {
    for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
      if (
        this.indicatorReferences_adminView[index].indicatorMetadata.indicatorId ===
        indicatorReference.indicatorMetadata.indicatorId
      ) {
        // remove object
        this.indicatorReferences_adminView.splice(index, 1);
        break;
      }
    }
  }

  onAddOrUpdateGeoresourceReference() {
    if (
      this.tmpGeoresourceReference_selectedGeoresourceMetadata &&
      this.tmpGeoresourceReference_referenceDescription
    ) {
      const tmpReference = {
        georesourceMetadata: this.tmpGeoresourceReference_selectedGeoresourceMetadata,
        referenceDescription: this.tmpGeoresourceReference_referenceDescription,
      };

      let processed = false;
      for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
        const georesourceReference = this.georesourceReferences_adminView[index];
        if (
          georesourceReference.georesourceMetadata.georesourceId ===
          tmpReference.georesourceMetadata.georesourceId
        ) {
          // replace object
          this.georesourceReferences_adminView[index] = tmpReference;
          processed = true;
          break;
        }
      }

      if (!processed) {
        // new entry
        this.georesourceReferences_adminView.push(tmpReference);
      }

      this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
      this.tmpGeoresourceReference_referenceDescription = '';
    }
  }

  onClickEditGeoresourceReference(georesourceReference: any) {
    this.tmpGeoresourceReference_selectedGeoresourceMetadata =
      georesourceReference.georesourceMetadata;
    this.tmpGeoresourceReference_referenceDescription = georesourceReference.referenceDescription;
  }

  onClickDeleteGeoresourceReference(georesourceReference: any) {
    for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
      if (
        this.georesourceReferences_adminView[index].georesourceMetadata.georesourceId ===
        georesourceReference.georesourceMetadata.georesourceId
      ) {
        // remove object
        this.georesourceReferences_adminView.splice(index, 1);
        break;
      }
    }
  }

  // Build post body for API request
  buildPostBody_indicators() {
    // Convert references to API format
    this.convertReferencesToApiFormat();

    const postBody: any = {
      datasetName: this.datasetName,
      abbreviation: this.indicatorAbbreviation,
      indicatorType: this.indicatorType?.apiName,
      isHeadlineIndicator: this.isHeadlineIndicator,
      unit: this.indicatorUnit,
      processDescription: this.indicatorProcessDescription,
      interpretation: this.indicatorInterpretation,
      creationType: this.indicatorCreationType?.apiName,
      lowestSpatialUnitForComputation:
        this.indicatorLowestSpatialUnitMetadataObjectForComputation?.spatialUnitLevel,
      referenceDateNote: this.indicatorReferenceDateNote,
      displayOrder: this.displayOrder,
      metadata: {
        note: this.metadata.note,
        literature: this.metadata.literature,
        updateInterval: this.metadata.updateInterval?.apiName,
        sridEPSG: this.metadata.sridEPSG,
        datasource: this.metadata.datasource,
        contact: this.metadata.contact,
        lastUpdate: this.metadata.lastUpdate,
        description: this.metadata.description,
        databasis: this.metadata.databasis,
      },
      allowedRoles: [] as string[],
      refrencesToOtherIndicators: this.indicatorReferences_apiRequest,
      refrencesToGeoresources: this.georesourceReferences_apiRequest,
      defaultClassificationMapping: {
        colorBrewerSchemeName: this.selectedColorBrewerPaletteEntry?.paletteName,
        numClasses: this.numClassesPerSpatialUnit,
        classificationMethod: this.classificationMethod,
        items: this.spatialUnitClassification.map((classification) => ({
          spatialUnit: classification.spatialUnitId,
          breaks: classification.breaks.filter((breakVal) => breakVal !== null),
        })),
      },
    };

    // Add topic reference if selected
    if (this.indicatorTopic_subsubsubTopic) {
      postBody.topicReference = this.indicatorTopic_subsubsubTopic.topicId;
    } else if (this.indicatorTopic_subsubTopic) {
      postBody.topicReference = this.indicatorTopic_subsubTopic.topicId;
    } else if (this.indicatorTopic_subTopic) {
      postBody.topicReference = this.indicatorTopic_subTopic.topicId;
    } else if (this.indicatorTopic_mainTopic) {
      postBody.topicReference = this.indicatorTopic_mainTopic.topicId;
    }

    // Add tags if provided
    if (this.indicatorTagsString_withCommas) {
      postBody.tags = this.indicatorTagsString_withCommas
        .split(',')
        .map((tag: string) => tag.trim());
    }

    // Add precision if custom value is enabled
    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      postBody.precision = this.indicatorPrecision;
    }

    // Add role permissions
    if (this.roleManagementTableOptions && this.roleManagementHelper) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.allowedRoles.push(roleId);
        }
      }
    }

    return postBody;
  }

  /**
   * Builds the POST body strictly following the KomMonitor Data Management API v3
   * schema `IndicatorPOSTInputType` (verified against the OpenAPI docs). Unlike
   * {@link buildPostBody_indicators} this method:
   *  - sends every required field unconditionally (`tags`, `topicReference`,
   *    `characteristicValue`, `ownerId`, `isPublic`, `permissions`),
   *  - uses the correct field names (`permissions` not `allowedRoles`,
   *    classification item key `spatialUnitId` not `spatialUnit`),
   *  - uppercases `classificationMethod` to match the API enum,
   *  - emits references in the `{ indicatorId | georesourceId, referenceDescription }`
   *    shape, built directly from the admin-view lists (no shared state).
   * Kept alongside the legacy builder so both can be compared against the live API.
   */
  buildPostBody_indicators_v3() {
    // Resolve the selected topic id from the deepest selected hierarchy level.
    const topicReference =
      this.indicatorTopic_subsubsubTopic?.topicId ??
      this.indicatorTopic_subsubTopic?.topicId ??
      this.indicatorTopic_subTopic?.topicId ??
      this.indicatorTopic_mainTopic?.topicId ??
      '';

    // Tags: always an array (required field), empty when none entered.
    const tags = this.indicatorTagsString_withCommas
      ? this.indicatorTagsString_withCommas.split(',').map((tag: string) => tag.trim())
      : [];

    // Permissions: role ids selected in the role-management grid (required array).
    const permissions: string[] = [];
    if (this.roleManagementTableOptions && this.roleManagementHelper) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      if (Array.isArray(roleIds)) {
        permissions.push(...roleIds);
      }
    }

    const postBody: any = {
      // required
      datasetName: this.datasetName,
      characteristicValue: '', // no dedicated UI field yet; API requires the property
      creationType: this.indicatorCreationType?.apiName,
      isHeadlineIndicator: this.isHeadlineIndicator,
      interpretation: this.indicatorInterpretation,
      processDescription: this.indicatorProcessDescription,
      unit: this.indicatorUnit,
      topicReference,
      tags,
      permissions,
      // ownerOrganization holds the full org object from the picker; the API
      // expects only its identifier. Fall back to the raw value if a bare id is set.
      ownerId: this.ownerOrganization?.organizationalUnitId ?? this.ownerOrganization,
      isPublic: this.isPublic ? true : false,
      metadata: {
        // required metadata fields
        contact: this.metadata.contact,
        datasource: this.metadata.datasource,
        description: this.metadata.description,
        updateInterval: this.metadata.updateInterval?.apiName,
        // optional / nullable metadata fields
        note: this.metadata.note || null,
        literature: this.metadata.literature || null,
        databasis: this.metadata.databasis || null,
        lastUpdate: this.metadata.lastUpdate || null,
        sridEPSG: this.metadata.sridEPSG || 4326,
      },
      defaultClassificationMapping: {
        colorBrewerSchemeName: this.selectedColorBrewerPaletteEntry?.paletteName,
        numClasses: this.numClassesPerSpatialUnit,
        classificationMethod: this.classificationMethod?.toUpperCase(),
        // Only send spatial units whose break values are fully filled in.
        items: this.spatialUnitClassification
          .filter((classification) => !classification.breaks.includes(null))
          .map((classification) => ({
            spatialUnitId: classification.spatialUnitId,
            breaks: classification.breaks,
          })),
      },
      // optional top-level fields
      abbreviation: this.indicatorAbbreviation || null,
      indicatorType: this.indicatorType?.apiName,
      displayOrder: this.displayOrder,
      referenceDateNote: this.indicatorReferenceDateNote || null,
      lowestSpatialUnitForComputation:
        this.indicatorLowestSpatialUnitMetadataObjectForComputation?.spatialUnitLevel ?? null,
      refrencesToOtherIndicators: this.indicatorReferences_adminView.map((ref) => ({
        indicatorId: ref.indicatorMetadata.indicatorId,
        referenceDescription: ref.referenceDescription,
      })),
      refrencesToGeoresources: this.georesourceReferences_adminView.map((ref) => ({
        georesourceId: ref.georesourceMetadata.georesourceId,
        referenceDescription: ref.referenceDescription,
      })),
    };

    // Precision is optional; only send it when a custom value is enabled.
    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      postBody.precision = this.indicatorPrecision;
    }

    return postBody;
  }

  /**
   * Returns the required `IndicatorPOSTInputType` fields that are still blank in
   * the API-v3 body, as `{ label }` entries for a user-facing validation dialog.
   * (Booleans, `tags`/`permissions` empty-arrays and `characteristicValue` — which
   * has no UI field yet — are intentionally not treated as missing.)
   */
  getV3MissingRequiredFields(): { label: string }[] {
    const body = this.buildPostBody_indicators_v3();
    const missing: { label: string }[] = [];
    const isBlank = (value: any) =>
      value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    const check = (blank: boolean, label: string) => {
      if (blank) missing.push({ label });
    };

    // Ordered by wizard step so the resulting list is already sorted by step.

    // Step 1 — basic metadata
    check(isBlank(body.datasetName), 'Indikatorname (Schritt 1)');
    check(isBlank(body.unit), 'Einheit (Schritt 1)');
    check(isBlank(body.processDescription), 'Methodik (der Berechnung) (Schritt 1)');
    check(isBlank(body.interpretation), 'Interpretation (Schritt 1)');
    check(isBlank(body.creationType), 'Fortführungstyp (Schritt 1)');

    // Step 2 — general metadata
    check(isBlank(body.metadata?.description), 'Beschreibung (Schritt 2)');
    check(isBlank(body.metadata?.datasource), 'Datenquelle (Schritt 2)');
    check(isBlank(body.metadata?.contact), 'Datenhalter und Kontakt (Schritt 2)');
    check(isBlank(body.metadata?.updateInterval), 'Aktualisierungszyklus (Schritt 2)');

    // Step 3 — topic hierarchy
    check(isBlank(body.topicReference), 'Heuptthema (Schritt 3)');

    // Step 5 — classification mapping
    const mapping = body.defaultClassificationMapping;
    check(isBlank(mapping?.colorBrewerSchemeName), 'Klassifizierung: Farbschema (Schritt 5)');
    check(isBlank(mapping?.classificationMethod), 'Klassifizierung: Methode (Schritt 5)');
    check(
      mapping?.numClasses === undefined || mapping?.numClasses === null,
      'Klassifizierung: Klassenanzahl (Schritt 5)'
    );
    check(
      !Array.isArray(mapping?.items) || mapping.items.length === 0,
      'Klassifizierung: vollständige Klassengrenzen für mind. eine Raumeinheit (Schritt 5)'
    );

    // Step 7 — ownership
    check(isBlank(body.ownerId), 'Eigentümer-Organisation (Schritt 7)');

    return missing;
  }

  // Import/Export functionality
  async parseMetadataFromFile(file: File) {
    try {
      this.metadataImportSettings = await readJsonFile(file);
      this.applyMetadataImport();
    } catch (error) {
      console.error(error);
      console.error('Uploaded Metadata File cannot be parsed.');
      this.indicatorMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
    }
  }

  private applyMetadataImport() {
    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.indicatorMetadataImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      return;
    }

    // Parse metadata
    this.metadata = {};
    this.metadata.note = this.metadataImportSettings.metadata.note;
    this.metadata.literature = this.metadataImportSettings.metadata.literature;

    if (this.envConfigService && this.envConfigService.updateIntervalOptions) {
      this.envConfigService.updateIntervalOptions.forEach((option: any) => {
        if (option.apiName === this.metadataImportSettings.metadata.updateInterval) {
          this.metadata.updateInterval = option;
        }
      });
    }

    this.metadata.sridEPSG = this.metadataImportSettings.metadata.sridEPSG;
    this.metadata.datasource = this.metadataImportSettings.metadata.datasource;
    this.metadata.contact = this.metadataImportSettings.metadata.contact;
    this.metadata.lastUpdate = this.metadataImportSettings.metadata.lastUpdate;
    this.metadata.description = this.metadataImportSettings.metadata.description;
    this.metadata.databasis = this.metadataImportSettings.metadata.databasis;

    // Parse basic fields
    this.datasetName = this.metadataImportSettings.datasetName || '';
    this.indicatorAbbreviation = this.metadataImportSettings.abbreviation || '';
    this.indicatorUnit = this.metadataImportSettings.unit || '';
    this.indicatorProcessDescription = this.metadataImportSettings.processDescription || '';
    this.indicatorInterpretation = this.metadataImportSettings.interpretation || '';
    this.indicatorReferenceDateNote = this.metadataImportSettings.referenceDateNote || '';
    this.displayOrder = this.metadataImportSettings.displayOrder || 0;
    this.isHeadlineIndicator = this.metadataImportSettings.isHeadlineIndicator || false;

    // Parse indicator type
    if (
      this.metadataImportSettings.indicatorType &&
      this.envConfigService &&
      this.envConfigService.indicatorTypeOptions
    ) {
      this.envConfigService.indicatorTypeOptions.forEach((option: any) => {
        if (option.apiName === this.metadataImportSettings.indicatorType) {
          this.indicatorType = option;
        }
      });
    }

    // Parse creation type
    if (this.metadataImportSettings.creationType) {
      // Add creation type options if available
      // this.indicatorCreationType = ...
    }

    // Parse tags
    if (this.metadataImportSettings.tags && Array.isArray(this.metadataImportSettings.tags)) {
      this.indicatorTagsString_withCommas = this.metadataImportSettings.tags.join(', ');
    }

    // Parse references
    if (
      this.metadataImportSettings.refrencesToOtherIndicators &&
      this.indicatorStore.availableIndicators
    ) {
      this.indicatorReferences_apiRequest = this.metadataImportSettings.refrencesToOtherIndicators;
      // Populate admin view
      this.indicatorReferences_adminView = [];
      this.indicatorReferences_apiRequest.forEach((ref: any) => {
        const indicator = this.indicatorStore.availableIndicators.find(
          (ind: any) => ind.indicatorId === ref.indicatorId
        );
        if (indicator) {
          this.indicatorReferences_adminView.push({
            indicatorId: ref.indicatorId,
            referenceDescription: ref.referenceDescription,
            indicatorName: indicator.indicatorName,
          });
        }
      });
    }

    if (
      this.metadataImportSettings.refrencesToGeoresources &&
      this.georesourceStore.availableGeoresources
    ) {
      this.georesourceReferences_apiRequest = this.metadataImportSettings.refrencesToGeoresources;
      // Populate admin view
      this.georesourceReferences_adminView = [];
      this.georesourceReferences_apiRequest.forEach((ref: any) => {
        const georesource = this.georesourceStore.availableGeoresources.find(
          (geo: any) => geo.georesourceId === ref.georesourceId
        );
        if (georesource) {
          this.georesourceReferences_adminView.push({
            georesourceId: ref.georesourceId,
            referenceDescription: ref.referenceDescription,
            georesourceName: georesource.georesourceName,
          });
        }
      });
    }

    // Parse classification mapping
    if (this.metadataImportSettings.defaultClassificationMapping) {
      const mapping = this.metadataImportSettings.defaultClassificationMapping;
      this.numClassesPerSpatialUnit = mapping.numClasses || 5;
      this.classificationMethod = mapping.classificationMethod || 'regional_default';

      // Set color brewer palette
      if (mapping.colorBrewerSchemeName) {
        this.selectedColorBrewerPaletteEntry = this.colorbrewerPalettes.find(
          (palette) => palette.paletteName === mapping.colorBrewerSchemeName
        );
      }

      // Parse spatial unit classification
      if (mapping.items) {
        this.onNumClassesChanged(this.numClassesPerSpatialUnit);
        mapping.items.forEach((item: any) => {
          const index = this.spatialUnitClassification.findIndex(
            (classification) => classification.spatialUnitId === item.spatialUnit
          );
          if (index > -1) {
            this.spatialUnitClassification[index].breaks = item.breaks;
          }
        });
      }
    }

    // Parse role permissions
    if (
      this.accessControlService.accessControl &&
      this.metadataImportSettings.allowedRoles &&
      this.roleManagementHelper
    ) {
      this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
        'indicatorAddRoleManagementTable',
        this.roleManagementTableOptions,
        this.accessControlService.accessControl,
        this.metadataImportSettings.allowedRoles
      );
    }
  }

  onExportIndicatorAddMetadata() {
    const metadataExport: any = { ...this.indicatorMetadataStructure };

    // Populate with current form data
    metadataExport.datasetName = this.datasetName || '';
    metadataExport.abbreviation = this.indicatorAbbreviation || '';
    metadataExport.unit = this.indicatorUnit || '';
    metadataExport.processDescription = this.indicatorProcessDescription || '';
    metadataExport.interpretation = this.indicatorInterpretation || '';
    metadataExport.referenceDateNote = this.indicatorReferenceDateNote || '';
    metadataExport.displayOrder = this.displayOrder || 0;
    metadataExport.isHeadlineIndicator = this.isHeadlineIndicator || false;

    if (this.indicatorType) {
      metadataExport.indicatorType = this.indicatorType.apiName;
    }

    if (this.indicatorCreationType) {
      metadataExport.creationType = this.indicatorCreationType.apiName;
    }

    if (this.indicatorTagsString_withCommas) {
      metadataExport.tags = this.indicatorTagsString_withCommas
        .split(',')
        .map((tag: string) => tag.trim());
    }

    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      metadataExport.precision = this.indicatorPrecision;
    }

    // Add metadata
    metadataExport.metadata.note = this.metadata.note || '';
    metadataExport.metadata.literature = this.metadata.literature || '';
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || '';
    metadataExport.metadata.datasource = this.metadata.datasource || '';
    metadataExport.metadata.contact = this.metadata.contact || '';
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || '';
    metadataExport.metadata.description = this.metadata.description || '';
    metadataExport.metadata.databasis = this.metadata.databasis || '';

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    // Add references
    metadataExport.refrencesToOtherIndicators = this.indicatorReferences_apiRequest;
    metadataExport.refrencesToGeoresources = this.georesourceReferences_apiRequest;

    // Add classification mapping
    metadataExport.defaultClassificationMapping = {
      colorBrewerSchemeName: this.selectedColorBrewerPaletteEntry?.paletteName,
      numClasses: this.numClassesPerSpatialUnit,
      classificationMethod: this.classificationMethod,
      items: this.spatialUnitClassification.map((classification) => ({
        spatialUnit: classification.spatialUnitId,
        breaks: classification.breaks.filter((breakVal) => breakVal !== null),
      })),
    };

    // Add role permissions
    metadataExport.allowedRoles = [];
    if (this.roleManagementTableOptions && this.roleManagementHelper) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          metadataExport.allowedRoles.push(roleId);
        }
      }
    }

    const name = this.datasetName;
    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = 'Indikator_Metadaten_Export';

    if (name) {
      fileName += '-' + name;
    }

    fileName += '.json';
    downloadJson(fileName, metadataJSON);
  }

  // Metadata structure for export
  get indicatorMetadataStructure() {
    return {
      metadata: {
        note: '',
        literature: '',
        updateInterval: '',
        sridEPSG: '',
        datasource: '',
        contact: '',
        lastUpdate: '',
        description: '',
        databasis: '',
      },
      allowedRoles: [],
      datasetName: '',
      abbreviation: '',
      indicatorType: '',
      isHeadlineIndicator: false,
      unit: '',
      processDescription: '',
      interpretation: '',
      creationType: '',
      lowestSpatialUnitForComputation: '',
      referenceDateNote: '',
      displayOrder: 0,
      refrencesToOtherIndicators: [],
      refrencesToGeoresources: [],
      tags: [],
      precision: null,
      defaultClassificationMapping: {
        colorBrewerSchemeName: '',
        numClasses: 5,
        classificationMethod: 'regional_default',
        items: [],
      },
    };
  }

  get indicatorMetadataStructure_pretty() {
    return JSON.stringify(this.indicatorMetadataStructure, null, 2);
  }

  resetForm() {
    this.currentStep = 1;
    this.datasetName = '';
    this.datasetNameInvalid = false;
    this.indicatorAbbreviation = '';
    this.indicatorType =
      this.indicatorTypeOptions && this.indicatorTypeOptions.length > 0
        ? this.indicatorTypeOptions[0]
        : null;
    this.isHeadlineIndicator = false;
    this.indicatorUnit = '';
    this.enableFreeTextUnit = false;
    this.indicatorProcessDescription = '';
    this.indicatorTagsString_withCommas = '';
    this.indicatorInterpretation = '';
    this.indicatorCreationType = null;
    this.indicatorLowestSpatialUnitMetadataObjectForComputation =
      this.availableSpatialUnits && this.availableSpatialUnits.length > 0
        ? this.availableSpatialUnits[0]
        : null;
    this.enableLowestSpatialUnitSelect = false;
    this.indicatorPrecision = null;
    this.showCustomCommaValue = false;
    this.indicatorReferenceDateNote = '';
    this.displayOrder = 0;
    this.indicatorTopic_mainTopic = null;
    this.indicatorTopic_subTopic = null;
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;

    // Reset Step 3: Topic Hierarchy
    this.selectedTopic = null;
    this.selectedSubTopic = null;
    this.availableSubTopics = [];
    this.additionalTopic = null;
    this.additionalSubTopic = null;
    this.additionalSubTopics = [];
    this.additionalTopicAssignments = [];
    this.indicatorReferences_adminView = [];
    this.indicatorReferences_apiRequest = [];
    this.georesourceReferences_adminView = [];
    this.georesourceReferences_apiRequest = [];
    this.numClassesPerSpatialUnit = 5;
    this.classificationMethod = 'regional_default';
    this.selectedColorBrewerPaletteEntry =
      this.colorbrewerPalettes && this.colorbrewerPalettes.length > 13
        ? this.colorbrewerPalettes[13]
        : this.colorbrewerPalettes && this.colorbrewerPalettes.length > 0
          ? this.colorbrewerPalettes[0]
          : null;
    this.spatialUnitClassification = [];
    this.classBreaksInvalid = false;
    this.tabClasses = [];
    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
    this.roleManagementTableOptions = null;
    this.metadataImportSettings = null;
    this.indicatorMetadataImportError = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.postBody_indicators = null;
    this.errorMessage = '';
    this.successMessage = '';

    // Reset metadata
    this.metadata = {
      description: '',
      databasis: '',
      datasource: '',
      contact: '',
      updateInterval: null,
      lastUpdate: '',
      literature: '',
      note: '',
      sridEPSG: 4326,
    };

    // Reset temporary variables
    this.indicatorNameFilter = '';
    this.tmpIndicatorReference_selectedIndicatorMetadata = null;
    this.tmpIndicatorReference_referenceDescription = '';
    this.georesourceNameFilter = '';
    this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
    this.tmpGeoresourceReference_referenceDescription = '';

    // Reset Step 4: Filtered lists
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];

    // Reset Step 5: Classification Options
    this.currentClassificationTab = 0;

    // Reset Step 6: Regional Comparison Values
    this.comparisonValueType = null;
    this.comparisonValue = null;
    this.comparisonRegion = null;
    this.comparisonTimeframe = null;
    this.comparisonDescription = '';
    this.evaluationDirection = null;
    this.toleranceRange = null;
    this.additionalComparisonType = null;
    this.additionalComparisonValue = null;
    this.additionalComparisonDescription = '';
    this.additionalComparisonValues = [];
    this.enableBenchmarking = false;
    this.benchmarkingVisualizationType = null;
    this.greenThreshold = null;
    this.yellowThreshold = null;
    this.redThreshold = null;

    // Reset Step 7: Access Control and Ownership
    this.roleFilter = '';
    this.selectedRoles = [];
    this.enableTimeRestrictedAccess = false;
    this.enableGeographicRestriction = false;
    this.accessStartDate = '';
    this.accessEndDate = '';
    this.allowedRegions = [];
    this.enableAccessLogging = false;
    this.filteredOrganizations = this.accessControl || [];
    this.filteredRoles = this.accessControl || [];

    // Reinitialize classification
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  hideSuccessAlert() {
    // The success alert is shown via `successMessagePart`, so clear that field
    // (the legacy `successMessage` alone did not control visibility).
    this.successMessagePart = '';
    this.successMessage = '';
  }

  hideErrorAlert() {
    // The error alert is shown via `errorMessagePart`, so clear that field
    // (the legacy `errorMessage` alone did not control visibility).
    this.errorMessagePart = '';
    this.errorMessage = '';
  }

  hideMetadataErrorAlert() {
    this.indicatorMetadataImportError = '';
  }

  onChangeIndicatorUnit() {
    if (this.indicatorUnit && this.indicatorUnit.includes('Freitext')) {
      this.enableFreeTextUnit = true;
    } else {
      this.enableFreeTextUnit = false;
    }
  }

  onChangeCreationType() {
    if (this.indicatorCreationType && this.indicatorCreationType.apiName === 'COMPUTATION') {
      this.enableLowestSpatialUnitSelect = true;
    } else {
      this.enableLowestSpatialUnitSelect = false;
    }
  }

  onChangeOwner(ownerOrganization: any) {
    this.ownerOrganization = ownerOrganization;
  }

  onChangeIsPublic(isPublic: boolean) {
    this.isPublic = isPublic;
  }

  // Step 3: Topic Hierarchy Methods
  onTopicChange() {
    if (this.selectedTopic) {
      // Load sub-topics for the selected topic
      this.availableSubTopics = this.selectedTopic.subTopics || [];
      this.selectedSubTopic = null;

      // Update main topic reference
      this.indicatorTopic_mainTopic = this.selectedTopic;
      this.indicatorTopic_subTopic = null;
      this.indicatorTopic_subsubTopic = null;
      this.indicatorTopic_subsubsubTopic = null;
    } else {
      this.availableSubTopics = [];
      this.availableSubSubTopics = [];
      this.availableSubSubSubTopics = [];
      this.selectedSubTopic = null;
      this.selectedSubSubTopic = null;
      this.selectedSubSubSubTopic = null;
    }
  }

  onSubTopicChange() {
    if (this.selectedSubTopic) {
      // Load sub-topics for the selected topic
      this.availableSubSubTopics = this.selectedSubTopic.subTopics || [];
      this.selectedSubSubTopic = null;

      // Update sub topic reference
      this.indicatorTopic_subTopic = this.selectedSubTopic;
      this.indicatorTopic_subsubTopic = null;
      this.indicatorTopic_subsubsubTopic = null;
    } else {
      this.availableSubSubTopics = [];
      this.availableSubSubSubTopics = [];
      this.selectedSubSubTopic = null;
      this.selectedSubSubSubTopic = null;
    }
  }

  onSubSubTopicChange() {
    if (this.selectedSubSubTopic) {
      // Load sub-topics for the selected topic
      this.availableSubSubSubTopics = this.selectedSubSubTopic.subTopics || [];
      this.selectedSubSubSubTopic = null;

      // Update sub topic reference
      this.indicatorTopic_subsubTopic = this.selectedSubSubTopic;
      this.indicatorTopic_subsubsubTopic = null;
    } else {
      this.availableSubSubSubTopics = [];
      this.selectedSubSubSubTopic = null;
    }
  }

  onSubSubSubTopicChange() {
    if (this.selectedSubSubSubTopic) {
      // Update sub topic reference
      this.indicatorTopic_subsubsubTopic = this.selectedSubSubSubTopic;
    }
  }

  onAdditionalTopicChange() {
    if (this.additionalTopic) {
      // Load sub-topics for the additional topic
      this.additionalSubTopics = this.additionalTopic.subTopics || [];
      this.additionalSubTopic = null;
    } else {
      this.additionalSubTopics = [];
      this.additionalSubTopic = null;
    }
  }

  addAdditionalTopicAssignment() {
    if (this.additionalTopic && this.additionalSubTopic) {
      // Check if this assignment already exists
      const existingAssignment = this.additionalTopicAssignments.find(
        (assignment) =>
          assignment.topic.topicId === this.additionalTopic.topicId &&
          assignment.subTopic.subTopicId === this.additionalSubTopic.subTopicId
      );

      if (!existingAssignment) {
        // Check if it's the same as the main assignment
        const isMainAssignment =
          this.selectedTopic &&
          this.selectedSubTopic &&
          this.selectedTopic.topicId === this.additionalTopic.topicId &&
          this.selectedSubTopic.subTopicId === this.additionalSubTopic.subTopicId;

        if (!isMainAssignment) {
          this.additionalTopicAssignments.push({
            topic: this.additionalTopic,
            subTopic: this.additionalSubTopic,
          });

          // Reset additional topic selection
          this.additionalTopic = null;
          this.additionalSubTopic = null;
          this.additionalSubTopics = [];
        }
      }
    }
  }

  removeAdditionalTopicAssignment(index: number) {
    if (index >= 0 && index < this.additionalTopicAssignments.length) {
      this.additionalTopicAssignments.splice(index, 1);
    }
  }

  // Step 4: Reference Filtering Methods
  filterIndicators() {
    if (!this.indicatorNameFilter || this.indicatorNameFilter.trim() === '') {
      this.filteredIndicators = this.availableIndicators || [];
    } else {
      const filter = this.indicatorNameFilter.toLowerCase().trim();
      this.filteredIndicators = (this.availableIndicators || []).filter(
        (indicator) => indicator.datasetName && indicator.datasetName.toLowerCase().includes(filter)
      );
    }
  }

  filterGeoresources() {
    if (!this.georesourceNameFilter || this.georesourceNameFilter.trim() === '') {
      this.filteredGeoresources = this.availableGeoresources || [];
    } else {
      const filter = this.georesourceNameFilter.toLowerCase().trim();
      this.filteredGeoresources = (this.availableGeoresources || []).filter(
        (georesource) =>
          georesource.datasetName && georesource.datasetName.toLowerCase().includes(filter)
      );
    }
  }

  // Convert admin view references to API format
  private convertReferencesToApiFormat() {
    // Convert indicator references
    this.indicatorReferences_apiRequest = this.indicatorReferences_adminView.map((ref) => ({
      referencedIndicatorName: ref.indicatorMetadata.datasetName,
      referencedIndicatorId: ref.indicatorMetadata.indicatorId,
      referencedIndicatorAbbreviation: ref.indicatorMetadata.abbreviation,
      referencedIndicatorDescription: ref.referenceDescription,
    }));

    // Convert georesource references
    this.georesourceReferences_apiRequest = this.georesourceReferences_adminView.map((ref) => ({
      referencedGeoresourceName: ref.georesourceMetadata.datasetName,
      referencedGeoresourceId: ref.georesourceMetadata.georesourceId,
      referencedGeoresourceDescription: ref.referenceDescription,
    }));
  }

  // Step 5: Classification Methods
  getClassColor(classIndex: number, palette: any): string {
    // Palette entries carry a colorbrewer `paletteArrayObject` keyed by class count
    // (e.g. '5'), so resolve the color row for the currently selected class count.
    const colors = palette?.paletteArrayObject?.[this.numClassesPerSpatialUnit?.toString()];
    if (Array.isArray(colors) && classIndex >= 0 && classIndex < colors.length) {
      return colors[classIndex];
    }

    return '#cccccc';
  }

  // Receives the full method object from app-classification-method-select; keep a
  // string fallback in case a bare id is passed.
  onClassificationMethodSelected(method: any) {
    this.classificationMethod = method?.id ?? method;
    // Reinitialize classification when method changes
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  onClickColorBrewerEntry(colorPaletteEntry: any) {
    this.selectedColorBrewerPaletteEntry = colorPaletteEntry;
  }

  // app-color-palette-select emits the scheme name; map it back to our palette entry.
  onColorSchemeSelected(paletteName: string) {
    const entry = this.colorbrewerPalettes.find((p) => p.paletteName === paletteName);
    if (entry) {
      this.onClickColorBrewerEntry(entry);
    }
  }

  // Read-only 5-color spectrum for the standard two-color (negative/positive) classification.
  getDynamicSchemeColors(direction: 'increase' | 'decrease'): string[] {
    const name =
      direction === 'increase'
        ? this.colorbreweSchemeName_dynamicIncrease
        : this.colorbreweSchemeName_dynamicDecrease;
    return this.colorbrewerSchemes?.[name]?.['5'] ?? [];
  }

  // Read-only 5-color preview of the currently selected palette ("derzeit selektiert").
  getSelectedPaletteColors(): string[] {
    return this.selectedColorBrewerPaletteEntry?.paletteArrayObject?.['5'] ?? [];
  }

  // Colors of the selected palette for the current class count — one legend row each.
  getClassColors(): string[] {
    return (
      this.selectedColorBrewerPaletteEntry?.paletteArrayObject?.[
        this.numClassesPerSpatialUnit?.toString()
      ] ?? []
    );
  }

  // Legend "Wertebereich" text for a class of a spatial unit (regional default).
  getLegendRange(tabIndex: number, classIndex: number): string {
    const breaks: (number | null)[] = this.spatialUnitClassification[tabIndex]?.breaks ?? [];
    const lastIndex = this.numClassesPerSpatialUnit - 1;
    const fmt = (value: number | null | undefined) =>
      value === null || value === undefined ? '[bitte eingeben]' : `${value}`;

    if (classIndex === 0) {
      return `Niedrigster Wert - < ${fmt(breaks[0])}`;
    }
    if (classIndex === lastIndex) {
      return `${fmt(breaks[classIndex - 1])} - < Höchster Wert`;
    }
    return `${fmt(breaks[classIndex - 1])} - < ${fmt(breaks[classIndex])}`;
  }

  // Legend "Hinweis" text — only the lowest and highest class carry a note.
  getLegendHint(tabIndex: number, classIndex: number): string {
    const breaks: (number | null)[] = this.spatialUnitClassification[tabIndex]?.breaks ?? [];
    const lastIndex = this.numClassesPerSpatialUnit - 1;

    if (classIndex === 0 && breaks[0] !== null && breaks[0] !== undefined) {
      return `Klasse wird bei Werten unter ${breaks[0]} hinzugefügt`;
    }
    if (
      classIndex === lastIndex &&
      breaks[classIndex - 1] !== null &&
      breaks[classIndex - 1] !== undefined
    ) {
      return `Klasse wird bei Werten über ${breaks[classIndex - 1]} hinzugefügt`;
    }
    return '';
  }

  onNumClassesChanged(numClasses: number) {
    this.numClassesPerSpatialUnit = numClasses;

    // Initialize classification for each spatial unit
    this.spatialUnitClassification = [];
    this.tabClasses = [];

    if (this.availableSpatialUnits && this.availableSpatialUnits.length > 0) {
      this.availableSpatialUnits.forEach((spatialUnit, index) => {
        // Initialize breaks array
        const breaks: Array<number | null> = [];
        for (let i = 0; i < numClasses - 1; i++) {
          breaks.push(null);
        }

        this.spatialUnitClassification.push({
          spatialUnitId: spatialUnit.spatialUnitId,
          spatialUnitLevel: spatialUnit.spatialUnitLevel,
          breaks: breaks,
        });

        // Initialize tab validation class (neutral until breaks are entered)
        this.tabClasses[index] = '';
      });
    }

    // Reset validation
    this.classBreaksInvalid = false;
  }

  onBreaksChanged(tabIndex: number) {
    if (!this.spatialUnitClassification[tabIndex]) {
      return;
    }

    const breaks: (number | null)[] = this.spatialUnitClassification[tabIndex].breaks;

    // Class breaks must be strictly ascending; empty (null) entries are ignored.
    // A tab is green ('tab-valid') once every break is filled and correctly ordered,
    // red ('tab-error') on any ordering violation, and neutral ('') while incomplete.
    let hasError = false;
    let filledCount = 0;
    let lastValidBreak: number | null = null;
    for (const classBreak of breaks) {
      if (classBreak !== null && classBreak !== undefined) {
        filledCount++;
        if (lastValidBreak !== null && classBreak <= lastValidBreak) {
          hasError = true;
          break;
        }
        lastValidBreak = classBreak;
      }
    }

    if (hasError) {
      this.tabClasses[tabIndex] = 'tab-error';
    } else if (breaks.length > 0 && filledCount === breaks.length) {
      this.tabClasses[tabIndex] = 'tab-valid';
    } else {
      this.tabClasses[tabIndex] = '';
    }

    // Aggregate overall validity across all spatial-unit tabs.
    this.classBreaksInvalid = this.tabClasses.some((cssClass) => cssClass === 'tab-error');
  }

  // Step 6: Regional Comparison Methods
  onComparisonValueTypeChange() {
    // Reset comparison value when type changes
    if (this.comparisonValueType === null) {
      this.comparisonValue = null;
    }
  }

  addAdditionalComparisonValue() {
    if (this.additionalComparisonType && this.additionalComparisonValue !== null) {
      // Check if this comparison already exists
      const existingComparison = this.additionalComparisonValues.find(
        (comparison) =>
          comparison.type === this.additionalComparisonType &&
          comparison.value === this.additionalComparisonValue
      );

      if (!existingComparison) {
        this.additionalComparisonValues.push({
          type: this.additionalComparisonType,
          value: this.additionalComparisonValue,
          description: this.additionalComparisonDescription || '',
        });

        // Reset additional comparison inputs
        this.additionalComparisonType = null;
        this.additionalComparisonValue = null;
        this.additionalComparisonDescription = '';
      }
    }
  }

  removeAdditionalComparisonValue(index: number) {
    if (index >= 0 && index < this.additionalComparisonValues.length) {
      this.additionalComparisonValues.splice(index, 1);
    }
  }

  getComparisonTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      target: 'Zielwert',
      average: 'Durchschnittswert',
      median: 'Medianwert',
      best_practice: 'Best Practice',
      threshold: 'Schwellenwert',
      custom: 'Benutzerdefiniert',
    };
    return typeMap[type] || type;
  }

  // Step 7: Access Control Methods
  filterOrganizations() {
    if (!this.ownerOrgFilter || this.ownerOrgFilter.trim() === '') {
      this.filteredOrganizations = this.accessControl || [];
    } else {
      const filter = this.ownerOrgFilter.toLowerCase().trim();
      this.filteredOrganizations = (this.accessControl || []).filter(
        (org) => org.organizationName && org.organizationName.toLowerCase().includes(filter)
      );
    }
  }

  clearOwnerFilter() {
    this.ownerOrgFilter = '';
    this.filterOrganizations();
  }

  filterRoles() {
    if (!this.roleFilter || this.roleFilter.trim() === '') {
      this.filteredRoles = this.accessControl || [];
    } else {
      const filter = this.roleFilter.toLowerCase().trim();
      this.filteredRoles = (this.accessControl || []).filter(
        (role) => role.roleName && role.roleName.toLowerCase().includes(filter)
      );
    }
  }

  isRoleSelected(role: any): boolean {
    return this.selectedRoles.some((selectedRole) => selectedRole.roleId === role.roleId);
  }

  toggleRoleSelection(role: any) {
    if (this.isRoleSelected(role)) {
      this.removeRole(role);
    } else {
      this.addRole(role);
    }
  }

  addRole(role: any) {
    if (!this.isRoleSelected(role)) {
      this.selectedRoles.push(role);
    }
  }

  removeRole(role: any) {
    const index = this.selectedRoles.findIndex(
      (selectedRole) => selectedRole.roleId === role.roleId
    );
    if (index >= 0) {
      this.selectedRoles.splice(index, 1);
    }
  }

  // Multi-step navigation
  nextStep() {
    const maxSteps = this.envConfigService.enableKeycloakSecurity ? 7 : 6;
    if (this.currentStep < maxSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    const maxSteps = this.envConfigService.enableKeycloakSecurity ? 7 : 6;

    // Allow navigation to any step without validation (like old AngularJS counterpart)
    if (step >= 1 && step <= maxSteps) {
      this.currentStep = step;
    }
  }
}
