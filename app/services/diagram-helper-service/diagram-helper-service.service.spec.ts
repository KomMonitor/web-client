import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { DiagramHelperServiceService } from './diagram-helper-service.service';

// TODO(prio6): ECharts init requires HTMLCanvasElement.getContext (canvas pkg) not available in jsdom
describe.skip('DiagramHelperServiceService', () => {
  let service: DiagramHelperServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiagramHelperServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
