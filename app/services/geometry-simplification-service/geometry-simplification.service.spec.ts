import { TestBed } from '@angular/core/testing';
import { GeometrySimplificationService } from './geometry-simplification.service';

describe('GeometrySimplificationService', () => {
  let service: GeometrySimplificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeometrySimplificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('holds the geometry-simplification request config', () => {
    service.simplifyGeometriesParameterName = 'simplifyGeometries';
    service.simplifyGeometries = 'medium';
    expect(service.simplifyGeometriesParameterName).toBe('simplifyGeometries');
    expect(service.simplifyGeometries).toBe('medium');
  });
});
