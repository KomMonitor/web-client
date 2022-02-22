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
		$scope.echartsImgPixelRatio = 2;

		$scope.initialize = function(data) {
			let configFileSelected = data[0];
			data = data[1];
			if(configFileSelected) {
				$scope.importConfig(data);
			} else {
				$scope.config.template = JSON.parse(JSON.stringify(data));
				$scope.config.pages = $scope.config.template.pages;
			}
			let deviceScreenDpi = calculateScreenDpi();
			$scope.pxPerMilli = deviceScreenDpi / 25.4 // /2.54 --> cm, /10 --> mm
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


						// usually each type is included only once per page, but there is an exception for linecharts in area specific part of timeseries template
						// for now we more or less hardcode this, but it might have to change in the future
						let pElementDom;
						if(pageElement.type === "linechart") {
							let arr = pageDom.querySelectorAll(".type-linechart");
							if(pageElement.showPercentageChangeToPrevTimestamp) {
								pElementDom = arr[1];
							} else {
								pElementDom = arr[0];
							}
						} else {
							pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
						}

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
			try {
				// restore indicators from indicator names
				let indicators = [];
				for(let name of config.indicators) {
					indicators.push( getIndicatorByName(name) );

				}
				// restore commune logo for every page, starting at the second
				let communeLogoSrc = ""; // base64 string
				for(let [idx, page] of config.pages.entries()) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "communeLogo-landscape" && idx === 0) {
							if(pageElement.src && pageElement.src.length) {
								communeLogoSrc = pageElement.src;
							} else {
								break; // no logo was exported
							}
						}

						if(pageElement.type === "communeLogo-landscape" && idx > 0) {
							pageElement.src = communeLogoSrc;
						}
					}
				}
				$scope.config.indicators = indicators;
				$scope.config.template = config.template;
				$scope.config.pages = config.pages;
				$scope.$apply();
				for(let indicator of $scope.config.indicators) {
					$scope.setupNewPages(indicator);
				}
			} catch (error) {
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
		}

		$scope.exportConfig = function() {
			try {
				let jsonToExport = {};
				jsonToExport.pages = angular.fromJson(angular.toJson( $scope.config.pages ));
				jsonToExport.template = angular.fromJson(angular.toJson( $scope.config.template ));
				// replace indicators with indicator names to reduce file size
				jsonToExport.indicators = $scope.config.indicators.map( indicator => indicator.indicatorName);
				// only store commune logo once (in first page)
				for(let [idx, page] of jsonToExport.pages.entries()) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "communeLogo-landscape" && idx > 0) {
							pageElement.src = "";
						}
					}
				}

				let jsonString = "data:text/json;charset=utf-8," + encodeURIComponent( angular.toJson(jsonToExport) );
				// to download json, a DOM element is created, clicked and removed
				let downloadAnchorNode = document.createElement('a');
				downloadAnchorNode.setAttribute("href", jsonString);
				downloadAnchorNode.setAttribute("download", getCurrentDateAndTime() + "_KomMonitor-Reporting-Konfiguration.json");
				document.body.appendChild(downloadAnchorNode); // required for firefox
				downloadAnchorNode.click();
				downloadAnchorNode.remove();
			} catch (error) {
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
			
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
				throw new Error("No indicator could be found for name: " + indicatorName)
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

		$scope.$on("reportingGenerateReport", function(event, format) {
			$scope.generateReport(format);
		});

		$scope.generateReport = function(format) {
			$scope.loadingData = true;

			try {
				format === "pdf" && $scope.generatePdfReport();
				format === "word" && $scope.generateWordReport();
				format === "zip" && $scope.generateZipFolder();
			} catch (error) {
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
		}
			
		$scope.generatePdfReport = function() {

			// create pdf document
			let doc = new jsPDF({
				margin: 0,	
				unit: 'mm',
				format: 'a4',
				orientation: "landscape"
			});

			// general settings
			let fontName = "times";
			doc.setDrawColor(148, 148, 148);
			doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
			
			for(let [idx, page] of $scope.config.pages.entries()) {
				if(idx > 0) {
					doc.addPage();
				}
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {

					let pElementDom;
					if(pageElement.type === "linechart") {
						let arr = pageDom.querySelectorAll(".type-linechart");
						if(pageElement.showPercentageChangeToPrevTimestamp) {
							pElementDom = arr[1];
						} else {
							pElementDom = arr[0];
						}
					} else {
						pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
					}
					// convert dimensions to millimeters here
					// that way we don't have to use pxToMilli everywhere we use coordinates in the pdf
					let pageElementDimensions = {}
					pageElementDimensions.top = pageElement.dimensions.top && pxToMilli(pageElement.dimensions.top);
					pageElementDimensions.bottom = pageElement.dimensions.bottom && pxToMilli(pageElement.dimensions.bottom);
					pageElementDimensions.left = pageElement.dimensions.left && pxToMilli(pageElement.dimensions.left);
					pageElementDimensions.right = pageElement.dimensions.right && pxToMilli(pageElement.dimensions.right);
					pageElementDimensions.width = pageElement.dimensions.width && pxToMilli(pageElement.dimensions.width);
					pageElementDimensions.height = pageElement.dimensions.height && pxToMilli(pageElement.dimensions.height);
					
					// TODO some cases could be merged, but it's better to do that later when stuff works
					switch(pageElement.type) {
						case "indicatorTitle-landscape": {
							// Css takes the top-left edge of the element by default.
							// doc.text takes left-bottom, so we ass baseline "top" to achieve the same behavior in jspdf.
							doc.setFont(fontName, "normal", "bold")
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" });
							doc.setFont(fontName, "normal", "normal")
							break;
						}
						case "communeLogo-landscape": {
							// only add logo if one was selected
							if(pageElement.src && pageElement.src.length) {
								doc.addImage(pageElement.src, "JPEG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							}
							break;
						}
						case "dataTimestamp-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "dataTimeseries-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "footerHorizontalSpacer-landscape": {
							let x1, x2, y1, y2;
							x1 = pageElementDimensions.left;
							x2 = pageElementDimensions.left + pageElementDimensions.width;
							y1 = pageElementDimensions.top;
							y2 = pageElementDimensions.top;
							doc.line(x1, y1, x2, y2);
							break;
						}
						case "footerCreationInfo-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "pageNumber-landscape": {
							let text = "Seite " + (idx+1);
							doc.text(text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						// template-specific elements
						case "map": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						// case "mapLegend" can be ignored since it is included in the map if needed
						case "overallAverage": {
							let x, y, width, height;
							x = pageElementDimensions.left;
							y = pageElementDimensions.top;
							width = pageElementDimensions.width;
							height = pageElementDimensions.height;
							doc.rect(x, y, width, height);
							let text = "Durchschnitt\nGesamtstadt:\n" + pageElement.text.toString()
							doc.text(text, pageElementDimensions.left + pxToMilli(5), pageElementDimensions.top + pxToMilli(5), { baseline: "top" });
							break;
						}
						case "overallChange": {
							let x = pxToMilli(670);
							let y = pageElementDimensions.top;
							let width = pxToMilli(130);
							let height = pxToMilli(80);
							doc.rect(x, y, width, height);
							let text = "Durchschnittliche\nVeränderung\nGesamtstadt:\n" + pageElement.text.toString()
							doc.text(text, x + pxToMilli(5), y + pxToMilli(5), { baseline: "top" });
							break;
						}
						case "barchart": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "linechart": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "textInput": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, {
								baseline: "top",
								maxWidth: pageElementDimensions.width
							})
							break;
						}
						case "datatable": {
							doc.autoTable({
								html: "#reporting-overview-page-" + idx + "-" + pageElement.type + " table",
								startY: pageElementDimensions.top,
								tableWidth: "wrap",
								margin: {left: pageElementDimensions.left},
								theme: "grid",
								//headStyles: {
								//	fillColor: false, // transparent
								//	textColor: [0, 0, 0],
								//}
							})
							break;
						}
					}
				}
			}

			//doc.output("dataurlnewwindow")
			let now = getCurrentDateAndTime();
			doc.save(now + "_KomMonitor-Report.pdf");
			$scope.loadingData = false;
		}


		$scope.generateZipFolder = function() {
			// creates a zip folder containing all echarts files
			let zip = new JSZip();
			for(let [idx, page] of $scope.config.pages.entries()) {
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {
					if(pageElement.type === "map" || pageElement.type === "barchart" || pageElement.type === "linechart") {
						let pElementDom;
						if(pageElement.type === "linechart") {
							let arr = pageDom.querySelectorAll(".type-linechart");
							if(pageElement.showPercentageChangeToPrevTimestamp) {
								pElementDom = arr[1];
							} else {
								pElementDom = arr[0];
							}
						} else {
							pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
						}
						let instance = echarts.getInstanceByDom(pElementDom);
						let base64String = instance.getDataURL({
							type: "png",
							pixelRatio: $scope.echartsImgPixelRatio
						});
						let filename = "Seite_" + (idx+1) + "_" + pageElement.type + ".png";
						if(pageElement.type === "linechart" && pageElement.showPercentageChangeToPrevTimestamp) {
							// two elements with same type on one page
							// use a different filename for one of them so we don't overwrite the other image
							filename = filename.replace(".png", "-proz.Veraenderung.png"); 
						}
							
						zip.file(filename, dataURItoBlob(base64String), "");
					}
				}
			}

			let zipFileName = getCurrentDateAndTime() + "_Kommonitor-Report-Grafiken";
			zip.generateAsync({type:"blob"}).then(function(content) {
				saveAs(content, zipFileName + ".zip");
				$scope.loadingData = false;
				$scope.$apply();
			});
		}

		let sections = []; // one section per page for now, since this is an easy way to create page breaks
		
		$scope.generateWordReport = function() {
			// see docx documentation for more info about the format:
			// https://docx.js.org/#/?id=basic-usage
			
		
			for(let [idx, page] of $scope.config.pages.entries()) {

				let paragraphs = [];
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {

					let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
					let pageElementDimensionsTwip = calculateDimensions(pageElement.dimensions, "twip");
					let pageElementDimensionsEmu = calculateDimensions(pageElement.dimensions, "emu");

					switch(pageElement.type) {
						case "indicatorTitle-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										bold: true,
										size: 32 // 16pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "communeLogo-landscape": {
							// only add logo if one was selected
							if(pageElement.src && pageElement.src.length) {
								let paragraph = new docx.Paragraph({
									children: [
										new docx.ImageRun({
											data: dataURItoBlob(pageElement.src),
											transformation: {
												width: pageElementDimensionsPx.width,
												height: pageElementDimensionsPx.height
											},
											floating: {
												horizontalPosition: {
													offset: pageElementDimensionsEmu.left,
												},
												verticalPosition: {
													offset: pageElementDimensionsEmu.top,
												}
											},
										})
									]
								});
								paragraphs.push(paragraph);
							}
							break;
						}
						case "dataTimestamp-landscape":
						case "dataTimeseries-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										size: 32  // 16pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						
						case "footerHorizontalSpacer-landscape":
							 // empty paragraph with border top
							let paragraph = new docx.Paragraph({
								children: [],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								},
								border: {
									top: {
										color: "#949494", // gray
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									}
								}
							});
							paragraphs.push(paragraph);
							break;
						case "footerCreationInfo-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										size: 32  // 16pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "pageNumber-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Seite " + (idx+1),
										size: 32  // 16pt
									},
									new docx.PageBreak())
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							paragraphs.push(paragraph);
							break;
						}
						case "map":
						case "barchart":
						case "linechart": {
							let pElementDom;
							if(pageElement.type === "linechart") {
								let arr = pageDom.querySelectorAll(".type-linechart");
								if(pageElement.showPercentageChangeToPrevTimestamp) {
									pElementDom = arr[1];
								} else {
									pElementDom = arr[0];
								}
							} else {
								pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
							}
							let instance = echarts.getInstanceByDom(pElementDom);
							let base64String = instance.getDataURL({
							 		type: "png",
							 		pixelRatio: $scope.echartsImgPixelRatio
							});
							let blob = dataURItoBlob(base64String);

							let paragraph = new docx.Paragraph({
								children: [
									new docx.ImageRun({
										data: blob,
										transformation: {
											width: pageElementDimensionsPx.width,
											height: pageElementDimensionsPx.height
										},
										floating: {
											horizontalPosition: {
												offset: pageElementDimensionsEmu.left,
											},
											verticalPosition: {
												offset: pageElementDimensionsEmu.top,
											},
											behindDocument: true
										},
									})
								]
							});
							paragraphs.push(paragraph);
							break;
						}
						case "overallAverage": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Durchschnitt",
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: "Gesamtstadt",
										size: 28,
										break: 1,  // 14pt
									}),
									new docx.TextRun({
										text: pageElement.text.toString(),
										size: 28,
										break: 1  // 14pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								},
								border: {
									top: {
										color: "#949494", // gray
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									right: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									bottom: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									left: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "overallChange": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Durchschnittliche",
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: "Veränderung",
										break: 1,
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: "Gesamtstadt",
										break: 1,
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: pageElement.text.toString(),
										break: 1,
										size: 28  // 14pt
									
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								},
								border: {
									top: {
										color: "#949494", // gray
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									right: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									bottom: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									left: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "textInput": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										size: 24 // 12pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "datatable": {
								let tableDom = document.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type + " table");
								let headerFieldsDom = tableDom.querySelectorAll("thead th")
								let tableRowsDom = tableDom.querySelectorAll("tbody tr");
								
								// table to create
								let table = {
									columnWidths: [],
									rows: [],
									float: {
										absoluteHorizontalPosition: pageElementDimensionsTwip.left,
										absoluteVerticalPosition: pageElementDimensionsTwip.top,
										overlap: docx.OverlapType.NEVER,
									},
								};
								let headerFields = [];
								let headerFieldNames = [];
								for(let fieldDom of headerFieldsDom) {
									let widthInTwip = pxToTwip(fieldDom.offsetWidth);
									let fieldContent = fieldDom.innerText;
									headerFieldNames.push(fieldContent)
									let field = new docx.TableCell({
										width: {
											size: widthInTwip,
											type: docx.WidthType.DXA,
										},
										verticalAlign: docx.VerticalAlign.CENTER,
										children: [new docx.Paragraph({
											alignment: docx.AlignmentType.CENTER,
											children: [new docx.TextRun({
												text: fieldContent,
												bold: true
											})]
										})],
									})
									headerFields.push(field);
									table.columnWidths.push(widthInTwip)
								}

								let headerRow = new docx.TableRow({
									children: headerFields,
								});

								table.rows.push(headerRow);
								
								for(let rowDom of tableRowsDom) { // excluding header
									let fieldsDom = rowDom.querySelectorAll("td");
									let fields = [];
									for(let [idx, fieldDom] of fieldsDom.entries()) {
										let fieldContent = fieldDom.innerText;
										let paragraph = new docx.Paragraph({
											text: fieldContent,
											alignment:
												headerFieldNames[idx] === "Wert" ?
												docx.AlignmentType.RIGHT :
												headerFieldNames[idx] === "Zeitpunkt" ?
												docx.AlignmentType.CENTER :
												docx.AlignmentType.LEFT, // "Bereich"
										});
										let field = new docx.TableCell({
											width: {
												size: table.columnWidths[idx],
												type: docx.WidthType.DXA,
											},
											verticalAlign: docx.VerticalAlign.CENTER,
											children: [paragraph],
										})
										fields.push(field)
									}
									let row = new docx.TableRow({
										children: fields,
									});
									table.rows.push(row);
								}

								paragraphs.push(new docx.Table(table)) // technically this is not a paragraph, but we only add it as a child of section below
								break;
						}
					}
				}

				let section = {
					properties: {
						type: docx.SectionType.NEXT_PAGE,
						page: {
							margin: {
								top: 0,
								right: 0,
								bottom: 0,
								left: 0,
							},
							pageNumbers: {
								start: (idx+1),
								formatType: docx.NumberFormat.DECIMAL,
							},
							size: {
								orientation: docx.PageOrientation.LANDSCAPE,
							},
						},
					},
					children: [...paragraphs],
				}

				sections.push(section)
			}

			let docxConfig = {
				sections: [...sections]
			}

			let doc = new docx.Document(docxConfig);
		
			let filename = getCurrentDateAndTime() + "_KomMonitor-Report"
			// Used to export the file into a .docx file
			docx.Packer.toBlob(doc).then((blob) => {
				saveAs(blob, filename + ".docx");
			});
			$scope.loadingData = false;
		}

		function pxToMilli(px) {
			// our preview is 830px wide
			// px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
			// This is the short version of:
			// px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
			// pxPerMillimeter cancels out there, so it doesn't matter.
			let result = parseInt(px, 10) / 830 * 297;
			result = Math.round(result * 100) / 100;
			return result;
		}

		function pxToTwip(px) {
			let result = parseInt(px, 10) * 15; // 1px = 0.75pt = 15twip
			return result * $scope.pxPerMilli*297 / 830 // scale from 830px to A4 page
		}

		function twipToEmus(value) {
			// see: https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/
			return value * 635;
		}

		// from: https://stackoverflow.com/a/46406124
		function dataURItoBlob(dataURI) {
			// convert base64 to raw binary data held in a string
			// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
			var byteString = atob(dataURI.split(',')[1]);
		
			// separate out the mime component
			var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
		
			// write the bytes of the string to an ArrayBuffer
			var ab = new ArrayBuffer(byteString.length);
		
			// create a view into the buffer
			var ia = new Uint8Array(ab);
		
			// set the bytes of the buffer to the correct values
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
		
			// write the ArrayBuffer to a blob, and you're done
			var blob = new Blob([ab], {type: mimeString});
			return blob;
		}

		function calculateDimensions(dimensions, unit) {
			let result = {};
			if(unit === "px") {
				// also scale our 830px preview up to A4 here
				let scalefactor = $scope.pxPerMilli*297 / 830
				result.top = dimensions.top && parseInt(dimensions.top, 10) * scalefactor;
				result.bottom = dimensions.bottom && parseInt(dimensions.bottom, 10) * scalefactor;
				result.left = dimensions.left && parseInt(dimensions.left, 10) * scalefactor;
				result.right = dimensions.right && parseInt(dimensions.right, 10) * scalefactor;
				result.width = dimensions.width && parseInt(dimensions.width, 10) * scalefactor;
				result.height = dimensions.height && parseInt(dimensions.height, 10) * scalefactor;
			}
			if(unit === "milli") {
				result.top = dimensions.top && pxToMilli(dimensions.top);
				result.bottom = dimensions.bottom && pxToMilli(dimensions.bottom);
				result.left = dimensions.left && pxToMilli(dimensions.left);
				result.right = dimensions.right && pxToMilli(dimensions.right);
				result.width = dimensions.width && pxToMilli(dimensions.width, 10);;
				result.height = dimensions.height && pxToMilli(dimensions.height, 10);
			}
			if(unit === "twip") {
				result.top = dimensions.top && docx.convertMillimetersToTwip(pxToMilli(dimensions.top));
				result.bottom = dimensions.bottom && docx.convertMillimetersToTwip(pxToMilli(dimensions.bottom));
				result.left = dimensions.left && docx.convertMillimetersToTwip(pxToMilli(dimensions.left));
				result.right = dimensions.right && docx.convertMillimetersToTwip(pxToMilli(dimensions.right));
				result.width = dimensions.width && docx.convertMillimetersToTwip(pxToMilli(dimensions.width, 10));
				result.height = dimensions.height && docx.convertMillimetersToTwip(pxToMilli(dimensions.height, 10));
			}
			if(unit === "emu") {
				result.top = dimensions.top && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.top)));
				result.bottom = dimensions.bottom && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.bottom)));
				result.left = dimensions.left && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.left)));
				result.right = dimensions.right && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.right)));
				result.width = dimensions.width && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.width, 10)));
				result.height = dimensions.height && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.height, 10)));
			}
			return result;
		}


		function calculateScreenDpi() {
			// create a hidden div that is one inch high
			let div = document.createElement("div")
			div.style.height = "1in";
			div.style.position = "absolute";
			div.style.left = "-100%";
			div.style.top = "-100%";
			document.getElementsByTagName("body")[0].append(div);
			const dpi = div.offsetHeight
			div.style.display = "none";
			return dpi
		}
	}
]});