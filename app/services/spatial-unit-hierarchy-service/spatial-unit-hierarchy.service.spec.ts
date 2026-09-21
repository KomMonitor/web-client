import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SpatialUnitHierarchyService } from './spatial-unit-hierarchy.service';

describe('SpatialUnitHierarchyService', () => {
  let service: SpatialUnitHierarchyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpatialUnitHierarchyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('fetchAllHierarchies resolves the API response when the endpoint is available', async () => {
    const apiHierarchies = [
      { hierarchyId: 'api-id', isPublic: true, mandantId: 'm1', name: 'API Hierarchy' },
    ];

    const promise = service.fetchAllHierarchies();
    httpMock
      .expectOne((req) => req.url.endsWith('/spatial-unit-hierarchies'))
      .flush(apiHierarchies);

    expect(await promise).toEqual(apiHierarchies);
  });

  it('fetchAllHierarchies falls back to the mocked hierarchies when the endpoint fails', async () => {
    const promise = service.fetchAllHierarchies();
    httpMock
      .expectOne((req) => req.url.endsWith('/spatial-unit-hierarchies'))
      .flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe('Sozialraum');
  });

  it('fetchHierarchyMembers resolves the API response when the endpoint is available', async () => {
    const apiMembers = {
      hierarchyId: 'api-id',
      isPublic: true,
      mandantId: 'm1',
      name: 'API Hierarchy',
      members: [],
    };

    const promise = service.fetchHierarchyMembers('api-id');
    httpMock
      .expectOne((req) => req.url.endsWith('/spatial-unit-hierarchies/api-id'))
      .flush(apiMembers);

    expect(await promise).toEqual(apiMembers);
  });

  it('falls back to the mocked members for a known hierarchyId when the endpoint fails', async () => {
    const promise = service.fetchHierarchyMembers('f09ae60b-f32a-46b2-a198-501cdab4a3e0');
    httpMock
      .expectOne((req) =>
        req.url.endsWith('/spatial-unit-hierarchies/f09ae60b-f32a-46b2-a198-501cdab4a3e0')
      )
      .flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.name).toBe('Sozialraum');
    expect(result.members).toHaveLength(4);
    expect(result.members.map((m) => m.spatialUnitLevel)).toEqual([
      'Test4',
      'Test3',
      'Test',
      'Test2',
    ]);
  });

  it('falls back to an empty member list for an unknown hierarchyId when the endpoint fails', async () => {
    const promise = service.fetchHierarchyMembers('unknown-id');
    httpMock
      .expectOne((req) => req.url.endsWith('/spatial-unit-hierarchies/unknown-id'))
      .flush('not found', { status: 404, statusText: 'Not Found' });

    const result = await promise;
    expect(result.hierarchyId).toBe('unknown-id');
    expect(result.members).toEqual([]);
  });
});
