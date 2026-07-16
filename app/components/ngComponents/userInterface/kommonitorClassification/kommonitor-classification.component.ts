import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClassificationMethodSelectComponent } from 'components/ngComponents/common/classificationMethodSelect/classification-method-select.component';
import { ColorPaletteSelectComponent } from 'components/ngComponents/common/colorPaletteSelect/color-palette-select.component';
import { ColorPaletteSwatchComponent } from 'components/ngComponents/common/colorPaletteSwatch/color-palette-swatch.component';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { LegendDisplayUpdate, MapService } from 'services/map-service/map.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { mergeColorSchemes } from './colors';

@Component({
  selector: 'kommonitor-classification-component',
  templateUrl: './kommonitor-classification.component.html',
  styleUrls: ['./kommonitor-classification.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClassificationMethodSelectComponent,
    ColorPaletteSelectComponent,
    ColorPaletteSwatchComponent,
  ],
})
export class KommonitorClassificationComponent implements OnInit {
  protected chartDisplayState = inject(ChartDisplayStateService);
  protected selectionState = inject(SelectionStateService);
  protected classificationState = inject(ClassificationStateService);
  private broadcastService = inject(BroadcastService);
  private mapService = inject(MapService);
  protected envConfigService = inject(EnvConfigService);

  methodName = 'Klassifizierungsmethode auswählen';
  showMethodSelection = false;
  addBtnHeight = [0, 0];
  showAddBtn = [false, false];

  isDraggingBreak = false;
  draggingBreak!: any;
  nrOfDraggingBreak = null;
  dynamicDraggingSite = 0;

  containsZeroValues = false;
  containsNegativeValues = false;
  containsOutliers_high = false;
  containsOutliers_low = false;
  containsNoData;

  hiddenMethodIds: any[] = [];

  /** colorbrewer schemes (incl. custom) used to render the selected palette preview. */
  private colorSchemes = mergeColorSchemes(this.envConfigService.customColorSchemes);

  /** The 5-class colors of the currently selected scheme (falls back to 'Blues'). */
  get selectedPaletteColors(): string[] {
    const schemeName =
      this.selectionState.selectedIndicator?.defaultClassificationMapping?.colorBrewerSchemeName;
    return (this.colorSchemes[schemeName] ?? this.colorSchemes['Blues'])['5'];
  }

  ngOnInit(): void {
    // catch broadcast msgs
    this.mapService.mapEvent$.subscribe((event) => {
      if (event.type === 'legendDisplayUpdated') this.updateClassificationComponent(event.update);
    });

    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case 'updateShowRegionalDefaultOption':
          {
            this.updateShowRegionalDefaultOption(values);
          }
          break;
      }
    });

    if (this.envConfigService.disableManualClassification) {
      this.hideManualClassification();
    }
  }

  updateClassificationComponent(update: LegendDisplayUpdate) {
    this.containsZeroValues = update.containsZeroValues;
    this.containsNegativeValues = update.datasetContainsNegativeValues;
    this.containsOutliers_high = update.containsOutliers_high;
    this.containsOutliers_low = update.containsOutliers_low;
    this.containsNoData = update.containsNoDataValues;
  }

  updateShowRegionalDefaultOption([show]) {
    if (show) {
      if (this.hiddenMethodIds.includes('regional_default')) {
        this.hiddenMethodIds.splice(this.hiddenMethodIds.indexOf('regional_default'), 1);
      }
    } else {
      if (!this.hiddenMethodIds.includes('regional_default')) {
        this.hiddenMethodIds.push('regional_default');
      }
    }
  }

  hideManualClassification() {
    if (!this.hiddenMethodIds.includes('manual')) {
      this.hiddenMethodIds.push('manual');
    }
  }

  onMethodSelected(method) {
    this.methodName = method.name;
    this.showMethodSelection = false;
    this.classificationState.classifyMethod = method.id;
    console.log(method);
    this.mapService.changeClassifyMethod(this.classificationState.classifyMethod);
  }

  onChangeSelectedClassifyMethod() {
    this.mapService.changeClassifyMethod(this.classificationState.classifyMethod);
  }

  onChangeNumberOfClasses() {
    this.mapService.changeNumClasses(this.classificationState.numClasses);
  }

  onColorSchemeSelected(schemeName: string) {
    this.selectionState.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName =
      schemeName;

    // notify the map to restyle the current layer with the new scheme
    this.mapService.changeColorScheme(schemeName);
  }

  toggleAddBtn(e, site) {
    if (!this.showAddBtn[site] && e.buttons === 0) {
      this.showAddBtn = [false, false];
      this.showAddBtn[site] = true;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = Math.floor(e.clientY - rect.top);
    if (y > 0 && y < rect.height) {
      this.addBtnHeight[site] = y;
    }
  }

  addNewBreaks(site) {
    if (
      (!this.chartDisplayState.isBalanceChecked &&
        !this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') &&
        !this.containsNegativeValues) ||
      this.chartDisplayState.isMeasureOfValueChecked
    ) {
      this.addNewBreak();
    } else {
      this.addNewBreakDynamic(site);
      if (this.chartDisplayState.isMeasureOfValueChecked) {
        this.addNewBreak();
      }
    }
  }

  addNewBreak() {
    const histogram = document.querySelectorAll<HTMLElement>('.editableHistogram')[0];
    if (this.classificationState.manualBrew.breaks.length < 10) {
      if (this.addBtnHeight[0] >= 0 && this.addBtnHeight[0] < histogram.offsetHeight) {
        const breaks = this.classificationState.manualBrew.breaks;
        const newBreak = Math.floor(
          (this.addBtnHeight[0] / histogram.offsetHeight) *
            (breaks[breaks.length - 1] - breaks[0]) +
            breaks[0]
        );
        if (!this.classificationState.manualBrew.breaks.includes(newBreak)) {
          this.classificationState.manualBrew.breaks.push(newBreak);
          this.classificationState.manualBrew.breaks.sort(function (a, b) {
            return a - b;
          });

          this.mapService.changeBreaks(this.classificationState.manualBrew.breaks);
        }

        if (
          (this.chartDisplayState.isBalanceChecked ||
            this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') ||
            this.containsNegativeValues) &&
          this.chartDisplayState.isMeasureOfValueChecked
        ) {
          this.updateDynamicBreaksFromManualBreaks();
        }
      }
    }
  }

  addNewBreakDynamic(site) {
    const histograms = Array.from(document.querySelectorAll<HTMLElement>('.editableHistogram'));
    histograms.reverse();
    const histogram = histograms[site];

    if (this.classificationState.dynamicBrew[site].breaks.length < 5) {
      if (this.addBtnHeight[site] >= 0 && this.addBtnHeight[site] < histogram.offsetHeight) {
        const breaks = this.classificationState.dynamicBrew[site].breaks;
        const newBreak = Math.floor(
          (this.addBtnHeight[site] / histogram.offsetHeight) *
            (breaks[breaks.length - 1] - breaks[0]) +
            breaks[0]
        );
        if (!this.classificationState.dynamicBrew[site].breaks.includes(newBreak)) {
          this.classificationState.dynamicBrew[site].breaks.push(newBreak);
          this.classificationState.dynamicBrew[site].breaks.sort(function (a, b) {
            return a - b;
          });

          const increaseBreaks = this.classificationState.dynamicBrew[0]
            ? this.classificationState.dynamicBrew[0].breaks
            : [];
          const decreaseBreaks = this.classificationState.dynamicBrew[1]
            ? this.classificationState.dynamicBrew[1].breaks
            : [];

          this.mapService.changeDynamicBreaks([increaseBreaks, decreaseBreaks]);
        }
      }
    }
  }

  updateDynamicBreaksFromManualBreaks() {
    const increaseBreaks: any[] = [];
    const decreaseBreaks: any[] = [];
    this.classificationState.manualBrew.breaks.forEach((br) => {
      if (br < 0) {
        decreaseBreaks.push(br);
      } else {
        increaseBreaks.push(br);
      }
    });

    this.mapService.changeDynamicBreaks([increaseBreaks, decreaseBreaks]);
  }

  breakIsUnalterable(br) {
    if (
      this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') ||
      this.containsNegativeValues
    ) {
      if (this.classificationState.dynamicBrewBreaks) {
        if (this.classificationState.dynamicBrewBreaks[1]) {
          if (br == this.classificationState.dynamicBrewBreaks[1][0]) {
            return true;
          }
          if (
            br ==
            this.classificationState.dynamicBrewBreaks[1][
              this.classificationState.dynamicBrewBreaks[1].length - 1
            ]
          ) {
            return true;
          }
        }
        if (this.classificationState.dynamicBrewBreaks[0]) {
          if (br == this.classificationState.dynamicBrewBreaks[0][0]) {
            return true;
          }
          if (
            br ==
            this.classificationState.dynamicBrewBreaks[0][
              this.classificationState.dynamicBrewBreaks[0].length - 1
            ]
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  deleteBreak(i, site) {
    if (
      this.chartDisplayState.isBalanceChecked ||
      this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') ||
      this.containsNegativeValues
    ) {
      if (this.chartDisplayState.isMeasureOfValueChecked) {
        this.classificationState.manualBrew.breaks.splice(i, 1);

        this.mapService.changeBreaks(this.classificationState.manualBrew.breaks);
        this.updateDynamicBreaksFromManualBreaks();
      } else {
        this.classificationState.dynamicBrew[site].breaks.splice(i, 1);
        const increaseBreaks = this.classificationState.dynamicBrew[0]
          ? this.classificationState.dynamicBrew[0].breaks
          : [];
        const decreaseBreaks = this.classificationState.dynamicBrew[1]
          ? this.classificationState.dynamicBrew[1].breaks
          : [];

        this.mapService.changeDynamicBreaks([increaseBreaks, decreaseBreaks]);
      }
    } else {
      this.classificationState.manualBrew.breaks.splice(i, 1);

      this.mapService.changeBreaks(this.classificationState.manualBrew.breaks);
    }
  }

  onBreaksChanged(e, i, site) {
    e.currentTarget.disabled = true;

    const breaks = [...this.classificationState.manualBrew.breaks];
    if (
      e.currentTarget.value <= breaks[0] ||
      e.currentTarget.value >= breaks[breaks.length - 1] ||
      breaks.includes(Number(e.currentTarget.value))
    ) {
      e.currentTarget.value = breaks[i];

      // todo, wrap into timeout if necessary
      //setTimeout(function () {
      e.currentTarget.value = breaks[i];
      this.classificationState.manualBrew.breaks[i] = breaks[i];
      //}, 10);
    } else {
      this.classificationState.manualBrew.breaks[i] = Number(e.currentTarget.value);
      this.classificationState.manualBrew.breaks.sort(function (a, b) {
        return a - b;
      });

      this.mapService.changeBreaks(this.classificationState.manualBrew.breaks);

      if (
        (this.chartDisplayState.isBalanceChecked ||
          this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') ||
          this.containsNegativeValues) &&
        this.chartDisplayState.isMeasureOfValueChecked
      ) {
        this.updateDynamicBreaksFromManualBreaks();
      }
    }
  }

  onBreaksChangedDynamic(e, i, site) {
    e.currentTarget.disabled = true;

    const breaks = [...this.classificationState.dynamicBrew[site].breaks];
    if (
      e.currentTarget.value <= breaks[0] ||
      e.currentTarget.value >= breaks[breaks.length - 1] ||
      breaks.includes(Number(e.currentTarget.value))
    ) {
      e.currentTarget.value = breaks[i];

      // todo, wrap in timeout if necessary
      /* setTimeout(function () {
       $apply(function(){ */
      e.currentTarget.value = breaks[i];
      this.classificationState.dynamicBrew[site].breaks[i] = breaks[i];
      /*     });
      }, 10); */
    } else {
      this.classificationState.dynamicBrew[site].breaks[i] = Number(e.currentTarget.value);
      this.classificationState.dynamicBrew[site].breaks.sort(function (a, b) {
        return a - b;
      });

      this.mapService.changeDynamicBreaks([
        this.classificationState.dynamicBrew[0].breaks,
        this.classificationState.dynamicBrew[1].breaks,
      ]);
    }
  }

  onBreakDblClick(e, i, site) {
    if (
      (!this.chartDisplayState.isBalanceChecked &&
        !this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') &&
        !this.containsNegativeValues) ||
      this.chartDisplayState.isMeasureOfValueChecked
    ) {
      if (
        i == 0 ||
        i == this.classificationState.manualBrew.breaks.length - 1 ||
        this.breakIsUnalterable(this.classificationState.manualBrew.breaks[i])
      ) {
        return;
      }
    } else {
      if (
        i == 0 ||
        i == this.classificationState.dynamicBrew[site].breaks.length - 1 ||
        this.breakIsUnalterable(this.classificationState.dynamicBrew[site].breaks[i])
      ) {
        return;
      }
    }
    const input = e.currentTarget.children[0].children[0];
    input.disabled = false;
    input.focus();

    if (window.getSelection) {
      window.getSelection()!.removeAllRanges();
    } else if (document.getSelection()) {
      document.getSelection()!.empty();
    }
  }

  restyleCurrentLayer() {
    this.mapService.restyleCurrentLayer(false);
  }

  getWidthForHistogramBar(i) {
    const colors = this.classificationState.manualBrew.colors
      ? this.classificationState.manualBrew.colors
      : [];
    const countArray: any[] = [];
    colors.forEach((color: any) => {
      countArray.push(this.classificationState.featuresPerColorMap.get(color) || 0);
    });
    return (countArray[i] / Math.max(...countArray)) * 100 || 0;
  }
  getWidthForHistogramBarMOV(side, i) {
    const colors: any[] = [];
    colors[0] = this.classificationState.measureOfValueBrew[0]
      ? this.classificationState.measureOfValueBrew[0].colors
      : [];
    colors[1] = this.classificationState.measureOfValueBrew[1]
      ? this.classificationState.measureOfValueBrew[1].colors
      : [];

    const countArray: any[] = [];
    colors[0].forEach((color) => {
      countArray.push(this.classificationState.featuresPerColorMap.get(color) || 0);
    });
    colors[1].forEach((color) => {
      countArray.push(this.classificationState.featuresPerColorMap.get(color) || 0);
    });
    const color = this.classificationState.measureOfValueBrew[side].colors[i];
    const count = this.classificationState.featuresPerColorMap.get(color);
    return (count / Math.max(...countArray)) * 100 || 0;
  }

  getWidthForHistogramBarDynamic(side, i) {
    const colors = [
      ...this.classificationState.dynamicBrew[0].colors,
      ...this.classificationState.dynamicBrew[1].colors,
    ];
    const countArray: any[] = [];
    colors.forEach((color) => {
      countArray.push(this.classificationState.featuresPerColorMap.get(color) || 0);
    });
    const color = this.classificationState.dynamicBrew[side].colors[i];
    const count = this.classificationState.featuresPerColorMap.get(color);
    return (count / Math.max(...countArray)) * 100 || 0;
  }

  getHeightForBar(i) {
    const size =
      this.classificationState.manualBrew.breaks[i + 1] -
      this.classificationState.manualBrew.breaks[i];
    return (size / (this.getMaxValue(0) - this.getMinValue(0))) * 100;
  }

  getHeightForBarMOV(site, i) {
    const size =
      this.classificationState.measureOfValueBrew[site].breaks[i + 1] -
      this.classificationState.measureOfValueBrew[site].breaks[i];
    return (size / (this.getMaxValue(0) - this.getMinValue(1))) * 100;
  }

  getHeightForBarDynamic(site, i) {
    const size =
      this.classificationState.dynamicBrew[site].breaks[i + 1] -
      this.classificationState.dynamicBrew[site].breaks[i];
    return (size / (this.getMaxValue(site) - this.getMinValue(site))) * 100;
  }

  getPercentage(n, site) {
    return ((n - this.getMinValue(site)) / (this.getMaxValue(site) - this.getMinValue(site))) * 100;
  }

  getMaxValue(site) {
    let breaks = [];
    if (
      (!this.chartDisplayState.isBalanceChecked &&
        !this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') &&
        !this.containsNegativeValues) ||
      this.chartDisplayState.isMeasureOfValueChecked
    ) {
      breaks = this.classificationState.manualBrew.breaks;
    } else {
      if (!this.classificationState.dynamicBrew) {
        return 0;
      }
      if (!this.classificationState.dynamicBrew[0] && !this.classificationState.dynamicBrew[1]) {
        return 0;
      }
      if (
        site == 1 &&
        (!this.classificationState.dynamicBrew[1] ||
          this.classificationState.dynamicBrew[1].breaks.length < 1)
      ) {
        breaks = this.classificationState.dynamicBrew[0].breaks;
      }
      if (
        site == 0 &&
        (!this.classificationState.dynamicBrew[0] ||
          this.classificationState.dynamicBrew[0].breaks.length < 1)
      ) {
        breaks = this.classificationState.dynamicBrew[1].breaks;
      }
      breaks = this.classificationState.dynamicBrew[site].breaks;
    }
    return breaks[breaks.length - 1];
  }

  getMinValue(site) {
    if (
      (!this.chartDisplayState.isBalanceChecked &&
        !this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') &&
        !this.containsNegativeValues) ||
      this.chartDisplayState.isMeasureOfValueChecked
    ) {
      return this.classificationState.manualBrew.breaks[0];
    }
    if (!this.classificationState.dynamicBrew) {
      return 0;
    }
    if (!this.classificationState.dynamicBrew[0] && !this.classificationState.dynamicBrew[1]) {
      return 0;
    }
    if (
      site == 1 &&
      (!this.classificationState.dynamicBrew[1] ||
        this.classificationState.dynamicBrew[1].breaks.length < 1)
    ) {
      return this.classificationState.dynamicBrew[0].breaks[0];
    }
    if (
      site == 0 &&
      (!this.classificationState.dynamicBrew[0] ||
        this.classificationState.dynamicBrew[0].breaks.length < 1)
    ) {
      return this.classificationState.dynamicBrew[1].breaks[0];
    }
    return this.classificationState.dynamicBrew[site].breaks[0];
  }

  onBreakMouseDown(e, i, site) {
    this.isDraggingBreak = true;
    this.draggingBreak = e.currentTarget;
    this.nrOfDraggingBreak = i;
    this.dynamicDraggingSite = site;
  }

  onClassificationMouseUp() {
    this.isDraggingBreak = false;
  }

  onBreaksMouseMove(e, site) {
    if (
      (!this.chartDisplayState.isBalanceChecked &&
        !this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') &&
        !this.containsNegativeValues) ||
      this.chartDisplayState.isMeasureOfValueChecked
    ) {
      this.onBreakMouseMove(e);
    } else {
      this.onDynamicBreakMouseMove(e, site);
    }
  }

  onBreakMouseMove(e) {
    if (
      this.nrOfDraggingBreak != 0 &&
      this.nrOfDraggingBreak != this.classificationState.manualBrew.breaks.length - 1 &&
      this.nrOfDraggingBreak &&
      !this.breakIsUnalterable(this.classificationState.manualBrew.breaks[this.nrOfDraggingBreak])
    ) {
      this.showAddBtn[0] = false;

      if (e.buttons === 1 && this.isDraggingBreak) {
        const histogram = document.querySelectorAll<HTMLElement>('.editableHistogram')[0];
        const newHeight = (this.addBtnHeight[0] / histogram.offsetHeight) * 100;
        if (newHeight > 0 && newHeight < 100) {
          this.draggingBreak.style.top = newHeight + '%';
        }

        (async () => {
          const breaks = this.classificationState.manualBrew.breaks;
          const newBreak = Math.floor(
            (this.addBtnHeight[0] / histogram.offsetHeight) *
              (breaks[breaks.length - 1] - breaks[0]) +
              breaks[0]
          );
          if (newBreak > breaks[0] && newBreak < breaks[breaks.length - 1]) {
            this.draggingBreak.children[0].children[0].value = newBreak;
            if (this.nrOfDraggingBreak)
              this.classificationState.manualBrew.breaks[this.nrOfDraggingBreak] = newBreak;
            this.classificationState.manualBrew.breaks.sort(function (a, b) {
              return a - b;
            });

            this.mapService.changeBreaks(this.classificationState.manualBrew.breaks);
            if (
              (this.chartDisplayState.isBalanceChecked ||
                this.selectionState.selectedIndicator.indicatorType.includes('DYNAMIC') ||
                this.containsNegativeValues) &&
              this.chartDisplayState.isMeasureOfValueChecked
            ) {
              this.updateDynamicBreaksFromManualBreaks();
            }
          }
        })();
      }
    }
  }

  onDynamicBreakMouseMove(e, site) {
    if (
      this.nrOfDraggingBreak != 0 &&
      this.nrOfDraggingBreak !=
        this.classificationState.dynamicBrew[this.dynamicDraggingSite].breaks.length - 1
    ) {
      this.showAddBtn[site] = false;

      if (e.buttons === 1 && this.isDraggingBreak) {
        const histograms = Array.from(document.querySelectorAll<HTMLElement>('.editableHistogram'));
        histograms.reverse();
        const histogram = histograms[this.dynamicDraggingSite];

        const newHeight = (this.addBtnHeight[site] / histogram.offsetHeight) * 100;
        if (newHeight > 0 && newHeight < 100) {
          this.draggingBreak.style.top = newHeight + '%';
        }

        (async () => {
          const breaks = this.classificationState.dynamicBrew[this.dynamicDraggingSite].breaks;
          const newBreak = Math.floor(
            (this.addBtnHeight[site] / histogram.offsetHeight) *
              (breaks[breaks.length - 1] - breaks[0]) +
              breaks[0]
          );
          if (
            newBreak > breaks[0] &&
            newBreak < breaks[breaks.length - 1] &&
            !breaks.includes(newBreak)
          ) {
            this.draggingBreak.children[0].children[0].value = newBreak;
            if (this.nrOfDraggingBreak)
              this.classificationState.dynamicBrew[this.dynamicDraggingSite].breaks[
                this.nrOfDraggingBreak
              ] = newBreak;
            this.classificationState.dynamicBrew[this.dynamicDraggingSite].breaks.sort(
              function (a, b) {
                return a - b;
              }
            );
            const increaseBreaks = this.classificationState.dynamicBrew[0]
              ? this.classificationState.dynamicBrew[0].breaks
              : [];
            const decreaseBreaks = this.classificationState.dynamicBrew[1]
              ? this.classificationState.dynamicBrew[1].breaks
              : [];

            this.mapService.changeDynamicBreaks([increaseBreaks, decreaseBreaks]);
          }
        })();
      }
    }
  }
}
