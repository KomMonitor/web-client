import { Injectable, signal } from '@angular/core';
import { ProcessScriptOverviewType } from 'models/data-management-api';

/**
 * Process-script metadata store extracted from DataExchangeService
 * (Prio 7 / B6b — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Holds the available process-script collection + id-lookup map; the DataExchangeService
 * facade re-exposes availableProcessScripts via a getter so its consumers stay unchanged.
 */
@Injectable({
  providedIn: 'root',
})
export class ProcessScriptMetadataStoreService {
  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableProcessScripts = signal<ProcessScriptOverviewType[]>([]);
  get availableProcessScripts(): ProcessScriptOverviewType[] {
    return this._availableProcessScripts();
  }
  set availableProcessScripts(value: ProcessScriptOverviewType[]) {
    this._availableProcessScripts.set(value);
  }
  availableProcessScripts_map = new Map<string, ProcessScriptOverviewType>();

  setProcessScripts(scriptsArray: ProcessScriptOverviewType[]) {
    this.availableProcessScripts_map = new Map(scriptsArray.map((s) => [s.scriptId, s]));
    this.availableProcessScripts = Array.from(this.availableProcessScripts_map.values());
  }

  deleteSingleProcessScriptMetadata(scriptId: string) {
    this.availableProcessScripts_map.delete(scriptId);
    this.availableProcessScripts = Array.from(this.availableProcessScripts_map.values());
  }
}
