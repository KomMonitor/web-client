angular.module('kommonitorSingleFeatureMapHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorSingleFeatureMapHelper', [])
  .service(
    'kommonitorSingleFeatureMapHelperService', ['$rootScope', '__env', '$timeout',
    function ($rootScope, __env, $timeout) {

      var self = this;

      this.resourceType_point = "POINT";
      this.resourceType_line = "LINE";
      this.resourceType_polygon = "POLYGON";

      //leaflet map instance
      this.map;
      // layer holding the editable feature
      this.featureLayer;
      this.drawPointControl;
      this.geosearchControl;

      // backgroundLayer
      this.backgroundLayer = new L.tileLayer.grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors" });
      
      this.invalidateMap = function(){
        if (this.map){
          // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
          $timeout(function(){            
            self.map.invalidateSize(true);
          }, 500);
        }
      };

      this.initSingleFeatureGeoMap = function(domId, resourceType){
        // init leaflet map

        // add geometry editing tool for the respective RESOURCE TYPE

        // add geocoding plugin if it is POINT resource

        // register events that broadcast new geometry to other components

          if(this.map){
            this.map.off();
            this.map.remove();

            // var domNode = document.getElementById(domId);

						// 	while (domNode.hasChildNodes()) {
						// 		domNode.removeChild(domNode.lastChild);
						// 	}
          }

          this.map = L.map(domId, {
            center: [__env.initialLatitude, __env.initialLongitude],
            zoom: __env.initialZoomLevel,
            zoomDelta: 0.5,
            zoomSnap: 0.5,
            layers: [this.backgroundLayer]
          });

          L.control.scale().addTo(this.map);          

          if(resourceType == this.resourceType_point){
            this.initGeosearchControl();
          }          

          this.initDrawControl(resourceType);

          this.invalidateMap();
      };

      this.initGeosearchControl = function(){
        /////////////////////////////////////////////////////
          ///// LEAFLET GEOSEARCH SETUP
          /////////////////////////////////////////////////////
          var GeoSearchControl = window.GeoSearch.GeoSearchControl;
          var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;

          // remaining is the same as in the docs, accept for the var instead of const declarations
          var provider = new OpenStreetMapProvider(    
            {
              // params: {
              //   'accept-language': 'de', // render results in Dutch
              //   countrycodes: 'de', // limit search results to the Netherlands
              //   addressdetails: 1 // include additional address detail parts                
              // },
              params: {
                viewbox: "" + (Number(__env.initialLongitude) - 0.001) + "," + (Number(__env.initialLatitude) - 0.001) + "," + (Number(__env.initialLongitude) + 0.001) + "," + (Number(__env.initialLatitude) + 0.001)
              },
              searchUrl: 'https://geocoder.fbg-hsbo.de/nominatim/',
              reverseUrl: 'https://geocoder.fbg-hsbo.de/nominatim/reverse'
            }
          );

          console.log(provider);

          this.geosearchControl = new GeoSearchControl({
            position: "topright",
            provider: provider,
            style: 'button',
            autoComplete: true,
            autoCompleteDelay: 250,
            showMarker: false,                                   // optional: true|false  - default true
            showPopup: false,                                   // optional: true|false  - default false
            marker: {                                           // optional: L.Marker    - default L.Icon.Default
              icon: new L.Icon.Default(),
              draggable: false,
            },
            popupFormat: ({ query, result }) => result.label,   // optional: function    - default returns result label
            maxMarkers: 1,                                      // optional: number      - default 1
            retainZoomLevel: false,                             // optional: true|false  - default false
            animateZoom: true,                                  // optional: true|false  - default true
            autoClose: false,                                   // optional: true|false  - default false
            searchLabel: 'Suche nach Adressen ...',                       // optional: string      - default 'Enter address'
            keepResult: false                                   // optional: true|false  - default false
          });

          this.map.addControl(this.geosearchControl);
          // this.map.on('geosearch/showlocation', function(event){
          //   console.log(event);
          //   let geoJSON = {
          //     type: "Feature",
          //     geometry: {
          //       type: "Point",
          //       coordinates: [event.x, event.y]
          //     },
          //     properties: {

          //     }
          //   };
          //   $rootScope.$broadcast("onUpdateSingleFeatureGeometry", geoJSON);
          // });
      };

      this.initDrawControl = function(resourceType){
        // FeatureGroup is to store editable layers
        this.featureLayer = new L.FeatureGroup();

        L.drawLocal = {
          edit: {
            toolbar: {
              actions: {
                save: {
                  title: "Bearbeitung speichern.",
                  text: "Speichern",
                },
                cancel: {
                  title: "Bearbeitung verwerfen.",
                  text: "Abbrechen",
                },
                clearAll: {
                  title: "Alle Features entfernen.",
                  text: "Alle Features entfernen",
                },
              },
              buttons: {
                edit: "Layer editieren.",
                editDisabled: "Keine Layer zum editieren vorhanden.",
                remove: "Layer entfernen.",
                removeDisabled: "Keine Layer zum entfernen vorhanden.",
              },
            },
            handlers: {
              edit: {
                tooltip: {
                  text: "Bearbeitungspunkte oder Punktmarker ziehen, um Feature zu editieren.",
                  subtext: "Abbrechen klicken, um Bearbeitung zu verwefen.",
                },
              },
              remove: {
                tooltip: {
                  text: "Feature anklicken, um es zu entfernen",
                },
              },
            }
          },
          draw: {
            toolbar: {
              actions: {
                title: "Zeichnen abbrechen",
                text: "Abbrechen",
              },
              finish: {
                title: "Zeichnen beenden",
                text: "Beenden",
              },
              undo: {
                title: "Zuletzt gezeichneten Punkt entfernen",
                text: "Letzten Punkt entfernen",
              },
              buttons: {
                polyline: "Polylinie zeichnen",
                polygon: "Polygon zeichnen",
                rectangle: "Rechteck zeichnen",
                circle: "Kreis zeichnen",
                marker: "Punkt zeichnen",
                circlemarker: "Kreispunkt zeichnen",
              },
            },
            handlers: {
              circle: {
                tooltip: {
                  start: "Klicken und halten, um Kreis zu zeichnen.",
                },
                radius: "Radius",
              },
              circlemarker: {
                tooltip: {
                  start: "Klicken, um einen Punkt zu markieren.",
                },
              },
              marker: {
                tooltip: {
                  start: "Klicken, um einen Punkt zu markieren.",
                },
              },
              polygon: {
                tooltip: {
                  start: "Klicken, um ein Polygon zu beginnen.",
                  cont: "Klicken, um das Polygon weiter zu zeichnen.",
                  end: "Ersten Punkt anklicken, um Polygon zu beenden.",
                },
              },
              polyline: {
                error: "<strong>Fehler:</strong> Selbstueberschneidung!",
                tooltip: {
                  start: "Klicken, um eine Polylinie zu beginnen.",
                  cont: "Klicken, um die Polylinie weiter zu zeichnen.",
                  end: "Letzten Punkt erneut anklicken, um Polylinie zu beenden.",
                },
              },
              rectangle: {
                tooltip: {
                  start: "Klicken und halten, um Rechteck zu zeichnen.",
                },
              },
              simpleshape: {
                tooltip: {
                  end: "Maus loslassen, um Zeichnung zu beenden.",
                },
              },
            }
          }

        };

        this.map.addLayer(this.featureLayer);
        this.drawPointControl = new L.Control.Draw({
          edit: {
            featureGroup: this.featureLayer
          },
          draw: {
            polyline: resourceType == this.resourceType_line ? true : false,
            polygon: resourceType == this.resourceType_polygon ? true : false,
            rectangle: false,
            circle: false,
            circlemarker: resourceType == false
          },
          position: 'bottomright'

        });

        this.map.addControl(this.drawPointControl);

        this.map.on(L.Draw.Event.CREATED, function (event) {
          var layer = event.layer;

          self.featureLayer.addLayer(layer);

          console.log(event);
          $rootScope.$broadcast("onUpdateSingleFeatureGeometry", self.featureLayer.toGeoJSON());
        });

        this.map.on(L.Draw.Event.EDITED, function (event) {

          console.log(event);
          $rootScope.$broadcast("onUpdateSingleFeatureGeometry", self.featureLayer.toGeoJSON());
        });

        this.map.on(L.Draw.Event.DELETED, function (event) {

          console.log(event);

          $rootScope.$broadcast("onUpdateSingleFeatureGeometry", self.featureLayer.toGeoJSON());
        });
      };


    }]);
