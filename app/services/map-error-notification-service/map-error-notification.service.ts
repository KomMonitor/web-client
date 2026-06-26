import { Injectable, inject } from '@angular/core';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

/**
 * Map application-error notification, extracted from DataExchangeService (Prio 7 / B4).
 *
 * Owns the error banner state + the "hide map loading spinner" signal that used to
 * live on the facade. NOTE: the `errorMessage` field and the legacy
 * `.mapApplicationErrorAlert` DOM node have no readers/markup in the current Angular
 * app — the only observable effect today is the `hideLoadingIconOnMap` broadcast.
 * Kept verbatim here to stay behavior-identical; can be simplified once confirmed dead.
 */
@Injectable({
  providedIn: 'root',
})
export class MapErrorNotificationService {
  private indicatorValueService = inject(IndicatorValueService);
  private broadcastService = inject(BroadcastService);

  errorMessage: any = undefined;

  displayMapApplicationError(error) {
    setTimeout(() => {
      if (error.data) {
        this.errorMessage = this.indicatorValueService.syntaxHighlightJSON(error.data);
      }
      if (error.message) {
        this.errorMessage = this.indicatorValueService.syntaxHighlightJSON(error.message);
      } else {
        this.errorMessage = this.indicatorValueService.syntaxHighlightJSON(error);
      }

      this.broadcastService.broadcast(BroadcastMessage.HideLoadingIconOnMap);

      $('.mapApplicationErrorAlert').show();
    }, 1000);
  }
}
