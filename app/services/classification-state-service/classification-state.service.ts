import { Injectable, inject, signal } from '@angular/core';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Shared classification state of the main-map indicator rendering
 * (map refactoring plan, Phase 2b — extracted from VisualStyleHelperServiceNew,
 * which is now a stateless brew/style factory).
 *
 * Single owner of the classify method, class count, the classyBrew objects,
 * the break lists and the per-color feature counters that the map pipeline
 * writes and the classification panel + map legend read.
 *
 * All fields are signal-backed accessor properties: plain property reads and
 * writes (incl. `[(ngModel)]` bindings) keep working, while the state is ready
 * for reactive consumers. NOTE: the brew objects and break arrays are still
 * mutated in place by the classification panel (push/splice/sort on
 * `manualBrew.breaks` etc.) — such mutations do not change the signal value
 * and rely on zone-based change detection, exactly as before the extraction.
 *
 * Not to be confused with the modal-scoped IndicatorClassificationStateService
 * of the admin indicator wizard (step 5).
 */
@Injectable({
  providedIn: 'root',
})
export class ClassificationStateService {
  private envConfigService = inject(EnvConfigService);

  private readonly _classifyMethod = signal<any>(
    this.envConfigService.defaultClassifyMethod || 'jenks'
  );
  get classifyMethod(): any {
    return this._classifyMethod();
  }
  set classifyMethod(value: any) {
    this._classifyMethod.set(value);
  }

  private readonly _numClasses = signal<any>(undefined);
  get numClasses(): any {
    return this._numClasses();
  }
  set numClasses(value: any) {
    this._numClasses.set(value);
  }

  private readonly _defaultBrew = signal<any>(undefined);
  get defaultBrew(): any {
    return this._defaultBrew();
  }
  set defaultBrew(value: any) {
    this._defaultBrew.set(value);
  }

  private readonly _manualBrew = signal<any>(undefined);
  get manualBrew(): any {
    return this._manualBrew();
  }
  set manualBrew(value: any) {
    this._manualBrew.set(value);
  }

  /** `[increaseBrew, decreaseBrew]` for dynamic indicators / negative values. */
  private readonly _dynamicBrew = signal<any>(undefined);
  get dynamicBrew(): any {
    return this._dynamicBrew();
  }
  set dynamicBrew(value: any) {
    this._dynamicBrew.set(value);
  }

  /** `[gtBrew, ltBrew]` for the measure-of-value display. */
  private readonly _measureOfValueBrew = signal<any>(undefined);
  get measureOfValueBrew(): any {
    return this._measureOfValueBrew();
  }
  set measureOfValueBrew(value: any) {
    this._measureOfValueBrew.set(value);
  }

  /** `[[increaseBreaks], [decreaseBreaks]]` for manually edited dynamic breaks. */
  private readonly _dynamicBrewBreaks = signal<any>([]);
  get dynamicBrewBreaks(): any {
    return this._dynamicBrewBreaks();
  }
  set dynamicBrewBreaks(value: any) {
    this._dynamicBrewBreaks.set(value);
  }

  /** `[ltBreaks, gtBreaks]` for manually edited measure-of-value breaks. */
  private readonly _manualMOVBreaks = signal<any>(undefined);
  get manualMOVBreaks(): any {
    return this._manualMOVBreaks();
  }
  set manualMOVBreaks(value: any) {
    this._manualMOVBreaks.set(value);
  }

  private readonly _regionalDefaultBreaks = signal<any>(undefined);
  get regionalDefaultBreaks(): any {
    return this._regionalDefaultBreaks();
  }
  set regionalDefaultBreaks(value: any) {
    this._regionalDefaultBreaks.set(value);
  }

  private readonly _regionalDefaultMOVBreaks = signal<any>(undefined);
  get regionalDefaultMOVBreaks(): any {
    return this._regionalDefaultMOVBreaks();
  }
  set regionalDefaultMOVBreaks(value: any) {
    this._regionalDefaultMOVBreaks.set(value);
  }

  private readonly _isCustomComputation = signal<boolean>(false);
  get isCustomComputation(): boolean {
    return this._isCustomComputation();
  }
  set isCustomComputation(value: boolean) {
    this._isCustomComputation.set(value);
  }

  private readonly _currentIndicatorOpacity = signal<any>(this.envConfigService.defaultFillOpacity);
  get currentIndicatorOpacity(): any {
    return this._currentIndicatorOpacity();
  }
  set currentIndicatorOpacity(value: any) {
    this._currentIndicatorOpacity.set(value);
  }

  // --- feature counters per legend entry (written during styling passes) ---

  private readonly _featuresPerColorMap = signal<Map<any, any>>(new Map());
  get featuresPerColorMap(): Map<any, any> {
    return this._featuresPerColorMap();
  }
  set featuresPerColorMap(value: Map<any, any>) {
    this._featuresPerColorMap.set(value);
  }

  private readonly _featuresPerNoData = signal<number>(0);
  get featuresPerNoData(): number {
    return this._featuresPerNoData();
  }
  set featuresPerNoData(value: number) {
    this._featuresPerNoData.set(value);
  }

  private readonly _featuresPerZero = signal<number>(0);
  get featuresPerZero(): number {
    return this._featuresPerZero();
  }
  set featuresPerZero(value: number) {
    this._featuresPerZero.set(value);
  }

  private readonly _featuresPerOutlierHigh = signal<number>(0);
  get featuresPerOutlierHigh(): number {
    return this._featuresPerOutlierHigh();
  }
  set featuresPerOutlierHigh(value: number) {
    this._featuresPerOutlierHigh.set(value);
  }

  private readonly _featuresPerOutlierLow = signal<number>(0);
  get featuresPerOutlierLow(): number {
    return this._featuresPerOutlierLow();
  }
  set featuresPerOutlierLow(value: number) {
    this._featuresPerOutlierLow.set(value);
  }

  resetFeatureCounters() {
    this.featuresPerColorMap = new Map();
    this.featuresPerNoData = 0;
    this.featuresPerZero = 0;
    this.featuresPerOutlierLow = 0;
    this.featuresPerOutlierHigh = 0;
  }

  incrementFeaturesPerColor(color) {
    // in-place Map mutation (no signal emission) — the legend reads the map
    // via change detection, exactly as before the extraction
    if (this.featuresPerColorMap.has(color)) {
      this.featuresPerColorMap.set(color, this.featuresPerColorMap.get(color) + 1);
    } else {
      this.featuresPerColorMap.set(color, 1);
    }
  }

  // --- brew backups for temporary reachability displays ---

  private defaultBrew_backup;
  private measureOfValueBrew_backup;
  private dynamicBrew_backup;
  private manualBrew_backup;

  backupCurrentBrewObjects_forMainMapIndicator() {
    this.defaultBrew_backup = jQuery.extend(true, {}, this.defaultBrew);
    this.measureOfValueBrew_backup = jQuery.extend(true, {}, this.measureOfValueBrew);
    this.dynamicBrew_backup = jQuery.extend(true, {}, this.dynamicBrew);
    this.manualBrew_backup = jQuery.extend(true, {}, this.manualBrew);
  }

  resetCurrentBrewObjects_forMainMapIndicator() {
    this.defaultBrew = jQuery.extend(true, {}, this.defaultBrew_backup);
    this.measureOfValueBrew = jQuery.extend(true, {}, this.measureOfValueBrew_backup);
    this.dynamicBrew = jQuery.extend(true, {}, this.dynamicBrew_backup);
    this.manualBrew = jQuery.extend(true, {}, this.manualBrew_backup);
  }
}
