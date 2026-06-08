import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ExportModeService {
  readonly exportMode = signal(false);

  toggle(): void {
    this.exportMode.update((v) => !v);
  }
}
