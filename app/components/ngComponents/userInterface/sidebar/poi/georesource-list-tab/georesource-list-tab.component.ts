import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconTranslate } from 'pipes/icon-translate.pipe';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceLayerService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { ExportItemCheckboxComponent } from 'components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component';
import { GeoresourceExportModeService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service';

/**
 * The "Alphabetische Listen" tab: per-type expandable boxes (POI/LOI/AOI/WMS/WFS)
 * listing the keyword-filtered georesources alphabetically. Reads the filtered
 * collections from {@link GeoresourceMetadataStoreService}; layer/favourite side effects come
 * from the shared services. Tree-coupled selection (toggle/zoom) is delegated to
 * the host {@link PoiComponent}.
 */
@Component({
  selector: 'app-georesource-list-tab',
  templateUrl: './georesource-list-tab.component.html',
  styleUrls: ['./georesource-list-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExpandableBoxComponent,
    IconTranslate,
    ExportItemCheckboxComponent,
  ],
})
export class GeoresourceListTabComponent {
  protected exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected metadataExportService = inject(MetadataExportService);
  protected georesourceStore = inject(GeoresourceMetadataStoreService);
  protected layerService = inject(GeoresourceLayerService);
  protected favoritesService = inject(GeoresourceFavoritesService);
  protected ogcService = inject(OgcService);
  protected exportMode = inject(GeoresourceExportModeService);
  private envConfigService = inject(EnvConfigService);

  @Input() showFavSelection = false;

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();

  isGeoresourceInfrastructureEnabled(id) {
    return this.envConfigService.enabledGeoresourcesInfrastructure.indexOf(id) !== -1;
  }

  isGeoresourceGeoserviceEnabled(id) {
    return this.envConfigService.enabledGeoresourcesGeoservices.indexOf(id) !== -1;
  }
}
