import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import {
  DeletedFeatureRef,
  FeatureTableDataGridHelperService,
  FeatureTableEditStatus,
} from './feature-table-data-grid-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/** Minimal EnvConfigService stub with the property names the grid columns use. */
const envConfigStub = {
  baseUrlToKomMonitorDataAPI: 'https://api.example.org',
  FEATURE_ID_PROPERTY_NAME: 'ID',
  FEATURE_NAME_PROPERTY_NAME: 'NAME',
  VALID_START_DATE_PROPERTY_NAME: 'validStartDate',
  VALID_END_DATE_PROPERTY_NAME: 'validEndDate',
  indicatorDatePrefix: 'DATE_',
};

/** Fake a click on the delete button inside a record-id cell. */
function clickDeleteButton(colDef: any, rowData: any): void {
  const button = document.createElement('button');
  button.className = 'featureTableDeleteRecordBtn';
  colDef.onCellClicked({ data: rowData, event: { target: button } });
}

describe('FeatureTableDataGridHelperService', () => {
  let service: FeatureTableDataGridHelperService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnvConfigService, useValue: envConfigStub },
      ],
    });
    service = TestBed.inject(FeatureTableDataGridHelperService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('statelessness', () => {
    it('keeps two grids independent: each keeps its own resource id and callbacks', () => {
      const firstDeletes: DeletedFeatureRef[] = [];
      const secondDeletes: DeletedFeatureRef[] = [];

      const first = service.buildSpatialResourceFeatureTable(
        {
          headers: [],
          features: [],
          resourceId: 'dataset-1',
          resourceType: 'spatialUnit',
          enableDelete: true,
        },
        { onDeleteSuccess: (d) => firstDeletes.push(d) }
      );
      // Building a second table must not retarget the first one
      const second = service.buildSpatialResourceFeatureTable(
        {
          headers: [],
          features: [],
          resourceId: 'dataset-2',
          resourceType: 'georesource',
          enableDelete: true,
        },
        { onDeleteSuccess: (d) => secondDeletes.push(d) }
      );

      const row = { ID: 'feature-9', kommonitorRecordId: 'record-9' };
      clickDeleteButton((first.columnDefs as any[])[0], row);
      clickDeleteButton((second.columnDefs as any[])[0], row);

      httpMock
        .expectOne(
          'https://api.example.org/spatial-units/dataset-1/singleFeature/feature-9/singleFeatureRecord/record-9'
        )
        .flush({});
      httpMock
        .expectOne(
          'https://api.example.org/georesources/dataset-2/singleFeature/feature-9/singleFeatureRecord/record-9'
        )
        .flush({});

      expect(firstDeletes).toEqual([
        { datasetId: 'dataset-1', featureId: 'feature-9', recordId: 'record-9' },
      ]);
      expect(secondDeletes).toEqual([
        { datasetId: 'dataset-2', featureId: 'feature-9', recordId: 'record-9' },
      ]);
    });

    it('rebuilds column defs for changed headers instead of returning a cached grid', () => {
      const first = service.buildSpatialResourceFeatureTable({
        headers: ['firstHeader'],
        features: [],
        resourceType: 'spatialUnit',
      });
      const second = service.buildSpatialResourceFeatureTable({
        headers: ['secondHeader'],
        features: [],
        resourceType: 'spatialUnit',
      });

      expect((first.columnDefs as any[]).map((c) => c.field)).toContain('firstHeader');
      expect((second.columnDefs as any[]).map((c) => c.field)).toContain('secondHeader');
      expect((second.columnDefs as any[]).map((c) => c.field)).not.toContain('firstHeader');
    });
  });

  describe('buildSpatialResourceFeatureTable', () => {
    it('builds the fixed columns plus one column per dynamic header', () => {
      const options = service.buildSpatialResourceFeatureTable({
        headers: ['extraHeader'],
        features: [],
        resourceType: 'spatialUnit',
      });

      const fields = (options.columnDefs as any[]).map((c) => c.field);
      expect(fields).toEqual([
        'kommonitorRecordId',
        'ID',
        'NAME',
        'validStartDate',
        'validEndDate',
        'extraHeader',
      ]);
    });

    it('flattens GeoJSON features and carries geometry plus record id into the row', () => {
      const options = service.buildSpatialResourceFeatureTable({
        headers: [],
        features: [
          { id: 'record-1', geometry: { type: 'Point' }, properties: { ID: 'feature-1' } },
        ],
        resourceType: 'spatialUnit',
      });

      expect(options.rowData).toEqual([
        { ID: 'feature-1', kommonitorGeometry: { type: 'Point' }, kommonitorRecordId: 'record-1' },
      ]);
    });

    it('renders the delete button only when deleting is enabled', () => {
      const withDelete: any = service.buildSpatialResourceFeatureTable({
        headers: [],
        features: [],
        resourceType: 'spatialUnit',
        enableDelete: true,
      });
      const withoutDelete: any = service.buildSpatialResourceFeatureTable({
        headers: [],
        features: [],
        resourceType: 'spatialUnit',
        enableDelete: false,
      });

      const params = { data: { kommonitorRecordId: 'record-3' } };
      expect(withDelete.columnDefs[0].cellRenderer(params)).toContain(
        'featureTableDeleteRecordBtn'
      );
      expect(withoutDelete.columnDefs[0].cellRenderer(params)).toBe('record-3');
    });

    it('ignores clicks that did not hit the delete button', () => {
      const options: any = service.buildSpatialResourceFeatureTable(
        {
          headers: [],
          features: [],
          resourceId: 'dataset-1',
          resourceType: 'spatialUnit',
          enableDelete: true,
        },
        {}
      );

      const cell = document.createElement('div');
      options.columnDefs[0].onCellClicked({
        data: { ID: 'feature-1', kommonitorRecordId: 'record-1' },
        event: { target: cell },
      });

      // no HTTP request at all — httpMock.verify() in afterEach asserts this
      expect(true).toBe(true);
    });

    it('reports a failed delete through onDeleteError, not onDeleteSuccess', () => {
      const onDeleteError = jest.fn();
      const onDeleteSuccess = jest.fn();
      const options: any = service.buildSpatialResourceFeatureTable(
        {
          headers: [],
          features: [],
          resourceId: 'dataset-1',
          resourceType: 'spatialUnit',
          enableDelete: true,
        },
        { onDeleteError, onDeleteSuccess }
      );

      clickDeleteButton(options.columnDefs[0], { ID: 'feature-1', kommonitorRecordId: 'record-1' });
      httpMock
        .expectOne(
          'https://api.example.org/spatial-units/dataset-1/singleFeature/feature-1/singleFeatureRecord/record-1'
        )
        .flush('nope', { status: 500, statusText: 'Server Error' });

      expect(onDeleteError).toHaveBeenCalled();
      expect(onDeleteSuccess).not.toHaveBeenCalled();
    });
  });

  describe('buildIndicatorFeatureTable', () => {
    it('marks the identifying and validity columns read-only and the value columns editable', () => {
      const options: any = service.buildIndicatorFeatureTable({
        headers: ['DATE_2020-01-01'],
        features: [],
      });

      const byField = new Map(options.columnDefs.map((c: any) => [c.field, c]));
      expect((byField.get('fid') as any).editable).toBe(false);
      expect((byField.get('NAME') as any).editable).toBe(false);
      expect((byField.get('validStartDate') as any).editable).toBe(false);
      // value columns inherit defaultColDef.editable === true
      expect((byField.get('DATE_2020-01-01') as any).editable).toBeUndefined();
      expect(options.defaultColDef.editable).toBe(true);
    });

    it('deletes an indicator timeseries record via the indicator URL', () => {
      const onDeleteSuccess = jest.fn();
      const options: any = service.buildIndicatorFeatureTable(
        {
          headers: [],
          features: [],
          resourceId: 'indicator-1',
          spatialUnitId: 'su-1',
          enableDelete: true,
        },
        { onDeleteSuccess }
      );

      clickDeleteButton(options.columnDefs[0], { ID: 'feature-2', fid: 'record-2' });
      httpMock
        .expectOne(
          'https://api.example.org/indicators/indicator-1/su-1/singleFeature/feature-2/singleFeatureRecord/record-2'
        )
        .flush({});

      expect(onDeleteSuccess).toHaveBeenCalledWith({
        datasetId: 'indicator-1',
        spatialUnitId: 'su-1',
        featureId: 'feature-2',
        recordId: 'record-2',
      });
    });

    it('drops arisenFrom from the row data', () => {
      const options = service.buildIndicatorFeatureTable({
        headers: [],
        features: [{ fid: 'record-1', arisenFrom: 'somewhere' }],
      });

      expect(options.rowData).toEqual([{ fid: 'record-1' }]);
    });
  });

  describe('measureHeaderHeight', () => {
    it('falls back to the minimum height without a grid root', () => {
      expect(service.measureHeaderHeight(null)).toBe(50);
    });

    it('measures only header cells inside the given grid root', () => {
      const ownGrid = document.createElement('div');
      const ownHeader = document.createElement('div');
      ownHeader.className = 'ag-header-cell-text';
      Object.defineProperty(ownHeader, 'scrollHeight', { value: 40 });
      ownGrid.appendChild(ownHeader);

      // A second grid with taller headers must not influence the measurement
      const otherGrid = document.createElement('div');
      const otherHeader = document.createElement('div');
      otherHeader.className = 'ag-header-cell-text';
      Object.defineProperty(otherHeader, 'scrollHeight', { value: 200 });
      otherGrid.appendChild(otherHeader);
      document.body.append(ownGrid, otherGrid);

      expect(service.measureHeaderHeight(ownGrid)).toBe(60);

      ownGrid.remove();
      otherGrid.remove();
    });
  });
});

describe('FeatureTableEditStatus', () => {
  it('records success and failure separately', () => {
    const status = new FeatureTableEditStatus();
    expect(status.lastSuccess()).toBeUndefined();
    expect(status.lastFailure()).toBeUndefined();

    status.record(true);
    expect(status.lastSuccess()).toBeInstanceOf(Date);
    expect(status.lastFailure()).toBeUndefined();

    status.record(false);
    expect(status.lastFailure()).toBeInstanceOf(Date);
  });

  it('reset clears both banners', () => {
    const status = new FeatureTableEditStatus();
    status.record(true);
    status.record(false);

    status.reset();

    expect(status.lastSuccess()).toBeUndefined();
    expect(status.lastFailure()).toBeUndefined();
  });
});
