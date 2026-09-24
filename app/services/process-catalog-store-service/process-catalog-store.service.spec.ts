import { TestBed } from '@angular/core/testing';

import { ProcessCatalogStoreService } from './process-catalog-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';

describe('ProcessCatalogStoreService', () => {
  let service: ProcessCatalogStoreService;

  const DESCRIPTIONS: Record<string, any> = {
    KmIndicatorMultiply: {
      id: 'KmIndicatorMultiply',
      title: 'Multiplikation',
      additional_parameters: {
        parameters: [{ name: 'kommonitorUiParams', value: [{ apiName: 'km_indicator_multiply' }] }],
      },
    },
    KmGeoresourceCountPointsWithinPolygon: {
      id: 'KmGeoresourceCountPointsWithinPolygon',
      title: 'Punkte je Fläche',
      additional_parameters: {
        parameters: [
          {
            name: 'kommonitorUiParams',
            value: [{ apiName: 'km_georesource_count_pointsWithinPolygon' }],
          },
        ],
      },
    },
  };

  let fetchProcesses: jest.Mock;
  let fetchProcessDescription: jest.Mock;

  beforeEach(() => {
    fetchProcesses = jest
      .fn()
      .mockResolvedValue(Object.values(DESCRIPTIONS).map((d) => ({ id: d.id })));
    fetchProcessDescription = jest.fn().mockImplementation((id: string) => DESCRIPTIONS[id]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProcessesApiService,
          useValue: {
            fetchProcesses,
            fetchProcessDescription,
            extractKommonitorUiParams: (process: any) =>
              process?.additional_parameters?.parameters?.find(
                (p: any) => p.name === 'kommonitorUiParams'
              )?.value?.[0],
          },
        },
      ],
    });
    service = TestBed.inject(ProcessCatalogStoreService);
  });

  it('maps a schedule apiName back to its PascalCase process', async () => {
    await service.loadCatalogue();
    expect(service.getProcessByApiName('km_indicator_multiply')?.id).toBe('KmIndicatorMultiply');
  });

  it('resolves apiNames that are not plain snake_case', async () => {
    await service.loadCatalogue();
    expect(service.getProcessByApiName('km_georesource_count_pointsWithinPolygon')?.id).toBe(
      'KmGeoresourceCountPointsWithinPolygon'
    );
  });

  it('exposes the process title for a schedule', async () => {
    await service.loadCatalogue();
    expect(service.getProcessTitleByApiName('km_indicator_multiply')).toBe('Multiplikation');
  });

  it('falls back to the raw processID for processes without UI params', async () => {
    await service.loadCatalogue();
    expect(service.getProcessTitleByApiName('single_export')).toBe('single_export');
  });

  it('fetches the catalogue only once, even for concurrent callers', async () => {
    await Promise.all([service.loadCatalogue(), service.loadCatalogue()]);
    await service.loadCatalogue();
    expect(fetchProcesses).toHaveBeenCalledTimes(1);
    expect(fetchProcessDescription).toHaveBeenCalledTimes(2);
  });

  it('refetches after invalidate', async () => {
    await service.loadCatalogue();
    service.invalidate();
    expect(service.getProcessByApiName('km_indicator_multiply')).toBeUndefined();
    await service.loadCatalogue();
    expect(fetchProcesses).toHaveBeenCalledTimes(2);
  });

  it('keeps working when the catalogue cannot be loaded', async () => {
    fetchProcesses.mockResolvedValue([]);
    service.invalidate();
    await service.loadCatalogue();
    expect(service.processes()).toEqual([]);
    expect(service.getProcessTitleByApiName('km_indicator_multiply')).toBe('km_indicator_multiply');
  });
});
