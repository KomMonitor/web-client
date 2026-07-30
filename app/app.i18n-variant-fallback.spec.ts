import { readFileSync } from 'fs';
import { join } from 'path';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom, of } from 'rxjs';

/**
 * Runtime verification for the regional-variant i18n setup: de-at/de-ch/de-li/
 * de-lu.json ship as empty bundles and every key must resolve via the 'de'
 * default-language fallback (app.module.ts: defaultLanguage 'de' + useDefaultLang).
 *
 * Reads the ACTUAL i18n bundle files from disk and drives the real
 * TranslateService with the same forRoot config as the app.
 */
const I18N_DIR = join(__dirname, 'assets', 'i18n');
const load = (lang: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(I18N_DIR, `${lang}.json`), 'utf-8'));

const BUNDLES: Record<string, Record<string, unknown>> = {
  de: load('de'),
  'de-at': load('de-at'),
  'de-ch': load('de-ch'),
  'de-li': load('de-li'),
  'de-lu': load('de-lu'),
  en: load('en'),
};

const VARIANTS = ['de-at', 'de-ch', 'de-li', 'de-lu'];

// A cross-section of keys touched by the localization work, spanning shallow and
// deeply nested namespaces.
const SAMPLE_KEYS = [
  'ADMIN_SHARED.CLOSE',
  'ADMIN_SHARED.UNKNOWN_ERROR',
  'ADMIN_SHARED_UI.STEP.NEXT',
  'ADMIN_SHARED_UI.SECURITY.ACCESS_OWNERSHIP_TITLE',
  'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_DATASET',
  'ADMIN_ROLES.GRID.COL_ORG_UNIT',
  'ADMIN_GEORESOURCES.ADD_MODAL.MSG.REGISTERED',
];

const deValue = (key: string): unknown =>
  key.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), BUNDLES['de']);

class RealFileLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    return of(BUNDLES[lang] ?? {});
  }
}

describe('i18n regional variant fallback (de-* -> de)', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          defaultLanguage: 'de',
          useDefaultLang: true,
          loader: { provide: TranslateLoader, useClass: RealFileLoader },
        }),
      ],
    });
    translate = TestBed.inject(TranslateService);
  });

  it('ships the four regional variant bundles empty (no duplicated content)', () => {
    for (const variant of VARIANTS) {
      expect(Object.keys(BUNDLES[variant])).toHaveLength(0);
    }
  });

  it('resolves keys via the de default bundle for every empty variant', async () => {
    translate.setDefaultLang('de');
    await firstValueFrom(translate.use('de'));

    for (const variant of VARIANTS) {
      await firstValueFrom(translate.use(variant));
      expect(translate.currentLang).toBe(variant);

      for (const key of SAMPLE_KEYS) {
        const value = translate.instant(key);
        expect(value).toBe(deValue(key)); // German value from the default bundle
        expect(value).not.toBe(key); // never a raw, unresolved key
      }
    }
  });

  it('interpolates parameters through the fallback (INVALID_HINT {{format}})', async () => {
    translate.setDefaultLang('de');
    await firstValueFrom(translate.use('de-at'));

    const hint = translate.instant('ADMIN_CONFIG.COMMON.INVALID_HINT', { format: 'JSON' });
    expect(hint).toContain('JSON-Struktur');
    expect(hint).not.toContain('{{format}}');
  });
});
