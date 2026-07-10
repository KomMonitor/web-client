import { Injectable, inject } from '@angular/core';
import {
  mergeColorSchemes,
  QUALITATIVE_SCHEMES,
} from 'components/ngComponents/userInterface/kommonitorClassification/colors';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/** The kind of classification the user configures in step 5. */
export type ClassificationType = 'QUANTITATIVE' | 'QUALITATIVE';

/** Default qualitative palette used when switching to categorical classification. */
const DEFAULT_QUALITATIVE_SCHEME = 'Accent';
/** Default sequential palette used when switching (back) to numeric classification. */
const DEFAULT_SEQUENTIAL_SCHEME = 'Blues';

/**
 * Holds the classification-step (wizard step 5) state and its manipulating logic,
 * peeled off from {@link IndicatorAddFormStateService} per the god-service split
 * roadmap. Provided at the modal-component level alongside the form-state service,
 * which delegates to this instance for everything classification-related (palette
 * selection, class count, per-spatial-unit breaks, legend rendering).
 *
 * This first extraction is behaviour-preserving: the fields and methods are moved
 * verbatim from the form-state service. Later steps of the step-5 redesign extend
 * it (numeric/categorical type switch, individual colors, per-class labels).
 */
@Injectable()
export class IndicatorClassificationStateService {
  private envConfigService = inject(EnvConfigService);

  // Spatial units the per-unit break tabs are built for. Set by the owning
  // form-state service from its shared `availableSpatialUnits` list.
  availableSpatialUnits: any[] = [];

  // Numeric (sequential/diverging) vs categorical (qualitative) classification.
  classificationType: ClassificationType = 'QUANTITATIVE';

  // Classification form data
  numClassesArray = [3, 4, 5, 6, 7, 8];
  numClassesPerSpatialUnit = 5;
  classificationMethod = 'regional_default';
  selectedColorBrewerPaletteEntry: any = null;
  spatialUnitClassification: any[] = [];
  classBreaksInvalid = false;
  tabClasses: string[] = [];

  // Colorbrewer schemes/palettes (built from bundled palettes + config custom schemes)
  colorbrewerPalettes: any[] = [];
  colorbrewerSchemes: any = {};
  colorbreweSchemeName_dynamicIncrease = 'Blues';
  colorbreweSchemeName_dynamicDecrease = 'Reds';

  // Currently active per-spatial-unit tab
  currentClassificationTab = 0;

  /**
   * Loads the colorbrewer schemes/palettes and initializes the per-spatial-unit
   * classification tabs. Call once after `availableSpatialUnits` has been set.
   */
  init(availableSpatialUnits: any[]): void {
    this.availableSpatialUnits = availableSpatialUnits ?? [];
    this.loadColorBrewerSchemes();
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

  get isNumeric(): boolean {
    return this.classificationType === 'QUANTITATIVE';
  }

  get isCategorical(): boolean {
    return this.classificationType === 'QUALITATIVE';
  }

  /**
   * Switches between numeric and categorical classification. Keeps the selected
   * palette consistent with the chosen type: switching to categorical picks a
   * qualitative default palette (unless one is already selected), switching back
   * to numeric picks a sequential default when a qualitative one was active.
   */
  setType(type: ClassificationType) {
    if (this.classificationType === type) {
      return;
    }
    this.classificationType = type;

    const current = this.selectedColorBrewerPaletteEntry?.paletteName;
    const currentIsQualitative = !!current && QUALITATIVE_SCHEMES.has(current);
    if (type === 'QUALITATIVE' && !currentIsQualitative) {
      this.onColorSchemeSelected(DEFAULT_QUALITATIVE_SCHEME);
    } else if (type === 'QUANTITATIVE' && currentIsQualitative) {
      this.onColorSchemeSelected(DEFAULT_SEQUENTIAL_SCHEME);
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

  /**
   * Resets the classification state to its defaults (mirrors the classification
   * part of {@link IndicatorAddFormStateService.resetForm}). Requires the palettes
   * to have been instantiated already.
   */
  reset() {
    this.classificationType = 'QUANTITATIVE';
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
    this.currentClassificationTab = 0;
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }
}
