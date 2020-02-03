angular.module('reportingModal').component('reportingModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reporting-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$timeout', function ReportingModalController(kommonitorDataExchangeService, $scope, $rootScope, __env, $timeout) {


		$scope.dataExchangeServiceInstance = kommonitorDataExchangeService;
		$scope.availableIndicators = [];
		$scope.availableIndicatorsNames = [];

		$scope.addedIndicators = [];
		$scope.addedIndicatorsNames = [];

		$scope.droppedIndicator = undefined;
		$scope.addedIndicatorsBoxSelection = {};

		$scope.allAddedIndicatorsConfig = [];

		$scope.pagesArray = [];
		$scope.generatingReport = false;

		//initialize
		$('#reporting-modal').on('show.bs.modal', function (e) {

			//create placeholder page
			if($scope.pagesArray.length == 0) {
				var placeholder = $scope.createPage("landscape");
				$scope.insertPage(placeholder, 0);
			}
			
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
						return
					} else {
						var indicatorAsString = ui.draggable.first().attr("data-indicator")
						//parse string to object
						$scope.droppedIndicator = $.parseJSON(indicatorAsString);

						//open new modal
						$('#reporting-add-indicator-modal').modal();
						//jquery $().on does not trigger angularjs digest circle
						//https://stackoverflow.com/questions/23968384/databinding-not-updating-when-called-from-on
						$rootScope.$apply(function () { 
							$rootScope.$broadcast('addIndicatorModalOpened', $scope.droppedIndicator, undefined);
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
			//TODO remove grid tiles

			//remove from addedIndicatorsNames
			$scope.addedIndicatorsNames = $scope.addedIndicatorsNames.filter( 
				el => el !== indicator.indicatorName);

			//remove from addedIndicators
			$scope.addedIndicators = $scope.addedIndicators.filter( 
				el => el !== indicator);

			//add back to available indicators and availableIndicatorsNames
			$scope.availableIndicators.push($scope.addedIndicatorsBoxSelection);
			$scope.availableIndicatorsNames.push(indicator.indicatorName);

			//delete conf
			$scope.allAddedIndicatorsConfig = $scope.allAddedIndicatorsConfig.filter( 
				el => el.indicator.indicatorName !== indicator.indicatorName);

			//reset box selection
			$scope.addedIndicatorsBoxSelection = undefined;
		}

		$scope.configureIndicator = function() {
			var indicator =  $scope.addedIndicatorsBoxSelection;
			//get configuration object
			var conf = $scope.getIndicatorConfigByName(indicator.indicatorName)
			//open modal
			$('#reporting-add-indicator-modal').modal();
			//jquery $().on does not trigger angularjs digest circle
			//https://stackoverflow.com/questions/23968384/databinding-not-updating-when-called-from-on
			$rootScope.$broadcast('addIndicatorModalOpened', indicator, conf);		
		}

		$scope.saveSettings = function() {
			//TODO
		};

		$scope.loadSettings = function() {
			//TODO
		};

		$scope.generateReport = function() {

			if(!!document.getElementById("reporting-page-0")) {
				alert("Bevor ein Report erzeugt werden kann, müssen Indikatoren hinzugefügt werden.")
				return;
			}

			//show loading overlay
			//$scope.generatingReport = true;
			document.body.style.cursor = 'wait';

			//a higher number will lead to higher quality images.
			//but it will also increase the time needed to generate a pdf and the file size
			window.devicePixelRatio = 2;

			var pages2canvasArray = []
			for(var i=1;i<=$scope.pagesArray.length;i++) {
				pages2canvasArray.push(html2canvas(document.getElementById("reporting-page-" + i.toString())))
			}

			//create html2canvas
			Promise.all(pages2canvasArray).then(data => {
					console.log(data[0])
					var orientation = ""
					if (data[0].width > data[0].height) {
						orientation = "landscape"
					} else {
						orientation = "portarait"
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
						console.log(data[i])
						//scale image to a4
						//TODO results differ depending on browser zoom level
						var pageWidth = doc.internal.pageSize.getWidth();
						var pageHeight = doc.internal.pageSize.getHeight();
						console.log("pdf pageWidth: ", pageWidth);
						console.log("pdf pageHeight: ", pageHeight);
						
						//create new canvas
						// var extraCanvas = document.createElement("canvas");
						// extraCanvas.setAttribute('width',pageWidth);
						// extraCanvas.setAttribute('height',pageHeight);
						// extraCanvas.setAttribute("style","width:"+pageWidth+"mm;height:"+pageHeight+"mm");
						// var ctx = extraCanvas.getContext('2d');
						// ctx.drawImage(data[i],0,0,data[i].width, data[i].height,0,0, pageWidth, pageHeight);
						// console.log("extraCanvas: ", extraCanvas);
						//var imgData = extra_canvas.toDataURL('image/png');

						var imgData = data[i].toDataURL('image/png');

						doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight); 
					}
					//get current date and time
					var date = new Date();
					var year = date.getFullYear().toString().substr(-2);
					var month = date.getMonth()+1;
					var day = date.getDate();
					var time = date.getHours();
					var minutes = date.getMinutes();
					var seconds = date.getSeconds();
					var now = "".concat(year,"-",month,"-",day,"_",time,"-",minutes,"-",seconds);

					//hide loading overlay
					//$scope.generatingReport = false;
					//console.log($scope.generatingReport);
					//create pdf, prompt user to save it
					document.body.style.cursor = 'default';
					window.devicePixelRatio = 1; //reset this
					doc.save(now + '_KomMonitor-Report.pdf');
					
			});
		};

		$rootScope.$on("indicatorAdded", function(event, allAddedIndicatorsConfig) {

			//dropped indicator contains the added indicator
			$scope.addedIndicators.push($scope.droppedIndicator);
			$scope.addedIndicatorsNames.push($scope.droppedIndicator.indicatorName);

			//save the config
			$scope.allAddedIndicatorsConfig = allAddedIndicatorsConfig;
			var addedIndicatorConfig = allAddedIndicatorsConfig[allAddedIndicatorsConfig.length-1];

			// remove placeholder page if it exists
			$scope.removePage(0);

			var pagesLengthBefore = $scope.pagesArray.length;

			// create pages depending on config
			// for each timestamp
			for (var i=0;i<addedIndicatorConfig.selectedTimestamps.length;i++) {
				
				// add one page by default
				var page = $scope.createPage("landscape");

				$scope.insertPage(page, $scope.pagesArray.length+1)
				
				//if all three diagram types are checked add a second page
				var history = addedIndicatorConfig.elementCheckboxes.elementHistoryIsChecked;
				var timeline = addedIndicatorConfig.elementCheckboxes.elementTimelineIsChecked;
				var featureComparison = addedIndicatorConfig.elementCheckboxes.elementFeatureComparisonIsChecked;
				if(history && timeline && featureComparison) {
					page = $scope.createPage("landscape");
					$scope.insertPage(page, $scope.pagesArray.length+1)
				}

				//if metadata is checked add an additional page
				var metadata = addedIndicatorConfig.elementCheckboxes.elementMetadataIsChecked;
				if(metadata) {
					page = $scope.createPage("portrait");
					$scope.insertPage(page, $scope.pagesArray.length+1)
				}

				//if datatable is checked add an additional page //TODO
				var datatable = addedIndicatorConfig.elementCheckboxes.elementDataTableIsChecked;
				if(datatable) {
					page = $scope.createPage("portrait");
					$scope.insertPage(page, $scope.pagesArray.length+1)
				}
			}

			var pagesLengthAfter = $scope.pagesArray.length;

			// create grid for each new page
			$timeout( function() {
				for (var i=pagesLengthBefore;i<pagesLengthAfter;i++) {
					//var $grid = $('#grid-' + (i+1).toString())
					var $grid = $("#grid-" + (i+1).toString());
					console.log($grid);
					//max row number differs depending on page format
					var maxRow = undefined;
					if($scope.pagesArray[i].pFormat === "landscape") {
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
						dragOut: true,
						float: true,
						itemClass: "grid-stack-item",
						maxRow: maxRow,
						column: 12,
						verticalMargin: 0,
						cellHeight: 10,
						disableOneColumnMode: true
					});

					//create grid tiles
					//TODO
					var grid = $grid.data('gridstack');
					console.log(grid);
					var options = {
						x: 0,
						y: 0,
						width: 8,
						height: 37,
						//id: $scope.droppedIndicator.indicatorName + "_" + i.toString()
					}
					var item = $.parseHTML(
						"<div class='grid-stack-item'>" +
							"<div class='grid-stack-item-content'>" +
								'<img style="width:511px;height:368px" src="img_temp/KomMonitor-Kartenexport.png" />' +
						"</div>" +
					"</div>");
					grid.addWidget(item, options)


					options = {
						x: 9,
						y: 0,
						width: 4,
						height: 37,
						//id: $scope.droppedIndicator.indicatorName + "_" + i.toString()
					}
					var item = $.parseHTML(
						"<div class='grid-stack-item'>" +
							"<div class='grid-stack-item-content'>" +
								'<div style="width:100%;font-size:8pt;word-wrap:break-word;padding:3px;">' +
									'<h3>Indikatoreninformation</h3>' +
									'<p>Hier ist Platz für Informationen über den Indikator.</p>' +
									'<p><b>Beschreibung: </b>Platzhalter</p>' +
									'<p><b>Datenquelle: </b>Platzhalter</p>' +
									'<p><b>Aktualisierungszyklus: </b>Platzhalter</p>' +
									'<p><b>zuletzt aktualisiert am: </b>Platzhalter</p>' +
								'</div>' +
							"</div>" +
						"</div>");
					grid.addWidget(item, options)


					options = {
						x: 0,
						y: 37,
						width: 6,
						height: 16,
						//id: $scope.droppedIndicator.indicatorName + "_" + i.toString()
					}
					var item = $.parseHTML(
						"<div class='grid-stack-item'>" +
							"<div class='grid-stack-item-content'>" +
								'<img style="width:382px;height:159px" src="img_temp/feature-vergleich.jpg"/>' +
						"</div>" +
					"</div>");
					grid.addWidget(item, options)


					options = {
						x: 7,
						y: 37,
						width: 6,
						height: 16,
						//id: $scope.droppedIndicator.indicatorName + "_" + i.toString()
					}
					var item = $.parseHTML(
						"<div class='grid-stack-item'>" +
							"<div class='grid-stack-item-content'>" +
								'<img style="width:382px;height:159px" src="img_temp/histogramm.jpg"/>' +
						"</div>" +
					"</div>");
					grid.addWidget(item, options)
				}
			});
			
			//TODO add reference to grid tiles (ids)

			//TODO create a connection between grid tiles and chosen options


			//remove indicator from list so it can't be added twice
			//TODO comparison is only by name right now, not by all properties
			$scope.availableIndicators = $scope.availableIndicators.filter( 
				el => !angular.equals(el, $scope.droppedIndicator));
			$scope.availableIndicatorsNames = $scope.availableIndicatorsNames.filter( 
				el => el !== $scope.droppedIndicator.indicatorName);
		});

		$scope.$on("indicatorModified", function(event, allAddedIndicatorsConfig, index) {
			$scope.allAddedIndicatorsConfig = allAddedIndicatorsConfig;
			var changedIndicatorConfig = allAddedIndicatorsConfig[index];
			//TODO do not use dropped indicator as it may not be the changed one
			//maybe get the changed indicator from other modal instaed
			//TODO change grid tiles

			//TODO add references to grid tiles (ids)

			//TODO create a connection between grid tiles and chosen options

		});


		/**
		 * gets indicators from the kommonitorDataExchangeService and stores the in a scope variable.
		 * stores the indicatornames separately.
		 */
		function loadIndicators() {
			//clear names to prevent error when modal is opened more than once
			$scope.availableIndicatorsNames = []

			$scope.availableIndicators = kommonitorDataExchangeService.availableIndicators
			//get names
			$($scope.availableIndicators).each(function(index, indicator) {
				$scope.availableIndicatorsNames.push(indicator.indicatorName)
			})
		};

		/**
		 * toggles the selection on added indicators.
		 * Makes sure that only one indicator can be selected simultaneously.
		 */
		$scope.toggleAddedIndicatorSelection = function($event, indicator) {

			//check if element was selected or not
			$element = $(event.currentTarget)
			var selected = $element.hasClass("reporting-selected-added-indicator")

			//deselect all indicators
			$("#addedIndicatorBox").children().each( (index, el) => {
				$(el).removeClass("reporting-selected-added-indicator")
			});
			//clear scope
			$scope.addedIndicatorsBoxSelection = undefined;

			//get clicked indicator
			var $element = $(event.currentTarget)
			// if element was not selected -> select it
			if (!selected) {
				$element.addClass("reporting-selected-added-indicator");
			}
			
			//add indicator to scope
			$scope.addedIndicatorsBoxSelection = indicator;
		}


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
					return false
				}
			});
			if (result === undefined) {
				console.error("no configuration found for indicator '" + name + "'")
			}
			return result;
		}

		/**
		 * creates a new page
		 * @param {string} format landscape or portrait
		 * @returns {obj} object with page properties
		 */
		$scope.createPage = function(format) {
			if(typeof(format) !== "string") {
				console.error("page format must be a string")
				return;
			}

			page = {};
			page.pFormat = format;
			return page;
		}

		/**
		 * inserts a given page at the specified page number
		 * @param {obj} page page to insert
		 * @param {int} pNumber position where to insert the page
		 */
		$scope.insertPage = function(page, pNumber) {

			if(pNumber < 0) {
				console.error("Page number can not be negative.")
				return;
			}

			var arrayLength = $scope.pagesArray.length;
			if (arrayLength < pNumber) {
				console.log("pNumber was greater than the current number of pages. Appending page as last page.")
				page.pNumber = arrayLength+1;
				$scope.pagesArray.push(page)
			} else {
				page.pNumber = pNumber
				$scope.pagesArray.splice(pNumber, 0, page)
			}
		}

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
		}
	}
]});
