import { Provider } from "@angular/core";
import {
  HttpClientTestingModule,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { TranslateModule } from "@ngx-translate/core";

/**
 * Shared test helpers for the Prio-6 baseline.
 *
 * Many components/services inject HttpClient, ngx-translate and rely on
 * animations being a no-op. These helpers keep the per-spec TestBed setup
 * small. Use them in `imports` / `providers` of `TestBed.configureTestingModule`.
 *
 * Deliberately minimal — no heavy mocking framework. Specs for heavy components
 * (Leaflet/ECharts, 6–12 injected services) are skipped for now (see plan).
 */

/** Common imports for component/service specs that touch HTTP + i18n. */
export const commonTestImports = [
  HttpClientTestingModule,
  TranslateModule.forRoot(),
];

/** Common providers (HttpClient testing backend + no-op animations). */
export const commonTestProviders: Provider[] = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideNoopAnimations(),
];
