import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import {
  GeoresourceGridType,
  KommonitorGeoresourceDataGridHelperService,
} from './kommonitor-data-grid-helper.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import {
  HOSTILE_PAYLOAD,
  expectNoMarkupInjection,
  renderCellLikeAgGrid,
} from 'testing/ag-grid-cell.testing';

/** A georesource with the hostile payload in every free-text field. */
function hostileGeoresource(): any {
  return {
    georesourceId: 'georesource-1',
    datasetName: HOSTILE_PAYLOAD,
    // A quote and a semicolon would end the inline style and add declarations
    // or attributes if the color were interpolated into markup.
    poiSymbolColor: `red;" onerror="window.__xss=1`,
    poiMarkerColor: HOSTILE_PAYLOAD,
    poiSymbolBootstrap3Name: HOSTILE_PAYLOAD,
    loiColor: HOSTILE_PAYLOAD,
    loiWidth: HOSTILE_PAYLOAD,
    loiDashArrayString: HOSTILE_PAYLOAD,
    aoiColor: HOSTILE_PAYLOAD,
    metadata: {
      description: HOSTILE_PAYLOAD,
      datasource: HOSTILE_PAYLOAD,
      contact: HOSTILE_PAYLOAD,
    },
    availablePeriodsOfValidity: [
      { startDate: '2020-01-01', endDate: HOSTILE_PAYLOAD },
      { startDate: HOSTILE_PAYLOAD },
    ],
    topicReference: 'main-topic',
    permissions: ['permission-1'],
    isPublic: false,
    ownerId: 'owner-1',
  };
}

describe('KommonitorGeoresourceDataGridHelperService', () => {
  let service: KommonitorGeoresourceDataGridHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: AccessControlService,
          useValue: {
            getAllowedRolesString: () => HOSTILE_PAYLOAD,
            getRoleTitle: () => HOSTILE_PAYLOAD,
          },
        },
        {
          provide: TopicMetadataStoreService,
          useValue: {
            availableTopics: [{ topicId: 'main-topic', topicName: HOSTILE_PAYLOAD, subTopics: [] }],
          },
        },
      ],
    });
    service = TestBed.inject(KommonitorGeoresourceDataGridHelperService);
  });

  it.each<GeoresourceGridType>(['poi', 'loi', 'aoi'])(
    'renders free text from the API as text in every %s column',
    (type) => {
      const georesource = hostileGeoresource();

      const cells = expectNoMarkupInjection(service.buildGeoresourceColumnDefs(type), georesource);

      const textCells = cells.filter((cell) => cell.textContent?.includes(HOSTILE_PAYLOAD));
      expect(textCells.length).toBeGreaterThanOrEqual(8);
    }
  );

  it('keeps an invalid color out of the swatch style', () => {
    const georesource = hostileGeoresource();
    const symbolColor = service
      .buildGeoresourceColumnDefs('poi')
      .find((col) => col.field === 'poiSymbolColor')!;

    const cell = renderCellLikeAgGrid(symbolColor, georesource)!;

    expect(cell.firstElementChild!.textContent).toBe(georesource.poiSymbolColor);
    expect(cell.querySelector('[onerror]')).toBeNull();
    const swatch = cell.lastElementChild as HTMLElement;
    expect(swatch.style.backgroundColor).toBe('');
  });

  it('shows a valid color as text and swatch', () => {
    const symbolColor = service
      .buildGeoresourceColumnDefs('poi')
      .find((col) => col.field === 'poiSymbolColor')!;

    const cell = renderCellLikeAgGrid(symbolColor, { poiSymbolColor: '#ff0000' })!;

    expect(cell.firstElementChild!.textContent).toBe('#ff0000');
    expect((cell.lastElementChild as HTMLElement).style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('shows the symbol name as text next to the icon from the icon table', () => {
    const symbolName = service
      .buildGeoresourceColumnDefs('poi')
      .find((col) => col.field === 'poiSymbolBootstrap3Name')!;

    const cell = renderCellLikeAgGrid(symbolName, { poiSymbolBootstrap3Name: 'home' })!;

    expect(cell.textContent).toBe('home');
    expect(cell.querySelector('span.fas')).not.toBeNull();
  });

  it('lists the periods of validity, an open end as "heute"', () => {
    const periods = service
      .buildGeoresourceColumnDefs('aoi')
      .find((col) => col.headerName === 'ADMIN_SHARED.PERIOD_OF_VALIDITY')!;

    const cell = renderCellLikeAgGrid(periods, {
      availablePeriodsOfValidity: [
        { startDate: '2020-01-01', endDate: '2020-12-31' },
        { startDate: '2021-01-01' },
      ],
    })!;

    expect(Array.from(cell.querySelectorAll('li p')).map((p) => p.textContent)).toEqual([
      '2020-01-01 – 2020-12-31',
      '2021-01-01 – heute',
    ]);
  });
});
