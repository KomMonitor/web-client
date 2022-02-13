angular.module('reportingOverview').component('reportingOverview', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingOverview/reporting-overview.template.html",
	controller : ['$scope', '__env', '$timeout', '$http', 'kommonitorDataExchangeService',
	function ReportingOverviewController($scope, __env, $timeout, $http, kommonitorDataExchangeService) {

		/*
		{
			indicators: [
				{...},
				{...},
				...
			],
			pages: [
				{
					indicatorName: ... // e.g for sorting pages
					spatialUnitName: ....
					pageElements: [...]
				},
				{...},
				...
			],
			template: {...} // clean version of the template, without indicator data
		}
		*/
		$scope.config = {
			indicators: [],
			pages: [],
			template: {}
		};
		$scope.loadingData = false;

		$scope.initialize = function(data) {
			let configFileSelected = data[0];
			data = data[1];
			if(configFileSelected) {
				$scope.importConfig(data);
			} else {
				$scope.config.template = JSON.parse(JSON.stringify(data));
				$scope.config.pages = $scope.config.template.pages;
			}
			
		}

		$scope.sortableConfig = {
			onEnd: function (e) {
				// nothing for now, config elements get reordered automatically
			}
		};

		$scope.$on("reportingInitializeOverview", function(event, data) {
			// data is a nested array at this point [ [ { template object } ] ]
			$scope.initialize(data);
		})

		$scope.onConfigureNewIndicatorClicked = function() {
			$scope.$emit('reportingConfigureNewIndicatorClicked', [$scope.config.template, $scope.config.indicators])
		}
		
		$scope.onBackToTemplateSelectionClicked = function() {
			$scope.$emit('reportingBackToTemplateSelectionClicked')
		}

		$scope.$on("reportingIndicatorConfigurationCompleted", function(event, data) {
			$scope.loadingData = true;
			// add indicator to 'added indicators'
			let [indicator, template] = data;
			// add indicator name to each page
			for(let page of template.pages) {
				page.indicatorName = indicator.indicatorName;
				page.spatialUnitName = template.spatialUnitName;
			}
			// remove all pages without property indicatorName (clean template)
			$scope.config.pages = $scope.config.pages.filter( page => {
				return page.hasOwnProperty("indicatorName");
			});
			// append to array
			$scope.config.pages.push(...template.pages);
			$scope.config.indicators.push(indicator);

			// setup pages after dom exists
			$scope.setupNewPages(indicator);
			
		});

		$scope.removeIndicator = function(indicatorName) {
			$scope.config.indicators = $scope.config.indicators.filter( el => {
				return el.indicatorName !== indicatorName;
			});

			// show empty template if this was the last indicator
			if($scope.config.indicators.length === 0) {
				$scope.config.pages = $scope.config.template.pages;
			}
		}

		$scope.$watchCollection('config.indicators', function(newVal, oldVal) {
			console.log("config.indicators changed", newVal);
			
			if(newVal.length < oldVal.length) { // removed
				// find removed indicator
				let difference = oldVal
					.filter(x => !newVal.includes(x))
					.concat(newVal.filter(x => !oldVal.includes(x)));

				let removedIndicator = difference[0];
				// remove all pages for that indicator
				$scope.config.pages = $scope.config.pages.filter( page => {
					return page.indicatorName !== removedIndicator.indicatorName;
				})
			}
			if(newVal.length === oldVal.length) { // order changed
				// sort pages according to newVal
				let orderedPages = [];
				for(let indicator of newVal) {
					// find all pages for that indicator and move them to the end of the array
					let pagesForIndicator = $scope.config.pages.filter( page => {
						return page.indicatorName === indicator.indicatorName;
					});
					orderedPages.push(...pagesForIndicator);
				}
				$scope.config.pages = orderedPages;
			}
		});


		$scope.setupNewPages = function(indicator) {
			
			$timeout(async function(indicator) {
				let indicatorName = indicator.indicatorName;

				for(let [idx, page] of $scope.config.pages.entries()) {

					if(page.indicatorName !== indicatorName) {
						continue; // only do changes to new pages
					}

					// get spatial unit by name
					let spatialUnit = indicator.applicableSpatialUnits.filter( el => {
						return el.spatialUnitName === page.spatialUnitName;
					});
					let spatialUnitId = spatialUnit[0].spatialUnitId;
					let indicatorId = indicator.indicatorId
					// get features for spatial unit
					
					let featureCollection = await $scope.queryFeatures(indicatorId, spatialUnitId)
					let features = $scope.createLowerCaseNameProperty(featureCollection.features);
					let geoJSON = { features: features };
					

					let pageDom = document.querySelector("#reporting-overview-page-" + idx);

					for(let pageElement of page.pageElements) {

						let pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)

						if(pageElement.type === "map" || pageElement.type === "barchart" || pageElement.type === "linechart") {
							let instance = echarts.init( pElementDom );

							if(pageElement.type === "map") {
								// for maps: register maps
								// check if there is a map registered for this combination, if not register one with all features
								let mapName = undefined;
								// get the timestamp from pageElement, not from dom because dom might not be up to date yet
								let dateElement = page.pageElements.find( el => {
									return el.type === (pageElement.isTimeseries ? "dataTimeseries-landscape" : "dataTimestamp-landscape");
								});
								mapName = indicatorName + "_" + dateElement.text + "_" + page.spatialUnitName;

								if(pageElement.classify)
									mapName += "_classified";
								if(pageElement.isTimeseries)
									mapName += "_timeseries"
								if(page.area && page.area.length)
									mapName += "_" + page.area
								let registeredMap = echarts.getMap(mapName)
								
								if( !registeredMap ) {
									// register new map
									echarts.registerMap(mapName, geoJSON)
								}
								let a = echarts.getMap(mapName)
							}
							
							// recreate boxplots, itemNameFormatter did not get transferred
							if(pageElement.type === "linechart" && pageElement.showBoxplots) {
								let xAxisLabels = pageElement.echartsOptions.xAxis[0].data;
								pageElement.echartsOptions.dataset[1].transform.config = {
									itemNameFormatter: function (params) {
										return xAxisLabels[params.value];
									}
								}
							}

							instance.setOption( pageElement.echartsOptions )
						}

						if(pageElement.type === "overallAverage") {
							pageDom.querySelector(".type-overallAverage").style.border = "none";
						}

						if(pageElement.type === "mapLegend") {
							pageElement.isPlaceholder = false;
							pageDom.querySelector(".type-mapLegend").style.display = "none";
						}

						if(pageElement.type === "overallChange") {
							let wrapper = pageDom.querySelector(".type-overallChange")
							wrapper.style.border = "none";
							wrapper.style.left = "670px";
							wrapper.style.width = "130px";
							wrapper.style.height = "100px";
						}

						if(pageElement.type === "datatable") {
							$scope.createDatatablePage(pElementDom, pageElement);
						}

					}
				}

				$scope.loadingData = false;
				$scope.$apply();

			}, 0, false, indicator);
		}


		$scope.createDatatableSkeleton = function(colNamesArr) {

			let table = document.createElement("table");
			table.classList.add("table-striped")
			table.classList.add("table-bordered")
			
			let thead = document.createElement("thead");
			let tbody = document.createElement("tbody");
			table.appendChild(thead);
			table.appendChild(tbody);
			
			let headerRow = document.createElement("tr");
			
			for(let colName of colNamesArr) {
				let col = document.createElement("th");
				col.classList.add("text-center");
				col.innerText = colName;
				headerRow.appendChild(col);
			}
	
			headerRow.style.height = "25px";
			thead.appendChild(headerRow);
	
			return table;
		}


		$scope.createDatatablePage = function(pElementDom, pageElement) {
			pElementDom.innerHTML = "";
			pElementDom.style.border = "none"; // hide dotted border from outer dom element
			pElementDom.style.justifyContent = "flex-start"; // align table at top instead of center
			// add data
			let table = $scope.createDatatableSkeleton(pageElement.columnNames);
			let tbody = table.querySelector("tbody")
			// tabledata is a nested array with one sub-array per row
			for(let row of pageElement.tableData) {
				let tr = document.createElement("tr");
				tr.style.height = "25px";
				for(let i=0; i<row.length; i++) {
					let td = document.createElement("td");
					td.innerText = row[i];
					// get corresponding column name for styling
					let colName = pageElement.columnNames[i];
					if(colName === "Bereich") {
						td.classList.add("text-left");
					}
					if(colName === "Wert") {
						td.classList.add("text-right");
					}

					tr.appendChild(td);
				}
				tbody.appendChild(tr);
			}
			pElementDom.appendChild(table);
		}


		$scope.importConfig = function(config) {
			$scope.loadingData = true;
			$scope.$apply();
			// restore indicators from indicator names
			let indicators = [];
			for(let name of config.indicators) {
				indicators.push( getIndicatorByName(name) );
				
			}
			$scope.config.indicators = indicators;
			$scope.config.template = config.template;
			$scope.config.pages = config.pages;
			$scope.$apply();
			for(let indicator of $scope.config.indicators) {
				$scope.setupNewPages(indicator);
			}
		}

		$scope.exportConfig = function() {
			let jsonToExport = {};
			jsonToExport.pages = $scope.config.pages;
			jsonToExport.template = $scope.config.template;
			// replace indicators with indicator names to reduce file size
			jsonToExport.indicators = $scope.config.indicators.map( indicator => indicator.indicatorName);
			
			let jsonString = "data:text/json;charset=utf-8," + encodeURIComponent( angular.toJson(jsonToExport) );
			// to download json, a DOM element is created, clicked and removed
			let downloadAnchorNode = document.createElement('a');
			downloadAnchorNode.setAttribute("href", jsonString);
			downloadAnchorNode.setAttribute("download", getCurrentDateAndTime() + "_KomMonitor-Reporting-Konfiguration.json");
			document.body.appendChild(downloadAnchorNode); // required for firefox
			downloadAnchorNode.click();
			downloadAnchorNode.remove();
		}

		function getCurrentDateAndTime() {
			let date = new Date();
			let year = date.getFullYear().toString();
			let month = date.getMonth() + 1;
			let day = date.getDate();
			let time = date.getHours();
			let minutes = date.getMinutes();
			let seconds = date.getSeconds();
			let now = "".concat(year, "-", month, "-", day, "_", time, "-", minutes, "-", seconds);
			return now;
		}


		function getIndicatorByName(indicatorName) {
			let result;
			for(let indicator of kommonitorDataExchangeService.availableIndicators) {
				if(indicator.indicatorName === indicatorName) {
					result = indicator;
					break;
				}
			}
			if(result) {
				return result
			} else {
				throw "No indicator could be found for name: " + indicatorName;
			}
		}

		$scope.queryFeatures = async function(indicatorId, spatialUnitId) {
			// build request
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
			"/indicators/" + indicatorId + "/" + spatialUnitId;
			// send request
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
				return response.data;
			}, function errorCallback(error) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				kommonitorDataExchangeService.displayMapApplicationError(error);
				console.error(response.statusText);
			});
		}

		$scope.createLowerCaseNameProperty = function(features) {
			for(let feature of features) {
				if(feature.hasOwnProperty("properties")) {
					if(!feature.properties.hasOwnProperty("name")) {
						let featureName = feature.properties.NAME;
						feature.properties.name = featureName;
					}
				}
			}
			return features;
		}


		// $scope.availableIndicators = [];
		// $scope.availableIndicatorsNames = [];

		// $scope.addedIndicators = [];
		// $scope.addedIndicatorsNames = [];

		// $scope.addedIndicatorsBoxSelection = {};

		// $scope.allAddedIndicatorsConfig = [];
		// $scope.modifiedIndicatorConfigSave = {};

		// $scope.pagesArray = [];
		// $scope.echartInstances = [];
		// $scope.generatingReport = false;

		// //initialize
		// $('#reporting-modal').on('show.bs.modal', function () {

		// 	$scope.createPlaceholderPage();

		// 	document.getElementById("reporting-load-settings-button").addEventListener('change', readSingleFile, false);
			
		// 	//jquery $().on does not trigger angularJS digest circle
		// 	//https://stackoverflow.com/questions/23968384/databinding-not-updating-when-called-from-on
		// 	$scope.$apply(function () { 
		// 		loadIndicators();
		// 	});

		// 	$(function() {
		// 		$(".draggable").draggable({
		// 			revert: "invalid",
		// 			revertDuration: 0,
		// 			appendTo: $('#reporting-modal .modal-content'),
		// 			scroll: false,
		// 			helper: "clone"
		// 		});
		// 	});

		// 	$(".droppable").droppable({
		// 		// on indicator drop from left column onto page
		// 		drop: function( event, ui ) {
		// 			var indicatorAsString = ui.draggable.first().attr("data-indicator");
		// 			//parse string to object
		// 			var droppedIndicator = JSON.parse(indicatorAsString);

		// 			//open new modal
		// 			$('#reporting-add-indicator-modal').modal();
		// 			//jquery $().on does not trigger angularjs digest circle
		// 			//https://stackoverflow.com/questions/23968384/databinding-not-updating-when-called-from-on
		// 			$rootScope.$apply(function () { 
		// 				$rootScope.$broadcast('addIndicatorModalOpened', droppedIndicator, undefined);
		// 			});
		// 		}
		// 	});
		// });

		

		// $scope.configureIndicator = function() {

		// 	var indicator =  $scope.addedIndicatorsBoxSelection;
		// 	if($.isEmptyObject(indicator)) {
		// 		return;
		// 	}
		// 	//get configuration object
		// 	var config = $scope.getIndicatorConfigByName(indicator.indicatorName);
		// 	//save configuration object for cormparison
		// 	$scope.modifiedIndicatorConfigSave = config;
		// 	//open modal
		// 	$('#reporting-add-indicator-modal').modal();
		// 	$rootScope.$broadcast('addIndicatorModalOpened', indicator, config);		
		// };

		// /**
		//  * saves the current state to a json object
		//  */
		// $scope.saveSettings = function() {

		// 	// TODO which variables are needed?
		// 	let json = {
		// 		'variables': {
		// 			'availableIndicators': $scope.availableIndicators,
		// 			'availableIndicatorsNames': $scope.availableIndicatorsNames,
		// 			'addedIndicators': $scope.addedIndicators,
		// 			'addedIndicatorsNames': $scope.addedIndicatorsNames,
		// 			'addedIndicatorsBoxSelection': $scope.addedIndicatorsBoxSelection,
		// 			'allAddedIndicatorsConfig': $scope.allAddedIndicatorsConfig,
		// 			'pagesArray': $scope.pagesArray,
		// 	 		'generatingReport': $scope.generatingReport
		// 		},
		// 		'pageElements': {} // TODO
		// 		/*
		// 		page Elements could look like:
		// 		{
		// 			pageNr: 1,
		// 			x: 0,
		// 			y: 0,
		// 			width: 100,
		// 			height: 100,
		// 			id: ...
		// 		}
		// 		*/
		// 	};

		// 	//TODO replace
		// 	let jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, (key, value) => {
		// 		// prevent circular references
		// 		if(key === "tiles") {
		// 			return undefined;
		// 		}
		// 		return value;
		// 	}));

		// 	// to download json, a DOM element is created, clicked and removed
		// 	// https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
		// 	let downloadAnchorNode = document.createElement('a');
		// 	downloadAnchorNode.setAttribute("href", jsonString);
		// 	downloadAnchorNode.setAttribute("download", getCurrentDateAndTime() + "_KomMonitor_Report.json");
		// 	document.body.appendChild(downloadAnchorNode); // required for firefox
		// 	downloadAnchorNode.click();
		// 	downloadAnchorNode.remove();
		// };



		// /**
		//  * reads a file chosen by the user
		//  * @returns {string} file content
		//  */
		// function readSingleFile(e) {
		// 	var content = "";
		// 	var srcElement = e.srcElement;
		// 	var file = e.target.files[0];
		// 	if (!file) {
		// 		return;
		// 	}
		// 	var reader = new FileReader();
		// 	reader.onload = function(e) {
		// 		content = e.target.result;
		// 		if(srcElement.id === "reporting-load-settings-button") {
		// 			$scope.loadSettings(content)
		// 		}
		// 	 };
		// 	reader.readAsText(file);
		// }

		// /**
		//  * reads a json object to restore a previously saved state
		//  */
		// $scope.loadSettings = function(fileContent) {

		// 	//parse to json
		// 	let json = JSON.parse(fileContent);
		// 	// reset modal
		// 	$scope.resetModal();

		// 	//set variables
		// 	$scope.availableIndicators = json.variables.availableIndicators;
		// 	$scope.availableIndicatorsNames = json.variables.availableIndicatorsNames;
		// 	$scope.addedIndicators = json.variables.addedIndicators;
		// 	$scope.addedIndicatorsNames = json.variables.addedIndicatorsNames;
		// 	$scope.addedIndicatorsBoxSelection = json.variables.addedIndicatorsBoxSelection;
		// 	$scope.allAddedIndicatorsConfig = json.variables.allAddedIndicatorsConfig;
		// 	$scope.modifiedIndicatorConfigSave = json.variables.modifiedIndicatorConfigSave;
		// 	$scope.pagesArray = json.variables.pagesArray;
		// 	$scope.generatingReport = false;

		// 	$scope.$digest();

		// 	//TODO

		// };

		// $scope.generateReport = function() {

		// 	if(!!document.getElementById("reporting-page-0")) {
		// 		alert("Bevor ein Report erzeugt werden kann, müssen Indikatoren hinzugefügt werden.");
		// 		return;
		// 	}

		// 	//show loading overlay
		// 	$timeout(function(){
		// 		$scope.generatingReport = true;
		// 		document.body.style.cursor = 'wait';
		// 	});						

		// 	//hide all scrollbars temporarily
		// 	//there is a bug in html2canvas, creating some space on the left side if the page has a scrollbar
		// 	$("body").css("overflow", "hidden");
		// 	$("#reporting-modal").css({"cssText": "display:block; overflow:hidden !important"});

		// 	//a higher number will lead to higher quality images.
		// 	//but it will also increase the time needed to generate a pdf and the file size
		// 	window.devicePixelRatio = 2;
		// 	var pages2canvasArray = [];
		// 	for(var i=1;i<=$scope.pagesArray.length;i++) {
		// 		pages2canvasArray.push(html2canvas(document.getElementById("reporting-page-" + i.toString()), {
		// 			//htm2canvas options can be placed here
		// 			scale: 1
		// 			// width: 1120 / 1.4,
		// 			// height: 790 / 1.4
		// 		}));
		// 	}
		// 	//create html2canvas
		// 	Promise.all(pages2canvasArray).then(data => {
		// 			var orientation = "";
		// 			if (data[0].width > data[0].height) {
		// 				orientation = "landscape";
		// 			} else {
		// 				orientation = "portrait";
		// 			}
		// 			//create pdf document
		// 			var doc = new jsPDF({
		// 				margin: 0,	
		// 				unit: 'mm',
		// 				format: 'a4',
		// 				orientation: orientation
		// 			});
		// 			for(var i=0;i<data.length;i++) {
		// 				//pdf page for first page already exists
		// 				if(i>0) {
		// 					//for all other pages add a page in landscape or portrait
		// 					if($scope.pagesArray[i].pFormat === "landscape") {
		// 						doc.addPage('a4', 'landscape');
		// 					} else {
		// 						doc.addPage('a4', 'portrait');
		// 					}
		// 				}
		// 				//scale image to a4
		// 				var pageWidth = doc.internal.pageSize.getWidth();
		// 				var pageHeight = doc.internal.pageSize.getHeight();
		// 				console.log("pdf pageWidth: ", pageWidth);
		// 				console.log("pdf pageHeight: ", pageHeight);
		// 				var imgData = data[i].toDataURL('image/png');
		// 				doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST'); 
		// 			}
					

					
		// 			//get current date and time
		// 			var now = getCurrentDateAndTime();

		// 			//hide loading overlay
		// 			$timeout(function(){
		// 				$scope.generatingReport = false;
						
		// 				document.body.style.cursor = 'default';	
		// 			});
		// 			window.devicePixelRatio = 1; //reset this

		// 			// unhide scrollbars
		// 			$("body").css("overflow", "auto");
		// 			$("#reporting-modal").css({"cssText": "display:block;"});
					
		// 			//create pdf, prompt user to save it
		// 			doc.save(now + '_KomMonitor-Report.pdf');
					
		// 	});
		// };

		// $rootScope.$on("reportingIndicatorAdded", function(event, allAddedIndicatorsConfig) {
		// 	//save the config
		// 	$scope.allAddedIndicatorsConfig = allAddedIndicatorsConfig;
		// 	// get config of the last added indicato, which is the one that was just added and that we have to display now.
		// 	var addedIndicatorConfig = allAddedIndicatorsConfig[allAddedIndicatorsConfig.length-1];
		// 	console.log("addedIndicatorConfig: ", addedIndicatorConfig)
		// 	// indicator has a property geoJSON, which contains the geoJSON for all areas for the selected spatial unit
		// 	// these need to be filtered to match selected areas only
		// 	filterGeoJSONbyAreas(addedIndicatorConfig);

		// 	// remove placeholder page if it exists
		// 	$scope.removePage(0);

		// 	// create pages depending on config
		// 	// for each timestamp
		// 	for (var i=0;i<addedIndicatorConfig.selectedTimestamps.length;i++) {
		// 		let timestamp = addedIndicatorConfig.selectedTimestamps[i];

		// 		// add one page by default
		// 		let page = $scope.createPage("landscape");
		// 		// add as last page
		// 		let pageNumber = $scope.pagesArray.length+1; 
		// 		$scope.insertPage(page, pageNumber);
		// 		let relativePageNumber = 1 // starting with 1 for first page of indicator to add (per timestamp)
				
		// 		$timeout( function() {
		// 			insertPageContent(page, relativePageNumber, addedIndicatorConfig, timestamp);
		// 		});
				
		// 		//if all three diagram types are checked add a second page
		// 		let history = addedIndicatorConfig.elementCheckboxes.elementHistoryIsChecked; // TODO history checkboy is hidden right now so if can't be checked
		// 		let timeline = addedIndicatorConfig.elementCheckboxes.elementTimelineIsChecked;
		// 		let featureComparison = addedIndicatorConfig.elementCheckboxes.elementFeatureComparisonIsChecked;
		// 		if(history && timeline && featureComparison) {
		// 			page = $scope.createPage("landscape");
		// 			pageNumber = $scope.pagesArray.length+1; 
		// 			$scope.insertPage(page, pageNumber);
		// 			let relativePageNumber = 2;

		// 			$timeout( function() {
		// 				insertPageContent(page, relativePageNumber, addedIndicatorConfig, timestamp);
		// 			});
		// 		}

		// 		//if datatable is checked add an additional page
		// 		let datatable = addedIndicatorConfig.elementCheckboxes.elementDataTableIsChecked;
		// 		if(datatable) {
		// 			page = $scope.createPage("portrait");
		// 			pageNumber = $scope.pagesArray.length+1;
		// 			$scope.insertPage(page, pageNumber);
		// 			// TODO datatable could also be the second page,
		// 			// but relativePageNumber is used as a distinction criteria for now, so we leave it at 3
		// 			let relativePageNumber = 3; 

		// 			$timeout( function() {
		// 				insertPageContent(page, relativePageNumber, addedIndicatorConfig, timestamp);
		// 			});
		// 		}
		// 	}

		// 	//add indicator to scope
		// 	$scope.addedIndicators.push(addedIndicatorConfig.indicator);
		// 	$scope.addedIndicatorsNames.push(addedIndicatorConfig.indicator.indicatorName);

		// 	//remove indicator from list so it can't be added twice
		// 	$scope.availableIndicators = $scope.availableIndicators.filter( 
		// 		el => el.indicatorName !== addedIndicatorConfig.indicator.indicatorName);
		// 	$scope.availableIndicatorsNames = $scope.availableIndicatorsNames.filter( 
		// 		el => el !== addedIndicatorConfig.indicator.indicatorName);
		// });

		// // This functionalitiy is disabled for now
		// $rootScope.$on("reportingIndicatorModified", function(event, allAddedIndicatorsConfig, index) {
		// 	$scope.allAddedIndicatorsConfig = allAddedIndicatorsConfig;
		// 	var changedIndicatorConfigNew = allAddedIndicatorsConfig[index];
		// 	var changedIndicatorConfigOld = $scope.modifiedIndicatorConfigSave;

		// 	console.log(changedIndicatorConfigOld);
		// 	console.log(changedIndicatorConfigNew);
			
		// 	//TODO

		// });


		// /**
		//  * gets indicators from the kommonitorDataExchangeService and stores the in a scope variable.
		//  * stores the indicatornames separately.
		//  */
		// function loadIndicators() {


		// 	$scope.availableIndicators = [];
		// 	$scope.availableIndicatorsNames = [];

		// 	$scope.availableIndicators = kommonitorDataExchangeService.displayableIndicators;
		// 	//get names
		// 	$($scope.availableIndicators).each(function(index, indicator) {
		// 		$scope.availableIndicatorsNames.push(indicator.indicatorName);
		// 	});
		// }

		// /**
		//  * toggles the selection on added indicators.
		//  * Makes sure that only one indicator can be selected simultaneously.
		//  */
		// $scope.toggleAddedIndicatorSelection = function($event, indicator) {

		// 	//check if element was selected or not
		// 	var $element = $(event.currentTarget);
		// 	var selected = $element.hasClass("reporting-selected-added-indicator");

		// 	//deselect all indicators
		// 	$("#addedIndicatorBox").children().each( (index, el) => {
		// 		$(el).removeClass("reporting-selected-added-indicator");
		// 	});
		// 	//clear scope
		// 	$scope.addedIndicatorsBoxSelection = undefined;

		// 	//get clicked indicator
		// 	$element = $(event.currentTarget);
		// 	// if element was not selected
		// 	if (!selected) {
		// 		//select it
		// 		$element.addClass("reporting-selected-added-indicator");
		// 		//add indicator to scope
		// 		$scope.addedIndicatorsBoxSelection = indicator;
		// 	}
			
			
		// };


		

		// /**
		//  * creates a new page
		//  * @param {string} format landscape or portrait
		//  * @returns {obj} object with page properties
		//  */
		// $scope.createPage = function(format) {
		// 	if(typeof(format) !== "string") {
		// 		console.error("page format must be a string");
		// 		return;
		// 	}

		// 	var page = {};
		// 	page.pFormat = format;
		// 	page.pNumber = -1; // gets updated when page gets inserted
		// 	return page;
		// };

		// /**
		//  * inserts a given page at the specified page number
		//  * @param {obj} page page to insert
		//  * @param {int} pNumber position where to insert the page
		//  */
		// $scope.insertPage = function(page, pNumber) {

		// 	if(pNumber < 0) {
		// 		console.error("Page number can not be negative.");
		// 		return;
		// 	}

		// 	var arrayLength = $scope.pagesArray.length;
		// 	if (arrayLength < pNumber) {
		// 		page.pNumber = arrayLength+1;
		// 		$scope.pagesArray.push(page);
		// 	} else {
		// 		page.pNumber = pNumber;
		// 		$scope.pagesArray.splice(pNumber, 0, page);
		// 	}
		// };

		// /**
		//  * creates an empty placeholder if there are no pages.
		//  */
		// $scope.createPlaceholderPage = function() {
		// 	if($scope.pagesArray.length == 0) {
		// 		var placeholder = $scope.createPage("landscape");
		// 		$scope.insertPage(placeholder, 0);
		// 	}
		// };

		// /**
		//  * removes the page at the given page number if it exists
		//  * updates the ids of all following pages
		//  * @param {int} pNumber number of page to be removed
		//  */
		// $scope.removePage = function(pNumber) {
		// 	//remove page
		// 	$scope.pagesArray = $scope.pagesArray.filter( (obj) => {
		// 		return obj.pNumber != pNumber;
		// 	});
		// 	for(var i=1;i<=$scope.pagesArray.length;i++) {
		// 		$scope.pagesArray[i-1].pNumber = i;
		// 	}
		// };

		// /**
		//  * resets the modal state back to the initial state.
		//  */
		// $scope.resetModal = function() {
		// 	$scope.availableIndicators = [];
		// 	$scope.availableIndicatorsNames = [];
		// 	$scope.addedIndicators = [];
		// 	$scope.addedIndicatorsNames = [];
		// 	$scope.addedIndicatorsBoxSelection = {};
		// 	$scope.allAddedIndicatorsConfig = [];
		// 	$scope.modifiedIndicatorConfigSave = {};
		// 	$scope.pagesArray = [];
		// 	$scope.echartInstances = [];
		// 	$scope.generatingReport = false;
		// 	$rootScope.$broadcast("reportingResetModal");

		// 	$scope.createPlaceholderPage();
		// 	loadIndicators();
		// 	$timeout( function() {
		// 		$(".draggable").draggable({
		// 			revert: "invalid",
		// 			revertDuration: 0,
		// 			appendTo: $('#reporting-modal .modal-content'),
		// 			scroll: false,
		// 			helper: "clone"
		// 		});
		// 	});
		// };

	
		// /**
		//  * Inserts the content to the page.
		//  * For now only one template is supported, so that we always add content to the same positions.
		//  * The positioning and elements depend on the given page number (this works since there is only one template right now)
		//  * each element gets a unique id (combination of indicator id, timesamp and element).
		//  * example ids (replace {indicatorId} and {timestamp}):
		//  * 	{indicatorId}_{timestamp}_map
		//  * 	{indicatorId}_{timestamp}_history
		//  * 	{indicatorId}_{timestamp}_featureComparison
		//  * 	{indicatorId}_{timestamp}_metadata
		//  * @param {obj} page | page object storing all relevant information about page format, position, ...
		//  * @param {int} relativePageNumber | relative page number of the newly added page.
		//  * 						If 4 pages are added per timestamp it is either 1,2,3 or 4
		//  * @param {obj} config | configuration object for indicator to add
		//  * @param {string} timestamp | timestamp
		//  */
		// function insertPageContent(page, relativePageNumber, config, timestamp) {
		// 	var elements = config.elementCheckboxes;

		// 	if(relativePageNumber === 1) {
		// 		if(elements.elementMapIsChecked) {
		// 			let id = config.indicator.indicatorId + "_" + timestamp.name + "_map";
		// 			let element = createPageElement(page, 0, 0, 800, 400, id, config);
		// 			config.pageElements[id] = element;
		// 		}

		// 		let x = 0; // tracks the x-coordinate to see if diagram was added
		// 		if(elements.elementFeatureComparisonIsChecked) {
		// 			let id = config.indicator.indicatorId + "_" + timestamp.name + "_featureComparison";
		// 			let element = createPageElement(page, x, 400, 400, 162, id, config);
		// 			config.pageElements[id] = element;
		// 			x += 400;
		// 		}

		// 		if(elements.elementHistoryIsChecked) {
		// 			let id = config.indicator.indicatorId + "_" + timestamp.name + "_history";
		// 			let element = createPageElement(page, x, 400, 400, 162, id, config);
		// 			config.pageElements[id] = element;
		// 			x += 400;
		// 		}

		// 		//zero or one diagrams added, we have space for the timeline diagram on this page
		// 		if(x < 800) {
		// 			console.log(x);
		// 			let id = config.indicator.indicatorId + "_" + timestamp.name + "_timeline";
		// 			let element = createPageElement(page, x, 400, 400, 162, id, config);
		// 			config.pageElements[id] = element;
		// 		}
		// 	}

		// 	if(relativePageNumber === 2) {
		// 		//all three diagram types are checked
		// 		let id = config.indicator.indicatorId + "_" + timestamp.name + "_timeline";
		// 		let element = createPageElement(page, 0, 0, 400, 162, id, config);
		// 		config.pageElements[id] = element;
		// 	}

		// 	if(relativePageNumber === 3) {
		// 		//datatable checked
		// 		let id = config.indicator.indicatorId + "_" + timestamp.name + "_dataTable";
		// 		let element = createPageElement(page, 0, 0, 400, 800, id, config);
		// 		config.pageElements[id] = element;
		// 	}
		// }

		// /**
		//  * filters the geoJSON property of the indicator by the selected areas.
		//  * filters by area name
		//  * this is a preparation for the method fillTileContent
		//  * @param {obj} config 
		//  */
		// function filterGeoJSONbyAreas(config) {
		// 	var features = config.indicator.geoJSON.features;
		// 	features = features.filter( (obj) => {
		// 		var name = obj.properties.NAME;
		// 		for (var key in config.selectedAreas) {
		// 			var el = config.selectedAreas[key];
		// 			if(name === el.name) {
		// 				return true;
		// 			}
					
		// 		}
		// 		return false;
		// 	});
		// 	config.indicator.geoJSON.features = features;
		// }

		// /**
		//  * gets the current date and time in format: yyyy-mm-dd_HH-MM-SS
		//  * @returns {string}
		//  */
		// function getCurrentDateAndTime() {
		// 	var date = new Date();
		// 	var year = date.getFullYear().toString().substr(-2);
		// 	var month = date.getMonth() + 1;
		// 	var day = date.getDate();
		// 	var time = date.getHours();
		// 	var minutes = date.getMinutes();
		// 	var seconds = date.getSeconds();
		// 	var now = "".concat(year, "-", month, "-", day, "_", time, "-", minutes, "-", seconds);
		// 	return now;
		// }

		// /**
		//  * Creates an element and adds it to the page.
		//  * Elements can be maps or diagrams.
		//  * 
		//  * @param {obj} page | page object storing all relevant information about page format, position, ...
		//  * @param {int} x | x coordinate of top left corner in pixel
		//  * @param {int} y | y coordinate of top left corner in pixel
		//  * @param {int} width | element with in pixel
		//  * @param {int} height | element height in pixel
		//  * @param {string} id | follows the scheme: {indicatorId}_{timestamp}_{elementType}
		//  * @param {obj} config | reporting-specific configuration for the indicator
		//  */
		// function createPageElement(page, x, y, width, height, id, config) {
		// 	// preparations
		// 	// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator to false to have consistent reporting setup
		// 	// set classifyZeroSeparately to true
		// 	// we need to undo these changes afterwards, so we store the current values in a backup first
		// 	let useOutlierDetectionOnIndicator_backup = kommonitorDataExchangeService.useOutlierDetectionOnIndicator;
		// 	let classifyUsingWholeTimeseries_backup = kommonitorDataExchangeService.classifyUsingWholeTimeseries;
		// 	let classifyZeroSeparately_backup = kommonitorDataExchangeService.classifyZeroSeparately; 
		// 	kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
		// 	kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;
		// 	kommonitorDataExchangeService.classifyZeroSeparately = true;

		// 	let id_split = id.split("_")
		// 	let indicatorId = id_split[0];
		// 	let timestamp = id_split[1];
		// 	let contentType = id_split[2];

		// 	let indicatorMetadata = config.indicator;

		// 	let geoJSON = indicatorMetadata.geoJSON;
		// 	let timestampPref = __env.indicatorDatePrefix + timestamp;
		// 	let numClasses = indicatorMetadata.defaultClassificationMapping.items.length;
		// 	let colorCodeStandard = indicatorMetadata.defaultClassificationMapping.colorBrewerSchemeName;
		// 	let colorCodePositiveValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
		// 	let colorCodeNegativeValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
		// 	let classifyMethod = __env.defaultClassifyMethod;

		// 	//setup brew
		// 	let defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(geoJSON, timestampPref, numClasses, colorCodeStandard, classifyMethod);
		// 	let dynamicBrewsArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(geoJSON, timestampPref, colorCodePositiveValues, colorCodeNegativeValues, classifyMethod);
		// 	let dynamicIncreaseBrew = dynamicBrewsArray[0];
		// 	let dynamicDecreaseBrew = dynamicBrewsArray[1];

		// 	//setup diagram resources
		// 	kommonitorDiagramHelperService.prepareAllDiagramResources_forReportingIndicator(config.indicator, config.selectedSpatialUnit.spatialUnitName, timestamp, defaultBrew, undefined, undefined, dynamicIncreaseBrew, dynamicDecreaseBrew, false, 0, false);
			
		// 	// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values			
		// 	kommonitorDataExchangeService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
		// 	kommonitorDataExchangeService.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
		// 	kommonitorDataExchangeService.classifyZeroSeparately = classifyZeroSeparately_backup;

		// 	// fill element with different content depending on content type
		// 	let wrapperDiv = document.createElement("div");
		// 	wrapperDiv.id = id;
		// 	wrapperDiv.classList.add("chart");
		// 	wrapperDiv.style.position = "absolute";
		// 	wrapperDiv.style.width = width + "px";
		// 	wrapperDiv.style.height = height + "px";

		// 	if (contentType === "map")
		// 		createMap( wrapperDiv );
		// 	else if (contentType === "featureComparison")
		// 		createFeatureComparisonDiagram( wrapperDiv );
		// 	else if (contentType === "history")
		// 		createHistoryDiagram( wrapperDiv );
		// 	else if (contentType === "timeline")
		// 		createTimelineDiagram( wrapperDiv );
		// 	else
		// 		throw "Unknown contentType provided."

		// 	positionElementOnPage(wrapperDiv, page, x, y);
		// }


		// function createMap(wrapperDiv) {
		// 	let map = echarts.init( wrapperDiv );
		// 	let options = kommonitorDiagramHelperService.getGeoMapChartOptions();
		// 	options.title.textStyle.fontSize = 16;
		// 	options.title.show = true;
		// 	options.grid = undefined;
		// 	options.visualMap.axisLabel = { "fontSize": 10 };
		// 	options.toolbox.show = false;
		// 	map.setOption(options);
		// 	map.resize();
		// 	$scope.echartInstances.push(map);
		// }


		// function createFeatureComparisonDiagram(wrapperDiv) {
		// 	let barChart = echarts.init( wrapperDiv );
		// 	let options = kommonitorDiagramHelperService.getBarChartOptions();
		// 	options.xAxis.name = ""; //remove title
		// 	options.title.textStyle.fontSize = 12;
		// 	options.title.text = "Ranking";
		// 	options.yAxis.axisLabel = { "fontSize": 10 };
		// 	options.title.show = true;
		// 	options.grid.top = 35;
		// 	options.grid.bottom = 5;
		// 	options.toolbox.show = false;
		// 	barChart.setOption(options);
		// 	barChart.resize();
		// 	$scope.echartInstances.push(barChart);
		// }


		// function createHistoryDiagram(wrapperDiv) {
		// 	let histogramChart = echarts.init( wrapperDiv );
		// 	let options = kommonitorDiagramHelperService.getHistogramChartOptions();
		// 	options.xAxis[0].name = ""; //remove title
		// 	options.title.textStyle.fontSize = 12;
		// 	options.title.show = true;
		// 	options.grid.top = 35;
		// 	options.grid.bottom = 5;
		// 	options.yAxis.axisLabel = { "fontSize": 10 };
		// 	options.toolbox.show = false;
		// 	histogramChart.setOption(options);
		// 	histogramChart.resize();
		// 	$scope.echartInstances.push(histogramChart);
		// }


		// function createTimelineDiagram(wrapperDiv) {
		// 	let lineChart = echarts.init( wrapperDiv );
		// 	let options = kommonitorDiagramHelperService.getLineChartOptions();
		// 	options.xAxis.name = ""; //remove title
		// 	options.title.textStyle.fontSize = 12;
		// 	options.title.text = "Zeitreihe - Arithm. Mittel";
		// 	options.yAxis.axisLabel = { "fontSize": 10 };
		// 	options.xAxis.axisLabel = { "fontSize": 10 };
		// 	options.legend.show = false;
		// 	options.grid.top = 35;
		// 	options.grid.bottom = 5;
		// 	options.title.show = true;
		// 	options.toolbox.show = false;
		// 	lineChart.setOption(options);
		// 	lineChart.resize();
		// 	$scope.echartInstances.push(lineChart);
		// }

		// /**
		//  * 
		//  * @param {domNode} wrapper | 
		//  * @param {obj} page 
		//  * @param {int} x 
		//  * @param {int} y 
		//  */
		// function positionElementOnPage(wrapper, page, x, y) {
		// 	wrapper.style.left = x + "px";
		// 	wrapper.style.top = y + "px";

		// 	let pageNode = document.querySelector("#reporting-page-" + page.pNumber)
		// 	pageNode.appendChild( wrapper );
		// }
    }
]});