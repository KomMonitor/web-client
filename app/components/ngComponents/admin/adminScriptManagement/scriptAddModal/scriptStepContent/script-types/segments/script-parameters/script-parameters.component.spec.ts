import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';

import { ScriptParametersComponent } from './script-parameters.component';

/**
 * Covers the add-parameter gate and the default-value handling per data type —
 * `false` is a valid boolean default, so a plain `required` would reject it.
 */

const STRING_TYPE = { apiName: 'string', displayName: 'Text' };
const BOOLEAN_TYPE = { apiName: 'boolean', displayName: 'Ja/Nein' };

describe('ScriptParametersComponent', () => {
  let component: ScriptParametersComponent;
  let fixture: ComponentFixture<ScriptParametersComponent>;
  let addScriptParameter: jest.Mock;

  beforeEach(() => {
    addScriptParameter = jest.fn();

    TestBed.configureTestingModule({
      imports: [ScriptParametersComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: ScriptHelperService,
          useValue: { addScriptParameter, getScriptParameterDataTypes: () => [] },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(ScriptParametersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the add button closed while the draft is incomplete', () => {
    expect(component.isAddParameterDisabled()).toBe(true);

    component.draft.patchValue({ name: 'radius', description: 'Suchradius' });
    expect(component.isAddParameterDisabled()).toBe(true);

    component.draft.patchValue({ dataType: STRING_TYPE, defaultValue: '500' });
    expect(component.isAddParameterDisabled()).toBe(false);
  });

  it('accepts false as a boolean default value', () => {
    component.draft.patchValue({
      name: 'flag',
      description: 'Schalter',
      dataType: BOOLEAN_TYPE,
      defaultValue: false,
    });

    expect(component.isAddParameterDisabled()).toBe(false);
  });

  it('seeds an unchecked default when the type becomes boolean', () => {
    component.draft.controls.dataType.setValue(BOOLEAN_TYPE);

    component.onChangeParameterDataType();

    expect(component.draft.controls.defaultValue.value).toBe(false);
  });

  it('clears the default value when the type changes to a non-boolean one', () => {
    component.draft.patchValue({ dataType: BOOLEAN_TYPE, defaultValue: true });

    component.draft.controls.dataType.setValue(STRING_TYPE);
    component.onChangeParameterDataType();

    expect(component.draft.controls.defaultValue.value).toBeNull();
  });

  it('hands the drafted parameter to the helper and resets', () => {
    component.draft.patchValue({
      name: 'radius',
      description: 'Suchradius',
      dataType: STRING_TYPE,
      defaultValue: '500',
      numericMinValue: 2,
      numericMaxValue: 9,
    });

    component.onAddScriptParameter();

    expect(addScriptParameter).toHaveBeenCalledWith(
      'radius',
      'Suchradius',
      STRING_TYPE,
      '500',
      2,
      9
    );
    expect(component.draft.getRawValue()).toEqual({
      name: '',
      description: '',
      dataType: null,
      defaultValue: null,
      numericMinValue: 0,
      numericMaxValue: 1,
    });
  });
});
