import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KommonitorLegendComponent } from './kommonitor-legend.component';

describe('KommonitorLegendComponent', () => {
  let component: KommonitorLegendComponent;
  let fixture: ComponentFixture<KommonitorLegendComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorLegendComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorLegendComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * The classification getters read `selectedIndicator`, which the selection state
   * carries untyped, so a plain assignment is all the setup they need.
   */
  describe('classification getters', () => {
    const select = (defaultClassificationMapping: unknown) => {
      component['selectionState'].selectedIndicator = { defaultClassificationMapping };
    };

    it('has no labels without an indicator, without a mapping or without labels', () => {
      expect(component['classificationLabels']).toEqual([]);

      select(undefined);
      expect(component['classificationLabels']).toEqual([]);

      select({ classificationType: 'QUANTITATIVE' });
      expect(component['classificationLabels']).toEqual([]);
    });

    it('reports labels only when at least one is non-empty', () => {
      select({ classificationType: 'QUANTITATIVE', labels: ['', ''] });
      expect(component['classificationLabels']).toEqual(['', '']);
      expect(component['hasClassificationLabels']).toBe(false);

      select({ classificationType: 'QUANTITATIVE', labels: ['', 'Medium'] });
      expect(component['hasClassificationLabels']).toBe(true);
    });

    it('detects a qualitative classification by its discriminator', () => {
      select({ classificationType: 'QUALITATIVE', categoricalData: [] });
      expect(component['isQualitativeClassification']).toBe(true);

      select({ classificationType: 'QUANTITATIVE' });
      expect(component['isQualitativeClassification']).toBe(false);
    });

    it('does NOT treat a mapping with categories but no discriminator as qualitative', () => {
      // Deliberate divergence from `isQualitativeMapping()`, which the map and the
      // reporting pipeline use: widening this would change what the legend renders
      // for legacy datasets. Frozen here so the difference stays a decision.
      select({ categoricalData: [{ categoricalValue: 'X', color: '#123456' }] });

      expect(component['isQualitativeClassification']).toBe(false);
      expect(component['categoricalClassification']).toEqual([]);
    });

    it('exposes the categories of a qualitative classification and nothing otherwise', () => {
      const categoricalData = [{ categoricalValue: 'X', color: '#123456', label: 'Ex' }];
      select({ classificationType: 'QUALITATIVE', categoricalData });
      expect(component['categoricalClassification']).toEqual(categoricalData);

      select({ classificationType: 'QUANTITATIVE', numClasses: 5 });
      expect(component['categoricalClassification']).toEqual([]);
    });

    it('shows the labels column only while method and class count match the current state', () => {
      component['chartDisplayState'].isMeasureOfValueChecked = false;
      component['chartDisplayState'].isBalanceChecked = false;
      component['classificationState'].classifyMethod = 'equal_interval';
      component['classificationState'].numClasses = 5;

      select({
        classificationType: 'QUANTITATIVE',
        classificationMethod: 'EQUAL_INTERVAL',
        numClasses: 5,
        labels: ['Low'],
      });
      expect(component['showLabelsColumn']).toBe(true);

      select({
        classificationType: 'QUANTITATIVE',
        classificationMethod: 'JENKS',
        numClasses: 5,
        labels: ['Low'],
      });
      expect(component['showLabelsColumn']).toBe(false);

      select({
        classificationType: 'QUANTITATIVE',
        classificationMethod: 'EQUAL_INTERVAL',
        numClasses: 7,
        labels: ['Low'],
      });
      expect(component['showLabelsColumn']).toBe(false);
    });
  });
});
