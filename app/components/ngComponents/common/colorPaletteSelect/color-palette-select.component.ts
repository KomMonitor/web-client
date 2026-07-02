import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ColorPaletteSwatchComponent } from 'components/ngComponents/common/colorPaletteSwatch/color-palette-swatch.component';
import { mergeColorSchemes } from 'components/ngComponents/userInterface/kommonitorClassification/colors';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'app-color-palette-select',
  templateUrl: './color-palette-select.component.html',
  styleUrls: ['./color-palette-select.component.scss'],
  standalone: true,
  imports: [OverlayModule, ColorPaletteSwatchComponent],
})
export class ColorPaletteSelectComponent {
  private envConfigService = inject(EnvConfigService);

  /**
   * Optional pre-selected colorbrewer scheme name. When set it is shown as selected in the
   * preview; otherwise the preview falls back to the 'Blues' scheme.
   */
  @Input() selectedColorScheme?: string;

  /** Emits the colorbrewer scheme name the user picked; the parent owns the side effects. */
  @Output() colorSchemeSelected = new EventEmitter<string>();

  clrSelectVisible = false;

  /** Prefer opening below the trigger, fall back to above when there's no room. */
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  /** Built-in colorbrewer schemes merged with any custom schemes from config (custom wins). */
  readonly colorbrewerPalettes = this.buildPalettes();

  onClickColorBrewerEntry(colorPaletteEntry) {
    this.colorSchemeSelected.emit(colorPaletteEntry.paletteName);
    this.clrSelectVisible = false;
  }

  private buildPalettes(): { paletteName: string; paletteArrayObject: any }[] {
    const schemes = mergeColorSchemes(this.envConfigService.customColorSchemes);
    return Object.keys(schemes).map((paletteName) => ({
      paletteName,
      paletteArrayObject: schemes[paletteName],
    }));
  }
}
