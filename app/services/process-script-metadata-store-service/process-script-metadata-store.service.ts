import { Injectable, signal } from '@angular/core';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';

/**
 * Process-schedule store. Extracted in the Prio 7 god-service split.
 *
 * Holds the available schedules + id-lookup map. Keyed by `scheduleID` since
 * the switch to the OGC Processes API; the former `scriptId` no longer exists.
 */
@Injectable({
  providedIn: 'root',
})
export class ProcessScriptMetadataStoreService {
  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _availableProcessScripts = signal<ProcessSchedule[]>([]);
  get availableProcessScripts(): ProcessSchedule[] {
    return this._availableProcessScripts();
  }
  set availableProcessScripts(value: ProcessSchedule[]) {
    this._availableProcessScripts.set(value);
  }
  availableProcessScripts_map = new Map<string, ProcessSchedule>();

  setProcessScripts(schedules: ProcessSchedule[]) {
    this.availableProcessScripts_map = new Map(
      schedules.map((schedule) => [schedule.scheduleID, schedule])
    );
    this.availableProcessScripts = Array.from(this.availableProcessScripts_map.values());
  }

  /**
   * Adds or replaces a single schedule. Used by the job-watching path, which
   * refetches a schedule whenever one of its jobs finishes.
   */
  replaceSingleProcessScriptMetadata(schedule: ProcessSchedule) {
    this.availableProcessScripts_map.set(schedule.scheduleID, schedule);
    this.availableProcessScripts = Array.from(this.availableProcessScripts_map.values());
  }

  deleteSingleProcessScriptMetadata(scheduleID: string) {
    this.availableProcessScripts_map.delete(scheduleID);
    this.availableProcessScripts = Array.from(this.availableProcessScripts_map.values());
  }
}
