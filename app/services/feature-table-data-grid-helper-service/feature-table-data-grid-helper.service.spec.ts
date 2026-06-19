import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FeatureTableDataGridHelperService } from './feature-table-data-grid-helper.service';

describe('FeatureTableDataGridHelperService', () => {
  let service: FeatureTableDataGridHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeatureTableDataGridHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSelectedFeatures returns an empty array when no grid exists', () => {
    expect(service.getSelectedFeatures()).toEqual([]);
  });

  it('getFeatureTableGridOptions is null before a grid is built', () => {
    expect(service.getFeatureTableGridOptions()).toBeNull();
  });

  it('buildDataGrid_featureTable_spatialResource (no DOM container) returns grid options with the delete renderer and base columns', () => {
    const options: any = service.buildDataGrid_featureTable_spatialResource(
      'a-table-id-that-does-not-exist',
      ['extraHeader'],
      [],
      'dataset-1',
      service.resourceType_spatialUnit,
      true
    );

    expect(options).toBeTruthy();
    expect(options.components.deleteButtonRenderer).toBeDefined();
    // base columns (DB-Record-Id, Feature-Id, Name, validStartDate, validEndDate) + the dynamic header
    const fields = options.columnDefs.map((c: any) => c.field);
    expect(fields).toContain('kommonitorRecordId');
    expect(fields).toContain('extraHeader');
  });
});
