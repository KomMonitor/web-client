// jsdom has no URL.createObjectURL, so the real helper would throw; mocking it
// is also the only seam for asserting what the button hands over.
jest.mock('util/json-file.util', () => ({ downloadJson: jest.fn() }));

import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { JobSummaryCellRendererComponent } from './job-summary-cell-renderer.component';
import { JobSummaryEntry } from 'components/ngComponents/models/jobs.models';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { downloadJson } from 'util/json-file.util';

/**
 * The renderer reads its summary from `JobOverviewService` rather than from the
 * row, because summaries arrive after the table is already on screen. These
 * tests pin down the consequence of that: the cell has to fill itself when the
 * summary lands. If it did not, the dialog would have to rebuild the grid —
 * and a rebuilt grid loses the user's filter and sort (I12).
 */
describe('JobSummaryCellRendererComponent', () => {
  let fixture: ComponentFixture<JobSummaryCellRendererComponent>;
  let summaries: ReturnType<typeof signal<Map<string, JobSummaryEntry[]>>>;

  const TEXTS = {
    ADMIN_SCRIPTS: {
      JOB_SUMMARY: {
        SPATIAL_UNIT: 'Raumeinheit',
        INTEGRATED_FEATURES: 'Integrierte Features',
        INTEGRATED_TARGET_DATES: 'Integrierte Zeitstempel',
        ERRORS: 'Fehler',
        NONE: 'keine',
        EMPTY: 'Keine Zusammenfassung vorhanden.',
        DOWNLOAD_ERRORS: 'Fehler-Export',
        DOWNLOAD_ERRORS_TOOLTIP: 'Fehlerinformationen dieses Jobs als JSON-Datei herunterladen',
      },
    },
  };

  const row = (jobID: string, status = 'successful', message: string | null = null) =>
    ({
      job: { jobID, status, message, job_start_datetime: '2026-09-11T10:57:19Z' },
      processTitle: 'Summe',
      targetIndicatorId: 'ind-1',
      targetIndicatorName: 'Bevölkerung',
    }) as any;

  const exportButton = () => fixture.nativeElement.querySelector('button');
  const exportedPayload = () => JSON.parse((downloadJson as jest.Mock).mock.calls[0][1]);

  const render = (data: unknown) => {
    fixture = TestBed.createComponent(JobSummaryCellRendererComponent);
    fixture.componentInstance.agInit({ data } as any);
    fixture.detectChanges();
  };

  const text = () => fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    summaries = signal(new Map<string, JobSummaryEntry[]>());

    TestBed.configureTestingModule({
      imports: [JobSummaryCellRendererComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: JobOverviewService,
          // Mirrors the real service: a signal-backed cache read through a
          // plain getter, so the renderer's computed() tracks it.
          useValue: { getSummary: (jobId: string) => summaries().get(jobId) },
        },
        {
          provide: SpatialUnitMetadataStoreService,
          useValue: {
            getSpatialUnitMetadataById: (id: string) =>
              id === 'su-1' ? { spatialUnitLevel: 'Stadtteile' } : undefined,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('de', TEXTS);
    translate.use('de');
  });

  it('fills itself when the summary lands, without the row being replaced', () => {
    render(row('j1'));
    expect(text()).toContain('Keine Zusammenfassung vorhanden.');

    summaries.set(
      new Map([
        [
          'j1',
          [
            {
              spatialUnitId: 'su-1',
              numberOfIntegratedIndicatorFeatures: 42,
              integratedTargetDates: ['2026-01-01'],
            },
          ] as JobSummaryEntry[],
        ],
      ])
    );
    fixture.detectChanges();

    expect(text()).toContain('Stadtteile');
    expect(text()).toContain('42');
    expect(text()).toContain('2026-01-01');
  });

  it('sorts the target dates and falls back to the raw id for an unknown spatial unit', () => {
    summaries.set(
      new Map([
        [
          'j1',
          [
            {
              spatialUnitId: 'su-unknown',
              numberOfIntegratedIndicatorFeatures: 0,
              integratedTargetDates: ['2026-03-01', '2026-01-01'],
            },
          ] as JobSummaryEntry[],
        ],
      ])
    );
    render(row('j1'));

    const dates = fixture.nativeElement.querySelectorAll('.date-list li');
    expect([...dates].map((li: HTMLElement) => li.textContent)).toEqual([
      '2026-01-01',
      '2026-03-01',
    ]);
    expect(text()).toContain('su-unknown');
    // 0 integrated features reads as "keine", not as a bare zero.
    expect(text()).toContain('keine');
  });

  it('shows the failure text of a failed job, which has no summary at all', () => {
    render(row('j2', 'failed', 'Zielindikator nicht gefunden'));

    expect(text()).toContain('Zielindikator nicht gefunden');
  });

  /**
   * The API declares `errorsOccurred` as a list of lists, master reads a flat
   * one, and no payload has settled it — so both have to render.
   */
  describe('errorsOccurred shapes', () => {
    const errorBoxes = () => fixture.nativeElement.querySelectorAll('app-job-error-box');

    const withErrors = (errorsOccurred: unknown) => {
      summaries.set(
        new Map([
          [
            'j1',
            [
              {
                spatialUnitId: 'su-1',
                numberOfIntegratedIndicatorFeatures: 1,
                errorsOccurred,
              },
            ] as unknown as JobSummaryEntry[],
          ],
        ])
      );
      render(row('j1'));
    };

    const error = (type: string) => ({
      type,
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'INDICATOR',
    });

    it('renders a flat list of errors', () => {
      withErrors([error('PROCESSING_ERROR'), error('MISSING_DATASET')]);

      expect(errorBoxes().length).toBe(2);
    });

    it('renders the declared list of lists, flattened', () => {
      withErrors([[error('PROCESSING_ERROR')], [error('MISSING_DATASET')]]);

      expect(errorBoxes().length).toBe(2);
    });
  });

  /**
   * The export replaces the log download the Processing Engine offered; the
   * Processes API has no logs, so this file is the only thing a user can hand
   * on to whoever runs the backend.
   */
  describe('error export', () => {
    beforeEach(() => (downloadJson as jest.Mock).mockClear());

    it('offers no export when there is neither a summary nor a message', () => {
      render(row('j1'));

      expect(exportButton()).toBeNull();
    });

    it('exports a failed job with its message and an empty summary', () => {
      render(row('j2', 'failed', 'Zielindikator nicht gefunden'));
      exportButton().click();

      expect((downloadJson as jest.Mock).mock.calls[0][0]).toBe('Job_Fehler_Export-j2.json');
      const payload = exportedPayload();
      expect(payload.jobID).toBe('j2');
      expect(payload.message).toBe('Zielindikator nicht gefunden');
      expect(payload.targetIndicatorName).toBe('Bevölkerung');
      expect(payload.jobSummary).toEqual([]);
    });

    it('exports the summary of a successful job, errors included', () => {
      const entry = {
        spatialUnitId: 'su-1',
        numberOfIntegratedIndicatorFeatures: 42,
        integratedTargetDates: ['2026-01-01'],
        errorsOccurred: [
          {
            type: 'missingTimestamp',
            affectedDatasetId: 'ind-1',
            affectedResourceType: 'indicator',
          },
        ],
      } as JobSummaryEntry;
      summaries.set(new Map([['j1', [entry]]]));
      render(row('j1'));
      exportButton().click();

      const payload = exportedPayload();
      expect(payload.jobSummary).toEqual([entry]);
      expect(payload.processTitle).toBe('Summe');
    });
  });
});
