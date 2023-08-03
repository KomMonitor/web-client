"use strict";
angular.module('kommonitorSingleFeatureMapHelper', ['kommonitorDataExchange']);
angular
    .module('kommonitorSingleFeatureMapHelper', [])
    .service('kommonitorSingleFeatureMapHelperService', ['$rootScope', '__env', '$timeout',
    function ($rootScope, __env, $timeout) {
        var self = this;
        this.resourceType_point = "POINT";
        this.resourceType_line = "LINE";
        this.resourceType_polygon = "POLYGON";
        //leaflet map instance
        this.map;
        this.layerControl;
        // layer holding the editable feature
        this.featureLayer;
        this.drawControl;
        this.geosearchControl;
        // backgroundLayer
        this.backgroundLayer;
        /*
           * L.TileLayer.Grayscale is a regular tilelayer with grayscale makeover.
           */
        L.TileLayer.Grayscale = L.TileLayer.extend({
            options: {
                quotaRed: 21,
                quotaGreen: 71,
                quotaBlue: 8,
                quotaDividerTune: 0,
                quotaDivider: function () {
                    return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
                }
            },
            initialize: function (url, options) {
                options = options || {};
                options.crossOrigin = true;
                L.TileLayer.prototype.initialize.call(this, url, options);
                this.on('tileload', function (e) {
                    this._makeGrayscale(e.tile);
                });
            },
            _createTile: function () {
                var tile = L.TileLayer.prototype._createTile.call(this);
                tile.crossOrigin = "Anonymous";
                return tile;
            },
            _makeGrayscale: function (img) {
                if (img.getAttribute('data-grayscaled'))
                    return;
                img.crossOrigin = '';
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
                var pix = imgd.data;
                for (var i = 0, n = pix.length; i < n; i += 4) {
                    pix[i] = pix[i + 1] = pix[i + 2] = (this.options.quotaRed * pix[i] + this.options.quotaGreen * pix[i + 1] + this.options.quotaBlue * pix[i + 2]) / this.options.quotaDivider();
                }
                ctx.putImageData(imgd, 0, 0);
                img.setAttribute('data-grayscaled', true);
                img.src = canvas.toDataURL();
            }
        });
        this.invalidateMap = function () {
            if (this.map) {
                // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
                $timeout(function () {
                    self.map.invalidateSize(true);
                }, 500);
            }
        };
        this.zoomToDataLayer = function () {
            if (this.map && this.dataLayer) {
                // just wait a bit in order to ensure that map element is visible to make invalidateSize actually work
                $timeout(function () {
                    self.map.fitBounds(self.dataLayer.getBounds());
                }, 750);
            }
        };
        this.initSingleFeatureGeoMap = function (domId, resourceType) {
            // init leaflet map
            // add geometry editing tool for the respective RESOURCE TYPE
            // add geocoding plugin if it is POINT resource
            // register events that broadcast new geometry to other components
            if (this.map) {
                this.map.off();
                this.map.remove();
                // var domNode = document.getElementById(domId);
                // 	while (domNode.hasChildNodes()) {
                // 		domNode.removeChild(domNode.lastChild);
                // 	}
            }
            // backgroundLayer
            this.backgroundLayer = new L.TileLayer.Grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { minZoom: __env.minZoomLevel, maxZoom: __env.maxZoomLevel, attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors" });
            this.map = L.map(domId, {
                center: [__env.initialLatitude, __env.initialLongitude],
                zoom: __env.initialZoomLevel,
                zoomDelta: 0.5,
                zoomSnap: 0.5,
                layers: [this.backgroundLayer]
            });
            L.control.scale().addTo(this.map);
            // this.initLayerControl();
            if (resourceType == this.resourceType_point) {
                this.initGeosearchControl();
            }
            this.initDrawControl(resourceType);
            this.invalidateMap();
        };
        this.initLayerControl = function () {
            let baseLayers = {
                "OpenStreetMap Graustufen": this.backgroundLayer
            };
            let overlays = {};
            this.layerControl = L.control.layers(baseLayers, overlays, { position: "topleft" }).addTo(this.map);
        };
        this.initGeosearchControl = function () {
            /////////////////////////////////////////////////////
            ///// LEAFLET GEOSEARCH SETUP
            /////////////////////////////////////////////////////
            var GeoSearchControl = window.GeoSearch.GeoSearchControl;
            var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;
            // remaining is the same as in the docs, accept for the var instead of const declarations
            var provider = new OpenStreetMapProvider({
                params: {
                    'accept-language': 'de',
                    countrycodes: 'de',
                    addressdetails: 1,
                    viewbox: "" + (Number(__env.initialLongitude) - 0.001) + "," + (Number(__env.initialLatitude) - 0.001) + "," + (Number(__env.initialLongitude) + 0.001) + "," + (Number(__env.initialLatitude) + 0.001)
                },
                searchUrl: __env.targetUrlToGeocoderService + '/search',
                reverseUrl: __env.targetUrlToGeocoderService + '/reverse'
            });
            console.log(provider);
            this.geosearchControl = new GeoSearchControl({
                position: "topright",
                provider: provider,
                style: 'button',
                autoComplete: true,
                autoCompleteDelay: 250,
                showMarker: false,
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
                keepResult: false // optional: true|false  - default false
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
        this.initDrawControlOptions = function (resourceType, enableDrawToolbar) {
            let options = {
                edit: {
                    featureGroup: this.featureLayer
                },
                position: 'bottomright'
            };
            if (enableDrawToolbar) {
                options.draw = {
                    polyline: resourceType == this.resourceType_line ? true : false,
                    polygon: resourceType == this.resourceType_polygon ? true : false,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: resourceType == this.resourceType_point ? true : false
                };
            }
            else {
                options.draw = false;
            }
            return options;
        };
        this.initDrawControl = function (resourceType) {
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
            this.drawControlOptions = this.initDrawControlOptions(resourceType, true);
            this.drawControl = new L.Control.Draw(this.drawControlOptions);
            this.map.addControl(this.drawControl);
            this.map.on(L.Draw.Event.CREATED, function (event) {
                var layer = event.layer;
                self.featureLayer.addLayer(layer);
                // disable draw tools
                self.map.removeControl(self.drawControl);
                self.drawControl = new L.Control.Draw(self.initDrawControlOptions(resourceType, false));
                self.map.addControl(self.drawControl);
                $rootScope.$broadcast("onUpdateSingleFeatureGeometry", self.featureLayer.toGeoJSON());
            });
            this.map.on(L.Draw.Event.EDITED, function (event) {
                $rootScope.$broadcast("onUpdateSingleFeatureGeometry", self.featureLayer.toGeoJSON());
            });
            this.map.on(L.Draw.Event.DELETED, function (event) {
                // reinit featureGroupLayer
                self.featureLayer = new L.FeatureGroup();
                // enable draw tools
                self.map.removeControl(self.drawControl);
                self.drawControl = new L.Control.Draw(self.initDrawControlOptions(resourceType, true));
                self.map.addControl(self.drawControl);
                $rootScope.$broadcast("onUpdateSingleFeatureGeometry", undefined);
            });
        };
        /**
        * binds the popup of a clicked output
        * to layer.feature.properties.popupContent
        */
        this.onEachFeatureGeoresource = function (feature, layer) {
            layer.on({
                click: function () {
                    var popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
                    for (var p in feature.properties) {
                        popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
                    }
                    popupContent += '</table></div>';
                    layer.bindPopup(popupContent);
                }
            });
        };
        this.addDataLayertoSingleFeatureGeoMap = function (geoJSON) {
            if (this.map) {
                this.dataLayer = L.geoJSON(geoJSON, {
                    pointToLayer: function (geoJsonPoint, latlng) {
                        return L.circleMarker(latlng, {
                            radius: 6
                        });
                    },
                    style: function (feature) {
                        return {
                            color: "red",
                            weight: 1,
                            opacity: 1
                        };
                    },
                    onEachFeature: self.onEachFeatureGeoresource
                });
                // this.layerControl.addOverlay(this.dataLayer, "weitere Objekte des Datensatzes");
                this.dataLayer.addTo(this.map);
                this.map.fitBounds(this.dataLayer.getBounds());
                this.invalidateMap();
            }
        };
    }]);
//# sourceMappingURL=kommonitor-single-feature-map-helper-service.module.js.map