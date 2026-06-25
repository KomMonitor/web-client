import { TestBed } from '@angular/core/testing';
import { ExportButtonVisibilityService } from './export-button-visibility.service';

describe('ExportButtonVisibilityService', () => {
  let service: ExportButtonVisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportButtonVisibilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults both export-button flags to true', () => {
    expect(service.showDiagramExportButtons).toBe(true);
    expect(service.showGeoresourceExportButtons).toBe(true);
  });
});
