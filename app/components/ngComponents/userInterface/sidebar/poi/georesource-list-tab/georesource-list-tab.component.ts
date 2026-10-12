import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceLayerService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { GeoresourceVectorElementComponent } from 'components/ngComponents/userInterface/sidebar/poi/georesource-vector-element/georesource-vector-element.component';
import { GeoresourceWmsElementComponent } from 'components/ngComponents/userInterface/sidebar/poi/georesource-wms-element/georesource-wms-element.component';
import { GeoresourceWfsElementComponent } from 'components/ngComponents/userInterface/sidebar/poi/georesource-wfs-element/georesource-wfs-element.component';

/**
 * The "Alphabetische Listen" tab: per-type expandable boxes (POI/LOI/AOI/WMS/WFS)
 * listing the keyword-filtered georesources alphabetically as card-style rows
 * (the same `app-georesource-*-element` components the "Datenkatalog" tab uses).
 * Reads the filtered collections from {@link GeoresourceMetadataStoreService};
 * layer/favourite side effects come from the shared services. Tree-coupled
 * selection (toggle/zoom) is delegated to the host {@link PoiComponent}.
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
    GeoresourceVectorElementComponent,
    GeoresourceWmsElementComponent,
    GeoresourceWfsElementComponent,
  ],
})
export class GeoresourceListTabComponent {
  protected georesourceStore = inject(GeoresourceMetadataStoreService);
  protected layerService = inject(GeoresourceLayerService);
  protected favoritesService = inject(GeoresourceFavoritesService);
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
