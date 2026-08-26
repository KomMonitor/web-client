import type { AttributeMappingType } from 'services/resource-import-service/resource-import.model';
import {
  attributeMappingDraftToRow,
  buildAttributeMappingDraftForm,
  patchAttributeMappingDraft,
  resetAttributeMappingDraft,
} from './attribute-mapping-draft-form.model';

const STRING_TYPE: AttributeMappingType = { displayName: 'Text', apiName: 'string' };
const INTEGER_TYPE: AttributeMappingType = { displayName: 'Ganzzahl', apiName: 'integer' };

describe('attribute-mapping draft form model', () => {
  it('is invalid while any of the three fields is missing', () => {
    const form = buildAttributeMappingDraftForm(STRING_TYPE);
    expect(form.invalid).toBe(true);

    form.patchValue({ sourceName: 'gen' });
    expect(form.invalid).toBe(true);

    form.patchValue({ destinationName: 'name' });
    expect(form.valid).toBe(true);
  });

  it('requires a data type', () => {
    const form = buildAttributeMappingDraftForm();
    form.patchValue({ sourceName: 'gen', destinationName: 'name' });

    expect(form.controls.dataType.hasError('required')).toBe(true);
  });

  it('serialises a completed draft into a table row', () => {
    const form = buildAttributeMappingDraftForm(INTEGER_TYPE);
    form.patchValue({ sourceName: '  gen  ', destinationName: ' name ' });

    expect(attributeMappingDraftToRow(form)).toEqual({
      sourceName: 'gen',
      destinationName: 'name',
      dataType: INTEGER_TYPE,
    });
  });

  it('loads an existing row back for editing', () => {
    const form = buildAttributeMappingDraftForm(STRING_TYPE);

    patchAttributeMappingDraft(form, {
      sourceName: 'gen',
      destinationName: 'name',
      dataType: INTEGER_TYPE,
    });

    expect(form.getRawValue()).toEqual({
      sourceName: 'gen',
      destinationName: 'name',
      dataType: INTEGER_TYPE,
    });
  });

  it('restores the default data type on reset', () => {
    const form = buildAttributeMappingDraftForm(STRING_TYPE);
    form.patchValue({ sourceName: 'gen', destinationName: 'name', dataType: INTEGER_TYPE });

    resetAttributeMappingDraft(form, STRING_TYPE);

    expect(form.getRawValue()).toEqual({
      sourceName: '',
      destinationName: '',
      dataType: STRING_TYPE,
    });
    expect(form.pristine).toBe(true);
  });
});
