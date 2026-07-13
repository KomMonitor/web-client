import { inject, Injectable, signal } from '@angular/core';
import {
  Classification,
  ExtendedDefaultClassificationMapping,
} from 'components/ngComponents/models/classification.models';
import {
  mergeColorSchemes,
  QUALITATIVE_SCHEMES,
} from 'components/ngComponents/userInterface/kommonitorClassification/colors';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/** The kind of classification the user configures in step 5. */
export type ClassificationType = 'QUANTITATIVE' | 'QUALITATIVE';

/** A colorbrewer scheme: hex color arrays keyed by class count (e.g. '3', '5'). */
export type ColorScheme = Record<string, string[]>;

/** A named colorbrewer palette: its scheme name and the class-count-keyed colors. */
export interface ColorPaletteEntry {
  paletteName: string;
  paletteArrayObject: ColorScheme;
}

/** Minimal spatial-unit shape the classification step needs. */
export interface ClassificationSpatialUnit {
  spatialUnitId: string;
  spatialUnitLevel: string;
}

/** One category of the qualitative classification. */
export interface CategoryRow {
  value: string;
  label: string;
  customColor: string | null;
}

/** Per-spatial-unit break configuration for the regional-default method. */
export interface SpatialUnitClassification {
  spatialUnitId: string;
  spatialUnitLevel: string;
  breaks: (number | null)[];
}

/**
 * Loose shape of a stored `defaultClassificationMapping` accepted by
 * {@link IndicatorClassificationStateService.applyMapping}. Tolerates both the
 * extended shape and the legacy one (item key `spatialUnit` instead of
 * `spatialUnitId`, no type/label fields), hence the optional/duplicated keys.
 */
export interface StoredClassificationMapping {
  classificationType?: string;
  colorBrewerSchemeName?: string;
  classificationMethod?: string;
  numClasses?: number;
  labels?: string[];
  individualColors?: string[];
  items?: { spatialUnitId?: string; spatialUnit?: string; breaks: (number | null)[] }[];
  categoricalData?: { categoricalValue?: string; color?: string; label?: string }[];
}

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
  availableSpatialUnits: ClassificationSpatialUnit[] = [];

  // Numeric (sequential/diverging) vs categorical (qualitative) classification.
  classificationType: ClassificationType = 'QUANTITATIVE';

  // Whether the "Individuell" palette option is active. Only then may the user pick
  // per-class / per-category colors below; otherwise the colors are taken from the
  // selected colorbrewer palette. `selectedColorBrewerPaletteEntry` keeps holding the
  // last real palette (the base the individual colors were seeded from). Signal-backed
  // so OnPush templates react to mode changes.
  readonly individualColorMode = signal(false);

  // Classification form data
  numClassesArray = [3, 4, 5, 6, 7, 8];
  numClassesPerSpatialUnit = 5;
  // Signal-backed so OnPush editors (e.g. the computed-methods info box) react when
  // the method changes between two computed methods without remounting.
  readonly classificationMethod = signal('regional_default');
  selectedColorBrewerPaletteEntry: ColorPaletteEntry | null = null;
  spatialUnitClassification: SpatialUnitClassification[] = [];
  classBreaksInvalid = false;
  tabClasses: string[] = [];

  // Per-class-position editable labels (shared across all spatial-unit levels).
  numLabels: string[] = [];
  // Per-class-position individual color overrides; a null entry falls back to the
  // selected palette color for that class. Non-null entries mean "individual color".
  individualColors: (string | null)[] = [];

  // Categorical (qualitative) classification: manually defined categories, each
  // with a value, an editable label and an optional individual color override.
  categories: CategoryRow[] = this.createEmptyCategories(4);
  // Fallback color for categories beyond the palette size (overflow) or without a
  // dedicated color assigned.
  defaultColor = '#c9ced4';

  // Colorbrewer schemes/palettes (built from bundled palettes + config custom schemes)
  colorbrewerPalettes: ColorPaletteEntry[] = [];
  colorbrewerSchemes: Record<string, ColorScheme> = {};
  colorbreweSchemeName_dynamicIncrease = 'Blues';
  colorbreweSchemeName_dynamicDecrease = 'Reds';

  // Currently active per-spatial-unit tab
  currentClassificationTab = 0;

  /**
   * Bumped whenever a structural change rewrites the plain state arrays in bulk
   * (class/category count, breaks/labels/colors rebuild, mapping import, reset).
   * The OnPush editor sub-components mirror it via an `effect` + `markForCheck`, so
   * they re-read the rebuilt arrays even when they stay mounted (e.g. changing the
   * class count without switching the classification method).
   */
  readonly revision = signal(0);
  private bumpRevision(): void {
    this.revision.update((value) => value + 1);
  }

  /**
   * Loads the colorbrewer schemes/palettes and initializes the per-spatial-unit
   * classification tabs. Call once after `availableSpatialUnits` has been set.
   */
  init(availableSpatialUnits: ClassificationSpatialUnit[]): void {
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

  // Receives the full method object from app-classification-method-select; keep a
  // string fallback in case a bare id is passed.
  onClassificationMethodSelected(method: Classification | string) {
    this.classificationMethod.set(typeof method === 'string' ? method : method.id);
    // Reinitialize classification when method changes
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }

  onClickColorBrewerEntry(colorPaletteEntry: ColorPaletteEntry) {
    this.selectedColorBrewerPaletteEntry = colorPaletteEntry;
  }

  // app-color-palette-select emits the scheme name; map it back to our palette entry.
  // The synthetic 'INDIVIDUAL' scheme enables the custom-color mode instead.
  onColorSchemeSelected(paletteName: string) {
    if (paletteName === 'INDIVIDUAL') {
      this.enableIndividualColors();
      return;
    }
    const entry = this.colorbrewerPalettes.find((p) => p.paletteName === paletteName);
    if (entry) {
      this.individualColorMode.set(false);
      this.onClickColorBrewerEntry(entry);
    }
  }

  /** Scheme name shown as selected in the palette dropdown ('INDIVIDUAL' in custom mode). */
  get selectedSchemeName(): string {
    return this.individualColorMode()
      ? 'INDIVIDUAL'
      : (this.selectedColorBrewerPaletteEntry?.paletteName ?? '');
  }

  /**
   * Enables the custom-color mode and seeds the editable colors from the currently
   * selected palette, so the user starts from the palette colors rather than blanks.
   */
  private enableIndividualColors() {
    this.individualColorMode.set(true);
    if (this.isCategorical) {
      this.categories = this.categories.map((category, index) => ({
        ...category,
        customColor: category.customColor ?? this.paletteColorForCategory(index),
      }));
    } else {
      const paletteColors = this.getClassColors();
      this.individualColors = this.individualColors.map(
        (override, index) => override ?? paletteColors[index] ?? '#cccccc'
      );
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
    // Leave the custom-color mode when the type changes; a fresh palette is chosen.
    this.individualColorMode.set(false);

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

  // Preview colors for "derzeit selektiert": the individually chosen colors in custom
  // mode, otherwise the selected palette's 5-color spectrum.
  getSelectedPaletteColors(): string[] {
    if (this.individualColorMode()) {
      return this.isCategorical
        ? this.categories.map((_, index) => this.categoryColor(index).color)
        : this.numericColors();
    }
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

  get isRegional(): boolean {
    return this.classificationMethod() === 'regional_default';
  }

  get isComputed(): boolean {
    return this.isNumeric && !this.isRegional;
  }

  // Human-readable names for the classification methods (kept in sync with
  // app-classification-method-select, which hardcodes the same German labels).
  private readonly methodNames: Record<string, string> = {
    regional_default: 'Regionaler Standard',
    jenks: 'Jenks',
    equal_interval: 'Gleiches Intervall',
    quantile: 'Quantile',
  };

  /** Display name of the currently selected classification method. */
  get currentMethodName(): string {
    const method = this.classificationMethod();
    return this.methodNames[method] ?? method;
  }

  /**
   * Position label for a numeric class in the computed-methods editor: the lowest
   * and highest class are annotated, the rest just show their 1-based position.
   */
  positionText(classIndex: number): string {
    const position = classIndex + 1;
    if (classIndex === 0) {
      return `${position} · niedrigste`;
    }
    if (classIndex === this.numClassesPerSpatialUnit - 1) {
      return `${position} · höchste`;
    }
    return String(position);
  }

  /**
   * Effective color of a numeric class position: the individual override in custom
   * mode, otherwise the selected palette color for that class. Falls back to a neutral
   * grey when the palette has no color for the position.
   */
  colorForClass(classIndex: number): string {
    if (this.individualColorMode()) {
      const override = this.individualColors[classIndex];
      if (override) {
        return override;
      }
    }
    const paletteColors = this.getClassColors();
    return paletteColors[classIndex] ?? '#cccccc';
  }

  /** Effective colors for every numeric class (palette colors with individual overrides). */
  numericColors(): string[] {
    const count = this.numClassesPerSpatialUnit;
    return Array.from({ length: count }, (_, i) => this.colorForClass(i));
  }

  /** Sets an individual color override for a class position (custom-color mode only). */
  setIndividualColor(classIndex: number, color: string) {
    const next = this.individualColors.slice();
    next[classIndex] = color;
    this.individualColors = next;
  }

  // ---- categorical (qualitative) classification ----

  /** Builds `count` blank category rows. */
  private createEmptyCategories(count: number): CategoryRow[] {
    return Array.from({ length: count }, () => ({ value: '', label: '', customColor: null }));
  }

  /** Number of categories (the categorical "class count"). */
  get categoryCount(): number {
    return this.categories.length;
  }

  /** Name of the selected qualitative palette (for overflow messaging). */
  get categoricalSchemeName(): string {
    return this.selectedColorBrewerPaletteEntry?.paletteName ?? '';
  }

  /**
   * The largest color set of the selected qualitative palette. Colorbrewer palettes
   * are keyed by class count (e.g. Accent has '3'..'8'); categorical assignment uses
   * the maximum available so as many categories as possible get a distinct color.
   */
  categoricalPaletteColors(): string[] {
    const paletteArrayObject = this.selectedColorBrewerPaletteEntry?.paletteArrayObject;
    if (!paletteArrayObject) {
      return [];
    }
    const maxKey = Object.keys(paletteArrayObject)
      .map((key) => Number(key))
      .filter((key) => !Number.isNaN(key))
      .sort((a, b) => b - a)[0];
    return paletteArrayObject[String(maxKey)] ?? [];
  }

  /** Number of distinct palette colors available for categories. */
  get categoricalPaletteSize(): number {
    return this.categoricalPaletteColors().length;
  }

  /**
   * Whether there are more categories than palette colors (overflow → default color).
   * Only relevant in palette mode; in custom-color mode the user colors every category.
   */
  get hasCategoryOverflow(): boolean {
    return !this.individualColorMode() && this.categoryCount > this.categoricalPaletteSize;
  }

  /** Palette color for a category position, or the default color when beyond the palette. */
  private paletteColorForCategory(index: number): string {
    const palette = this.categoricalPaletteColors();
    return index < palette.length ? palette[index] : this.defaultColor;
  }

  /**
   * Effective color of a category: in custom-color mode the individual override,
   * otherwise the palette color at that position, or the default color when beyond
   * the palette (overflow). The `overflow` flag marks palette-mode categories that
   * fell back to the default.
   */
  categoryColor(index: number): { color: string; overflow: boolean } {
    const category = this.categories[index];
    if (this.individualColorMode() && category?.customColor) {
      return { color: category.customColor, overflow: false };
    }
    const palette = this.categoricalPaletteColors();
    if (index < palette.length) {
      return { color: palette[index], overflow: false };
    }
    return { color: this.defaultColor, overflow: !this.individualColorMode() };
  }

  /** Sets an individual color override for a category. */
  setCategoryColor(index: number, color: string) {
    const next = this.categories.slice();
    next[index] = { ...next[index], customColor: color };
    this.categories = next;
  }

  /** Resizes the category list to `count` (min 2), preserving existing rows. */
  onCatNumClassesChanged(count: number) {
    let next = Math.floor(count);
    if (!next || next < 2) {
      next = 2;
    }
    const categories = this.categories.slice(0, next);
    while (categories.length < next) {
      categories.push({ value: '', label: '', customColor: null });
    }
    this.categories = categories;
    this.bumpRevision();
  }

  /** Appends a new blank category. */
  addCategory() {
    this.categories = [...this.categories, { value: '', label: '', customColor: null }];
    this.bumpRevision();
  }

  /** Removes a category (keeping at least two). */
  removeCategory(index: number) {
    if (this.categories.length <= 2) {
      return;
    }
    this.categories = this.categories.filter((_, i) => i !== index);
    this.bumpRevision();
  }

  // ---- API mapping (the single place that knows the extended backend fields) ----

  /**
   * Builds the `defaultClassificationMapping` payload from the current state. This
   * is the ONLY place that emits the extended, prototype-proposed fields
   * (`classificationType`, `labels`, `individualColors`, `categoricalData`); the
   * form-state payload builders and the metadata export all call this. Adjust here
   * (plus {@link applyMapping} and {@link ExtendedDefaultClassificationMapping})
   * once the backend schema is finalized.
   */
  buildDefaultClassificationMapping(): ExtendedDefaultClassificationMapping {
    if (this.isCategorical) {
      return {
        classificationType: 'QUALITATIVE',
        colorBrewerSchemeName: this.individualColorMode()
          ? 'INDIVIDUAL'
          : this.categoricalSchemeName,
        numClasses: this.categoryCount,
        categoricalData: this.categories.map((category, index) => ({
          categoricalValue: category.value,
          color: this.categoryColor(index).color,
          label: category.label,
        })),
      };
    }

    const mapping: ExtendedDefaultClassificationMapping = {
      classificationType: 'QUANTITATIVE',
      colorBrewerSchemeName: this.individualColorMode()
        ? 'INDIVIDUAL'
        : (this.selectedColorBrewerPaletteEntry?.paletteName ?? ''),
      numClasses: this.numClassesPerSpatialUnit,
      classificationMethod: this.classificationMethod()?.toUpperCase() as
        | ExtendedDefaultClassificationMapping['classificationMethod']
        | undefined,
    };

    if (this.individualColorMode()) {
      mapping.individualColors = this.numericColors();
    }
    if (this.numLabels.some((label) => label && label.length)) {
      mapping.labels = this.numLabels.slice();
    }
    // Break values are only meaningful for the regional default method; only send
    // spatial units whose breaks are fully filled in (so the filtered breaks are all
    // numbers, matching the API's `number[]`).
    if (this.isRegional) {
      mapping.items = this.spatialUnitClassification
        .filter((classification) => !classification.breaks.includes(null))
        .map((classification) => ({
          spatialUnitId: classification.spatialUnitId,
          breaks: classification.breaks as number[],
        }));
    }

    return mapping;
  }

  /**
   * Applies a stored `defaultClassificationMapping` onto the state (the reverse of
   * {@link buildDefaultClassificationMapping}). Accepts both the extended shape and
   * the legacy one (item key `spatialUnit` instead of `spatialUnitId`, no type/label
   * fields); missing type info defaults to numeric.
   */
  applyMapping(mapping: StoredClassificationMapping | null | undefined) {
    if (!mapping) {
      return;
    }

    this.classificationType =
      mapping.classificationType === 'QUALITATIVE' || mapping.categoricalData
        ? 'QUALITATIVE'
        : 'QUANTITATIVE';

    // 'INDIVIDUAL' scheme means the stored colors are custom (not from a palette).
    this.individualColorMode.set(mapping.colorBrewerSchemeName === 'INDIVIDUAL');

    // Palette: resolve a named scheme; INDIVIDUAL is handled via the color fields.
    if (mapping.colorBrewerSchemeName && mapping.colorBrewerSchemeName !== 'INDIVIDUAL') {
      const entry = this.colorbrewerPalettes.find(
        (palette) => palette.paletteName === mapping.colorBrewerSchemeName
      );
      if (entry) {
        this.selectedColorBrewerPaletteEntry = entry;
      }
    }

    if (this.isCategorical) {
      const data = mapping.categoricalData ?? [];
      if (data.length) {
        const individual = mapping.colorBrewerSchemeName === 'INDIVIDUAL';
        this.categories = data.map((item) => ({
          value: item.categoricalValue ?? '',
          label: item.label ?? '',
          customColor: individual ? (item.color ?? null) : null,
        }));
      }
      this.bumpRevision();
      return;
    }

    // Numeric branch
    if (mapping.classificationMethod) {
      this.classificationMethod.set(String(mapping.classificationMethod).toLowerCase());
    }
    if (mapping.numClasses) {
      this.numClassesPerSpatialUnit = mapping.numClasses;
    }
    // Rebuild the per-spatial-unit tabs (also resets labels/individual colors), then
    // apply the stored values on top.
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);

    (mapping.items ?? []).forEach((item) => {
      const spatialUnitId = item.spatialUnitId ?? item.spatialUnit;
      const index = this.spatialUnitClassification.findIndex(
        (classification) => classification.spatialUnitId === spatialUnitId
      );
      if (index > -1) {
        this.spatialUnitClassification[index].breaks = item.breaks;
        this.onBreaksChanged(index);
      }
    });

    if (Array.isArray(mapping.labels)) {
      this.numLabels = this.resizeArray(mapping.labels.slice(), this.numClassesPerSpatialUnit, '');
    }
    if (mapping.colorBrewerSchemeName === 'INDIVIDUAL' && Array.isArray(mapping.individualColors)) {
      this.individualColors = this.resizeArray(
        mapping.individualColors.slice(),
        this.numClassesPerSpatialUnit,
        null
      );
    }

    // numLabels / individualColors were rewritten after onNumClassesChanged's bump.
    this.bumpRevision();
  }

  /** Resizes an array to `length`, keeping existing entries and padding with `fill`. */
  private resizeArray<T>(source: T[], length: number, fill: T): T[] {
    const next = source.slice(0, length);
    while (next.length < length) {
      next.push(fill);
    }
    return next;
  }

  onNumClassesChanged(numClasses: number) {
    this.numClassesPerSpatialUnit = numClasses;

    // Keep the per-class-position labels and individual color overrides in sync
    // with the class count (preserving already-entered values).
    this.numLabels = this.resizeArray(this.numLabels, numClasses, '');
    this.individualColors = this.resizeArray(this.individualColors, numClasses, null);

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

    // Arrays above were rebuilt in bulk: let mounted OnPush editors re-check.
    this.bumpRevision();
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
    this.individualColorMode.set(false);
    this.numClassesPerSpatialUnit = 5;
    this.classificationMethod.set('regional_default');
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
    // Clear per-class labels/colors; onNumClassesChanged repopulates them to defaults.
    this.numLabels = [];
    this.individualColors = [];
    // Reset categorical state to four blank categories and the default overflow color.
    this.categories = this.createEmptyCategories(4);
    this.defaultColor = '#c9ced4';
    this.onNumClassesChanged(this.numClassesPerSpatialUnit);
  }
}
