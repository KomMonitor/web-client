import { patchMetadataFormFromApi } from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import { patchTopicHierarchyFromChain } from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';
import {
  DEFAULT_AOI_COLOR,
  DEFAULT_LOI_COLOR,
  DEFAULT_LOI_WIDTH,
  DEFAULT_POI_ICON_NAME,
  DEFAULT_POI_MARKER_STYLE,
  GeoresourceAddFormGroup,
  buildGeoresourceAddForm,
  georesourceAddFormToApi,
} from './georesource-add-form.model';

/**
 * TestBed-free model spec. The POST-body expectations mirror the ones pinned in
 * `georesource-add-modal.component.spec.ts` before the Reactive-Forms rework.
 */

const SUB = { topicId: 't-1-1', topicName: 'Ebene 2' };
const MAIN = { topicId: 't-1', topicName: 'Umwelt', subTopics: [SUB] };

const UPDATE_INTERVAL_OPTIONS = [{ apiName: 'YEARLY', displayName: 'jährlich' }];

const buildForm = (withSecurity = true): GeoresourceAddFormGroup =>
  buildGeoresourceAddForm({
    withSecurity,
    existingDatasetNames: () => ['Spielplätze', 'Schulen'],
  });

const fillRequired = (form: GeoresourceAddFormGroup): void => {
  form.controls.metadata.patchValue({ datasetName: 'Spielplätze neu' });
  patchMetadataFormFromApi(
    form.controls.general,
    {
      description: 'Beschreibung',
      datasource: 'Quelle',
      contact: 'Kontakt',
      lastUpdate: '2026-01-01',
      updateInterval: 'YEARLY',
    },
    UPDATE_INTERVAL_OPTIONS
  );
  patchTopicHierarchyFromChain(form.controls.topics, [MAIN]);
  form.controls.security.patchValue({ ownerOrganization: 'org-1' });
  form.controls.data.controls.periodOfValidity.patchValue({ startDate: '2026-01-01' });
  form.controls.data.controls.importer.patchValue({ idProperty: 'id', nameProperty: 'name' });
  form.controls.data.controls.importer.controls.converter.setValue({
    name: 'GeoJSON',
    type: 'geojson',
    mimeTypes: [],
    encodings: [],
  });
  form.controls.data.controls.importer.controls.datasourceType.setValue({
    type: 'FILE',
    parameters: [],
  });
};

describe('georesource add form model', () => {
  describe('buildGeoresourceAddForm', () => {
    it('starts as a POI dataset with the historic style defaults', () => {
      const metadata = buildForm().controls.metadata.getRawValue();

      expect(metadata.georesourceType).toBe('poi');
      expect(metadata.style.poiIconName).toBe(DEFAULT_POI_ICON_NAME);
      expect(metadata.style.poiMarkerStyle).toBe(DEFAULT_POI_MARKER_STYLE);
      expect(metadata.style.loiColor).toBe(DEFAULT_LOI_COLOR);
      expect(metadata.style.loiWidth).toBe(DEFAULT_LOI_WIDTH);
      expect(metadata.style.aoiColor).toBe(DEFAULT_AOI_COLOR);
    });

    it('restores those defaults on reset instead of nulling them', () => {
      const form = buildForm();
      form.controls.metadata.patchValue({
        georesourceType: 'aoi',
        style: { loiColor: '#000000', loiWidth: 9, poiIconName: 'tree' },
      });

      form.reset();

      const metadata = form.controls.metadata.getRawValue();
      expect(metadata.georesourceType).toBe('poi');
      expect(metadata.style.loiColor).toBe(DEFAULT_LOI_COLOR);
      expect(metadata.style.loiWidth).toBe(DEFAULT_LOI_WIDTH);
      expect(metadata.style.poiIconName).toBe(DEFAULT_POI_ICON_NAME);
    });

    it('caps the POI marker text at three characters', () => {
      const form = buildForm();
      const control = form.controls.metadata.controls.style.controls.poiMarkerText;

      control.setValue('ABC');
      expect(control.valid).toBe(true);

      control.setValue('ABCD');
      expect(control.hasError('maxlength')).toBe(true);
    });

    it('rejects a dataset name that already exists', () => {
      const form = buildForm();
      form.controls.metadata.controls.datasetName.setValue('Schulen');

      expect(form.controls.metadata.controls.datasetName.hasError('uniqueName')).toBe(true);
    });

    it('requires a main topic', () => {
      expect(buildForm().controls.topics.controls.mainTopic.hasError('topicRequired')).toBe(true);
    });

    it('becomes valid once every required field is filled', () => {
      const form = buildForm();
      expect(form.invalid).toBe(true);

      fillRequired(form);

      expect(form.valid).toBe(true);
    });

    it('requires an owning organization only with Keycloak enabled', () => {
      expect(
        buildForm(true).controls.security.controls.ownerOrganization.hasError('required')
      ).toBe(true);
      expect(
        buildForm(false).controls.security.controls.ownerOrganization.hasError('required')
      ).toBe(false);
    });
  });

  describe('georesourceAddFormToApi', () => {
    const STYLE_KEYS = [
      'poiSymbolBootstrap3Name',
      'poiSymbolColor',
      'poiMarkerColor',
      'poiMarkerStyle',
      'poiMarkerText',
      'loiDashArrayString',
      'loiColor',
      'loiWidth',
      'aoiColor',
    ];

    it('assembles the envelope the API expects', () => {
      const form = buildForm();
      fillRequired(form);
      form.controls.data.controls.periodOfValidity.patchValue({ endDate: '2026-12-31' });
      form.controls.security.patchValue({ isPublic: true });

      const body = georesourceAddFormToApi(form, ['role-1']);

      expect(body.geoJsonString).toBe('');
      expect(body.jsonSchema).toBeNull();
      expect(body.datasetName).toBe('Spielplätze neu');
      expect(body.permissions).toEqual(['role-1']);
      expect(body.ownerId).toBe('org-1');
      expect(body.isPublic).toBe(true);
      expect(body.periodOfValidity).toEqual({ startDate: '2026-01-01', endDate: '2026-12-31' });
      expect(body.metadata.updateInterval).toBe('YEARLY');
    });

    it('names the permission field permissions, not allowedRoles', () => {
      // Behaviour change: `allowedRoles` was a regression of the Angular port —
      // see the note on GeoresourceAddPostBody.
      const body = georesourceAddFormToApi(buildForm());

      expect(Object.keys(body)).toContain('permissions');
      expect(Object.keys(body)).not.toContain('allowedRoles');
    });

    it('passes the validity dates through unnormalised', () => {
      const form = buildForm();
      form.controls.data.controls.periodOfValidity.patchValue({ startDate: '01.01.2026' });

      expect(georesourceAddFormToApi(form).periodOfValidity.startDate).toBe('01.01.2026');
    });

    it('writes all nine style keys for a POI dataset', () => {
      const form = buildForm();
      form.controls.metadata.patchValue({
        georesourceType: 'poi',
        style: {
          poiIconName: 'tree',
          poiMarkerStyle: 'text',
          poiMarkerText: 'ABC',
          poiMarkerColor: { colorName: 'red' },
          poiSymbolColor: { colorName: 'white' },
        },
      });

      const body = georesourceAddFormToApi(form);

      STYLE_KEYS.forEach((key) => expect(Object.keys(body)).toContain(key));
      expect(body.poiSymbolBootstrap3Name).toBe('tree');
      expect(body.poiMarkerStyle).toBe('text');
      expect(body.poiMarkerText).toBe('ABC');
      expect(body.poiMarkerColor).toBe('red');
      expect(body.poiSymbolColor).toBe('white');
      expect(body.loiWidth).toBe(DEFAULT_LOI_WIDTH);
      expect(body.loiColor).toBeNull();
      expect(body.aoiColor).toBeNull();
    });

    it('falls back to an empty string for unset POI colours', () => {
      const body = georesourceAddFormToApi(buildForm());

      expect(body.poiMarkerColor).toBe('');
      expect(body.poiSymbolColor).toBe('');
    });

    it('writes the line style for a LOI dataset', () => {
      const form = buildForm();
      form.controls.metadata.patchValue({
        georesourceType: 'loi',
        style: {
          loiColor: '#123456',
          loiWidth: 7,
          loiDashArray: { label: 'gestrichelt', dashArrayValue: '5,5', svgString: '' },
        },
      });

      const body = georesourceAddFormToApi(form);

      expect(body.loiColor).toBe('#123456');
      expect(body.loiWidth).toBe(7);
      expect(body.loiDashArrayString).toBe('5,5');
      expect(body.poiSymbolBootstrap3Name).toBeNull();
      expect(body.aoiColor).toBeNull();
    });

    it('uses an empty string, not null, for a missing LOI dash array', () => {
      const form = buildForm();
      form.controls.metadata.patchValue({ georesourceType: 'loi' });

      expect(georesourceAddFormToApi(form).loiDashArrayString).toBe('');
    });

    it('writes the area colour for an AOI dataset', () => {
      const form = buildForm();
      form.controls.metadata.patchValue({
        georesourceType: 'aoi',
        style: { aoiColor: '#abcdef' },
      });

      const body = georesourceAddFormToApi(form);

      expect(body.aoiColor).toBe('#abcdef');
      expect(body.loiWidth).toBe(DEFAULT_LOI_WIDTH);
      expect(body.poiMarkerStyle).toBeNull();
    });

    it.each([
      ['poi', [true, false, false]],
      ['loi', [false, true, false]],
      ['aoi', [false, false, true]],
    ])('expands %s back into the three API flags', (type, expected) => {
      const form = buildForm();
      form.controls.metadata.patchValue({ georesourceType: type as never });

      const body = georesourceAddFormToApi(form);

      expect([body.isPOI, body.isLOI, body.isAOI]).toEqual(expected);
    });

    it('reports the deepest selected topic', () => {
      const form = buildForm();

      patchTopicHierarchyFromChain(form.controls.topics, [MAIN]);
      expect(georesourceAddFormToApi(form).topicReference).toBe('t-1');

      patchTopicHierarchyFromChain(form.controls.topics, [MAIN, SUB]);
      expect(georesourceAddFormToApi(form).topicReference).toBe('t-1-1');
    });

    it('sends an empty topic reference when nothing is selected', () => {
      expect(georesourceAddFormToApi(buildForm()).topicReference).toBe('');
    });

    it('cannot report a stale deeper topic after the main topic changed', () => {
      // The historic builder could: nothing cleared the deeper levels, so a
      // reference from a foreign branch was POSTed. The shared cascade fixes it.
      const form = buildForm();
      patchTopicHierarchyFromChain(form.controls.topics, [MAIN, SUB]);

      form.controls.topics.controls.mainTopic.setValue({ topicId: 't-2', topicName: 'Soziales' });

      expect(georesourceAddFormToApi(form).topicReference).toBe('t-2');
    });

    it('defaults permissions to an empty array', () => {
      expect(georesourceAddFormToApi(buildForm()).permissions).toEqual([]);
    });
  });
});
