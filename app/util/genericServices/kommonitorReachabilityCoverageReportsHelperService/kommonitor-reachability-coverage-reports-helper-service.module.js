angular.module('kommonitorReachabilityCoverageReportsHelper', ['kommonitorDataExchange', 'kommonitorReachabilityHelper', 'kommonitorReachabilityMapHelper']);


angular
  .module('kommonitorReachabilityCoverageReportsHelper', [])
  .service(
    'kommonitorReachabilityCoverageReportsHelperService', [
    '__env', 'kommonitorDataExchangeService', 'kommonitorReachabilityHelperService', 'kommonitorReachabilityMapHelperService',
    function (__env, kommonitorDataExchangeService, kommonitorReachabilityHelperService, kommonitorReachabilityMapHelperService) {

      let self = this;
      let fontName = "Helvetica";
      let fontSize_default = 12;
      let initY = 10;
      let initX = 10;

      let headStyles = {
        fontStyle: 'bold',
        fontSize: 12,
        fillColor: '#337ab7',
        // auto or wrap
        cellWidth: 'auto',
        halign: "center",
        valign: "middle"
      };

      let bodyStyles = {
        fontStyle: 'normal',
        fontSize: 11,
        // auto or wrap or number
        cellWidth: 'auto',
        halign: "center",
        valign: "middle"
      };

      let bodyStyles_spatialUnitPoiCoverage = {
        0: {
          fontStyle: 'normal',
          fontSize: 11,
          // auto or wrap or number
          cellWidth: 'auto',
          halign: "center",
          valign: "middle"
        },
        1: {
          fontStyle: 'normal',
          fontSize: 11,
          // auto or wrap or number
          cellWidth: 'auto',
          halign: "right",
          valign: "middle"
        }

      };

      // first column with fixed width
      let columnStyles = {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { fontStyle: 'normal' }
      };

      let weightStrategyText = "";
      let weightStrategyExplanationText = "";

      let nextLineY = initY;

      this.generateReachabilityIndicatorStatisticsReport_focusSpatialUnitCoverage = function (indicatorStatistic) {
        // write pdf report with several sections:
        // 1. first page with general information and total overview (map of whole indicator area and all isochrones and all points)
        // 2. for each indicator area create one page to focus that specific area (all points whose isochrones intersect with it)
        //	  summarize affected POIs and summarize POI coverage of this specific area
        // 3. Data table summarizing most important infos per spatial unit area as one line ranked by most coverage


      }

      /*
        reachabilityScenario datamodel
            {
              "reachabilitySettings": reachabilitySettings, // settings from rechability helper service for isochrone config
              "scenarioName": "name", // unique scenario name
              "indicatorStatistics": indicatorStatistics, // array of all calculated indicator statistics
              "isochrones_dissolved": isochrones_dissolved, // kommonitorReachabilityHelperService.currentIsochronesGeoJSON 
              "isochrones_perPoint": isochrones_perPoint, //kommonitorReachabilityHelperService.original_nonDissolved_isochrones 
              "poiDataset": {
                "poiId": poiId,
                "poiName": poiName,
                "poiDate": poiDate
              }
            }

        indicatorStatistics datamodel
          {
            indicator: {
              indicatorId: $scope.selectedIndicatorForStatistics.indicatorId,
              indicatorName: $scope.selectedIndicatorForStatistics.indicatorName,
              unit: $scope.selectedIndicatorForStatistics.unit
            },
            spatialUnit: {
              spatialUnitId: $scope.selectedSpatialUnit.spatialUnitId,
              spatialUnitName: $scope.selectedSpatialUnit.spatialUnitName
            },
            weightStrategy: $scope.weightStrategy,
            timestamp: $scope.selectedIndicatorDate,
            progress: "queued",
            jobId: jobId,
            coverageResult: undefined,
            active: false
          }
      */
      this.generateReachabilityIndicatorStatisticsReport_focusPoiCoverage = async function (reachabilityScenario, indicatorStatistic) {
        // write pdf report with several sections:
        // 1. first page with general information and total overview (map of whole indicator area and all isochrones and all points)
        // 2. for each POI create one page to focus each POI (show POI details; affected indicator areas and the coverage through this specific POI)
        // 3. Data table summarizing most important infos per POI as one line ranked by most coverage

        // create pdf document
        // 210 mm x 297 mm
        let doc = this.setupDoc();

        //insert logo
        doc = this.insertLogo(doc);

        // general settings
        doc.setDrawColor(148, 148, 148);
        doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
        doc.setFontSize(fontSize_default);

        doc = await this.generateTotalCoverageSection_focusPoiCoverage(doc, reachabilityScenario, indicatorStatistic);

        doc = await this.generateFeatureCoverageSection_focusPoiCoverage(doc, reachabilityScenario, indicatorStatistic);

        // doc = await this.generateCoverageDataTableSection_focusPoiCoverage(doc, reachabilityScenario, indicatorStatistic);

        doc.save("KomMonitor-Report_Erreichbarkeits_Coverage.pdf");
      }

      this.insertLogo = function (doc) {
        var img = new Image();
        var subPath = location.pathname;
        img.src = subPath + 'logos/KM_Logo1.png';
        doc.addImage(img, 'PNG', 193, 5, 12, 12);

        return doc;
      }

      this.setupDoc = function () {
        let doc = new jsPDF({
          margin: 0,
          unit: 'mm',
          format: 'a4',
          orientation: "portrait"
        });

        doc.setProperties({
          title: 'KomMonitor Report Erreichbarkeitsversorgung',
          subject: "KomMonitor Report Erreichbarkeitsversorgung",
          author: 'KomMonitor',
          keywords: 'Indikator, Erreichbarkeitsversorgung, Erreichbarkeitsanalyse',
          creator: 'KomMonitor'
        });

        return doc;
      }

      this.generateTotalCoverageSection_focusPoiCoverage = async function (doc, reachabilityScenario, indicatorStatistic) {

        nextLineY = initY;

        // TITLE
        doc = this.insertTitle(doc);

        // disclaimer accuracy regarding coverage type --> always insecure. best guess based on selected coverage type

        doc = this.insertTable_indicator_poi_information(doc, reachabilityScenario, indicatorStatistic, false);

        nextLineY = doc.autoTable.previous.finalY + 5;

        // // SUBTITLE COVERAGE TYPE (simple area or residential areas)
        doc = this.insertCoverageType(doc, indicatorStatistic);

        nextLineY = doc.autoTable.previous.finalY + 5;

        // SECTION LINE
        doc = this.insertSectionSeparator(doc);

        // TOTAL COVERAGE
        doc = await this.addCoverageInformation_totalCoverage(doc, reachabilityScenario, indicatorStatistic);

        return doc;

      }

      this.addCoverageInformation_totalCoverage = async function (doc, reachabilityScenario, indicatorStatistic) {
        doc.setFont(fontName, 'bolditalic');
        doc.setFontSize(12);
        let totalCoverageTitle = doc.splitTextToSize("Gesamtergebnis - Versorgung über alle Raumeinheiten", 180);
        doc.text(totalCoverageTitle, initX, nextLineY, { baseline: "top" });
        doc.setFont(fontName, "normal", "normal");
        doc.setFontSize(fontSize_default);

        nextLineY += 10;

        let totalCoverage_tableArray = []

        for (const overallCoverageEntry of indicatorStatistic.coverageResult.overallCoverage) {
          let range = overallCoverageEntry.range
          if (kommonitorReachabilityHelperService.settings.focus == 'time') {
            range = Number(range) / 60 + " [Minuten]";
          }
          else {
            range = range + " [Meter]"
          }

          let coverage_absolute = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(overallCoverageEntry.coverage[0].absoluteCoverage) + " von " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(indicatorStatistic.coverageResult.timeseries[0].value) + " [" + indicatorStatistic.indicator.unit + "]";
          let coverage_relative = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(overallCoverageEntry.coverage[0].relativeCoverage * 100) + " [%]";


          totalCoverage_tableArray.push([
            range, coverage_absolute, coverage_relative
          ]);
        }

        doc.autoTable({
          head: [['Einzugsgebiet', 'geschätzte absolute Versorgung', 'geschätzter Anteil']],
          body: totalCoverage_tableArray,
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: nextLineY,
        });

        // screenshot of leaflet map
        nextLineY = doc.autoTable.previous.finalY + 5;
        let remainingSpaceY = 297 - nextLineY;

        let leafletMapScreenshot = await kommonitorReachabilityMapHelperService.takeScreenshot_image("reachabilityScenarioIsochroneStatisticsGeoMap", null);

        doc.addImage(leafletMapScreenshot, "PNG", initX, nextLineY,
          180, remainingSpaceY - 5, "", 'MEDIUM');

        return doc;
      }

      this.insertSectionSeparator = function (doc) {
        doc.line(initX, nextLineY, 180, nextLineY, null);
        nextLineY += 5;

        return doc;
      }

      this.insertTitle = function (doc) {
        // Css takes the top-left edge of the element by default.
        // doc.text takes left-bottom, so we add baseline "top" to achieve the same behavior in jspdf.
        doc.setFont(fontName, 'bolditalic');
        doc.setFontSize(14);
        let titleArray = doc.splitTextToSize("Geschätzte Versorgung durch Punkteinzugsgebiete", 180);
        doc.text(titleArray, initX, initY, { baseline: "top" });
        doc.setFont(fontName, "normal", "normal");
        doc.setFontSize(fontSize_default);

        nextLineY = initY;

        for (const item of titleArray) {
          nextLineY += 10;
        }

        return doc;
      }

      this.insertTable_indicator_poi_information = function (doc, reachabilityScenario, indicatorStatistic, insertCoverageTypeShortInformation) {

        let headerArray = ['Eingangsdaten', 'Name', 'Zeitschnitt'];

        let bodyArray = [
          ["Punktdatensatz", reachabilityScenario.poiDataset.poiName, reachabilityScenario.poiDataset.poiDate],
          ["Indikator", indicatorStatistic.indicator.indicatorName + " [ " + indicatorStatistic.indicator.unit + " ]" + "\n - \n" + indicatorStatistic.spatialUnit.spatialUnitName, indicatorStatistic.timestamp]
        ];

        if (insertCoverageTypeShortInformation) {
          bodyArray.push(["Gewichtungstyp", weightStrategyText, "-"]);
        }

        doc.autoTable({
          head: [headerArray],
          body: bodyArray,
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: nextLineY
        });

        return doc;
      }

      this.setWeightStrategyTexts = function (indicatorStatistic) {
        weightStrategyText = "";
        weightStrategyExplanationText = "";
        if (indicatorStatistic.weightStrategy == "residential_areas") {
          weightStrategyText += "versorgte Wohnfläche";
          weightStrategyExplanationText += "Pro Raumeinheit wird nur die Wohnfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumeinheit ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Wohnfläche innerhalb der Raumeinheit. Dieses Verfahren berücksichtigt demnach nur die Wohnfläche und liefert daher einen genaueren Schätzwert als der einfache Gesamtflächenanteil. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.";
        }
        else {
          weightStrategyText += "einfacher Gesamtflächenanteil";
          weightStrategyExplanationText += "Pro Raumeinheit wird die Gesamtfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumeinheit ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Gesamtfläche der Raumeinheit. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.";
        }
      }

      this.insertCoverageType = function (doc, indicatorStatistic) {
        // doc.setFont(fontName, 'bold');
        // doc.setFontSize(12);
        this.setWeightStrategyTexts(indicatorStatistic);

        doc.autoTable({
          head: [['Gewichtungstyp', 'Hinweis zu Berechnung']],
          body: [
            [weightStrategyText, weightStrategyExplanationText],
          ],
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: nextLineY,
        });        

        return doc;
      }

      this.generateFeatureCoverageSection_focusPoiCoverage = async function (doc, reachabilityScenario, indicatorStatistic) {

        // init / clone leaflet map to focus each point by its isochrones BBOX
        let leafletMapDomId = "leaflet_map_poi_individual_indicator_coverage";

        this.appendLeafletContainer(leafletMapDomId);

        await this.initPoiIndividualLeafletMap(leafletMapDomId, reachabilityScenario, indicatorStatistic);

        // sort / clone POIs by their total coverage
        let mapParts = kommonitorReachabilityMapHelperService.getMapParts_byDomId(leafletMapDomId);
        let poiLayer = mapParts.indicatorStatistics.poiLayer;

        // for each POI
        // highlight and zoom to POI isochrones and make screenshot

        // add screenshot to pdf

        // add coverage information to pdf 

        // for each cutoff value

        // first add total coverage over whole area  

        // then for each affected spatial unit (sorted by coverage)
        // add spatial unit coverage 
        for (const poiLayerKey in poiLayer._layers) {
          if (Object.hasOwnProperty.call(poiLayer._layers, poiLayerKey)) {
            const markerLayer = poiLayer._layers[poiLayerKey];
            
            doc = await self.insertPoiIndividualPage(doc, reachabilityScenario, indicatorStatistic, markerLayer, leafletMapDomId);
          }
        }


        this.removeLeafletContainer(leafletMapDomId);

        return doc;
      };

      this.insertPoiIndividualPage = async function (doc, reachabilityScenario, indicatorStatistic, marker, domId) {

        let feature = marker.feature;
        let poiIsochroneLayer = kommonitorReachabilityMapHelperService.generateSinglePoiIsochroneLayer(feature);
        kommonitorReachabilityMapHelperService.removeSinglePoiIsochroneLayer(domId);
        kommonitorReachabilityMapHelperService.addSinglePoiIsochroneLayer(domId, feature, poiIsochroneLayer, true);

        // maybe wait a bit to ensure that leaflet container is properly rendered.
        await new Promise(resolve => setTimeout(resolve, 350));

        // let popupContent = self.generatePoiPopupContent(feature, indicatorStatisticsCandidate);
        // marker.bindPopup("");

        // //fire event 'click' on target layer 
        // marker.fireEvent('click');
        // marker.closePopup();

        doc.addPage();

        //insert logo
        doc = this.insertLogo(doc);

        // TITLE
        doc = this.insertTitle(doc);

        // disclaimer accuracy regarding coverage type --> always insecure. best guess based on selected coverage type

        doc = this.insertTable_indicator_poi_information(doc, reachabilityScenario, indicatorStatistic, true);

        nextLineY = doc.autoTable.previous.finalY + 5;

        // SECTION LINE
        doc = this.insertSectionSeparator(doc);

        // POI individual info
        doc = await this.addCoverageInformation_poiIndividualCoverage(doc, reachabilityScenario, indicatorStatistic, marker, domId)

        return doc;
      }

      this.addCoverageInformation_poiIndividualCoverage = async function (doc, reachabilityScenario, indicatorStatistic, marker, domId) {
        doc.setFont(fontName, 'bolditalic');
        doc.setFontSize(12);
        let poiCoverageTitle = doc.splitTextToSize('Versorgung durch Punkt "' + marker.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + '"', 180);
        doc.text(poiCoverageTitle, initX, nextLineY, { baseline: "top" });
        doc.setFont(fontName, "normal", "normal");
        doc.setFontSize(fontSize_default);

        nextLineY += 10;

        /*
          ISOCHRONE PRUNE RESULT EXAMPLE
          {
            "poiFeatureId": "35_5",
            "overallCoverage": [
              {
                "date": "2023-01-01",
                "absoluteCoverage": 6.3172536,
                "relativeCoverage": 0.0020464053
              }
            ],
            "spatialUnitCoverage": [
              {
                "spatialUnitFeatureId": "7",
                "coverage": [
                  {
                    "date": "2023-01-01",
                    "absoluteCoverage": 6.3172536,
                    "relativeCoverage": 0.0186901
                  }
                ]
              }
            ]
          },
        */
        let poiIsochroneStatistics = marker.feature.properties.individualIsochronePruneResults;

        let poiCoverage_tableArray = []
        let spatialUnitPoiCoverage_tableArray = []

        // overall section

        for (const poiIsochroneStatistic of poiIsochroneStatistics) {
          let range = poiIsochroneStatistic.poiFeatureId.split("_")[1];
          if (kommonitorReachabilityHelperService.settings.focus == 'time') {
            // range = Number(range) / 60 + " [Minuten]";
            range = Number(range) + " [Minuten]";
          }
          else {
            range = range + " [Meter]"
          }

          let coverage_total_absolute = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(poiIsochroneStatistic.overallCoverage[0].absoluteCoverage) + " von " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(indicatorStatistic.coverageResult.timeseries[0].value) + " [" + indicatorStatistic.indicator.unit + "]";
          let coverage_total_relative = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(poiIsochroneStatistic.overallCoverage[0].relativeCoverage * 100) + " [%]";


          poiCoverage_tableArray.push([
            range, coverage_total_absolute, coverage_total_relative
          ]);

          // spatial unit wise section
          let coverage_spatialUnit_range = "";
          for (const spatialUnitCoverageEntry of poiIsochroneStatistic.spatialUnitCoverage) {
            let indicatorGeoJSON = indicatorStatistic.indicator.geoJSON;
            let spatialUnitFeatureId = spatialUnitCoverageEntry.spatialUnitFeatureId;
            let indicatorFeature = kommonitorReachabilityMapHelperService.getIndicatorFeature_forSpatialUnitFeatureId(indicatorGeoJSON, spatialUnitFeatureId);
            let spatialUnitFeatureName = indicatorFeature.properties[__env.FEATURE_NAME_PROPERTY_NAME];

            // rechtsorientiert einfuegen
            coverage_spatialUnit_range += spatialUnitFeatureName + "\n" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].absoluteCoverage) + " von " + indicatorFeature.properties[__env.indicatorDatePrefix + indicatorStatistic.timestamp] + " [" + indicatorStatistic.indicator.unit + "]"
              + "  =>  entspricht " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].relativeCoverage * 100) + " [%]"
              + "\n\n";

          }

          coverage_spatialUnit_range = coverage_spatialUnit_range.slice(0, -2); // Remove the last 2 characters
          spatialUnitPoiCoverage_tableArray.push([
            range, coverage_spatialUnit_range
          ]);

        }

        doc.autoTable({
          head: [['Einzugsgebiet', 'geschätzte absolute Versorgung', 'geschätzter Anteil']],
          body: poiCoverage_tableArray,
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: nextLineY,
        });

        nextLineY = doc.autoTable.previous.finalY + 5;

        doc.autoTable({
          head: [['Einzugsgebiet', 'anteilig versorgte Raumeinheiten']],
          body: spatialUnitPoiCoverage_tableArray,
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles_spatialUnitPoiCoverage,
          startY: nextLineY,
        });

        // screenshot of leaflet map
        nextLineY = doc.autoTable.previous.finalY + 5;
        let remainingSpaceY = 297 - nextLineY;

        let leafletMapScreenshot = await kommonitorReachabilityMapHelperService.takeScreenshot_image(domId, null);

        doc.addImage(leafletMapScreenshot, "PNG", initX, nextLineY,
          180, remainingSpaceY - 5, "", 'MEDIUM');

        return doc;
      }

      this.initPoiIndividualLeafletMap = async function (leafletMapDomId, reachabilityScenario, indicatorStatistic) {
        kommonitorReachabilityMapHelperService.initReachabilityIndicatorStatisticsGeoMap(leafletMapDomId);

        /*
          {
              "reachabilitySettings": reachabilitySettings, // settings from rechability helper service for isochrone config
              "scenarioName": "name", // unique scenario name
              "indicatorStatistics": indicatorStatistics, // array of all calculated indicator statistics
              "isochrones_dissolved": isochrones_dissolved, // kommonitorReachabilityHelperService.currentIsochronesGeoJSON 
              "isochrones_perPoint": isochrones_perPoint, //kommonitorReachabilityHelperService.original_nonDissolved_isochrones 
              "poiDataset": {
                "poiId": poiId,
                "poiName": poiName,
                "poiDate": poiDate
              }
            }

            from this information kommonitorReachabilityHelperService.settings were already set
            hence we can derive the information from there as well 
        */
        kommonitorReachabilityMapHelperService
          .replaceIsochroneGeoJSON(
            leafletMapDomId,
            kommonitorReachabilityHelperService.settings.selectedStartPointLayer.datasetName,
            kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
            kommonitorReachabilityHelperService.settings.transitMode,
            kommonitorReachabilityHelperService.settings.focus,
            kommonitorReachabilityHelperService.settings.rangeArray,
            kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
            kommonitorReachabilityHelperService.settings.dissolveIsochrones);

        let poiDataset = kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
        let original_nonDissolved_isochrones = kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
        await kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(leafletMapDomId, poiDataset, original_nonDissolved_isochrones, indicatorStatistic);

      }

      this.appendLeafletContainer = function (domId) {
        let divContainer = document.createElement('div');
        divContainer.setAttribute("id", domId);
        divContainer.setAttribute("style", "height: 600px; width: 1000px;");

        document.body.appendChild(divContainer);
      }

      this.removeLeafletContainer = function (domId) {
        document.getElementById(domId).remove();
      }

      this.generateCoverageDataTableSection_focusPoiCoverage = async function (doc, indicatorStatistic) {

        return doc;
      };

    }]);
