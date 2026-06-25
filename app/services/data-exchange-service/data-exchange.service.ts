import { Injectable } from '@angular/core';

/**
 * Formerly the central "god service" (~2000 lines). All responsibilities have
 * been peeled off into dedicated services (Prio 7 god-service split). This empty
 * shell only remains because a number of consumers still carry a now-unused
 * import/injection; those are removed in a follow-up before the class is deleted.
 */
@Injectable({
  providedIn: 'root',
})
export class DataExchangeService {}
