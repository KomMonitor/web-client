import { buildIndicatorMethodologyPatchBody } from './indicator-methodology-patch.util';
import { IndicatorOverviewType } from 'models/data-management-api';

describe('buildIndicatorMethodologyPatchBody', () => {
  const indicator = (overrides: Partial<IndicatorOverviewType> = {}) =>
    ({
      indicatorId: 'ind-1',
      indicatorName: 'Anteil Bevölkerung 80+',
      abbreviation: 'B80',
      interpretation: 'Hohe Werte bedeuten viel.',
      isHeadlineIndicator: false,
      unit: 'Prozent',
      tags: ['Demografie', 'Alter'],
      topicReference: 'topic-7',
      processDescription: 'alte Methodik',
      metadata: { contact: 'a@b.de', datasource: 'Amt', description: 'x', updateInterval: 'YEAR' },
      ...overrides,
    }) as unknown as IndicatorOverviewType;

  it('exchanges only the methodology and keeps the rest of the metadata', () => {
    const body = buildIndicatorMethodologyPatchBody(indicator(), 'neue Methodik');

    expect(body.processDescription).toBe('neue Methodik');
    expect(body.datasetName).toBe('Anteil Bevölkerung 80+');
    expect(body.abbreviation).toBe('B80');
    expect(body.interpretation).toBe('Hohe Werte bedeuten viel.');
    expect(body.unit).toBe('Prozent');
    expect(body.tags).toEqual(['Demografie', 'Alter']);
    expect(body.topicReference).toBe('topic-7');
    expect(body.metadata).toEqual(indicator().metadata);
  });

  it('carries every field the API marks required', () => {
    const body = buildIndicatorMethodologyPatchBody(indicator(), 'm');

    for (const key of [
      'abbreviation',
      'interpretation',
      'isHeadlineIndicator',
      'metadata',
      'processDescription',
      'tags',
      'topicReference',
      'unit',
    ]) {
      expect(body).toHaveProperty(key);
      expect((body as Record<string, unknown>)[key]).toBeDefined();
    }
  });

  it('leaves permissions and ownership out of the body', () => {
    const body = buildIndicatorMethodologyPatchBody(
      indicator({
        permissions: [{ permissionId: 'p1' }],
        ownerId: 'org-1',
        isPublic: true,
      } as unknown as Partial<IndicatorOverviewType>),
      'm'
    );

    expect(body).not.toHaveProperty('permissions');
    expect(body).not.toHaveProperty('ownerId');
    expect(body).not.toHaveProperty('isPublic');
    expect(body).not.toHaveProperty('indicatorId');
    expect(body).not.toHaveProperty('applicableDates');
  });

  it('renames the references to the keys the body expects', () => {
    const body = buildIndicatorMethodologyPatchBody(
      indicator({
        referencedIndicators: [
          {
            referencedIndicatorId: 'ind-2',
            referencedIndicatorName: 'Bevölkerung',
            referencedIndicatorDescription: 'Nenner',
          },
        ],
        referencedGeoresources: [
          {
            referencedGeoresourceId: 'geo-2',
            referencedGeoresourceName: 'Kitas',
            referencedGeoresourceDescription: 'Punkte',
          },
        ],
      } as unknown as Partial<IndicatorOverviewType>),
      'm'
    );

    expect(body.refrencesToOtherIndicators).toEqual([
      { indicatorId: 'ind-2', referenceDescription: 'Nenner' },
    ]);
    expect(body.refrencesToGeoresources).toEqual([
      { georesourceId: 'geo-2', referenceDescription: 'Punkte' },
    ]);
  });

  it('omits optional fields the indicator does not carry', () => {
    const body = buildIndicatorMethodologyPatchBody(indicator(), 'm');

    expect(body).not.toHaveProperty('precision');
    expect(body).not.toHaveProperty('characteristicValue');
    expect(body).not.toHaveProperty('referenceDateNote');
    expect(body).not.toHaveProperty('refrencesToOtherIndicators');
  });

  it('keeps the optional fields it does carry', () => {
    const body = buildIndicatorMethodologyPatchBody(
      indicator({
        precision: 2,
        displayOrder: 5,
        creationType: 'COMPUTATION',
        indicatorType: 'STATUS',
        lowestSpatialUnitForComputation: 'Stadtteile',
      } as unknown as Partial<IndicatorOverviewType>),
      'm'
    );

    expect(body.precision).toBe(2);
    expect(body.displayOrder).toBe(5);
    expect(body.creationType).toBe('COMPUTATION');
    expect(body.indicatorType).toBe('STATUS');
    expect(body.lowestSpatialUnitForComputation).toBe('Stadtteile');
  });

  it('falls back to empty values rather than dropping a required field', () => {
    const body = buildIndicatorMethodologyPatchBody(
      { indicatorName: 'Nur ein Name' } as unknown as IndicatorOverviewType,
      'm'
    );

    expect(body.abbreviation).toBe('');
    expect(body.unit).toBe('');
    expect(body.tags).toEqual([]);
    expect(body.isHeadlineIndicator).toBe(false);
  });
});
