import { TestBed } from '@angular/core/testing';
import { ReportGenerationProgressService } from './report-generation-progress.service';

describe('ReportGenerationProgressService', () => {
  let service: ReportGenerationProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportGenerationProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults to no generation in progress', () => {
    expect(service.reportGenerationInProgress).toBe(false);
    expect(service.reportStatus).toBe('preparing');
    expect(service.reportProgress).toBe(0);
    expect(service.reportCountdown).toBe(0);
    expect(service.reportingModalOpen).toBe(false);
    expect(service.abortPreparation).toBe(false);
    expect(service.reportingBackgroundState).toEqual({
      pageToProcess_add: undefined,
      pageToProcess_overview: undefined,
    });
  });

  it('holds the shared progress state', () => {
    service.reportGenerationInProgress = true;
    service.reportStatus = 'finished';
    service.reportProgress = 42;
    service.reportCountdown = 5;
    service.reportingModalOpen = true;
    service.abortPreparation = true;
    service.reportingBackgroundState.pageToProcess_add = { id: 1 };

    expect(service.reportGenerationInProgress).toBe(true);
    expect(service.reportStatus).toBe('finished');
    expect(service.reportProgress).toBe(42);
    expect(service.reportCountdown).toBe(5);
    expect(service.reportingModalOpen).toBe(true);
    expect(service.abortPreparation).toBe(true);
    expect(service.reportingBackgroundState.pageToProcess_add).toEqual({ id: 1 });
  });
});
