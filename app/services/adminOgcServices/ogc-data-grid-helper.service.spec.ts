import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OgcDataGridHelperService } from './ogc-data-grid-helper.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import {
  HOSTILE_PAYLOAD,
  expectNoMarkupInjection,
  renderCellLikeAgGrid,
} from 'testing/ag-grid-cell.testing';

describe('OgcDataGridHelperService', () => {
  let service: OgcDataGridHelperService;

  /** The WMS column defs; private on the service, which applies them to its grid. */
  const columnDefs = () => (service as any).getWmsColumnDefinitions();

  /** A WMS entry with the hostile payload in every free-text field. */
  const hostileWms = () => ({
    id: 'wms-1',
    title: HOSTILE_PAYLOAD,
    description: HOSTILE_PAYLOAD,
    topicReference: 'topic-1',
    connectionDetails: {
      baseUrl: 'https://wms.example.org/wms',
      // A quote here used to end the legend's src attribute.
      layerName: `layer" onerror="window.__xss=1`,
    },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TopicMetadataStoreService,
          useValue: { availableTopics: [{ topicId: 'topic-1', topicName: HOSTILE_PAYLOAD }] },
        },
      ],
    });
    service = TestBed.inject(OgcDataGridHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('renders free text from the API as text in every column', () => {
    const cells = expectNoMarkupInjection(columnDefs(), hostileWms());

    const textCells = cells.filter((cell) => cell.textContent?.includes(HOSTILE_PAYLOAD));
    // Name, description and topic.
    expect(textCells.length).toBe(3);
  });

  it('builds the legend image with the layer name inside its URL', () => {
    const legendColumn = columnDefs().find(
      (col: any) => col.headerName === 'ADMIN_WMS.GRID.COL_LEGEND'
    );

    const legend = renderCellLikeAgGrid(legendColumn, hostileWms()) as HTMLImageElement;

    expect(legend.tagName).toBe('IMG');
    expect(legend.getAttributeNames()).toEqual(['src']);
    expect(legend.src).toContain('https://wms.example.org/wms');
  });
});
