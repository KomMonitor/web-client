import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from 'services/auth-service/auth.service';

import { SpatialUnitHierarchyService } from './spatial-unit-hierarchy.service';

describe('SpatialUnitHierarchyService', () => {
  let service: SpatialUnitHierarchyService;
  let httpMock: HttpTestingController;
  let isAuthenticated: jest.Mock;

  beforeEach(() => {
    isAuthenticated = jest.fn().mockReturnValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated } },
      ],
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

  it('fetchAllHierarchies hits the public endpoint when the user is not logged in', async () => {
    isAuthenticated.mockReturnValue(false);

    const promise = service.fetchAllHierarchies();
    httpMock.expectOne((req) => req.url.endsWith('/public/spatial-unit-hierarchies')).flush([]);

    expect(await promise).toEqual([]);
  });

  it('fetchAllHierarchies resolves to an empty list when the endpoint fails', async () => {
    const promise = service.fetchAllHierarchies();
    httpMock
      .expectOne((req) => req.url.endsWith('/spatial-unit-hierarchies'))
      .flush('not found', { status: 404, statusText: 'Not Found' });

    expect(await promise).toEqual([]);
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

  it('fetchHierarchyMembers hits the public endpoint when the user is not logged in', async () => {
    isAuthenticated.mockReturnValue(false);

    const promise = service.fetchHierarchyMembers('api-id');
    httpMock
      .expectOne((req) => req.url.endsWith('/public/spatial-unit-hierarchies/api-id'))
      .flush({ hierarchyId: 'api-id', isPublic: true, mandantId: 'm1', name: 'n', members: [] });

    expect((await promise)?.hierarchyId).toBe('api-id');
  });

  it('fetchHierarchyMembers resolves to undefined when the endpoint fails', async () => {
    const promise = service.fetchHierarchyMembers('unknown-id');
    httpMock
      .expectOne((req) => req.url.endsWith('/spatial-unit-hierarchies/unknown-id'))
      .flush('not found', { status: 404, statusText: 'Not Found' });

    expect(await promise).toBeUndefined();
  });
});
