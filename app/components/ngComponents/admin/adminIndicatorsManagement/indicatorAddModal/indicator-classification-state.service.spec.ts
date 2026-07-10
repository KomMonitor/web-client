import { TestBed } from '@angular/core/testing';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorClassificationStateService } from './indicator-classification-state.service';

const SPATIAL_UNITS = [
  { spatialUnitId: 'su1', spatialUnitLevel: 'Level 1' },
  { spatialUnitId: 'su2', spatialUnitLevel: 'Level 2' },
];

describe('IndicatorClassificationStateService', () => {
  let service: IndicatorClassificationStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IndicatorClassificationStateService,
        { provide: EnvConfigService, useValue: { customColorSchemes: undefined } },
      ],
    });
    service = TestBed.inject(IndicatorClassificationStateService);
    service.init(SPATIAL_UNITS);
  });

  describe('numeric mapping', () => {
    beforeEach(() => {
      service.onColorSchemeSelected('Blues');
      service.onNumClassesChanged(5);
    });

    it('emits a regional-default mapping with only fully-filled spatial units', () => {
      service.spatialUnitClassification[0].breaks = [10, 20, 30, 40];
      service.onBreaksChanged(0);

      const mapping = service.buildDefaultClassificationMapping();

      expect(mapping.classificationType).toBe('QUANTITATIVE');
      expect(mapping.colorBrewerSchemeName).toBe('Blues');
      expect(mapping.classificationMethod).toBe('REGIONAL_DEFAULT');
      expect(mapping.numClasses).toBe(5);
      // su2 still has null breaks and must be omitted.
      expect(mapping.items).toEqual([{ spatialUnitId: 'su1', breaks: [10, 20, 30, 40] }]);
    });

    it('ignores class color overrides while not in individual mode (colors come from the palette)', () => {
      // Setting an override without selecting "Individuell" must not switch to INDIVIDUAL.
      service.setIndividualColor(0, '#123456');

      const mapping = service.buildDefaultClassificationMapping();

      expect(mapping.colorBrewerSchemeName).toBe('Blues');
      expect(mapping.individualColors).toBeUndefined();
    });

    it('emits INDIVIDUAL + individualColors once the "Individuell" option is selected', () => {
      service.onColorSchemeSelected('INDIVIDUAL');
      expect(service.individualColorMode()).toBe(true);
      service.setIndividualColor(0, '#123456');

      const mapping = service.buildDefaultClassificationMapping();

      expect(mapping.colorBrewerSchemeName).toBe('INDIVIDUAL');
      expect(mapping.individualColors?.length).toBe(5);
      expect(mapping.individualColors?.[0]).toBe('#123456');
    });

    it('leaves individual mode when a real palette is picked again', () => {
      service.onColorSchemeSelected('INDIVIDUAL');
      service.onColorSchemeSelected('Greens');

      expect(service.individualColorMode()).toBe(false);
      expect(service.buildDefaultClassificationMapping().colorBrewerSchemeName).toBe('Greens');
    });

    it('includes labels only when at least one is set', () => {
      expect(service.buildDefaultClassificationMapping().labels).toBeUndefined();

      service.numLabels[1] = 'Medium';
      expect(service.buildDefaultClassificationMapping().labels?.[1]).toBe('Medium');
    });

    it('omits items for computed methods (breaks are derived from data)', () => {
      service.onClassificationMethodSelected({ id: 'jenks' });

      const mapping = service.buildDefaultClassificationMapping();

      expect(mapping.classificationMethod).toBe('JENKS');
      expect(mapping.items).toBeUndefined();
    });
  });

  describe('categorical mapping', () => {
    beforeEach(() => {
      service.setType('QUALITATIVE');
    });

    it('emits categoricalData for every category', () => {
      service.onCatNumClassesChanged(3);
      service.categories[0].value = 'A';
      service.categories[0].label = 'Alpha';

      const mapping = service.buildDefaultClassificationMapping();

      expect(mapping.classificationType).toBe('QUALITATIVE');
      expect(mapping.numClasses).toBe(3);
      expect(mapping.categoricalData?.length).toBe(3);
      expect(mapping.categoricalData?.[0].categoricalValue).toBe('A');
      expect(mapping.categoricalData?.[0].label).toBe('Alpha');
      expect(mapping.categoricalData?.[0].color).toBeTruthy();
    });

    it('flags overflow categories and colors them with the default color', () => {
      // Accent has 8 colors; a 9th category overflows.
      const paletteSize = service.categoricalPaletteSize;
      service.onCatNumClassesChanged(paletteSize + 1);

      expect(service.hasCategoryOverflow).toBe(true);
      const overflow = service.categoryColor(paletteSize);
      expect(overflow.overflow).toBe(true);
      expect(overflow.color).toBe(service.defaultColor);
    });
  });

  describe('applyMapping', () => {
    it('restores numeric state from a stored mapping (round-trip)', () => {
      service.onColorSchemeSelected('Greens');
      service.onNumClassesChanged(4);
      service.spatialUnitClassification[0].breaks = [1, 2, 3];
      service.onBreaksChanged(0);
      service.numLabels[0] = 'Low';
      const built = service.buildDefaultClassificationMapping();

      service.reset();
      service.applyMapping(built);

      expect(service.classificationType).toBe('QUANTITATIVE');
      expect(service.classificationMethod()).toBe('regional_default');
      expect(service.numClassesPerSpatialUnit).toBe(4);
      expect(service.selectedColorBrewerPaletteEntry.paletteName).toBe('Greens');
      expect(service.spatialUnitClassification[0].breaks).toEqual([1, 2, 3]);
      expect(service.numLabels[0]).toBe('Low');
    });

    it('restores categorical state from a stored mapping', () => {
      service.setType('QUALITATIVE');
      service.onColorSchemeSelected('Set1');
      service.onCatNumClassesChanged(2);
      service.categories[0].value = 'X';
      service.categories[0].label = 'Ex';
      const built = service.buildDefaultClassificationMapping();

      service.reset();
      service.applyMapping(built);

      expect(service.classificationType).toBe('QUALITATIVE');
      expect(service.categories.length).toBe(2);
      expect(service.categories[0].value).toBe('X');
      expect(service.categories[0].label).toBe('Ex');
    });
  });
});
