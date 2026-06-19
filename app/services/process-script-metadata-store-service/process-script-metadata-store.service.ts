import { Injectable } from "@angular/core";

/**
 * Process-script metadata store extracted from DataExchangeService
 * (Prio 7 / B6b — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Holds the available process-script collection + id-lookup map; the DataExchangeService
 * facade re-exposes availableProcessScripts via a getter so its consumers stay unchanged.
 */
@Injectable({
  providedIn: "root",
})
export class ProcessScriptMetadataStoreService {

  availableProcessScripts: any[] = [];
  availableProcessScripts_map = new Map();

  setProcessScripts(scriptsArray) {
    this.availableProcessScripts_map = new Map(
      scriptsArray.map((s) => [s.scriptId, s]),
    );
    this.availableProcessScripts = Array.from(
      this.availableProcessScripts_map.values(),
    );
  }
}
