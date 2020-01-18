angular.module('georesourceEditMetadataModal').component('georesourceEditMetadataModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceEditMetadataModal/georesource-edit-metadata-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env',function GeoresourceEditMetadataModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.currentGeoresourceDataset;

		/*	POST BODY
		{
		"isLOI": false,
		"metadata": {
		"note": "note",
		"literature": "literature",
		"updateInterval": "ARBITRARY",
		"sridEPSG": 0.8008281904610115,
		"datasource": "datasource",
		"contact": "contact",
		"lastUpdate": "2000-01-23",
		"description": "description",
		"databasis": "databasis"
		},
		"allowedRoles": [
		"allowedRoles",
		"allowedRoles"
		],
		"datasetName": "datasetName",
		"poiSymbolBootstrap3Name": "poiSymbolBootstrap3Name",
		"poiSymbolColor": "white",
		"isAOI": false,
		"loiDashArrayString": "loiDashArrayString",
		"topicReference": "topicReference",
		"poiMarkerColor": "white",
		"isPOI": false,
		"loiColor": "loiColor",
		"aoiColor": "aoiColor"
		}
		*/

		//Date picker
		$('#georesourceEditLastUpdateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

		$scope.loadingData = false;

		$scope.georesourceMetadataStructure = {
			"metadata": {
				"note": "an optional note",
				"literature": "optional text about literature",
				"updateInterval": "YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY",
				"sridEPSG": 4326,
				"datasource": "text about data source",
				"contact": "text about contact details",
				"lastUpdate": "YYYY-MM-DD",
				"description": "description about spatial unit dataset",
				"databasis": "text about data basis",
			},
			"datasetName": "Name of georesource dataset",
			"isPOI": "boolean parameter for point of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"isLOI": "boolean parameter for lines of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"isAOI": "boolean parameter for area of interest dataset - only one of isPOI, isLOI, isAOI can be true",
			"poiSymbolBootstrap3Name": "glyphicon name of bootstrap 3 symbol to use for a POI resource",
			"poiSymbolColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
			"loiDashArrayString": "dash array string value - e.g. 20 20",
			"poiMarkerColor": "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
			"loiColor": "color for lines of interest dataset",
			"aoiColor": "color for area of interest dataset"
		};

		$scope.georesourceMetadataStructure_pretty = kommonitorDataExchangeService.syntaxHighlightJSON($scope.georesourceMetadataStructure);

		$scope.metadataImportSettings;
		$scope.georesourceMetadataImportError;
		$scope.georesourceMetadataImportErrorAlert;

		$scope.datasetName = undefined;
		$scope.datasetNameInvalid = false;

		$scope.metadata = {};
		$scope.metadata.note = undefined;
		$scope.metadata.literature = undefined;
		$scope.metadata.updateInterval = undefined;
		$scope.metadata.sridEPSG = undefined;
		$scope.metadata.datasource = undefined;
		$scope.metadata.databasis = undefined;
		$scope.metadata.contact = undefined;
		$scope.metadata.lastUpdate = undefined;
		$scope.metadata.description = undefined;

		$scope.georesourceType = "poi";
		$scope.isPOI = true;
		$scope.isLOI = false;
		$scope.isAOI = false;
		$scope.selectedPoiMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[0];
		$scope.selectedPoiSymbolColor = kommonitorDataExchangeService.availablePoiMarkerColors[1];
		$scope.selectedLoiDashArrayObject = kommonitorDataExchangeService.availableLoiDashArrayObjects[0];
		$scope.loiColor = "#bf3d2c";
		$scope.aoiColor = "#bf3d2c";
		$scope.selectedPoiIconName = "home";

		$scope.iconPickerOptions = {
			align: 'center', // Only in div tag
	    arrowClass: 'btn-default',
	    arrowPrevIconClass: 'fas fa-angle-left',
	    arrowNextIconClass: 'fas fa-angle-right',
	    cols: 10,
	    footer: true,
	    header: true,
	    icon: 'glyphicon-' + $scope.selectedPoiIconName,
	    iconset: 'glyphicon',
	    labelHeader: '{0} von {1} Seiten',
	    labelFooter: '{0} - {1} von {2} Icons',
	    placement: 'bottom', // Only in button tag
	    rows: 6,
	    search: true,
	    searchText: 'Stichwortsuche (Bootstrap Glyphicons)',
	    selectedClass: 'btn-success',
	    unselectedClass: ''
		};

		$('#poiSymbolEditPicker').iconpicker($scope.iconPickerOptions);

		$('#poiSymbolEditPicker').on('change', function(e) {
		    console.log(e.icon);
				// split up due to current data management request structure where we expect only the last name of Bootstrap 3.3.7 glyphicon name
				// i.e. "home" for "glyphicon-home"
				$scope.selectedPoiIconName = e.icon.split("-")[1];
				console.log($scope.selectedPoiIconName);
		});

		$scope.loadingData = false;

		// initialize loiDashArray dropdown
		setTimeout(function(){
			for(var i=0; i<kommonitorDataExchangeService.availableLoiDashArrayObjects.length; i++){
				$("#loiDashArrayEditDropdownItem-" + i).html(kommonitorDataExchangeService.availableLoiDashArrayObjects[i].svgString);
			}

			$("#loiDashArrayEditDropdownButton").html($scope.selectedLoiDashArrayObject.svgString);
		},1000);



		// initialize colorPickers
		$('#loiColorEditPicker').colorpicker();
		$('#aoiColorEditPicker').colorpicker();


		$scope.successMessagePart = undefined;
		$scope.errorMessagePart = undefined;

		$scope.$on("onEditGeoresourceMetadata", function (event, georesourceDataset) {

			$scope.currentGeoresourceDataset = georesourceDataset;

			$scope.resetGeoresourceEditMetadataForm();

		});


		$scope.resetGeoresourceEditMetadataForm = function(){

			$scope.datasetName = $scope.currentGeoresourceDataset.datasetName;
			$scope.datasetNameInvalid = false;

			$scope.metadata = {};
			$scope.metadata.note = $scope.currentGeoresourceDataset.metadata.note;
			$scope.metadata.literature = $scope.currentGeoresourceDataset.metadata.literature;
			$scope.metadata.sridEPSG = 4326;
			$scope.metadata.datasource = $scope.currentGeoresourceDataset.metadata.datasource;
			$scope.metadata.databasis = $scope.currentGeoresourceDataset.metadata.databasis;
			$scope.metadata.contact = $scope.currentGeoresourceDataset.metadata.contact;
			$scope.metadata.description = $scope.currentGeoresourceDataset.metadata.description;

			$scope.metadata.lastUpdate = $scope.currentGeoresourceDataset.metadata.lastUpdate;
			// $('#georesourceEditLastUpdateDatepicker').data({date: $scope.currentGeoresourceDataset.metadata.lastUpdate});
			$('#georesourceEditLastUpdateDatepicker').datepicker('setDate', $scope.currentGeoresourceDataset.metadata.lastUpdate);

			kommonitorDataExchangeService.updateIntervalOptions.forEach(function(option){
				if(option.apiName === $scope.currentGeoresourceDataset.metadata.updateInterval){
					$scope.metadata.updateInterval = option;
				}
			});

			$scope.isPOI = $scope.currentGeoresourceDataset.isPOI;
			$scope.isLOI = $scope.currentGeoresourceDataset.isLOI;
			$scope.isAOI = $scope.currentGeoresourceDataset.isAOI;
			if($scope.isPOI){
				$scope.georesourceType = "poi";
			}
			else if($scope.isLOI){
				$scope.georesourceType = "loi";
			}
			else {
				$scope.georesourceType = "aoi";
			}
			kommonitorDataExchangeService.availablePoiMarkerColors.forEach(function(option){
				if(option.colorName === $scope.currentGeoresourceDataset.poiMarkerColor){
					$scope.selectedPoiMarkerColor = option;
				}
				if(option.colorName === $scope.currentGeoresourceDataset.poiSymbolColor){
					$scope.selectedPoiSymbolColor = option;
				}
			});
			kommonitorDataExchangeService.availableLoiDashArrayObjects.forEach(function(option){
				if(option.dashArrayValue === $scope.currentGeoresourceDataset.loiDashArrayString){
					$scope.selectedLoiDashArrayObject = option;
				}
			});
			$scope.loiColor = $scope.currentGeoresourceDataset.loiColor;
			$scope.aoiColor = $scope.currentGeoresourceDataset.aoiColor;
			$scope.selectedPoiIconName = $scope.currentGeoresourceDataset.poiSymbolBootstrap3Name;

			setTimeout(function(){
				$("#poiSymbolEditPicker").val("").iconpicker('setIcon', 'glyphicon-' + $scope.currentGeoresourceDataset.poiSymbolBootstrap3Name);
				// $("#poiSymbolPicker i").css('glyphicon glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
				// $("#poiSymbolPicker input").css('glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
			}, 200);

			$scope.successMessagePart = undefined;
			$scope.errorMessagePart = undefined;
			$("#georesourceEditMetadataSuccessAlert").hide();
			$("#georesourceEditMetadataErrorAlert").hide();
		};

		$scope.checkDatasetName = function(){
			$scope.datasetNameInvalid = false;
			kommonitorDataExchangeService.availableGeoresources.forEach(function(georesource){
				if (georesource.datasetName === $scope.datasetName){
					$scope.datasetNameInvalid = true;
					return;
				}
			});
		};

		$scope.editGeoresourceMetadata = function(){

			var patchBody =
			{
				"metadata": {
					"note": $scope.metadata.note,
					"literature": $scope.metadata.literature,
					"updateInterval": $scope.metadata.updateInterval.apiName,
					"sridEPSG": $scope.metadata.sridEPSG,
					"datasource": $scope.metadata.datasource,
					"contact": $scope.metadata.contact,
					"lastUpdate": $scope.metadata.lastUpdate,
					"description": $scope.metadata.description,
					"databasis": $scope.metadata.databasis,
					"sridEPSG": 4326
				},
				"datasetName": $scope.datasetName,
			  "isAOI": $scope.isAOI,
				"isLOI": $scope.isLOI,
				"isPOI": $scope.isPOI,
			  "topicReference": null
			};

			if($scope.isPOI){
				patchBody["poiSymbolBootstrap3Name"] = $scope.selectedPoiIconName;
				patchBody["poiSymbolColor"] = $scope.selectedPoiSymbolColor.colorName;
				patchBody["poiMarkerColor"] = $scope.selectedPoiMarkerColor.colorName;

				patchBody["loiDashArrayString"] = null;
				patchBody["loiColor"] = null;

				patchBody["aoiColor"] = null;
			}
			else if($scope.isLOI){
				patchBody["poiSymbolBootstrap3Name"] = null;
				patchBody["poiSymbolColor"] = null;
				patchBody["poiMarkerColor"] = null;

				patchBody["loiDashArrayString"] = $scope.selectedLoiDashArrayObject.dashArrayValue;
				patchBody["loiColor"] = $scope.loiColor;

				patchBody["aoiColor"] = null;
			}
			else if($scope.isAOI){
				patchBody["poiSymbolBootstrap3Name"] = null;
				patchBody["poiSymbolColor"] = null;
				patchBody["poiMarkerColor"] = null;

				patchBody["loiDashArrayString"] = null;
				patchBody["loiColor"] = null;

				patchBody["aoiColor"] = $scope.aoiColor;
			}

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + $scope.currentGeoresourceDataset.georesourceId,
				method: "PATCH",
				data: patchBody
				// headers: {
				//    'Content-Type': undefined
				// }
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					$scope.successMessagePart = $scope.datasetName;

					$rootScope.$broadcast("refreshGeoresourceOverviewTable");
					$("#georesourceEditMetadataSuccessAlert").show();
					$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#georesourceEditMetadataErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#georesourceEditMetadataSuccessAlert").hide();
					// }, 3000);
			});
		};

		$scope.onImportGeoresourceEditMetadata = function(){

			$scope.georesourceMetadataImportError = "";

			$("#georesourceEditMetadataImportFile").files = [];

			// trigger file chooser
			$("#georesourceEditMetadataImportFile").click();

		};

		$(document).on("change", "#georesourceEditMetadataImportFile" ,function(){

			console.log("Importing Georesource metadata for Edit Georesource Form");

			// get the file
			var file = document.getElementById('georesourceEditMetadataImportFile').files[0];
			$scope.parseMetadataFromFile(file);
		});

		$scope.parseMetadataFromFile = function(file){
			var fileReader = new FileReader();

			fileReader.onload = function(event) {

				try{
					$scope.parseFromMetadataFile(event);
				}
				catch(error){
					console.error("Uploaded Metadata File cannot be parsed.");
					$scope.georesourceMetadataImportError = "Uploaded Metadata File cannot be parsed correctly";
					document.getElementById("georesourcesEditMetadataPre").innerHTML = $scope.georesourceMetadataStructure_pretty;
					$("#georesourceEditMetadataImportErrorAlert").show();
				}

			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.parseFromMetadataFile = function(event){
			// $scope.geoJsonString = event.target.result;
			$scope.metadataImportSettings = JSON.parse(event.target.result);

			if(! $scope.metadataImportSettings.metadata){
				console.error("uploaded Metadata File cannot be parsed - wrong structure.");
				$scope.georesourceMetadataImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster &uuml;berein.";
				document.getElementById("georesourcesEditMetadataPre").innerHTML = $scope.georesourceMetadataStructure_pretty;
				$("#georesourceEditMetadataImportErrorAlert").show();
			}

				$scope.metadata = {};
				$scope.metadata.note = $scope.metadataImportSettings.metadata.note;
				$scope.metadata.literature = $scope.metadataImportSettings.metadata.literature;
				kommonitorDataExchangeService.updateIntervalOptions.forEach(function(option){
					if(option.apiName === $scope.metadataImportSettings.metadata.updateInterval){
						$scope.metadata.updateInterval = option;
					}
				});
				$scope.metadata.sridEPSG = $scope.metadataImportSettings.metadata.sridEPSG;
				$scope.metadata.datasource = $scope.metadataImportSettings.metadata.datasource;
				$scope.metadata.contact = $scope.metadataImportSettings.metadata.contact;
				$scope.metadata.lastUpdate = $scope.metadataImportSettings.metadata.lastUpdate;
				// initialize date
				$('#georesourceEditLastUpdateDatepicker').datepicker('setDate', $scope.metadata.lastUpdate);

				$scope.metadata.description = $scope.metadataImportSettings.metadata.description;
				$scope.metadata.databasis = $scope.metadataImportSettings.metadata.databasis;

				$scope.datasetName = $scope.metadataImportSettings.datasetName;

				// georesource specific properties

				$scope.isPOI = $scope.metadataImportSettings.isPOI;
				$scope.isLOI = $scope.metadataImportSettings.isLOI;
				$scope.isAOI = $scope.metadataImportSettings.isAOI;
				if($scope.metadataImportSettings.isPOI){
						$scope.georesourceType = "poi";
				}
				else if($scope.metadataImportSettings.isLOI){
						$scope.georesourceType = "loi";
				}
				else{
						$scope.georesourceType = "aoi";
				}
				kommonitorDataExchangeService.availablePoiMarkerColors.forEach(function(option){
					if(option.colorName === $scope.metadataImportSettings.poiMarkerColor){
						$scope.selectedPoiMarkerColor = option;
					}
					if(option.colorName === $scope.metadataImportSettings.poiSymbolColor){
						$scope.selectedPoiSymbolColor = option;
					}
				});
				kommonitorDataExchangeService.availableLoiDashArrayObjects.forEach(function(option){
					if(option.dashArrayValue === $scope.metadataImportSettings.loiDashArrayString){
						$scope.selectedLoiDashArrayObject = option;
					}
				});
				$scope.loiColor = $scope.metadataImportSettings.loiColor;
				$scope.aoiColor = $scope.metadataImportSettings.aoiColor;
				$scope.selectedPoiIconName = $scope.metadataImportSettings.poiSymbolBootstrap3Name;

				setTimeout(function(){
					$("#poiSymbolEditPicker").val("").iconpicker('setIcon', 'glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
					// $("#poiSymbolPicker i").css('glyphicon glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
					// $("#poiSymbolPicker input").css('glyphicon-' + $scope.metadataImportSettings.poiSymbolBootstrap3Name);
				}, 200);

				$scope.$apply();
		}

		$scope.onExportGeoresourceEditMetadata = function(){
			var metadataExport = $scope.georesourceMetadataStructure;

			metadataExport.metadata.note = $scope.metadata.note || "";
			metadataExport.metadata.literature = $scope.metadata.literature  || "";
			metadataExport.metadata.sridEPSG = $scope.metadata.sridEPSG || "";
			metadataExport.metadata.datasource = $scope.metadata.datasource || "";
			metadataExport.metadata.contact = $scope.metadata.contact || "";
			metadataExport.metadata.lastUpdate = $scope.metadata.lastUpdate || "";
			metadataExport.metadata.description = $scope.metadata.description || "";
			metadataExport.metadata.databasis = $scope.metadata.databasis || "";
			metadataExport.datasetName = $scope.datasetName || "";

			if($scope.metadata.updateInterval){
					metadataExport.metadata.updateInterval = $scope.metadata.updateInterval.apiName;
			}

			var name = $scope.datasetName;

			// georesource specific properties
			metadataExport.isPOI = $scope.isPOI;
			metadataExport.isLOI = $scope.isLOI;
			metadataExport.isAOI = $scope.isAOI;

			if($scope.isPOI){
				metadataExport["poiSymbolBootstrap3Name"] = $scope.selectedPoiIconName;
				metadataExport["poiSymbolColor"] = $scope.selectedPoiSymbolColor.colorName;
				metadataExport["poiMarkerColor"] = $scope.selectedPoiMarkerColor.colorName;

				metadataExport["loiDashArrayString"] = "";
				metadataExport["loiColor"] = "";

				metadataExport["aoiColor"] = "";
			}
			else if($scope.isLOI){
				metadataExport["poiSymbolBootstrap3Name"] = "";
				metadataExport["poiSymbolColor"] = "";
				metadataExport["poiMarkerColor"] = "";

				metadataExport["loiDashArrayString"] = $scope.selectedLoiDashArrayObject.dashArrayValue;
				metadataExport["loiColor"] = $scope.loiColor;

				metadataExport["aoiColor"] = "";
			}
			else if($scope.isAOI){
				metadataExport["poiSymbolBootstrap3Name"] = "";
				metadataExport["poiSymbolColor"] = "";
				metadataExport["poiMarkerColor"] = "";

				metadataExport["loiDashArrayString"] = "";
				metadataExport["loiColor"] = "";

				metadataExport["aoiColor"] = $scope.aoiColor;
			}


			var metadataJSON = JSON.stringify(metadataExport);

			var fileName = "Georessource_Metadaten_Export";

			if (name){
				fileName += "-" + name;
			}

			fileName += ".json";

			var blob = new Blob([metadataJSON], {type: "application/json"});
			var data  = URL.createObjectURL(blob);

			var a = document.createElement('a');
			a.download    = fileName;
			a.href        = data;
			a.textContent = "JSON";
			a.target = "_blank";
			a.rel = "noopener noreferrer";
			a.click();

			a.remove();
		};

		$scope.onChangeMarkerColor = function(markerColor){
			$scope.selectedPoiMarkerColor = markerColor;
		};

		$scope.onChangeSymbolColor = function(symbolColor){
			$scope.selectedPoiSymbolColor = symbolColor;
		};

		$scope.onChangeLoiDashArray = function(loiDashArrayObject){
			$scope.selectedLoiDashArrayObject = loiDashArrayObject;

			$("#loiDashArrayDropdownButton").html(loiDashArrayObject.svgString);
		};

			$scope.hideSuccessAlert = function(){
				$("#georesourceEditMetadataSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#georesourceEditMetadataErrorAlert").hide();
			};

	}
]});
