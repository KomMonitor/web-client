import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  ReachabilitySessionSnapshot,
  ReachabilityStateService,
} from 'services/reachability-state-service/reachability-state.service';

export type ReachabilityScenario = ReachabilitySessionSnapshot;

/**
 * Persistence/repository layer for named reachability scenarios. Holds the saved-scenario
 * list; snapshotting and restoring the live session itself is delegated to
 * ReachabilityStateService.getSnapshot()/restoreSnapshot() so there is only one object
 * graph to clone, not several kept in sync by hand.
 */
@Injectable({
  providedIn: 'root',
})
export class ReachabilityScenarioHelperService {
  private reachabilityStateService = inject(ReachabilityStateService);

  private readonly scenarios = new BehaviorSubject<ReachabilityScenario[]>([]);
  public readonly scenarios$ = this.scenarios.asObservable();

  private readonly isochronesCalculationFinished = new Subject<boolean>();
  public readonly isochronesCalculationFinished$ =
    this.isochronesCalculationFinished.asObservable();

  get reachabilityScenarios(): ReachabilityScenario[] {
    return this.scenarios.value;
  }

  public loadActiveScenario(scenarioDataset: ReachabilityScenario): void {
    this.reachabilityStateService.restoreSnapshot(scenarioDataset);
    // since the config contains all info for active scenario we just reload all reachability maps
    this.isochronesCalculationFinished.next(true);
  }

  public addReachabilityScenario(): void {
    this.replaceOrAddScenario(this.reachabilityStateService.getSnapshot());
  }

  public replaceOrAddScenario(scenario: ReachabilityScenario): void {
    const currentScenarios = this.scenarios.getValue();
    const index = currentScenarios.findIndex((s) => s.scenarioName === scenario.scenarioName);

    if (index > -1) {
      currentScenarios.splice(index, 1, scenario);
      //this.kommonitorToastHelperService.displaySuccessToast("Erreichbarkeitsszenario aktualisiert", scenario.scenarioName);
    } else {
      currentScenarios.push(scenario);
      //this.kommonitorToastHelperService.displaySuccessToast("Erreichbarkeitsszenario neu angelegt", scenario.scenarioName);
    }
    this.scenarios.next(currentScenarios);
  }

  public cloneReachabilityScenario(scenario: ReachabilityScenario): void {
    const clone: ReachabilityScenario = JSON.parse(JSON.stringify(scenario));
    clone.scenarioName = 'Kopie - ' + clone.scenarioName;

    const currentScenarios = this.scenarios.getValue();
    currentScenarios.push(clone);
    this.scenarios.next(currentScenarios);
  }

  public removeReachabilityScenario(scenario: ReachabilityScenario): void {
    const currentScenarios = this.scenarios.getValue();
    const updatedScenarios = currentScenarios.filter(
      (s) => s.scenarioName !== scenario.scenarioName
    );
    this.scenarios.next(updatedScenarios);
  }

  public exportScenarios(): void {
    const scenariosString = JSON.stringify(this.scenarios.getValue());
    const fileName = 'Erreichbarkeitsszenarien_KomMonitor.json';
    const blob = new Blob([scenariosString], { type: 'application/json' });
    const data = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = 'JSON';
    a.target = '_self';
    a.rel = 'noopener noreferrer';
    a.click();
    a.remove();
    URL.revokeObjectURL(data);
  }

  /**
   * This method should be called from a component that handles the file input.
   * The component should pass the File object to this method.
   *
   * @param file The imported file with reachability scenarios.
   */
  public async importScenarios(file: File): Promise<void> {
    if (!file) {
      return;
    }
    try {
      const fileContent = await this.readFileContent(file);
      const importedScenarios = JSON.parse(fileContent as string) as ReachabilityScenario[];

      // Basic validation
      if (!Array.isArray(importedScenarios)) {
        throw new Error('Imported file is not a valid scenario array.');
      }

      const currentScenarios = this.scenarios.getValue();
      this.scenarios.next([...currentScenarios, ...importedScenarios]);
      //this.kommonitorToastHelperService.displaySuccessToast("Szenarien importiert", `${importedScenarios.length} Szenarien erfolgreich importiert.`);
    } catch (error) {
      console.error('Uploaded Reachability Scenarios File cannot be parsed.', error);
      //this.kommonitorToastHelperService.displayErrorToast("Import fehlgeschlagen", "Die Datei konnte nicht als Erreichbarkeitsszenario interpretiert werden.");
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = () => {
        if (typeof fileReader.result === 'string') {
          resolve(fileReader.result);
        } else {
          reject(new Error('Dateiinhalt konnte nicht als Text gelesen werden.'));
        }
      };

      fileReader.onerror = () => {
        reject(fileReader.error);
      };

      fileReader.readAsText(file);
    });
  }
}
