import { Injectable, inject } from '@angular/core';
import * as L from 'leaflet';
import { OpenStreetMapProvider, SearchControl } from 'leaflet-geosearch';
import 'leaflet-measure';
import 'leaflet-search';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MAP_LAYER_GROUPS } from 'services/map-service/map-context';
import '../../../customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol';

/**
 * Sets up and owns the controls of the main map: grouped layer control,
 * scale bar, geosearch (address search), feature search and measurement
 * (map refactoring plan, Phase 4 — extracted from KommonitorMapComponent).
 */
@Injectable({
  providedIn: 'root',
})
export class MapControlsService {
  private envConfigService = inject(EnvConfigService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);

  private map: any;
  private layerControl: any;
  private searchControl: any;
  private geosearchControl: any;

  /** Creates the grouped layer control + scale bar and remembers the map. Returns the layer control. */
  initializeLayerControl(map: any, baseMaps: any, sortableLayers: string[]) {
    this.map = map;

    const groupedOverlays = {
      indicatorLayerGroupName: {},
      poiLayerGroupName: {},
      loiLayerGroupName: {},
      aoiLayerGroupName: {},
      wmsLayerGroupName: {},
      wfsLayerGroupName: {},
      fileLayerGroupName: {},
      reachabilityLayerGroupName: {},
      spatialUnitOutlineLayerGroupName: {},
    };

    this.layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, {
      collapsed: false,
      position: 'topleft',
      layers: sortableLayers,
    });

    delete this.layerControl._groupList;
    this.layerControl._groupList = ['', 'Raumebene Umringe', 'Indikatoren'];

    map.addControl(this.layerControl);

    // Hide Leaflet layer control button in favor of a custom button for opening the layer control group
    $('.leaflet-control-layers').hide();

    // Disable map interaction while the user's cursor is inside the control
    this.layerControl.getContainer().addEventListener('mouseover', () => {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    });
    this.layerControl.getContainer().addEventListener('mouseout', () => {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    });

    const scaleBar = L.control.scale({ position: 'bottomleft' });
    scaleBar.addTo(map);

    return this.layerControl;
  }

  initSearchControls() {
    const provider = new OpenStreetMapProvider({
      params: {
        'accept-language': 'de',
        countrycodes: 'de',
        addressdetails: 1, // include additional address detail parts
        viewbox:
          '' +
          (Number(this.envConfigService.initialLongitude) - 0.001) +
          ',' +
          (Number(this.envConfigService.initialLatitude) - 0.001) +
          ',' +
          (Number(this.envConfigService.initialLongitude) + 0.001) +
          ',' +
          (Number(this.envConfigService.initialLatitude) + 0.001),
      },
      searchUrl: this.envConfigService.targetUrlToGeocoderService + '/search',
      reverseUrl: this.envConfigService.targetUrlToGeocoderService + '/reverse',
    });

    this.geosearchControl = SearchControl({
      position: 'topleft',
      provider: provider,
      style: 'button',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,
      showPopup: false,
      marker: {
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ query, result }) => result.label,
      maxMarkers: 1,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: false,
      searchLabel: 'Suche nach Adressen ...',
      keepResult: false,
    });

    this.map.addControl(this.geosearchControl);

    this.searchControl = new this.MultipleResultsLeafletSearch({});
    this.searchControl.addTo(this.map);

    // expert controls start hidden (shown via toggleExpertControls)
    $('.geosearch').toggle();
    $('.leaflet-control-search').toggle();
  }

  initMeasureControl() {
    const measureOptions = {
      position: 'topleft',
      primaryLengthUnit: 'meters',
      secondaryLengthUnit: 'kilometers',
      primaryAreaUnit: 'sqmeters',
      activeColor: '#d15c54',
      completedColor: '#d15c54',
      decPoint: ',',
      thousandsSep: '.',
    };

    const measureControl = new L.Control.Measure(measureOptions);
    measureControl.addTo(this.map);

    // hide the button initially
    $('.leaflet-control-measure').toggle();

    // fix map-jumping with every click
    L.Control.Measure.include({
      // Prevent auto-panning when the capture marker is placed
      _setCaptureMarkerIcon: function () {
        // Turn off autoPan
        this._captureMarker.options.autoPanOnFocus = false;
        // Call the original icon setup
        this._captureMarker.setIcon(
          L.divIcon({
            iconSize: this._map.getSize().multiplyBy(2),
          })
        );
      },
    });
  }

  openLayerControl() {
    $('.leaflet-control-layers').toggle();
  }

  toggleExpertControls() {
    $('.leaflet-control-search').toggle();
    $('.geosearch').toggle();
    $('.leaflet-control-measure').toggle();
  }

  /** Rebuilds the feature search index from the currently displayed searchable layers. */
  updateSearchControl() {
    const isKomMonitorSpecificProperty = (propertyKey) => {
      if (propertyKey == 'outlier') {
        return true;
      } else if (propertyKey == this.envConfigService.VALID_START_DATE_PROPERTY_NAME) {
        return true;
      } else if (propertyKey == this.envConfigService.VALID_END_DATE_PROPERTY_NAME) {
        return true;
      } else if (propertyKey == 'bbox') {
        return true;
      } else if (propertyKey.includes(this.envConfigService.indicatorDatePrefix)) {
        return true;
      }
      return false;
    };

    setTimeout(() => {
      if (this.searchControl) {
        try {
          this.map.removeControl(this.searchControl);
          this.searchControl = undefined;
        } catch (error) {
          this.mapErrorNotificationService.displayMapApplicationError(error);
        }
      }

      // build L.featureGroup of available POI layers
      const featureLayers: any[] = [];

      for (const layerEntry of this.layerControl._layers) {
        if (layerEntry) {
          if (layerEntry.overlay) {
            if (this.map.hasLayer(layerEntry.layer)) {
              if (
                layerEntry.group.name === MAP_LAYER_GROUPS.poi ||
                layerEntry.group.name === MAP_LAYER_GROUPS.loi ||
                layerEntry.group.name === MAP_LAYER_GROUPS.aoi ||
                layerEntry.group.name === MAP_LAYER_GROUPS.indicator ||
                layerEntry.group.name === MAP_LAYER_GROUPS.wfs ||
                layerEntry.group.name === MAP_LAYER_GROUPS.file
              ) {
                featureLayers.push(layerEntry.layer);
              }
            }
          }
        }
      }

      let layerGroup;
      // if no relevant layers are currently displayed, then
      if (featureLayers.length === 0) {
        this.searchControl = new this.MultipleResultsLeafletSearch({});
        this.searchControl.addTo(this.map);

        $('.leaflet-control-search').toggle();
      } else {
        layerGroup = L.featureGroup(featureLayers);

        this.searchControl = new this.MultipleResultsLeafletSearch({
          position: 'topleft',
          layer: layerGroup,
          initial: false,
          propertyName: this.envConfigService.FEATURE_NAME_PROPERTY_NAME,
          textPlaceholder: 'Layer-Objekte nach Name und/oder ID filtern',
          textCancel: 'Abbrechen',
          textErr: 'Position nicht gefunden',
          hideMarkerOnCollapse: true,
          zoom: 15,
          autoResize: true,
          autoCollapse: false,
          autoType: true,
          formatData: function (json) {
            //adds coordinates to name.
            let propName = this.options.propertyName,
              propLoc = this.options.propertyLoc,
              i,
              jsonret = {};
            if (L.Util.isArray(propLoc))
              for (i in json) {
                if (!this._getPath(json[i], propName)) continue;
                jsonret[
                  this._getPath(json[i], propName) +
                    ' (' +
                    json[i][propLoc[0]] +
                    ',' +
                    json[i][propLoc[1]] +
                    ')'
                ] = L.latLng(json[i][propLoc[0]], json[i][propLoc[1]]);
              }
            else
              for (i in json) {
                if (!this._getPath(json[i], propName)) continue;
                jsonret[
                  this._getPath(json[i], propName) +
                    ' (' +
                    json[i][propLoc][0] +
                    ',' +
                    json[i][propLoc][1] +
                    ')'
                ] = L.latLng(this._getPath(json[i], propLoc));
              }
            return jsonret;
          },
          filterData: function (text, records) {
            let I,
              icase,
              regSearch,
              frecords = {};

            text = text.replace(/[.*+?^${}()|[\]\\]/g, ''); //sanitize remove all special characters
            if (text === '') return [];

            I = this.options.initial ? '^' : ''; //search only initial text
            icase = !this.options.casesensitive ? 'i' : undefined;

            regSearch = new RegExp(I + text, icase);

            for (const key in records) {
              // make a searchable string from all relevant feature properties
              let recordString = '';
              const record = records[key];
              const recordProperties = record.layer.feature.properties;

              for (const propertyKey in recordProperties) {
                if (recordProperties[propertyKey] && !isKomMonitorSpecificProperty(propertyKey)) {
                  recordString += recordProperties[propertyKey];
                }
              }

              if (regSearch.test(recordString)) frecords[key] = records[key];
            }

            return frecords;
          },
          buildTip: (text, val) => {
            let emString = '';

            if (val.layer.metadataObject) {
              if (val.layer.metadataObject.isPOI) {
                emString +=
                  '<i style="width:14px;height:14px;float:left;" class="awesome-marker-legend awesome-marker-legend-icon-' +
                  val.layer.metadataObject.poiMarkerColor +
                  '">';
                emString +=
                  "<span style='margin-left:3px; top:-2px; font-size:0.7em; color:" +
                  val.layer.metadataObject.poiSymbolColor +
                  ";' align='center' class='glyphicon glyphicon-" +
                  val.layer.metadataObject.poiSymbolBootstrap3Name +
                  "' aria-hidden='true'></span>";
                emString += '</i>';
              }
            } else {
              emString += "<i style='font-size:1.0em;' class='fas fa-sitemap'></i>";
            }
            return '<a href="" class="search-tip">' + emString + '&nbsp;&nbsp;' + text + '</a>';
          },
        });

        this.searchControl.addTo(this.map);

        $('.leaflet-control-search').toggle();
      }
    }, 200);
  }

  private MultipleResultsLeafletSearch = L.Control.Search.extend({
    _makeUniqueKey: function (featureName, featureId) {
      return featureName + ' (Name) - ' + featureId + ' (ID)';
    },

    _searchInLayer: function (layer, retRecords, propName) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Leaflet callback relies on the dynamic `this`
      const self = this;
      let loc;
      let key_withUniqueID;

      if (layer instanceof L.Control.Search.Marker) return;

      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        if (self._getPath(layer.options, propName)) {
          loc = layer.getLatLng();
          loc.layer = layer;
          retRecords[self._getPath(layer.options, propName)] = loc;
        } else if (self._getPath(layer.feature.properties, propName)) {
          loc = layer.getLatLng();
          loc.layer = layer;
          key_withUniqueID = this._makeUniqueKey(
            self._getPath(layer.feature.properties, propName),
            layer.feature.properties.ID
          );
          retRecords[key_withUniqueID] = loc;
        } else {
          console.warn("propertyName '" + propName + "' not found in marker");
        }
      } else if (
        layer instanceof L.Path ||
        layer instanceof L.Polyline ||
        layer instanceof L.Polygon
      ) {
        if (self._getPath(layer.options, propName)) {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          retRecords[self._getPath(layer.options, propName)] = loc;
        } else if (self._getPath(layer.feature.properties, propName)) {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          key_withUniqueID = this._makeUniqueKey(
            self._getPath(layer.feature.properties, propName),
            layer.feature.properties.ID
          );
          retRecords[key_withUniqueID] = loc;
        } else {
          console.warn("propertyName '" + propName + "' not found in shape");
        }
      } else if (Object.prototype.hasOwnProperty.call(layer, 'feature')) {
        //GeoJSON
        if (Object.prototype.hasOwnProperty.call(layer.feature.properties, propName)) {
          key_withUniqueID = this._makeUniqueKey(
            self._getPath(layer.feature.properties, propName),
            layer.feature.properties.ID
          );
          if (layer.getLatLng && typeof layer.getLatLng === 'function') {
            loc = layer.getLatLng();
            loc.layer = layer;
            retRecords[key_withUniqueID] = loc;
          } else if (layer.getBounds && typeof layer.getBounds === 'function') {
            loc = layer.getBounds().getCenter();
            loc.layer = layer;
            retRecords[key_withUniqueID] = loc;
          } else {
            console.warn('Unknown type of Layer');
          }
        } else {
          console.warn("propertyName '" + propName + "' not found in feature");
        }
      } else if (layer instanceof L.LayerGroup) {
        layer.eachLayer(function (layer) {
          self._searchInLayer(layer, retRecords, propName);
        });
      }
    },
    _defaultMoveToLocation: function (latlng, title, map) {
      if (this.options.zoom) this._map.setView(latlng, this.options.zoom);
      else this._map.panTo(latlng);

      // add collapse after click on item
      this.collapse();
    },
    _handleAutoresize: function () {
      let maxWidth;

      if (!this._map) {
        this._map = this.map;
      }

      if (this._input.style.maxWidth !== this._map._container.offsetWidth) {
        maxWidth = this._map._container.clientWidth;

        // other side margin + padding + width border + width search-button + width search-cancel
        maxWidth -= 10 + 20 + 1 + 30 + 22;

        this._input.style.maxWidth = maxWidth.toString() + 'px';
      }

      if (
        this.options.autoResize &&
        this._container.offsetWidth + 20 < this._map._container.offsetWidth
      ) {
        this._input.size =
          this._input.value.length < this._inputMinSize
            ? this._inputMinSize
            : this._input.value.length;
      }
    },
  });
}
