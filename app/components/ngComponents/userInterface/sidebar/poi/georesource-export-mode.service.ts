import { Injectable, signal } from "@angular/core";
import { Georessource } from "components/ngComponents/userInterface/exporting/models";
import { GeoresourcesDataset } from "components/ngComponents/models/georesources.models";

@Injectable({ providedIn: "root" })
export class GeoresourceExportModeService {
  readonly exportMode = signal(false);

  toggle(): void {
    this.exportMode.update((v) => !v);
  }

  toExportGeoresource(dataset: GeoresourcesDataset): Georessource {
    return {
      id: dataset.georesourceId ?? "",
      name: dataset.datasetName ?? dataset.georesourceName ?? "",
      availableTimestamps: (dataset.availablePeriodsOfValidity ?? [])
        .map((p) => p.startDate)
        .filter((d): d is string => !!d),
    };
  }
}
