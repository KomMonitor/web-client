// extend web browser window object to allow for __env parameter
// holding KomMonitor related environment parameters / config options
interface Window {
    gtag: (...args: any[]) => void
    __env: any
  }

// jQuery is provided as a runtime global by the jquery.min.js <script> loaded
// via angular.json "scripts" (NOT bundled/imported). Declared here as ambient
// globals so the ~80 `$(...)` / `jQuery.extend(...)` call sites type-check without
// each importing jquery. Typed `any`, matching the project's existing
// `declare const $: any` convention.
declare const $: any;
declare const jQuery: any;