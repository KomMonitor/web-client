import { Injectable, inject } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';

/**
 * Map application-error notification, extracted from DataExchangeService (Prio 7 / B4).
 *
 * The legacy error banner (`errorMessage` + `.mapApplicationErrorAlert` DOM node)
 * no longer exists in the Angular app, so the only observable effect is hiding
 * the map loading spinner. The service is kept as the semantic hook for a future
 * real error UI (map refactoring plan, Phase 0).
 */
@Injectable({
  providedIn: 'root',
})
export class MapErrorNotificationService {
  private broadcastService = inject(BroadcastService);

  displayMapApplicationError(error) {
    console.error('Map application error:', error);
    this.broadcastService.broadcast(BroadcastMessage.HideLoadingIconOnMap);
  }
}
