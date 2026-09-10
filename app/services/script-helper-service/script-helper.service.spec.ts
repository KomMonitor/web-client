import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ScriptHelperService } from './script-helper.service';

describe('ScriptHelperService', () => {
  let service: ScriptHelperService;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ScriptHelperService);
    translate = TestBed.inject(TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('select options', () => {
    beforeEach(() => {
      translate.setTranslation('de', {
        ADMIN_SCRIPTS: {
          DATA_TYPES: { STRING: 'Textuell (String)' },
          SCRIPT_TYPES: { GENERIC: 'Generische Definition' },
          TEMPORAL_UNITS: { YEARS: 'Jahr(e)' },
        },
      });
      translate.setTranslation('en', {
        ADMIN_SCRIPTS: {
          DATA_TYPES: { STRING: 'Text (string)' },
          SCRIPT_TYPES: { GENERIC: 'Generic definition' },
          TEMPORAL_UNITS: { YEARS: 'year(s)' },
        },
      });
      translate.setDefaultLang('de');
      translate.use('de');
    });

    it('resolves the display names from the active language', () => {
      expect(service.availableScriptDataTypes[0]).toEqual({
        apiName: 'string',
        displayName: 'Textuell (String)',
      });
      expect(service.availableScriptTypeOptions[0].displayName).toBe('Generische Definition');
      expect(service.temporalOptions[0].displayName).toBe('Jahr(e)');
    });

    it('keeps the apiName contract untouched by translation', () => {
      // The wizard branches on apiName, so these must stay stable
      expect(service.availableScriptTypeOptions.map((o) => o.apiName)).toContain(
        'indicator_headlineIndicator'
      );
      expect(service.temporalOptions.map((o) => o.apiName)).toEqual(['YEARS', 'MONTHS', 'DAYS']);
    });

    it('returns a stable array identity for repeated reads', () => {
      // A template iterates this getter with `track dataType`; fresh objects on
      // every change-detection run would rebuild the DOM each time.
      expect(service.availableScriptDataTypes).toBe(service.availableScriptDataTypes);
    });

    it('re-resolves the display names after a language switch', () => {
      const before = service.availableScriptDataTypes;
      translate.use('en');
      const after = service.availableScriptDataTypes;

      expect(after).not.toBe(before);
      expect(after[0].displayName).toBe('Text (string)');
    });
  });
});
