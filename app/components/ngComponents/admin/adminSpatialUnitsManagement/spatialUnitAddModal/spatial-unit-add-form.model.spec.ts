import { patchMetadataFormFromApi } from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  DEFAULT_OUTLINE_COLOR,
  DEFAULT_OUTLINE_WIDTH,
  SpatialUnitAddFormGroup,
  buildSpatialUnitAddForm,
  spatialUnitAddFormToApi,
} from './spatial-unit-add-form.model';

/**
 * TestBed-free model spec, following
 * `adminShared/resourceMetadataForm/resource-metadata-form.model.spec.ts`.
 *
 * The POST-body expectations mirror the ones pinned in
 * `spatial-unit-add-modal.component.spec.ts` before the Reactive-Forms rework,
 * so the wire format is provably unchanged.
 */

const SPATIAL_UNITS = [
  { spatialUnitLevel: 'Stadt' },
  { spatialUnitLevel: 'Stadtteile' },
  { spatialUnitLevel: 'Baublöcke' },
];

const UPDATE_INTERVAL_OPTIONS = [{ apiName: 'YEARLY', displayName: 'jährlich' }];

const buildForm = (withSecurity = true): SpatialUnitAddFormGroup =>
  buildSpatialUnitAddForm({
    withSecurity,
    existingLevelNames: () => SPATIAL_UNITS.map((unit) => unit.spatialUnitLevel),
    orderedSpatialUnits: () => SPATIAL_UNITS,
  });

const fillRequired = (form: SpatialUnitAddFormGroup): void => {
  form.controls.metadata.patchValue({ spatialUnitLevel: 'Quartiere' });
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

describe('spatial-unit add form model', () => {
  describe('buildSpatialUnitAddForm', () => {
    it('starts with the historic defaults', () => {
      const metadata = buildForm().controls.metadata.getRawValue();

      expect(metadata.spatialUnitLevel).toBe('');
      expect(metadata.isOutlineLayer).toBe(false);
      expect(metadata.outlineColor).toBe(DEFAULT_OUTLINE_COLOR);
      expect(metadata.outlineWidth).toBe(DEFAULT_OUTLINE_WIDTH);
      expect(metadata.outlineDashArray).toBeNull();
    });

    it('restores those defaults on reset instead of nulling them', () => {
      const form = buildForm();
      form.controls.metadata.patchValue({ outlineWidth: 9, outlineColor: '#ffffff' });
      form.controls.security.patchValue({ isPublic: true });

      form.reset();

      expect(form.controls.metadata.controls.outlineWidth.value).toBe(DEFAULT_OUTLINE_WIDTH);
      expect(form.controls.metadata.controls.outlineColor.value).toBe(DEFAULT_OUTLINE_COLOR);
      expect(form.controls.security.controls.isPublic.value).toBe(false);
      expect(form.controls.data.controls.importer.controls.keepAttributes.value).toBe(true);
    });

    it('starts from a supplied default outline pattern', () => {
      const pattern = { label: 'gestrichelt', dashArrayValue: '5,5', svgString: '' };
      const form = buildSpatialUnitAddForm({
        withSecurity: false,
        existingLevelNames: () => [],
        orderedSpatialUnits: () => [],
        defaultOutlineDashArray: pattern,
      });

      expect(form.controls.metadata.controls.outlineDashArray.value).toBe(pattern);
    });

    it('becomes valid once every required field is filled', () => {
      const form = buildForm();
      expect(form.invalid).toBe(true);

      fillRequired(form);

      expect(form.valid).toBe(true);
    });

    it('requires an owning organization only with Keycloak enabled', () => {
      const withSecurity = buildForm(true);
      const withoutSecurity = buildForm(false);

      expect(withSecurity.controls.security.controls.ownerOrganization.hasError('required')).toBe(
        true
      );
      expect(
        withoutSecurity.controls.security.controls.ownerOrganization.hasError('required')
      ).toBe(false);
    });

    it('rejects a level name that already exists', () => {
      const form = buildForm();
      form.controls.metadata.controls.spatialUnitLevel.setValue('Stadtteile');

      expect(form.controls.metadata.controls.spatialUnitLevel.hasError('uniqueName')).toBe(true);
    });

    it('carries the hierarchy rule on the metadata group', () => {
      const form = buildForm();

      form.controls.metadata.patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[0],
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[2],
      });
      expect(form.controls.metadata.hasError('spatialUnitHierarchy')).toBe(true);

      form.controls.metadata.patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[2],
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[0],
      });
      expect(form.controls.metadata.hasError('spatialUnitHierarchy')).toBe(false);
    });

    it('carries the period rule on the data group', () => {
      const form = buildForm();

      form.controls.data.controls.periodOfValidity.patchValue({
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      });

      expect(form.controls.data.controls.periodOfValidity.hasError('periodOfValidity')).toBe(true);
    });
  });

  describe('spatialUnitAddFormToApi', () => {
    it('assembles the historic POST body', () => {
      const form = buildForm();
      fillRequired(form);
      form.controls.metadata.patchValue({
        nextLowerHierarchySpatialUnit: SPATIAL_UNITS[2],
        nextUpperHierarchySpatialUnit: SPATIAL_UNITS[0],
        isOutlineLayer: true,
        outlineColor: '#123456',
        outlineWidth: 4,
        outlineDashArray: { label: 'gestrichelt', dashArrayValue: '5,5', svgString: '' },
      });
      form.controls.data.controls.periodOfValidity.patchValue({ endDate: '2026-12-31' });
      form.controls.security.patchValue({ isPublic: true });

      const body = spatialUnitAddFormToApi(form, ['role-1', 'role-2']);

      expect(body).toEqual({
        geoJsonString: '',
        metadata: {
          description: 'Beschreibung',
          databasis: '',
          datasource: 'Quelle',
          contact: 'Kontakt',
          updateInterval: 'YEARLY',
          lastUpdate: '2026-01-01',
          literature: '',
          note: '',
          sridEPSG: 4326,
        },
        jsonSchema: undefined,
        permissions: ['role-1', 'role-2'],
        nextLowerHierarchyLevel: 'Baublöcke',
        spatialUnitLevel: 'Quartiere',
        periodOfValidity: { startDate: '2026-01-01', endDate: '2026-12-31' },
        nextUpperHierarchyLevel: 'Stadt',
        isOutlineLayer: true,
        outlineColor: '#123456',
        outlineWidth: 4,
        outlineDashArrayString: '5,5',
        ownerId: 'org-1',
        isPublic: true,
      });
    });

    it('sends explicit nulls for unset hierarchy levels', () => {
      const form = buildForm();
      fillRequired(form);

      const body = spatialUnitAddFormToApi(form);

      expect(body.nextLowerHierarchyLevel).toBeNull();
      expect(body.nextUpperHierarchyLevel).toBeNull();
    });

    it('leaves outlineDashArrayString undefined without a pattern', () => {
      const form = buildForm();
      fillRequired(form);

      expect(spatialUnitAddFormToApi(form).outlineDashArrayString).toBeUndefined();
    });

    it('maps an open-ended validity period to null', () => {
      const form = buildForm();
      fillRequired(form);

      const body = spatialUnitAddFormToApi(form);

      expect(body.periodOfValidity).toEqual({ startDate: '2026-01-01', endDate: null });
    });

    it('normalises NgbDateStruct values from the datepicker', () => {
      const form = buildForm();
      fillRequired(form);
      form.controls.data.controls.periodOfValidity.controls.startDate.setValue({
        year: 2026,
        month: 3,
        day: 7,
      } as never);

      expect(spatialUnitAddFormToApi(form).periodOfValidity.startDate).toBe('2026-03-07');
    });

    it('defaults permissions to an empty array', () => {
      const form = buildForm();
      fillRequired(form);

      expect(spatialUnitAddFormToApi(form).permissions).toEqual([]);
    });
  });
});
