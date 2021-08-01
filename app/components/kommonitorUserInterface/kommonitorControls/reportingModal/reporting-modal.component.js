angular.module('reportingModal').component('reportingModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDiagramHelperService',
	'kommonitorInfoLegendHelperService', 'kommonitorVisualStyleHelperService',
	'$scope', '$rootScope', '__env', '$timeout', 
	function ReportingModalController(kommonitorDataExchangeService, kommonitorDiagramHelperService, 
		kommonitorInfoLegendHelperService, kommonitorVisualStyleHelperService,
		$scope, $rootScope, __env, $timeout) {

		$scope.availableIndicators = [];
		$scope.availableIndicatorsNames = [];

		$scope.addedIndicators = [];
		$scope.addedIndicatorsNames = [];

		$scope.addedIndicatorsBoxSelection = {};

		$scope.allAddedIndicatorsConfig = [];
		$scope.modifiedIndicatorConfigSave = {};

		$scope.pagesArray = [];
		$scope.gridsArray = [];
		$scope.echartInstances = [];
		$scope.generatingReport = false;

		var elementPositionAtDragStart = undefined;

		//initialize
		$('#reporting-modal').on('show.bs.modal', function () {

			$scope.createPlaceholderPage();

			document.getElementById("reporting-load-settings-button").addEventListener('change', readSingleFile, false);
			
			//jquery $().on does not trigger angularJS digest circle
			//https://stackoverflow.com/questions/23968384/databinding-not-updating-when-called-from-on
			$scope.$apply(function () { 
				loadIndicators();
			});

			$(function() {
				$(".draggable").draggable({
					revert: "invalid",
					revertDuration: 0,
					appendTo: $('#reporting-modal .modal-content'),
					scroll: false,
					helper: "clone"
				});
			});

			$(".droppable").droppable({
				drop: function( event, ui ) {
					//don't do anything if a grid item was dropped instead of an indicator
					if (ui.draggable.first().hasClass("grid-stack-item")) {
						return;
					} else {
						var indicatorAsString = ui.draggable.first().attr("data-indicator");
						//parse string to object
						var droppedIndicator = $.parseJSON(indicatorAsString);

						//open new modal
						$('#reporting-add-indicator-modal').modal();
						//jquery $().on does not trigger angularjs digest circle
						//https://stackoverflow.com/questions/23968384/databinding-not-updating-when-called-from-on
						$rootScope.$apply(function () { 
							$rootScope.$broadcast('addIndicatorModalOpened', droppedIndicator, undefined);
						});
					}
				}
			});
		});

		/**
		 * removes an indicator and all corresponding grid tiles
		 * adds indicator back to available indicators
		 */
		$scope.removeIndicator = function() {
			var indicator = $scope.addedIndicatorsBoxSelection;
			if($.isEmptyObject(indicator)) {
				return;
			}
			
			// remove grid tiles from DOM
			var indicatorId = indicator.indicatorId;
			// find all elements where data-gs-id attribute contains the indicator id and remove them
			$(document).find("[data-gs-id*='" + indicatorId + "']").remove(); 

			//remove from echartInstances
			$scope.echartInstances = $scope.echartInstances.filter( el => {
				if(el.getDom().id.includes(indicatorId)) {
					el.dispose();
					return false;
				} else {
					return true;
				}
			});
			
			//remove from addedIndicatorsNames
			$scope.addedIndicatorsNames = $scope.addedIndicatorsNames.filter( 
				el => el !== indicator.indicatorName
			);

			//remove from addedIndicators
			$scope.addedIndicators = $scope.addedIndicators.filter( 
				el => el !== indicator
			);

			//add back to available indicators and availableIndicatorsNames
			$scope.availableIndicators[$scope.availableIndicators.length] = $scope.addedIndicatorsBoxSelection;
			$scope.availableIndicatorsNames[$scope.availableIndicatorsNames.length] = indicator.indicatorName;

			//delete config
			$scope.allAddedIndicatorsConfig = $scope.allAddedIndicatorsConfig.filter( 
				el => el.indicator.indicatorName !== indicator.indicatorName
			);
			$rootScope.$broadcast("reportingIndicatorRemoved", indicatorId);
			
			//reset box selection
			$scope.addedIndicatorsBoxSelection = undefined;

			//remove empty pages
			var pages = $(document).find("div[id^=reporting-page-]");
			
			// iterate pages in reverse because removing a page lowers the page number of
			// all following pages leading to incorrect results in a normal iteration
			$(pages.get().reverse()).each( (index, el) => {
				//get grid
				var $grid = $(el).find("div[id^=grid-]");
				//if empty
				if($grid.children().length == 0) {
					//remove from pages array
					var pNumber = $grid.attr("id").split("-")[1];
					$scope.removePage(pNumber);
				}
			});
			
			$timeout( function() {
				//if all pages were removed create a placeholder page
				pages = $(document).find("div[id^=reporting-page-]");
				if(pages.length == 0) {
					$scope.createPlaceholderPage();
				}

				$(".draggable").draggable({
					revert: "invalid",
					revertDuration: 0,
					appendTo: $('#reporting-modal .modal-content'),
					scroll: false,
					helper: "clone"
				});
			});
		};

		$scope.configureIndicator = function() {

			var indicator =  $scope.addedIndicatorsBoxSelection;
			if($.isEmptyObject(indicator)) {
				return;
			}
			//get configuration object
			var config = $scope.getIndicatorConfigByName(indicator.indicatorName);
			//save configuration object for cormaprison
			$scope.modifiedIndicatorConfigSave = config;
			//open modal
			$('#reporting-add-indicator-modal').modal();
			$rootScope.$broadcast('addIndicatorModalOpened', indicator, config);		
		};

		/**
		 * saves the current state to a json object
		 */
		$scope.saveSettings = function() {

			//get tile information
			var tilePositions = [];
			$($scope.gridsArray).each( (index, el) => {
				var $grid = $(el.grid);
				var $tiles = $($grid.attr('nodes'));
				$tiles.each( (index, el) => {
					var tileInfo = {};
					tileInfo.tileId = el.id;
					tileInfo.tilePageNumber = el._grid.container[0].id.split("-")[1];
					tileInfo.tilePosX = el.x;
					tileInfo.tilePosY = el.y;
					tileInfo.tileWidth = el.width;
					tileInfo.tileHeight = el.height;
					tileInfo.tileContent = tileInfo.tileId.split("_")[2];
					tilePositions.push(tileInfo);
				});
			});

			var json = {
				'variables': {
					'availableIndicators': $scope.availableIndicators,
					'availableIndicatorsNames': $scope.availableIndicatorsNames,
					'addedIndicators': $scope.addedIndicators,
					'addedIndicatorsNames': $scope.addedIndicatorsNames,
					'addedIndicatorsBoxSelection': $scope.addedIndicatorsBoxSelection,
					'allAddedIndicatorsConfig': $scope.allAddedIndicatorsConfig,
					'modifiedIndicatorConfigSave': $scope.modifiedIndicatorConfigSave,
					// 'gridsArray': $scope.gridsArray,
					'pagesArray': $scope.pagesArray,
			 		'generatingReport': $scope.generatingReport
				},
				'tilePositions': tilePositions
			};

			var jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, (key, value) => {
				// prevent circular references
				if(key === "tiles") {
					return undefined;
				}
				return value;
			}));

			// to download json a DOM element is created, clicked and removed
			// https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
			var downloadAnchorNode = document.createElement('a');
				downloadAnchorNode.setAttribute("href", jsonString);
				downloadAnchorNode.setAttribute("download", getCurrentDateAndTime() + "_KomMonitor_Report.json");
				document.body.appendChild(downloadAnchorNode); // required for firefox
				downloadAnchorNode.click();
				downloadAnchorNode.remove();
		};



		/**
		 * reads a file chosen by the user
		 * @returns {string} file content
		 */
		function readSingleFile(e) {
			var content = "";
			var srcElement = e.srcElement;
			var file = e.target.files[0];
			if (!file) {
				return;
			}
			var reader = new FileReader();
			reader.onload = function(e) {
				content = e.target.result;
				if(srcElement.id === "reporting-load-settings-button") {
					$scope.loadSettings(content)
				}
			 };
			reader.readAsText(file);
		}

		/**
		 * reads a json object to restore a previously saved state
		 */
		$scope.loadSettings = function(fileContent) {

			//parse to json
			var json = JSON.parse(fileContent);
			// reset modal
			$scope.resetModal();
			//set variables
			$scope.availableIndicators = json.variables.availableIndicators;
			$scope.availableIndicatorsNames = json.variables.availableIndicatorsNames;
			$scope.addedIndicators = json.variables.addedIndicators;
			$scope.addedIndicatorsNames = json.variables.addedIndicatorsNames;
			$scope.addedIndicatorsBoxSelection = json.variables.addedIndicatorsBoxSelection;
			$scope.allAddedIndicatorsConfig = json.variables.allAddedIndicatorsConfig;
			$scope.modifiedIndicatorConfigSave = json.variables.modifiedIndicatorConfigSave;
			// $scope.gridsArray = josn.variables.gridsArray
			$scope.pagesArray = json.variables.pagesArray;
			$scope.generatingReport = json.variables.generatingReport;
			$($scope.allAddedIndicatorsConfig).each( (index, el) => {
				el.tiles = {};
			});
			$scope.$digest();


			//iterate pages
			$($scope.pagesArray).each( (index, el) => {
				// add grid
				// this will append the grid as last element in $scope.gridsArray
				createGrid(el, index+1);
			});
			$timeout( function() {
				$(json.tilePositions).each( (index, tile) => {
					recreateTile(tile);
					fillTileContent(tile.tileId);
				});
			});
			
		};

		$scope.generateReport = function() {

			if(!!document.getElementById("reporting-page-0")) {
				alert("Bevor ein Report erzeugt werden kann, müssen Indikatoren hinzugefügt werden.");
				return;
			}

			//show loading overlay
			$timeout(function(){
				$scope.generatingReport = true;
				document.body.style.cursor = 'wait';
			});						

			//hide all scrollbars temporarily
			//there is a bug in html2canvas, creating some space on the left side if the page has a scrollbar
			$("body").css("overflow", "hidden");
			$("#reporting-modal").css({"cssText": "display:block; overflow:hidden !important"});

			//a higher number will lead to higher quality images.
			//but it will also increase the time needed to generate a pdf and the file size
			window.devicePixelRatio = 2;
			var pages2canvasArray = [];
			for(var i=1;i<=$scope.pagesArray.length;i++) {
				pages2canvasArray.push(html2canvas(document.getElementById("reporting-page-" + i.toString()), {
					//htm2canvas options can be placed here
					scale: 1
					// width: 1120 / 1.4,
					// height: 790 / 1.4
				}));
			}
			//create html2canvas
			Promise.all(pages2canvasArray).then(data => {
					var orientation = "";
					if (data[0].width > data[0].height) {
						orientation = "landscape";
					} else {
						orientation = "portrait";
					}
					//create pdf document
					var doc = new jsPDF({
						margin: 0,	
						unit: 'mm',
						format: 'a4',
						orientation: orientation
					});
					for(var i=0;i<data.length;i++) {
						//pdf page for first page already exists
						if(i!==0) {
							//for all other pages add a page in landscape or portrait
							if($scope.pagesArray[i].pFormat === "landscape") {
								doc.addPage('a4', 'landscape');
							} else {
								doc.addPage('a4', 'portrait');
							}
						}
						//scale image to a4
						var pageWidth = doc.internal.pageSize.getWidth();
						var pageHeight = doc.internal.pageSize.getHeight();
						console.log("pdf pageWidth: ", pageWidth);
						console.log("pdf pageHeight: ", pageHeight);
						var imgData = data[i].toDataURL('image/png');
						doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST'); 
					}
					

					
					//get current date and time
					var now = getCurrentDateAndTime();

					//hide loading overlay
					$timeout(function(){
						$scope.generatingReport = false;
					//console.log($scope.generatingReport);
					//create pdf, prompt user to save it
					document.body.style.cursor = 'default';	
					});
					window.devicePixelRatio = 1; //reset this

					// unhide scrollbars
					$("body").css("overflow", "auto");
					$("#reporting-modal").css({"cssText": "display:block;"});

					doc.save(now + '_KomMonitor-Report.pdf');
					
			});
		};

		$rootScope.$on("reportingIndicatorAdded", function(event, allAddedIndicatorsConfig) {

			//save the config
			$scope.allAddedIndicatorsConfig = allAddedIndicatorsConfig;
			var addedIndicatorConfig = allAddedIndicatorsConfig[allAddedIndicatorsConfig.length-1];

			// indicator has a property geoJSON, which contains the geoJSON for all areas for the selected spatial unit
			// these need to be filtered to match selected areas only
			filterGeoJSONbyAreas(addedIndicatorConfig);

			// remove placeholder page if it exists
			$scope.removePage(0);

			// create pages depending on config
			// for each timestamp
			for (var i=0;i<addedIndicatorConfig.selectedTimestamps.length;i++) {
				
				// add one page by default
				var page = $scope.createPage("landscape");
				// save current pagesArray length +1 as constant
				// this is done to get rid of the reference to the array length.
				// by the time when createGrid is executed in the $timeout, the actual array might be longer
				const pNumber_save = $scope.pagesArray.length+1;
				//same for timestamp (get timestamp for current i, not for i==addedIndicatorConfig.selectedTimestamps.length)
				const timestamp = addedIndicatorConfig.selectedTimestamps[i].name;
				$scope.insertPage(page, pNumber_save);
				$timeout( function() {
					// add grid
					// this will append the grid as last element in $scope.gridsArray
					createGrid(page, pNumber_save);
					// create grid tiles depending on config
					// tile content is filled in later
					var grid = $scope.gridsArray[$scope.gridsArray.length-1];
					createGridTiles(grid, addedIndicatorConfig, timestamp, 1);
					// get all tiles for the current timestamp
					var properties = Object.getOwnPropertyNames(addedIndicatorConfig.tiles);
					var tileIds = properties.filter( el => el.includes(timestamp));

					// for each tile
					for (var i=0;i<tileIds.length;i++) {
						//only fill tile if it is not already filled with content
						if( $("div[data-gs-id=" + tileIds[i] + "] " + ".grid-stack-item-content").children().length == 0) {
							fillTileContent(tileIds[i]);
						}
					}
				});
				
				//if all three diagram types are checked add a second page
				var history = addedIndicatorConfig.elementCheckboxes.elementHistoryIsChecked;
				var timeline = addedIndicatorConfig.elementCheckboxes.elementTimelineIsChecked;
				var featureComparison = addedIndicatorConfig.elementCheckboxes.elementFeatureComparisonIsChecked;
				if(history && timeline && featureComparison) {
					page = $scope.createPage("landscape");
					const pNumber_save2 = $scope.pagesArray.length+1;
					$scope.insertPage(page, pNumber_save2);

					$timeout( function() {
						createGrid(page, pNumber_save2);
						var grid = $scope.gridsArray[$scope.gridsArray.length-1];
						createGridTiles(grid, addedIndicatorConfig, timestamp, 2);
						// get all tiles for the current timestamp
						var properties = Object.getOwnPropertyNames(addedIndicatorConfig.tiles);
						var tileIds = properties.filter( el => el.includes(timestamp));

						// for each tile
						for (var i=0;i<tileIds.length;i++) {
							//only fill tile if it is not already filled with content
							if( $("div[data-gs-id=" + tileIds[i] + "] " + ".grid-stack-item-content").children().length == 0) {
								fillTileContent(tileIds[i]);
							}
						}
					});
				}

				//if metadata is checked add an additional page
				//TODO only for one timestamp
				var metadata = addedIndicatorConfig.elementCheckboxes.elementMetadataIsChecked;
				if(metadata) {
					page = $scope.createPage("portrait");
					const pNumber_save2 = $scope.pagesArray.length+1;
					$scope.insertPage(page, pNumber_save2);

					$timeout( function() {
						createGrid(page, pNumber_save2);
						var grid = $scope.gridsArray[$scope.gridsArray.length-1];
						createGridTiles(grid, addedIndicatorConfig, timestamp, 3);
						// get all tiles for the current timestamp
						var properties = Object.getOwnPropertyNames(addedIndicatorConfig.tiles);
						var tileIds = properties.filter( el => el.includes(timestamp));
						// for each tile
						for (var i=0;i<tileIds.length;i++) {
							//only fill tile if it is not already filled with content
							if( $("div[data-gs-id=" + tileIds[i] + "] " + ".grid-stack-item-content").children().length == 0) {
								fillTileContent(tileIds[i]);
							}
						}
					});
				}

				//if datatable is checked add an additional page
				var datatable = addedIndicatorConfig.elementCheckboxes.elementDataTableIsChecked;
				if(datatable) {
					page = $scope.createPage("portrait");
					const pNumber_save2 = $scope.pagesArray.length+1;
					$scope.insertPage(page, pNumber_save2);

					$timeout( function() {
						createGrid(page, pNumber_save2);
						var grid = $scope.gridsArray[$scope.gridsArray.length-1];
						createGridTiles(grid, addedIndicatorConfig, timestamp, 4);
						// get all tiles for the current timestamp
						var properties = Object.getOwnPropertyNames(addedIndicatorConfig.tiles);
						var tileIds = properties.filter( el => el.includes(timestamp));
						// for each tile
						for (var i=0;i<tileIds.length;i++) {
							//only fill tile if it is not already filled with content
							if( $("div[data-gs-id=" + tileIds[i] + "] " + ".grid-stack-item-content").children().length == 0) {
								fillTileContent(tileIds[i]);
							}
						}
					});
				}
			}

			//add indicator to scope
			$scope.addedIndicators.push(addedIndicatorConfig.indicator);
			$scope.addedIndicatorsNames.push(addedIndicatorConfig.indicator.indicatorName);

			//remove indicator from list so it can't be added twice
			$scope.availableIndicators = $scope.availableIndicators.filter( 
				el => el.indicatorName !== addedIndicatorConfig.indicator.indicatorName);
			$scope.availableIndicatorsNames = $scope.availableIndicatorsNames.filter( 
				el => el !== addedIndicatorConfig.indicator.indicatorName);
		});

		$rootScope.$on("reportingIndicatorModified", function(event, allAddedIndicatorsConfig, index) {
			$scope.allAddedIndicatorsConfig = allAddedIndicatorsConfig;
			var changedIndicatorConfigNew = allAddedIndicatorsConfig[index];
			var changedIndicatorConfigOld = $scope.modifiedIndicatorConfigSave;

			console.log(changedIndicatorConfigOld);
			console.log(changedIndicatorConfigNew);
			
			//TODO

		});


		/**
		 * gets indicators from the kommonitorDataExchangeService and stores the in a scope variable.
		 * stores the indicatornames separately.
		 */
		function loadIndicators() {


			$scope.availableIndicators = [];
			$scope.availableIndicatorsNames = [];

			$scope.availableIndicators = kommonitorDataExchangeService.displayableIndicators;
			//get names
			$($scope.availableIndicators).each(function(index, indicator) {
				$scope.availableIndicatorsNames.push(indicator.indicatorName);
			});
		}

		/**
		 * toggles the selection on added indicators.
		 * Makes sure that only one indicator can be selected simultaneously.
		 */
		$scope.toggleAddedIndicatorSelection = function($event, indicator) {

			//check if element was selected or not
			var $element = $(event.currentTarget);
			var selected = $element.hasClass("reporting-selected-added-indicator");

			//deselect all indicators
			$("#addedIndicatorBox").children().each( (index, el) => {
				$(el).removeClass("reporting-selected-added-indicator");
			});
			//clear scope
			$scope.addedIndicatorsBoxSelection = undefined;

			//get clicked indicator
			$element = $(event.currentTarget);
			// if element was not selected
			if (!selected) {
				//select it
				$element.addClass("reporting-selected-added-indicator");
				//add indicator to scope
				$scope.addedIndicatorsBoxSelection = indicator;
			}
			
			
		};


		/**
		 * get indicator config by name
		 * @param {string} name: indicator name
		 * @returns {*} indicator or undefined if no indicator found
		 */
		$scope.getIndicatorConfigByName = function(name) {
			var result = undefined;
			$($scope.allAddedIndicatorsConfig).each((index, el) => {
				if(el.indicator.indicatorName === name) {
					result = el;
					return false;
				}
			});
			if (result === undefined) {
				console.error("no configuration found for indicator '" + name + "'");
			}
			return result;
		};

		/**
		 * creates a new page
		 * @param {string} format landscape or portrait
		 * @returns {obj} object with page properties
		 */
		$scope.createPage = function(format) {
			if(typeof(format) !== "string") {
				console.error("page format must be a string");
				return;
			}

			var page = {};
			page.pFormat = format;
			return page;
		};

		/**
		 * inserts a given page at the specified page number
		 * @param {obj} page page to insert
		 * @param {int} pNumber position where to insert the page
		 */
		$scope.insertPage = function(page, pNumber) {

			if(pNumber < 0) {
				console.error("Page number can not be negative.");
				return;
			}

			var arrayLength = $scope.pagesArray.length;
			if (arrayLength < pNumber) {
				page.pNumber = arrayLength+1;
				$scope.pagesArray.push(page);
			} else {
				page.pNumber = pNumber;
				$scope.pagesArray.splice(pNumber, 0, page);
			}
		};

		/**
		 * creates an empty placeholder if there are no pages.
		 */
		$scope.createPlaceholderPage = function() {
			if($scope.pagesArray.length == 0) {
				var placeholder = $scope.createPage("landscape");
				$scope.insertPage(placeholder, 0);
			}
		};

		/**
		 * removes the page at the given page number if it exists
		 * updates the ids of all following pages
		 * @param {int} pNumber number of page to be removed
		 */
		$scope.removePage = function(pNumber) {
			//remove page
			$scope.pagesArray = $scope.pagesArray.filter( (obj) => {
				return obj.pNumber != pNumber;
			});
			for(var i=1;i<=$scope.pagesArray.length;i++) {
				$scope.pagesArray[i-1].pNumber = i;
			}
		};

		/**
		 * resets the modal state back to the initial state.
		 */
		$scope.resetModal = function() {
			$scope.availableIndicators = [];
			$scope.availableIndicatorsNames = [];
			$scope.addedIndicators = [];
			$scope.addedIndicatorsNames = [];
			$scope.addedIndicatorsBoxSelection = {};
			$scope.allAddedIndicatorsConfig = [];
			$scope.modifiedIndicatorConfigSave = {};
			$scope.pagesArray = [];
			$scope.gridsArray = [];
			$scope.echartInstances = [];
			$scope.generatingReport = false;
			$rootScope.$broadcast("reportingResetModal");

			$scope.createPlaceholderPage();
			loadIndicators();
			$timeout( function() {
				$(".draggable").draggable({
					revert: "invalid",
					revertDuration: 0,
					appendTo: $('#reporting-modal .modal-content'),
					scroll: false,
					helper: "clone"
				});
			});
		};

		/**
		 * creates an empty grid for the given page.
		 * pushes grid to $scope.gridsArray
		 * @param {int} pageNumber
		 */
		function createGrid(page, pageNumber) {
			var $grid = $("#grid-" + pageNumber.toString());
			//max row number differs depending on page format
			var maxRow = undefined;
			if(page.pFormat === "landscape") {
				maxRow = 53;
			} else {
				maxRow = 76;
			}
			$grid.gridstack({
				// https://github.com/gridstack/gridstack.js/tree/develop/doc#options
				acceptWidgets: true,
				disableResize: false,
				resizable: {
					handles: 'e, se, s, sw, w',
					handleClass: "grid-stack-item"
				},
				float: true,
				maxRow: maxRow,
				column: 12,
				verticalMargin: 0,
				cellHeight: 10,
			});

			$grid.on('gsresizestop', function(event, elem) {

				var id = $(elem).attr('data-gs-id');

				var chartId;
				var chart;

				if (id.includes("map")) {
					chartId = id + "_map";
					chart = echarts.init(document.getElementById(chartId));
					chart.resize();
				} else if (id.includes("featureComparison")) {
					chartId = id + "_barChart";
					chart = echarts.init(document.getElementById(chartId));
					chart.resize();
				} else if (id.includes("history")) {
					chartId = id + "_histogramChart";
					chart = echarts.init(document.getElementById(chartId));
					chart.resize();
				} else if (id.includes("timeline")) {
					chartId = id + "_lineChart";
					chart = echarts.init(document.getElementById(chartId));
					chart.resize();
				}
				
			});

			$grid.on('dropped', function(event, previousWidget, newWidget) {

				//get tile id
				var tileId = previousWidget.id;

				//if div contains an echart
				var echartsDiv = $(newWidget.el[0]).find("div[id^=" + tileId + "]");
				var splittedId = undefined;
				//length is only 1 if div with this id was found
				if(echartsDiv.length == 1) {
					splittedId = echartsDiv.attr("id").split("_");
				} else {
					splittedId = [];
				}
			
				var typeOfChart = undefined;
				// 4 if div contains an echart
				// 0 otherwise
				if(splittedId.length == 4) {
					typeOfChart = splittedId[3];
					//concat both parts
					var chartId = tileId + "_" + typeOfChart;
					//get the chart with this id
					var charts = $scope.echartInstances.filter( (el) => { return el.getDom().id === chartId; });
					//charts.length is zero if the tile did not contain a diagram
					if (charts.length == 1) {
						//dispose chart
						charts[0].dispose();
						//remove from dom
						$(echartsDiv).parent().remove();
						//remove it from echartInstances
						$scope.echartInstances = $scope.echartInstances.filter( (el) => {
							return el.getDom().id !== chartId;
						});

						//the DOM of newWidget is different from widgets added by the user.
						//so we save the needed attributes, remove it and add a new widget
						var options = {
							x: newWidget.x,
							y: newWidget.y,
							width: newWidget.width,
							height: newWidget.height,
							id: $(newWidget.el[0]).attr("data-gs-id")
						};
						var widgetToRemove = $(newWidget._grid.container[0]).find("[data-gs-id='" + tileId + "']")[0];
						newWidget._grid.removeWidget(widgetToRemove);
						
						var item = getEmptyTileHTML();
						newWidget._grid.addWidget(item, options);
						//replace tile in config by new one
						//get config
						var config = undefined;
						$($scope.addedIndicators).each( (index, el) => {
							if(el.indicatorId === tileId.split("_")[0]) {
								config = $scope.getIndicatorConfigByName(el.indicatorName);
							}
						});
						config.tiles[tileId] = item[0];
						fillTileContent(tileId);
					}
				}

				//remove placeholder after a short timeout
				setTimeout(function() {
					var pl = $(document).find(".grid-stack-placeholder");
					pl.remove();
				}, 100);
			});

			$grid.on("dragstart", function(event, ui) {
				//lock all other elements
				$($scope.gridsArray).each( (index, element) => {
					var nodes = element.grid.nodes;
					for(var i=0;i<nodes.length;i++) {
						element.locked(nodes[i].el, true);
					}
				});
			});

			$grid.on("resizestart", function(event, ui) {
				//lock all other elements
				$($scope.gridsArray).each( (index, element) => {
					var nodes = element.grid.nodes;
					for(var i=0;i<nodes.length;i++) {
						element.locked(nodes[i].el, true);
					}
				});
			});

			$grid.on("change", function(event, items) {
				//unlock all elements
				$($scope.gridsArray).each( (index, element) => {
					var nodes = element.grid.nodes;
					for(var i=0;i<nodes.length;i++) {
						element.locked(nodes[i].el, false);
					}
				});
			});

			var grid = $grid.data('gridstack');
			$scope.gridsArray.push(grid);
		}

		/**
		 * creates grid tiles depending on the config for the given grid
		 * each tile gets a unique id (combination of indicator id, timesamp and element).
		 * example ids (replace {indicatorId} and {timestamp}):
		 * 	{indicatorId}_{timestamp}_map
		 * 	{indicatorId}_{timestamp}_history
		 * 	{indicatorId}_{timestamp}_featureComparison
		 * 	{indicatorId}_{timestamp}_metadata
		 * 
		 * @param {obj} grid grid to add tiles for
		 * @param {obj} config configuration object for indicator to add
		 * @param {string} timestamp timestamp (used for id)
		 * @param {int} page number of the newly added page (relative, not absolute).
		 * 						If 4 pages are added per timestamp it is either 1,2,3 or 4
		 */
		function createGridTiles(grid, config, timestamp, page) {
			var elements = config.elementCheckboxes;

			if(page == 1) {
				if(elements.elementMapIsChecked) {
					var id = config.indicator.indicatorId + "_" + timestamp + "_map";
					var options = {
						x: 0,
						y: 0,
						width: 12,
						height: 37,
						id: id
					};
				
					// the template is the same for all tiles.
					// however, we need separate variables to not just replace the previously added item
					var item = getEmptyTileHTML();
					grid.addWidget(item, options);
					//get the added tile
					var tile = $(document).find("[data-gs-id='" + id + "']")[0];
					//save in config
					config.tiles[id] = tile;
				}
	
				if(elements.elementDescriptionIsChecked) {
					var id = config.indicator.indicatorId + "_" + timestamp + "_description";
					var options = {
						x: 8,
						y: 0,
						width: 5,
						height: 37,
						id: id
					};
					var item = getEmptyTileHTML();
					grid.addWidget(item, options);
					var tile = $(document).find("[data-gs-id='" + id + "']")[0];
					config.tiles[id] = tile;
				}

				var x = 0;
				if(elements.elementFeatureComparisonIsChecked) {
					var id = config.indicator.indicatorId + "_" + timestamp + "_featureComparison";
					var options = {
						x: x,
						y: 37,
						width: 6,
						height: 16,
						id: id
					};
					var item = getEmptyTileHTML();
					grid.addWidget(item, options);
					var tile = $(document).find("[data-gs-id='" + id + "']")[0];
					config.tiles[id] = tile;

					x = x+7;
				}

				if(elements.elementHistoryIsChecked) {
					var id = config.indicator.indicatorId + "_" + timestamp + "_history";
					var options = {
						x: x,
						y: 37,
						width: 6,
						height: 16,
						id: id
					};
					var item = getEmptyTileHTML();
					grid.addWidget(item, options);
					var tile = $(document).find("[data-gs-id='" + id + "']")[0];
					config.tiles[id] = tile;

					x = x+7;
				}

				//zero or one diagrams added
				if(x < 14) {
					var id = config.indicator.indicatorId + "_" + timestamp + "_timeline"
					if(elements.elementTimelineIsChecked) {
						var options = {
							x: x,
							y: 37,
							width: 6,
							height: 16,
							id: id
						};
						var item = getEmptyTileHTML();
						grid.addWidget(item, options);
						var tile = $(document).find("[data-gs-id='" + id + "']")[0];
						config.tiles[id] = tile;
					}
				}
			}

			if(page == 2) {
				//all three diagram types are checked
				var id = config.indicator.indicatorId + "_" + timestamp + "_timeline";
				var options = {
					x: 0,
					y: 0,
					width: 6,
					height: 16,
					id: id
				};
				var item = getEmptyTileHTML();
				grid.addWidget(item, options);
				var tile = $(document).find("[data-gs-id='" + id + "']")[0];
				config.tiles[id] = tile;
			}

			if(page==3) {
				//metadata checked
				var id = config.indicator.indicatorId + "_" + timestamp + "_metadata";
				var options = {
					x: 0,
					y: 0,
					width: 12,
					height: 76,
					id: id
				};
				var item = getEmptyTileHTML();
				grid.addWidget(item, options);
				var tile = $(document).find("[data-gs-id='" + id + "']")[0];
				config.tiles[id] = tile;
			}

			if(page==4) {
				//datatable checked
				var id = config.indicator.indicatorId + "_" + timestamp + "_dataTable"
				var options = {
					x: 0,
					y: 0,
					width: 6,
					height: 76,
					id: id
				};
				var item = getEmptyTileHTML();
				grid.addWidget(item, options);
				var tile = $(document).find("[data-gs-id='" + id + "']")[0];
				config.tiles[id] = tile;
			}
		}

		/**
		 * creates a html template for an empty tile.
		 * @returns {obj} parsed html
		 */
		function getEmptyTileHTML() {
			var item = $.parseHTML(
				"<div class='grid-stack-item'>" +
					"<div class='grid-stack-item-content'>" +
						//content goes here later
					"</div>" +
				"</div>");
			return item;
		}

		/**
		 * inserts content (map, diagrams, ...) in tiles.
		 * gets all needed information (indicator, timestamp and content type) from the tile id.
		 * @param {string} tileId
		 */
		function fillTileContent(tileId) {
			//get config
			var indicatorId = tileId.split("_")[0];
			var indicatorName = undefined;
			$($scope.addedIndicators).each( (index, el) => {
				if(el.indicatorId == indicatorId) {
					indicatorName = el.indicatorName;
				}
			});

			// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator to false to have consistent reporting setup
			// set classifyZeroSeparately to true 
			var useOutlierDetectionOnIndicator_backup = kommonitorDataExchangeService.useOutlierDetectionOnIndicator;
			var classifyUsingWholeTimeseries_backup = kommonitorDataExchangeService.classifyUsingWholeTimeseries;
			var classifyZeroSeparately_backup = kommonitorDataExchangeService.classifyZeroSeparately; 

			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;
			kommonitorDataExchangeService.classifyZeroSeparately = true;

			var config = $scope.getIndicatorConfigByName(indicatorName);

			//get timestamp
			var timestamp = tileId.split("_")[1];

			var geoJSON = config.indicator.geoJSON;
			var timestampPref = __env.indicatorDatePrefix + timestamp;
			var numClasses = config.indicator.defaultClassificationMapping.items.length;
			var colorCodeStandard = config.indicator.defaultClassificationMapping.colorBrewerSchemeName;
			var colorCodePositiveValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
			var colorCodeNegativeValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
			var classifyMethod = __env.defaultClassifyMethod;
			//setup brew
			var defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(geoJSON, timestampPref, numClasses, colorCodeStandard, classifyMethod);
			var dynamicBrewsArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(geoJSON, timestampPref, colorCodePositiveValues, colorCodeNegativeValues, classifyMethod);
			var dynamicIncreaseBrew = dynamicBrewsArray[0];
			var dynamicDecreaseBrew = dynamicBrewsArray[1];

			//setup diagram resources
			kommonitorDiagramHelperService.prepareAllDiagramResources_forReportingIndicator(config.indicator, config.selectedSpatialUnit.spatialUnitName, timestamp, defaultBrew, undefined, undefined, dynamicIncreaseBrew, dynamicDecreaseBrew, false, 0, false);
			
			// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values			
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
			kommonitorDataExchangeService.classifyZeroSeparately = classifyZeroSeparately_backup;

			//fill the tile with different content
			//the id shows what type of content is needed
			var contentType = tileId.split("_")[2]; //get the last part ot the id
			var $tileContent = $(config.tiles[tileId]).children().first();

			if (contentType === "map") {

				var html = $.parseHTML(
					"<div class='chart' style='width:100%;height:100%'>" +
						"<div id='" + tileId + "_map' style='width:100%;height:100%;'>" +
						"</div>" +
					"</div>");
				$tileContent.append(html[0]);
				var map = echarts.init(document.getElementById(tileId + "_map"));
				var options = kommonitorDiagramHelperService.getGeoMapChartOptions();
				options.title.textStyle.fontSize = 16;
				options.title.show = true;
				options.grid = undefined;
				options.visualMap.axisLabel = {
					"fontSize": 10
				};
				options.toolbox.show = false;
				map.setOption(options);
				map.resize();
				$scope.echartInstances.push(map);

			} else if (contentType === "description") {
				//variables
				var ind = config.indicator;
				var meta = ind.metadata;

				var name = ind.indicatorName ? ind.indicatorName : "";
				var category = ind.isHeadlineIndicator ? ind.isHeadlineIndicator : "";
				var type = ind.indicatorType ? ind.indicatorType : "";
				var description = meta.description ? meta.description : "";
				var unit = ind.unit ? ind.unit : "";
				var method = ind.processDescription ? ind.processDescription : "";
				var interpretation = ind.interpretation ? ind.interpretation : "";
				var datasource = meta.datasource ? meta.datasource : "";
				var contact = meta.contact ? meta.contact : "";
				var note = meta.note ? meta.note : "";
				var updateInterval = meta.updateInterval ? meta.updateInterval : "";

				var html = $.parseHTML(
					'<table id="reporting-metadata-table" class="table table-condensed">'+
					'	<tbody>'+
					'		<tr>'+
					'			<td><strong>Name</strong></td>'+
					'			<td>' + name + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Kategorie</strong></td>'+
					'			<td>' + category + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Typ</strong></td>'+
					'			<td>' + type + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Beschreibung</strong></td>'+
					'			<td>' + description + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Ma&szlig;einheit</strong></td>'+
					'			<td>' + unit + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Methodik</strong></td>'+
					'			<td>' + method + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Interpretation</strong></td>'+
					'			<td>' + interpretation + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Datengrundlage</strong></td>'+
					'			<td>' + datasource + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Datenquelle</strong></td>'+
					'			<td>' + datasource + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Datenhalter und Kontakt</strong></td>'+
					'			<td>' + contact + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Bemerkung</strong></td>'+
					'			<td>' + note + '</td>'+
					'		</tr>'+
					'		<tr>'+
					'			<td><strong>Fortf&uuml;hrungsintervall</strong></td>'+
					'			<td>' + updateInterval + '</td>'+
					'		</tr>'+
					'	</tbody>'+
					'</table>' 
				);
				$tileContent.html("");
				$tileContent.append(html[0]);

			} else if (contentType === "featureComparison") {
				
				var html = $.parseHTML(
					"<div class='chart' style='width:100%;height:100%'>" +
						"<div id='" + tileId + "_barChart' style='width:100%;height:100%;'>" +
						"</div>" +
					"</div>");
				$tileContent.append(html[0]);
				var barChart = echarts.init(document.getElementById(tileId + "_barChart"));
				var options = kommonitorDiagramHelperService.getBarChartOptions();
				options.xAxis.name = ""; //remove title
				options.title.textStyle.fontSize = 12;
				options.title.text = "Ranking";
				options.yAxis.axisLabel = {
					"fontSize": 10
				};
				options.title.show = true;
				options.grid.top = 35;
				options.grid.bottom = 5;
				options.toolbox.show = false;
				barChart.setOption(options);
				barChart.resize();
				$scope.echartInstances.push(barChart);

			} else if (contentType === "history") {

				var html = $.parseHTML(
					"<div class='chart' style='width:100%;height:100%'>" +
						"<div id='" + tileId + "_histogramChart' style='width:100%;height:100%;'>" +
						"</div>" +
					"</div>");
				$tileContent.append(html[0]);
				var histogramChart = echarts.init(document.getElementById(tileId + "_histogramChart"));
				var options = kommonitorDiagramHelperService.getHistogramChartOptions();
				options.xAxis[0].name = ""; //remove title
				options.title.textStyle.fontSize = 12;
				options.title.show = true;
				options.grid.top = 35;
				options.grid.bottom = 5;
				options.yAxis.axisLabel = {
					"fontSize": 10
				};
				options.toolbox.show = false;
				histogramChart.setOption(options);
				histogramChart.resize();
				$scope.echartInstances.push(histogramChart);
				
			} else if (contentType === "timeline") {

				var html = $.parseHTML(
					"<div class='chart' style='width:100%;height:100%'>" +
						"<div id='" + tileId + "_lineChart' style='width:100%;height:100%;'>" +
						"</div>" +
					"</div>");
				$tileContent.append(html[0]);
				var lineChart = echarts.init(document.getElementById(tileId + "_lineChart"));
				var options = kommonitorDiagramHelperService.getLineChartOptions();
				options.xAxis.name = ""; //remove title
				options.title.textStyle.fontSize = 12;
				options.title.text = "Zeitreihe - Arithm. Mittel";
				options.yAxis.axisLabel = {
					"fontSize": 10
				};
				options.xAxis.axisLabel = {
					"fontSize": 10
				};
				options.legend.show = false;
				options.grid.top = 35;
				options.grid.bottom = 5;
				options.title.show = true;
				options.toolbox.show = false;
				lineChart.setOption(options);
				lineChart.resize();
				$scope.echartInstances.push(lineChart);

			} else if (contentType === "metadata") {
				var jspdf = kommonitorDataExchangeService.createMetadataPDF_indicator(config.indicator);
				// TODO create an image to show in the tile
				var dataUrl = jspdf.output('dataurlstring');
				
				var $obj = $('<object>');
				$obj.attr("data", dataUrl);
				$obj.css("width", "100%");
				$obj.css("height", "100%");
				$obj.attr("type","application/pdf");
				$tileContent.append($obj);

			} else if (contentType === "dataTable") {

			} else {
				console.err("contentType was something unexpected: " + contentType);
				return;
			}
		}

		/**
		 * filters the geoJSON property of the indicator by the selected areas.
		 * filters by area name
		 * this is a preparation for the method fillTileContent
		 * @param {obj} config 
		 */
		function filterGeoJSONbyAreas(config) {
			var features = config.indicator.geoJSON.features;
			features = features.filter( (obj) => {
				var name = obj.properties.NAME;
				for (var key in config.selectedAreas) {
					var el = config.selectedAreas[key];
					if(name === el.name) {
						return true;
					}
					
				}
				return false;
			});
			config.indicator.geoJSON.features = features;
		}

		/**
		 * gets the current date and time in format: yyyy-mm-dd_HH-MM-SS
		 * @returns {string}
		 */
		function getCurrentDateAndTime() {
			var date = new Date();
			var year = date.getFullYear().toString().substr(-2);
			var month = date.getMonth() + 1;
			var day = date.getDate();
			var time = date.getHours();
			var minutes = date.getMinutes();
			var seconds = date.getSeconds();
			var now = "".concat(year, "-", month, "-", day, "_", time, "-", minutes, "-", seconds);
			return now;
		}

		function recreateTile(tile) {
			var grid = $("#grid-" + tile.tilePageNumber.toString()).data('gridstack');
			var options = {
				x: tile.tilePosX,
				y: tile.tilePosY,
				width: tile.tileWidth,
				height: tile.tileHeight,
				id: tile.tileId
			};
			var item = getEmptyTileHTML();
			grid.addWidget(item, options);

			t = $(document).find("[data-gs-id='" + tile.tileId + "']")[0];
			//get config
			var config = undefined;
			$($scope.addedIndicators).each( (index, el) => {
				if(el.indicatorId === tile.tileId.split("_")[0]) {
					config = $scope.getIndicatorConfigByName(el.indicatorName);
				}
			});
			config.tiles[tile.tileId] = t;
		}

		$scope.filterIndicators = function() {

			return kommonitorDataExchangeService.filterIndicators();
		};
	}
]});


