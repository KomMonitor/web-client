import { Injectable } from '@angular/core';

// Report-generation progress state shared across the reporting feature - moved out of
// ReportingService (which had no internal coupling to any of these members at all; every read/
// write happens in indicator-add/reporting-overview's preparation loops, the global progress
// banner, the background processor, and the reporting modal).
@Injectable({
  providedIn: 'root',
})
export class ReportGenerationProgressService {
  reportingBackgroundState: {
    pageToProcess_add: any;
    pageToProcess_overview: any;
  } = {
    pageToProcess_add: undefined,
    pageToProcess_overview: undefined,
  };

  // drives the global "report is being prepared in the background" banner, shown
  // outside the reporting modal too so the user can keep using the app while it runs
  reportGenerationInProgress = false;
  reportStatus: 'preparing' | 'finished' = 'preparing';
  reportProgress = 0;
  reportCountdown = 0;
  reportingModalOpen = false;
  // lives here rather than on the generating component: that component (indicator-add /
  // reporting-overview) can be destroyed and recreated while its preparation loop keeps
  // running in the background (closing/reopening the reporting modal), so an abort request
  // from a freshly-created component instance or the global banner needs a flag the
  // still-running loop actually reads, independent of which component instance is live.
  abortPreparation = false;
}
