import { Injectable } from '@angular/core';

/**
 * Adds native `title` tooltips to all `<option>` elements so that long,
 * truncated select labels remain readable on hover.
 *
 * Extracted from MetadataBootstrapService to keep DOM concerns out of the
 * metadata-loading orchestration (Prio 7 cleanup). This still relies on the
 * global jQuery `$('option')` selector and a deferred run because the options
 * are rendered from freshly loaded metadata on the next change-detection
 * cycle. The proper long-term home is a per-`<select>` Angular directive; that
 * is a larger change because the feature components are standalone and would
 * each need to import it.
 */
@Injectable({
  providedIn: 'root',
})
export class OptionTitleTooltipService {
  /** Delay (ms) giving Angular time to render options from new metadata. */
  private static readonly RENDER_DELAY_MS = 1000;

  /** Mirror every option's text into its `title` attribute, once rendered. */
  applyToAllOptions(): void {
    setTimeout(() => {
      $('option').each(function (_index, element) {
        const text = $(element).text();
        $(element).attr('title', text);
      });
    }, OptionTitleTooltipService.RENDER_DELAY_MS);
  }
}
