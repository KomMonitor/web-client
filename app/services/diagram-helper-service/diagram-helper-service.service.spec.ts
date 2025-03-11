import { TestBed } from '@angular/core/testing';

import { DiagramHelperServiceService } from './diagram-helper-service.service';

describe('DiagramHelperServiceService', () => {
  let service: DiagramHelperServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagramHelperServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
