/**
 * Resolves a path inside the deployed app (e.g. `logos/KM_Logo1.png`) to an
 * absolute URL.
 *
 * Resolves against the document's `<base href>`, not `location.pathname`: the
 * app may run under a sub-path (e.g. `/v6/ui/`), and on a deep link such as
 * `/v6/ui/administration/groups` the pathname points below the app's root.
 */
export function appUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}
