import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { JobSummaryCellRendererComponent } from './job-summary-cell-renderer.component';
import { JobSummaryEntry } from 'components/ngComponents/models/jobs.models';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

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
      },
    },
  };

  const row = (jobID: string, status = 'successful', message: string | null = null) =>
    ({ job: { jobID, status, message }, processTitle: 'Summe' }) as any;

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
});
