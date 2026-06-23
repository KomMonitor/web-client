import { TestBed } from '@angular/core/testing';

import { GeoresourceMetadataStoreService } from './georesource-metadata-store.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';

describe('GeoresourceMetadataStoreService', () => {
  let service: GeoresourceMetadataStoreService;

  beforeEach(() => {
    (window as any).__env = (window as any).__env || {};
    (window as any).__env.wfsDatasets = (window as any).__env.wfsDatasets || [];
    (window as any).__env.arrayOfNameSubstringsForHidingGeoresources =
      (window as any).__env.arrayOfNameSubstringsForHidingGeoresources || [];

    TestBed.configureTestingModule({
      providers: [
        { provide: TopicHierarchyService, useValue: {} },
        {
          provide: TopicHierarchyStoreService,
          useValue: { buildTopicGeoresourceHierarchy: () => undefined },
        },
      ],
    });
    service = TestBed.inject(GeoresourceMetadataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setServices populates the wms dataset fields', () => {
    const services: any[] = [{ id: 'w1', serviceResource: 'GEORESOURCE' }];
    service.setServices(services);
    expect(service.availableWmsDatasets).toBe(services);
    expect(service.wmsDatasets).toBe(services);
  });

  it('add/replace/delete + getGeoresourceMetadataById manage the collection', () => {
    service.addSingleGeoresourceMetadata({ georesourceId: 'g1', title: 'A' });
    expect(service.getGeoresourceMetadataById('g1')).toBeDefined();
    service.replaceSingleGeoresourceMetadata({ georesourceId: 'g1', title: 'B' });
    expect(service.getGeoresourceMetadataById('g1').title).toBe('B');
    service.deleteSingleGeoresourceMetadata('g1');
    expect(service.getGeoresourceMetadataById('g1')).toBeUndefined();
  });

  it('filterGeoresourcesByTypes honors the POI/LOI/AOI flags', () => {
    const data: any[] = [{ isPOI: true }, { isLOI: true }, { isAOI: true }];
    expect(service.filterGeoresourcesByTypes(data, true, false, false)).toEqual([{ isPOI: true }]);
    expect(service.filterGeoresourcesByTypes(data, false, false, false)).toEqual([]);
  });
});
