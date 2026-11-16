import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import type { MapLayerOwner } from 'services/map-layer-registry-service/map-layer.model';
import { MapService } from 'services/map-service/map.service';

import { KommonitorDataImportComponent } from './kommonitor-data-import.component';

describe('KommonitorDataImportComponent', () => {
  let component: KommonitorDataImportComponent;
  let fixture: ComponentFixture<KommonitorDataImportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorDataImportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorDataImportComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lets the layer panel remove a file layer by unticking the file, which stays listed', () => {
    const mapService = TestBed.inject(MapService);
    const add = jest.spyOn(mapService, 'addFileLayerToMap').mockImplementation(() => undefined);
    const remove = jest
      .spyOn(mapService, 'removeFileLayerFromMap')
      .mockImplementation(() => undefined);
    const dataset: any = { datasetName: 'Schulen', isSelected: true, transparency: 0.25 };

    component.toggleDataLayer(dataset);
    expect(add).toHaveBeenCalledWith(dataset, 0.75, expect.anything());
    const owner: MapLayerOwner = add.mock.calls[0][2]!;
    // the success of the map lists a copy of the dataset, not the dataset itself
    component.FileLayerSuccess(dataset);
    const listed = component.fileDatasets.find((file) => file.datasetName === 'Schulen')!;
    expect(listed).not.toBe(dataset);

    owner.remove!('file:Schulen');

    expect(listed.isSelected).toBe(false);
    expect(remove).toHaveBeenCalledWith(listed);
    expect(component.fileDatasets).toContain(listed);
  });
});
