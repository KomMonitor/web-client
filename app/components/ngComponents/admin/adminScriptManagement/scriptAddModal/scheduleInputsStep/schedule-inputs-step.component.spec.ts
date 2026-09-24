import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ScheduleInputsStepComponent } from './schedule-inputs-step.component';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ScheduleDraftService } from 'services/schedule-draft-service/schedule-draft.service';

describe('ScheduleInputsStepComponent (comp_filter)', () => {
  let fixture: ComponentFixture<ScheduleInputsStepComponent>;
  let component: any;
  let processInputs: ReturnType<typeof signal<Record<string, unknown>>>;
  let ensureGeoresourceFeaturesLoaded: jest.Mock;

  /** A flat `{ property: typeName }` map — what the schema endpoint answers. */
  const SCHEMA = {
    Stadtteil: 'String',
    Platzzahl: 'Integer',
    Stichtag: 'Date',
  };

  const FEATURES = [
    { Stadtteil: 'Süd', Platzzahl: 30 },
    { Stadtteil: 'Nord', Platzzahl: 5 },
    { Stadtteil: 'Süd', Platzzahl: 100 },
    { Stadtteil: '', Platzzahl: null },
  ];

  const filterObject = () => processInputs()['comp_filter'] as Record<string, string>;

  const build = () => {
    fixture = TestBed.createComponent(ScheduleInputsStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    processInputs = signal<Record<string, unknown>>({ georesource_id: 'geo-1' });
    ensureGeoresourceFeaturesLoaded = jest.fn().mockResolvedValue(undefined);

    const draft = {
      selectedProcess: signal({ id: 'KmGeoresourceCountPointsWithinPolygon' }),
      inputBoxes: signal([
        { box: { id: 'comp_filter', title: 'Filter', contents: ['comp_filter'] }, inputs: [] },
      ]),
      georesourceSchema: signal(SCHEMA),
      georesourceFeatures: signal(FEATURES),
      loadingFilterValues: signal(false),
      applicableDates: signal([]),
      getInput: (key: string) => processInputs()[key],
      setInput: (key: string, value: unknown) =>
        processInputs.update((inputs) => ({ ...inputs, [key]: value })),
      ensureGeoresourceFeaturesLoaded,
    };

    TestBed.configureTestingModule({
      imports: [ScheduleInputsStepComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ScheduleDraftService, useValue: draft },
        { provide: IndicatorMetadataStoreService, useValue: { availableIndicators: [] } },
        { provide: GeoresourceMetadataStoreService, useValue: { availableGeoresources: [] } },
      ],
    });
  });

  describe('the property list', () => {
    it('leaves out date properties, which no operator compares', () => {
      build();
      expect(component.filterProperties()).toEqual(['Stadtteil', 'Platzzahl']);
    });
  });

  describe('the operator list', () => {
    it('offers equality and Contains for text properties', () => {
      build();
      component.setFilterProperty('Stadtteil');
      expect(component.filterOperators().map((operator: any) => operator.apiName)).toEqual([
        'Equal',
        'Unequal',
        'Contains',
      ]);
    });

    it('offers the ordering operators and Range for everything else', () => {
      build();
      component.setFilterProperty('Platzzahl');
      const operators = component.filterOperators().map((operator: any) => operator.apiName);
      expect(operators).toContain('Range');
      expect(operators).toContain('Greater_than_or_equal');
      expect(operators).not.toContain('Contains');
    });

    it('stays empty until a property is chosen', () => {
      build();
      expect(component.filterOperators()).toEqual([]);
    });
  });

  describe('the value list', () => {
    it('offers the values that occur, de-duplicated and sorted as text', () => {
      build();
      component.setFilterProperty('Stadtteil');
      expect(component.filterValueOptions()).toEqual(['Nord', 'Süd']);
    });

    it('sorts numeric properties by value, not lexicographically', () => {
      build();
      component.setFilterProperty('Platzzahl');
      expect(component.filterValueOptions()).toEqual(['5', '30', '100']);
    });

    it('fetches the feature table when a property is picked', () => {
      build();
      component.setFilterProperty('Stadtteil');
      expect(ensureGeoresourceFeaturesLoaded).toHaveBeenCalled();
    });

    it('fetches it again when the step is re-entered with a property set', () => {
      processInputs.set({
        georesource_id: 'geo-1',
        comp_filter: { compFilterProp: 'Stadtteil', compFilterOperator: '', compFilterPropVal: '' },
      });
      build();
      expect(ensureGeoresourceFeaturesLoaded).toHaveBeenCalled();
    });
  });

  describe('writing the filter', () => {
    it('drops operator and value when the property changes', () => {
      build();
      component.setFilterProperty('Stadtteil');
      component.setFilterOperator('Equal');
      component.setFilterValue('Süd');

      component.setFilterProperty('Platzzahl');

      expect(filterObject()).toEqual({
        compFilterProp: 'Platzzahl',
        compFilterOperator: '',
        compFilterPropVal: '',
      });
    });

    it('drops the value when the operator changes, since its shape differs', () => {
      build();
      component.setFilterProperty('Stadtteil');
      component.setFilterOperator('Equal');
      component.setFilterValue('Süd');

      component.setFilterOperator('Contains');

      expect(filterObject().compFilterPropVal).toBe('');
    });

    it('never adds a key beyond the three the process declares', () => {
      build();
      component.setFilterProperty('Platzzahl');
      component.setFilterOperator('Range');
      component.setRangeBound('from', '5');
      component.setRangeBound('to', '100');

      expect(Object.keys(filterObject()).sort()).toEqual([
        'compFilterOperator',
        'compFilterProp',
        'compFilterPropVal',
      ]);
    });
  });

  describe('Range', () => {
    it('joins both bounds into the single declared field', () => {
      build();
      component.setFilterProperty('Platzzahl');
      component.setFilterOperator('Range');
      component.setRangeBound('from', '5');
      component.setRangeBound('to', '100');

      expect(filterObject().compFilterPropVal).toBe('5-100');
      expect(component.rangeBounds()).toEqual({ from: '5', to: '100' });
    });

    it('keeps a negative lower bound intact', () => {
      build();
      component.setFilterProperty('Platzzahl');
      component.setFilterOperator('Range');
      component.setRangeBound('from', '-5');
      component.setRangeBound('to', '100');

      expect(component.rangeBounds()).toEqual({ from: '-5', to: '100' });
    });

    it('writes nothing while both bounds are empty', () => {
      build();
      component.setFilterProperty('Platzzahl');
      component.setFilterOperator('Range');
      component.setRangeBound('from', '');

      expect(filterObject().compFilterPropVal).toBe('');
    });

    it('offers only upper bounds above the lower one', () => {
      build();
      component.setFilterProperty('Platzzahl');
      component.setFilterOperator('Range');
      component.setRangeBound('from', '5');

      expect(component.rangeToOptions()).toEqual(['30', '100']);
    });
  });

  describe('Contains', () => {
    it('stores the selection as a comma-separated list', () => {
      build();
      component.setFilterProperty('Stadtteil');
      component.setFilterOperator('Contains');
      component.onContainsSelect([{ id: 'Nord' }, { id: 'Süd' }]);

      expect(filterObject().compFilterPropVal).toBe('Nord,Süd');
    });

    it('reads that list back into the selection', () => {
      build();
      component.setFilterProperty('Stadtteil');
      component.setFilterOperator('Contains');
      component.setFilterValue('Nord, Süd');

      expect(component.containsSelection()).toEqual(['Nord', 'Süd']);
      expect(component.containsData().selectedItems).toEqual([
        { id: 'Nord', name: 'Nord' },
        { id: 'Süd', name: 'Süd' },
      ]);
    });

    it('offers every occurring value for selection', () => {
      build();
      component.setFilterProperty('Stadtteil');
      component.setFilterOperator('Contains');

      expect(component.containsData().items).toEqual([
        { id: 'Nord', name: 'Nord' },
        { id: 'Süd', name: 'Süd' },
      ]);
    });
  });
});
