import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoricalClassificationItem } from 'components/ngComponents/models/classification.models';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { VisualStyleHelperServiceNew } from './visual-style-helper.service';

describe('VisualStyleHelperServiceNew', () => {
  let service: VisualStyleHelperServiceNew;
  let state: ClassificationStateService;

  const PROP = 'DATE_2024-01-01';
  const CATEGORIES: CategoricalClassificationItem[] = [
    { categoricalValue: 'A', color: '#ff0000', label: 'Kat A' },
    { categoricalValue: 'B', color: '#00ff00', label: 'Kat B' },
  ];

  const feature = (value: unknown) => ({ properties: { [PROP]: value } });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VisualStyleHelperServiceNew);
    state = TestBed.inject(ClassificationStateService);
    state.resetFeatureCounters();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('styleCategorical', () => {
    it('colors a feature with its matching category color and counts it', () => {
      const style = service.styleCategorical(feature('B'), CATEGORIES, PROP, false, true);

      expect(style.fillColor).toBe('#00ff00');
      expect(state.featuresPerColorMap.get('#00ff00')).toBe(1);
    });

    it('falls back to the shared "other" color for unmatched values', () => {
      const style = service.styleCategorical(feature('Z'), CATEGORIES, PROP, false, true);

      // '#c9ced4' is CATEGORICAL_OTHER_COLOR
      expect(style.fillColor).toBe('#c9ced4');
      expect(state.featuresPerColorMap.get('#c9ced4')).toBe(1);
    });

    it('routes NoData values to the NoData style/counter, not a category', () => {
      const style = service.styleCategorical(feature(null), CATEGORIES, PROP, false, true);

      expect(style).toBe(service.noDataStyle);
      expect(state.featuresPerNoData).toBe(1);
      expect(state.featuresPerColorMap.size).toBe(0);
    });

    it('does not increment counters when incrementFeatures is false', () => {
      service.styleCategorical(feature('A'), CATEGORIES, PROP, false, false);

      expect(state.featuresPerColorMap.size).toBe(0);
    });
  });
});
