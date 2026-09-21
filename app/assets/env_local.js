/*
 * Development app config: the KomMonitor demo's own one, with `apiUrl` pointed
 * at the v6 deployment. Reached by pointing
 * `config/config-storage-server.json` → `targetUrlToConfigStorageServer_appConfig`
 * at this file; the other four config URLs keep pointing at the demo, so
 * Keycloak, controls and filter config still come from there.
 *
 * Why: the demo's config service answers `apiUrl = .../data-management/`, an
 * older deployment that knows no spatial unit hierarchies
 * (`/spatial-unit-hierarchies` → 404) and returns spatial units without
 * `mandantId`, while the vendored spec in `api-specs/` is the v6 one.
 *
 * It fetches rather than copies, so it cannot go stale when the demo's config
 * changes — only the one line at the end is ours. `StartupService` loads this
 * file as a script and reads `window.__env` right afterwards, so the fetch has
 * to be synchronous; a script tag cannot wait for one nested inside it.
 */
(function () {
  var SOURCE = 'https://demo.kommonitor.de.52north.org/client-config/config/client-app-config';

  var request = new XMLHttpRequest();
  request.open('GET', SOURCE, false);
  request.send();
  if (request.status !== 200) {
    throw new Error('Could not load the demo app config from ' + SOURCE + ': ' + request.status);
  }
  // Indirect eval, so the config assigns to the real `window`, exactly as it
  // would when the browser runs it as the script it is.
  (0, eval)(request.responseText);

  window.__env.apiUrl = 'https://demo.kommonitor.de.52north.org/data-management-v6/';
})();
