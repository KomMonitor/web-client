angular.module('reportingTemplateSelect').component('reportingTemplateSelect', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingTemplateSelect/reporting-template-select.template.html",
	controller : ['$scope', '$rootScope', '__env', '$timeout', 'kommonitorDataExchangeService',
	function ReportingTemplateSelectController($scope, $rootScope, __env, $timeout, kommonitorDataExchangeService) {

		$scope.generalSettings = {
			creator: "M. Mustermann",
			commune: "Testkommune",
			communeLogo: "",
			creationDate: getCurrentDate(),
			freeText: "Text",
		}
		$scope.availableTemplateCategories = [
			{
				"id": 1,
				"displayName": "Zeitpunkt",
			},
			{
				"id": 2,
				"displayName": "Zeitserie",
			},
			{
				"id": 3,
				"displayName": "Erreichbarkeit",
			}
		]

		// A basic version of the templates.
		// These are not full-fledged templates yet, but they can serve as a starting point and are adjusted according to user choices dynamically.
		$scope.availableTemplates = [
			{
				"name": "A4-landscape-timestamp",
				"displayName": "DIN A4, Querformat",
				"categoryId": 1,
				"orientation" : "landscape",
				"pages": [
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
								
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							}
						]
					},// l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
								
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte klassifiziert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte klassifiziert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt"
							}
						]
					}, // p
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "", // the area shown on this page or an empty string if it is a placeholder page
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt."
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"area": "", // the area shown on this page or an empty string if it is a placeholder page
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "470px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "400px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "barchart",
								"dimensions": {
									"top": "500px",
									"left": "15px",
									"width": "550px",
									"height": "160px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt."
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "670px",
									"left": "15px",
									"width": "550px",
									"height": "70px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // p
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText":
									"Datentabelle (Spalten: Bereich, Wert).\
									Ggf. über mehrere Seiten.",
								"columnNames": [],
								"tableData": []
							}
						]
					} //l
				]
			},
			{
				"name": "A4-portrait-timestamp",
				"displayName": "DIN A4, Hochformat",
				"categoryId": 1,
				"orientation": "portrait",
				"pages": [
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
								
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
								
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte klassifiziert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte klassifiziert.\
									Beschriftung: Quote/Anzahl pro Bereich.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Eine Säule pro selektiertem Bereich + Durchschnitt der Gesamtstadt"
							}
						]
					}, // l
					// one page for each selected area
					{
						"orientation": "portrait",
						"area": "", // the area shown on this page or an empty string if it is a placeholder page
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "470px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "400px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "barchart",
								"dimensions": {
									"top": "500px",
									"left": "15px",
									"width": "550px",
									"height": "160px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt."
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "670px",
									"left": "15px",
									"width": "550px",
									"height": "70px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"area": "", // the area shown on this page or an empty string if it is a placeholder page
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
							},
							{
								"type": "barchart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Säulendiagramm. Vergleich des Bereichs mit dem Durchschnitt 1. aller selektierten Bereiche und 2. der Gesamtstadt."
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // l
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText":
									"Datentabelle (Spalten: Bereich, Wert).\
									Ggf. über mehrere Seiten.",
								"columnNames": [],
								"tableData": []
							}
						]
					} // p
				]
			},
			{
				"name": "A4-landscape-timeseries",
				"displayName": "DIN A4, Querformat",
				"categoryId": 2,
				"orientation": "landscape",
				"pages": [
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt (aktuellster Wert)"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion (aktuellster Wert)"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt (aktuellster Wert)"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion (aktuellster Wert)"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte, klassifiziert.\
									Veränderung ältester Wert --> aktuellster Wert.\
									Beschriftung: Veränderung in Einheit des Indikators.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "overallChange",
								"dimensions": {
									"top": "100px",
									"left": "670px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Gesamtstadt"
							},
							{
								"type": "selectionChange",
								"dimensions": {
									"top": "200px",
									"left": "670px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte, klassifiziert.\
									Veränderung ältester Wert --> aktuellster Wert.\
									Beschriftung: Veränderung in Einheit des Indikators.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "overallChange",
								"dimensions": {
									"top": "100px",
									"left": "420px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Gesamtstadt"
							},
							{
								"type": "selectionChange",
								"dimensions": {
									"top": "200px",
									"left": "420px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// with boxplot at each data point
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt",
								"showAverage": true,
								"showAreas": false,
								"showBoxplots": true

							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								// with boxplot at each data point
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt",
								"showAverage": true,
								"showAreas": false,
								"showBoxplots": true

							}
						]
					}, // p
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							},
							{
								
								"type": "linechart",
								"dimensions": {
									"top": "240px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Liniendiagramm. Veränderung zum Vorjahr in Prozent",
								"showAverage": true,
								"showAreas": true,
								"showAverage": true,
								"showPercentageChangeToPrevTimestamp": true
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"area": "",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "470px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "400px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "linechart",
								"dimensions": {
									"top": "500px",
									"left": "15px",
									"width": "270px",
									"height": "160px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							},
							{
								
								"type": "linechart",
								"dimensions": {
									"top": "500px",
									"left": "295px",
									"width": "270px",
									"height": "160px"
								},
								"isPlaceholder": true,
								"placeholderText": "Liniendiagramm. Veränderung zum Vorjahr in Prozent",
								"showAverage": true,
								"showAreas": true,
								"showAverage": true,
								"showPercentageChangeToPrevTimestamp": true
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "670px",
									"left": "15px",
									"width": "550px",
									"height": "70px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // p
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// should include data for different timestamps
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText":
									"Datentabelle (Spalten: Bereich, Zeitpunkt, Wert).\
									Ggf. über mehrere Seiten.",
								"columnNames": [],
								"tableData": []
							},
						]
					} // l
				]
			},
			{
				"name": "A4-portrait-timeseries",
				"displayName": "DIN A4, Hochformat",
				"categoryId": 2,
				"orientation": "portrait",
				"pages": [
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt (aktuellster Wert)"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "450px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion (aktuellster Wert)"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte ohne Klassifizierung.\
									Selektierte Bereiche farblich markiert.\
									Beschriftung: Quote/Anzahl pro Bereich (aktuellster Wert).\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "overallAverage",
								"dimensions": {
									"top": "100px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Gesamtstadt (aktuellster Wert)"
							},
							{
								"type": "selectionAverage",
								"dimensions": {
									"top": "180px",
									"left": "700px",
									"width": "100px",
									"height": "60px"
								},
								"isPlaceholder": true,
								"placeholderText": "Durchschnitt Selektion (aktuellster Wert)"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte, klassifiziert.\
									Veränderung ältester Wert --> aktuellster Wert.\
									Beschriftung: Veränderung in Einheit des Indikators.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "overallChange",
								"dimensions": {
									"top": "100px",
									"left": "420px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Gesamtstadt"
							},
							{
								"type": "selectionChange",
								"dimensions": {
									"top": "200px",
									"left": "420px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Übersichtskarte, klassifiziert.\
									Veränderung ältester Wert --> aktuellster Wert.\
									Beschriftung: Veränderung in Einheit des Indikators.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "overallChange",
								"dimensions": {
									"top": "100px",
									"left": "670px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Gesamtstadt"
							},
							{
								"type": "selectionChange",
								"dimensions": {
									"top": "200px",
									"left": "670px",
									"width": "130px",
									"height": "80px"
								},
								"isPlaceholder": true,
								"placeholderText": "Veränderung Selektion"
							},
							{
								"type": "mapLegend",
								"dimensions": {
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Eine Linie pro ausgewähltem Bereich + Durchschnitt Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								// with boxplot at each data point
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt",
								"showAverage": true,
								"showAreas": false,
								"showBoxplots": true

							}
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// with boxplot at each data point
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Durchschnitt Gesamtstadt + Boxplot pro Zeitpunkt",
								"showAverage": true,
								"showAreas": false,
								"showBoxplots": true

							}
						]
					}, // l
					// one page for each selected area
					{
						"orientation": "portrait",
						"area": "",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "470px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "400px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "linechart",
								"dimensions": {
									"top": "500px",
									"left": "15px",
									"width": "270px",
									"height": "160px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							},
							{
								
								"type": "linechart",
								"dimensions": {
									"top": "500px",
									"left": "295px",
									"width": "270px",
									"height": "160px"
								},
								"isPlaceholder": true,
								"placeholderText": "Liniendiagramm. Veränderung zum Vorjahr in Prozent",
								"showAverage": true,
								"showAreas": true,
								"showAverage": true,
								"showPercentageChangeToPrevTimestamp": true
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "670px",
									"left": "15px",
									"width": "550px",
									"height": "70px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"area": "",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Titel des Indikators [Einheit], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "400px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": 
									"Karte.\
									Detailansicht des Bereichs.\
									Keine Hintergrundkarte.",
								"colorScheme": undefined,
								"classify": true,
								"isTimeseries": true
							},
							{
								"type": "linechart",
								"dimensions": {
									"top": "90px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Zeitreihendiagramm. Vergleich des Bereichs mit dem Durchschnitt der Gesamtstadt.",
								"showAverage": true,
								"showAreas": true,
								"showBoxplots": false
							},
							{
								
								"type": "linechart",
								"dimensions": {
									"top": "240px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Liniendiagramm. Veränderung zum Vorjahr in Prozent",
								"showAverage": true,
								"showAreas": true,
								"showAverage": true,
								"showPercentageChangeToPrevTimestamp": true
							},
							{
								"type": "textInput",
								"dimensions": {
									"top": "390px",
									"left": "425px",
									"width": "390px",
									"height": "140px"
								},
								"isPlaceholder": true,
								"placeholderText": "Freitext",
								"css": "align-self: self-start; margin-bottom: auto; text-align: left;"
							}
						]
					}, // l
					// end of area-specific part
					// datatable might need multiple pages
					{
						"orientation": "portrait",
						"pageElements": [

							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								// should include data for different timestamps
								"type": "datatable",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "300px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText":
									"Datentabelle (Spalten: Bereich, Zeitpunkt, Wert).\
									Ggf. über mehrere Seiten.",
								"columnNames": [],
								"tableData": []
							},
						]
					} // p
				]
			},
			{
				"name": "A4-landscape-reachability",
				"displayName": "DIN A4, Querformat",
				"categoryId": 3,
				"orientation" : "landscape",
				"pages": [
					{
						"orientation": "landscape",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI]",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// isochrones, only show main roads if possible
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "495px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
							
						]
					}, // l
					{
						"orientation": "portrait",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
									"left": "15px",
									"width": "470px",
									"height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI]",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								// isochrones, only show main roads if possible
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "700px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
							
						]
					}, // p
					// one page for each selected area
					{
						"orientation": "landscape",
						"area": "",
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),
							
							{
								// isochrones, background map in grayscale 
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "495px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
						]
					}, // l
					{
						"orientation": "portrait",
						"area": "",
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
									"left": "15px",
									"width": "470px",
									"height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),
							
							{
								// isochrones, background map in grayscale 
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "700px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
						]
					} // p
					// end of area-specific part
				]
			},
			{
				"name": "A4-portrait-reachability",
				"displayName": "DIN A4, Hochformat",
				"categoryId": 3,
				"orientation" : "portrait",
				"pages": [
					{
						"orientation": "portrait",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
									"left": "15px",
									"width": "470px",
									"height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI]",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

							{
								// isochrones, only show main roads if possible
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "700px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
							
						]
					}, // p
					{
						"orientation": "landscape",
						"pageElements": [

							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI]",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

							{
								// isochrones, only show main roads if possible
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Gesamtstadt mit Isochronen, Grenzen der gewählten Bereiche farblich hervorgehoben. Kartenhintergrund: nur Hauptstraßen.",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "495px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
							
						]
					}, // l
					// one page for each selected area
					{
						"orientation": "portrait",
						"area": "",
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-portrait",
								"dimensions": {
								  "top": "15px",
									"left": "15px",
									"width": "470px",
									"height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-portrait"),
							
							{
								// isochrones, background map in grayscale 
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "550px",
									"height": "650px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "600px",
									"left": "450px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "700px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
						]
					}, // p
					{
						"orientation": "landscape",
						"area": "",
						"pageElements": [

							
							// different placeholder so we don't use the default here
							{
								"type": "indicatorTitle-landscape",
								"dimensions": {
								  "top": "15px",
								  "left": "15px",
								  "width": "720px",
								  "height": "30px"
								},
								"isPlaceholder": true,
								"placeholderText": "Entfernungen für [Name POI], Bereich (Diese Seite wird für jeden Bereich wiederholt)",
								"text": "",
								"css": "text-align: left; padding-left: 5px; font-weight: bold;"
							},
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
							kommonitorDataExchangeService.getDefaultReportingTemplatePageElement("pageNumber-landscape"),
							
							{
								// isochrones, background map in grayscale 
								"type": "map",
								"dimensions": {
									"top": "90px",
									"left": "15px",
									"width": "800px",
									"height": "440px"
								},
								"isPlaceholder": true,
								"placeholderText": "Karte Detailansicht Bereich mit Isochronen, Hintergrund OSM-Karte in Graustufen",
								"colorScheme": undefined,
								"classify": false,
							},
							{
								"type": "mapLegend",
								"dimensions": {
									// used for the placeholder only
									"top": "400px",
									"left": "700px",
									"width": "100px",
									"height": "120px"
								},
								"isPlaceholder": true,
								"placeholderText": "Legende"
							},
							{
								"type": "mapAttribution",
								"dimensions": {
									// used for the placeholder only
									"top": "495px",
									"left": "25px",
									"width": "125px",
									"height": "25px"
								},
								"isPlaceholder": true,
								"placeholderText": "Copyrightvermerk"
							}
						]
					}, // l
					// end of area-specific part
				]
			}
		]
	
		$scope.selectedTemplate = undefined;

		$scope.$on('reportingInitializeTemplateSelect', function(event, data) {
			$scope.initialize();
		});

		$scope.initialize = function() {
			// open first category
			let collapsible = document.querySelector("#reporting-template-category-accordion #collapse1")
			collapsible.classList.add("in");
			// select first template
			collapsible.querySelector("#collapse1-template0").click();

			$scope.datePicker = $('#reporting-general-settings-datefield').datepicker({
				autoclose: true,
				language: 'de',
				format: 'yyyy-mm-dd'
			});
			document.getElementById("reporting-load-commune-logo-button").addEventListener('change', readSingleFile, false);

			// set the property "isPlaceholder" to false for specific page elements since their content should be replaced right away
			for(let template of $scope.availableTemplates) {
				$scope.iteratePageElements( template, function(page, pageElement) {
					pageElement.isPlaceholder = (
						pageElement.type.includes("footerCreationInfo-") ||
						pageElement.type.includes("pageNumber-") ||
						pageElement.type === "textInput"
						) ? false : true;
				})
			}
			
			for(let template of $scope.availableTemplates) {
				for(let page of template.pages) {
					for(let el of page.pageElements) {
						el.isPlaceholder = (
							el.type.includes("footerCreationInfo-") ||
							el.type.includes("pageNumber-") ||
							el.type === "textInput"
							) ? false : true;
					}
				}
			}

		}

		$scope.getPageNumber = function(index) {
			let pageNumber = 1;
			for(let i = 0; i < index; i ++) {
				if ($scope.showThisPage($scope.selectedTemplate.pages[i])) {
					pageNumber ++;
				}
			}
			return pageNumber;
		}

		$scope.showThisPage = function(page) {
			let pageWillBeShown = false;
			for(let visiblePage of $scope.filterPagesToShow()){
				if(visiblePage == page) {
					pageWillBeShown = true;
				}
			}
			return pageWillBeShown;
		}

		$scope.filterPagesToShow = function() {
			let pagesToShow = [];
			let skipNextPage = false;
			for (let i = 0; i < $scope.selectedTemplate.pages.length; i ++) {
				let page = $scope.selectedTemplate.pages[i];
				if ($scope.pageContainsDatatable(i)) {
					pagesToShow.push(page);
					skipNextPage = false;
				}
				else {
					if(skipNextPage == false) {
						pagesToShow.push(page);
						skipNextPage = true;
					}
					else {
						skipNextPage = false;
					}
				}
			}
			return pagesToShow;
		}

		$scope.pageContainsDatatable = function(pageID) {
			let page = $scope.selectedTemplate.pages[pageID];
			let pageContainsDatatable = false;
			for(let pageElement of page.pageElements) {
				if(pageElement.type == "datatable") {
					pageContainsDatatable = true;
				}
			}
			return pageContainsDatatable;
		}
		

		/**
		 * filters templates to only show the ones matching the given category.
		 * @param {*} categoryId 
		 * @returns 
		 */
		$scope.templateFilter = function(categoryId) {
			return function(value) {
				return categoryId === value.categoryId;
			}
		}

		$scope.onTemplateElementClicked = function($event, template) {
			let el = $event.target;
			el.style.backgroundColor = "#0078D7";
			el.style.color = "white";
			document.querySelectorAll(".reporting-selectable-template").forEach( (element) => {
				if( el !== element) {
					element.style.backgroundColor = "white";
					element.style.color = "black";
				}
			});
			// set scope variable manually each time
			if($scope.selectedTemplate !== template) {
				$scope.selectedTemplate = template;
			}
		}

		/**
		 * converts a base64 encoded data url SVG image to a PNG image
		 * @param originalBase64 data url of svg image
		 * @param width target width in pixel of PNG image
		 * @return {Promise<String>} resolves to png data url of the image
		 */
		async function base64SvgToBase64Png (originalBase64, width) {
			return await new Promise(resolve => {
				let img = document.createElement('img');
				img.onload = function () {
					document.body.appendChild(img);
					let canvas = document.createElement("canvas");
					let ratio = (img.clientWidth / img.clientHeight) || 1;
					document.body.removeChild(img);
					canvas.width = width;
					canvas.height = width / ratio;
					let ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					try {
						let data = canvas.toDataURL('image/png');
						resolve(data);
					} catch (e) {
						resolve(null);
					}
				};
				img.src = originalBase64;
			});
		}

		/**
		 * reads a file chosen by the user
		 * @returns {string} file content
		 */
		function readSingleFile(e) {
			let content = "";
			let srcElement = e.srcElement;
			let file = e.target.files[0];
			if (!file) {
				return;
			}
			var reader = new FileReader();
			reader.onload = async function(e) {
				content = e.target.result;

				// if content is SVG base64 string then convert that to png image
				// as svg is porblemativ when perfirming PDF export later with jsPDF
				if(content.includes("svg")){
					content = await base64SvgToBase64Png(content, 250);
				}

				if(srcElement.id === "reporting-load-commune-logo-button") {
					$scope.generalSettings.communeLogo = content;
					// set isPlaceholder to false
					for(let template of $scope.availableTemplates) {
						$scope.iteratePageElements( template, function(page, pageElement) {
							if(pageElement.type.includes("communeLogo-")) {
								pageElement.isPlaceholder = false;
								pageElement.src = content;
							}
						})
					}

					$timeout(function(){
						$scope.$digest();
					});
				}
			 };
			reader.readAsDataURL(file);
		}

		$scope.templateSupportsFreeText = function() {
			if(typeof($scope.selectedTemplate) === "undefined")
				return false;

			if(!$scope.selectedTemplate.pages) {
				return false;
			}

			for(let page of $scope.selectedTemplate.pages) {
				for(let pageElement of page.pageElements) {
					if (pageElement.type === "textInput") {
						return true;
					}
				}
			}
			return false;
		}


		$scope.onTemplateSelected = function() {
			// update selected template with general settings
			for(let [idx, page] of $scope.selectedTemplate.pages.entries()) {
				for(let el of page.pageElements) {
					if(el.type.includes("footerCreationInfo-")) {
						el.text = "Erstellt am " + $scope.generalSettings.creationDate + " von " + $scope.generalSettings.creator + ", " + $scope.generalSettings.commune
					}
					if(el.type === "textInput") {
						el.text = $scope.generalSettings.freeText;
					}

					// page number is generated by html expression, but we update if anyway for consistency
					if(el.type.includes("pageNumber-")) {
						el.placeholderText = "Seite " + $scope.getPageNumber(idx)
					}
				}
			}
			$scope.$emit('reportingTemplateSelected', $scope.selectedTemplate)
		}

		$scope.onBackToWorkflowSelectionClicked = function() {
			$scope.selectedTemplate = {};
			$scope.$emit('reportingBackToWorkflowSelectionClicked')
		}

		$scope.iteratePageElements = function(template, functionToExecute) {
			for(let page of template.pages) {
				for(let pageElement of page.pageElements) {
					functionToExecute(page, pageElement);
				}
			}
		}

		// Format: YYYY-MM-DD
		function getCurrentDate() {
			let now = new Date();
			const offset = now.getTimezoneOffset()
			now = new Date(now.getTime() - (offset*60*1000))
			return now.toISOString().split('T')[0]
		}
	}
]});