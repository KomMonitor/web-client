import {
  buildResourceMetadataForm,
  DEFAULT_SRID_EPSG,
  metadataFormToApi,
  patchMetadataFormFromApi,
  UpdateIntervalOption,
} from './resource-metadata-form.model';

const OPTIONS: UpdateIntervalOption[] = [
  { apiName: 'ARBITRARY', displayName: 'beliebig' },
  { apiName: 'YEARLY', displayName: 'jährlich' },
];

describe('resource-metadata-form.model', () => {
  describe('buildResourceMetadataForm', () => {
    it('is invalid when required fields are empty', () => {
      const form = buildResourceMetadataForm();
      expect(form.invalid).toBe(true);
    });

    it('becomes valid once description, datasource, contact, updateInterval and lastUpdate are set', () => {
      const form = buildResourceMetadataForm();
      form.patchValue({
        description: 'desc',
        datasource: 'source',
        contact: 'contact',
        updateInterval: OPTIONS[1],
        lastUpdate: '2026-01-31',
      });
      expect(form.valid).toBe(true);
    });

    it('treats databasis, literature and note as optional', () => {
      const form = buildResourceMetadataForm();
      expect(form.controls.databasis.valid).toBe(true);
      expect(form.controls.literature.valid).toBe(true);
      expect(form.controls.note.valid).toBe(true);
    });

    it('defaults sridEPSG to 4326', () => {
      expect(buildResourceMetadataForm().controls.sridEPSG.value).toBe(DEFAULT_SRID_EPSG);
    });
  });

  describe('patchMetadataFormFromApi', () => {
    it('applies API metadata and resolves updateInterval by apiName', () => {
      const form = buildResourceMetadataForm();
      patchMetadataFormFromApi(
        form,
        {
          description: 'desc',
          databasis: 'basis',
          datasource: 'source',
          contact: 'contact',
          updateInterval: 'YEARLY',
          lastUpdate: '2025-12-24',
          literature: 'lit',
          note: 'note',
          sridEPSG: 25832,
        },
        OPTIONS
      );
      const value = form.getRawValue();
      expect(value.description).toBe('desc');
      expect(value.updateInterval).toBe(OPTIONS[1]);
      expect(value.lastUpdate).toBe('2025-12-24');
      expect(value.sridEPSG).toBe(25832);
    });

    it('falls back to defaults for missing fields and unknown updateInterval', () => {
      const form = buildResourceMetadataForm();
      form.patchValue({ description: 'stale', updateInterval: OPTIONS[0] });
      patchMetadataFormFromApi(form, { updateInterval: 'MONTHLY' as any }, OPTIONS);
      const value = form.getRawValue();
      expect(value.description).toBe('');
      expect(value.updateInterval).toBeNull();
      expect(value.sridEPSG).toBe(DEFAULT_SRID_EPSG);
    });

    it('clears previous values when patched with null metadata', () => {
      const form = buildResourceMetadataForm();
      form.patchValue({ description: 'stale', note: 'stale note' });
      patchMetadataFormFromApi(form, null, OPTIONS);
      expect(form.getRawValue().description).toBe('');
      expect(form.getRawValue().note).toBe('');
    });
  });

  describe('metadataFormToApi', () => {
    it('serializes updateInterval as apiName and keeps ISO date strings', () => {
      const form = buildResourceMetadataForm();
      form.patchValue({
        description: 'desc',
        datasource: 'source',
        contact: 'contact',
        updateInterval: OPTIONS[1],
        lastUpdate: '2026-01-31',
      });
      const api = metadataFormToApi(form);
      expect(api.updateInterval).toBe('YEARLY');
      expect(api.lastUpdate).toBe('2026-01-31');
      expect(api.sridEPSG).toBe(DEFAULT_SRID_EPSG);
    });

    it('converts NgbDateStruct-like lastUpdate values to ISO strings', () => {
      const form = buildResourceMetadataForm();
      form.controls.lastUpdate.setValue({ year: 2026, month: 3, day: 5 } as any);
      expect(metadataFormToApi(form).lastUpdate).toBe('2026-03-05');
    });

    it('falls back to ARBITRARY when no updateInterval is selected', () => {
      const form = buildResourceMetadataForm();
      expect(metadataFormToApi(form).updateInterval).toBe('ARBITRARY');
    });
  });
});
