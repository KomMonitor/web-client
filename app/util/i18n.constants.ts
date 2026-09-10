/**
 * Supported UI languages.
 *
 * The four `de-*` regional variants ship as empty i18n bundles and resolve
 * through ngx-translate's default-language fallback to `de` (see
 * `app/app.config.ts` and `app/app.i18n-variant-fallback.spec.ts`).
 */
export const SUPPORTED_LANGUAGE_CODES = ['de', 'de-at', 'de-li', 'de-lu', 'de-ch', 'en'] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

/** The language every other bundle falls back to. */
export const DEFAULT_LANGUAGE_CODE: SupportedLanguageCode = 'de';

/** localStorage key holding the user's language choice. */
export const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

/**
 * The language to start the app with: the stored preference when it is one of
 * the supported codes, otherwise the default.
 */
export function resolvePreferredLanguage(): SupportedLanguageCode {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // localStorage can throw in hardened browser configurations
    return DEFAULT_LANGUAGE_CODE;
  }

  return isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE_CODE;
}

export function isSupportedLanguage(
  code: string | null | undefined
): code is SupportedLanguageCode {
  return !!code && (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(code);
}
