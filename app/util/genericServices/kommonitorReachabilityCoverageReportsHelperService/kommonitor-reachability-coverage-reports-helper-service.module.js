angular.module('kommonitorReachabilityCoverageReportsHelper', ['kommonitorDataExchange', 'kommonitorReachabilityHelper', 'kommonitorReachabilityMapHelper']);


angular
  .module('kommonitorReachabilityCoverageReportsHelper', [])
  .service(
    'kommonitorReachabilityCoverageReportsHelperService', [
    '__env', 'kommonitorDataExchangeService', 'kommonitorReachabilityHelperService', 'kommonitorReachabilityMapHelperService',
    '$rootScope', '$timeout',
    function (__env, kommonitorDataExchangeService, kommonitorReachabilityHelperService, kommonitorReachabilityMapHelperService,
      $rootScope, $timeout) {

      let self = this;

      this.reportInProgress_totalCoverage = false;
      this.reportInProgress_poiCoverage = false;
      this.progressText_poiCoverage = "";
      this.reportInProgress_spatialUnitCoverage = false;

      this.leafletContainer_height_px = 675;
      this.leafletContainer_width_px = 675;
      this.leafletContainer_resolution = this.leafletContainer_width_px / this.leafletContainer_height_px;

      this.pdfLeafletImageWidth = 190;
      this.pdfLeafletImageHeight = this.pdfLeafletImageWidth / this.leafletContainer_resolution;

      this.domToImageMoreSettings = {
        quality: 0.95, 
        width: this.leafletContainer_width_px,
        height: this.leafletContainer_height_px
      }


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
        fontStyle: 'normal',
        fontSize: 11,
        // auto or wrap or number
        cellWidth: 'auto',
        halign: "right",
        valign: "middle"
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

      this.generateTotalCoverageReport_focusPoiCoverage = async function (reachabilityScenario, indicatorStatistic) {

        this.reportInProgress_totalCoverage = true;
        $timeout(function () {
          $rootScope.$digest();
        });

        // create pdf document
        // 210 mm x 297 mm
        let doc = this.setupDoc();

        //insert logo
        doc = this.insertLogo(doc);

        // general settings
        doc.setDrawColor(148, 148, 148);
        doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
        doc.setFontSize(fontSize_default);

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

        doc.save("KomMonitor-Report_Erreichbarkeits_Coverage_Gesamtgebiet.pdf");

        this.reportInProgress_totalCoverage = false;
        $timeout(function () {
          $rootScope.$digest();
        });

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

        // init / clone leaflet map to focus each point by its isochrones BBOX
        let leafletMapDomId = "leaflet_map_total_indicator_coverage";

        this.appendLeafletContainer(leafletMapDomId);

        await this.initTotalCoverageLeafletMap(leafletMapDomId, reachabilityScenario, indicatorStatistic);

        // maybe wait a bit to ensure that leaflet container is properly rendered.
        await new Promise(resolve => setTimeout(resolve, 750));

        kommonitorReachabilityMapHelperService.zoomToIndicatorLayer(leafletMapDomId);

        await new Promise(resolve => setTimeout(resolve, 750));

        nextLineY = doc.autoTable.previous.finalY + 5;
        let remainingSpaceY = 297 - nextLineY - 5;

        let leafletMapScreenshot = await kommonitorReachabilityMapHelperService.takeScreenshot_image(leafletMapDomId, this.domToImageMoreSettings);

        // ideal image resolution
        if (remainingSpaceY < this.pdfLeafletImageHeight) {
          doc.addPage();

          //insert logo
          doc = this.insertLogo(doc);

          // TITLE
          doc = this.insertTitle(doc);

          doc.setFont(fontName, 'bolditalic');
          doc.setFontSize(12);
          let totalCoverageTitle = doc.splitTextToSize("Gesamtergebnis - Versorgung über alle Raumeinheiten", 180);
          doc.text(totalCoverageTitle, initX, nextLineY, { baseline: "top" });
          doc.setFont(fontName, "normal", "normal");
          doc.setFontSize(fontSize_default);

          nextLineY += 10;
        }

        doc.addImage(leafletMapScreenshot, "JPEG", initX, nextLineY,
          this.pdfLeafletImageWidth, this.pdfLeafletImageHeight, "", 'MEDIUM');

        this.removeLeafletContainer(leafletMapDomId);

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
          this.setWeightStrategyTexts(indicatorStatistic);
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
        if (indicatorStatistic.weightStrategy.apiName == "residential_areas") {
          weightStrategyText += "versorgte Wohnfläche";
          weightStrategyExplanationText += "Pro Raumebene wird nur die Wohnfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumebene ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Wohnfläche innerhalb der Raumebene. Dieses Verfahren berücksichtigt demnach nur die Wohnfläche und liefert daher einen genaueren Schätzwert als der einfache Gesamtflächenanteil. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.";
        }
        else {
          weightStrategyText += "einfacher Gesamtflächenanteil";
          weightStrategyExplanationText += "Pro Raumebene wird die Gesamtfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumebene ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Gesamtfläche der Raumebene. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.";
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

      this.generateFeatureCoverageReport_focusPoiCoverage = async function (reachabilityScenario, indicatorStatistic) {

        this.reportInProgress_poiCoverage = true;
        this.progressText_poiCoverage = "0 / " + kommonitorReachabilityHelperService.settings.selectedStartPointLayer.geoJSON_reachability.features.length;

        $timeout(function () {
          $rootScope.$digest();
        });

        // create pdf document
        // 210 mm x 297 mm
        let doc = this.setupDoc();

        // general settings
        doc.setDrawColor(148, 148, 148);
        doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
        doc.setFontSize(fontSize_default);

        nextLineY = initY;

        // init / clone leaflet map to focus each point by its isochrones BBOX
        let leafletMapDomId = "leaflet_map_poi_individual_indicator_coverage";

        this.appendLeafletContainer(leafletMapDomId);

        await this.initPoiIndividualLeafletMap(leafletMapDomId, reachabilityScenario, indicatorStatistic);

        // sort / clone POIs by their total coverage
        let mapParts = kommonitorReachabilityMapHelperService.getMapParts_byDomId(leafletMapDomId);
        let poiLayer = mapParts.indicatorStatistics.poiLayer;

        //now an array
        let poiLayer_array = this.sortPoiLayer_byTotalCoverageDesc(poiLayer);

        // for each POI
        // highlight and zoom to POI isochrones and make screenshot

        // add screenshot to pdf

        // add coverage information to pdf 

        // for each cutoff value

        // first add total coverage over whole area  

        // then for each affected spatial unit (sorted by coverage)
        // add spatial unit coverage 
        for (let index = 0; index < poiLayer_array.length; index++) {
          const markerLayer = poiLayer_array[index];
          doc = await self.insertPoiIndividualPage(doc, reachabilityScenario, indicatorStatistic, markerLayer, leafletMapDomId);

          this.progressText_poiCoverage = index + " / " + poiLayer_array.length;
          $timeout(function () {
            $rootScope.$digest();
          });

          if (index < poiLayer_array.length - 1) {
            doc.addPage();
          }
        }


        this.removeLeafletContainer(leafletMapDomId);

        doc.save("KomMonitor-Report_Erreichbarkeits_Coverage_Einzelpunkte-Karte.pdf");

        this.reportInProgress_poiCoverage = false;
        $timeout(function () {
          $rootScope.$digest();
        });

      };

      this.sortPoiLayer_byTotalCoverageDesc = function (poiLayer) {

        let poiArray_sorted = [];

        for (const poiLayerKey in poiLayer._layers) {
          if (Object.hasOwnProperty.call(poiLayer._layers, poiLayerKey)) {
            const markerLayer = poiLayer._layers[poiLayerKey];
            poiArray_sorted.push(markerLayer);
          }
        }

        poiArray_sorted.sort(function (a, b) {

          let isochroneStatistics_a = a.feature.properties.individualIsochronePruneResults;
          let absoluteCoverage_a = isochroneStatistics_a[isochroneStatistics_a.length - 1].overallCoverage[0].absoluteCoverage;

          let isochroneStatistics_b = b.feature.properties.individualIsochronePruneResults;
          let absoluteCoverage_b = isochroneStatistics_b[isochroneStatistics_b.length - 1].overallCoverage[0].absoluteCoverage;

          return absoluteCoverage_b - absoluteCoverage_a;
        });

        return poiArray_sorted;
      }

      this.insertSpatialUnitIndividualPage = async function (doc, reachabilityScenario, indicatorStatistic, spatialUnitLayer, domId) {
        let feature = spatialUnitLayer.feature;
        kommonitorReachabilityMapHelperService.zoomToIndicatorFeature(domId, feature);

        // maybe wait a bit to ensure that leaflet container is properly rendered.
        await new Promise(resolve => setTimeout(resolve, 750));

        //insert logo
        doc = this.insertLogo(doc);

        // TITLE
        doc = this.insertTitle(doc);

        // disclaimer accuracy regarding coverage type --> always insecure. best guess based on selected coverage type

        doc = this.insertTable_indicator_poi_information(doc, reachabilityScenario, indicatorStatistic, true);

        nextLineY = doc.autoTable.previous.finalY + 5;

        // SECTION LINE
        doc = this.insertSectionSeparator(doc);

        // spatial unit feature individual info
        doc = await this.addCoverageInformation_spatialUnitIndividualCoverage(doc, reachabilityScenario, indicatorStatistic, spatialUnitLayer, domId)

        return doc;
      }

      this.addCoverageInformation_spatialUnitIndividualCoverage = async function (doc, reachabilityScenario, indicatorStatistic, spatialUnitLayer, domId) {
        doc.setFont(fontName, 'bolditalic');
        doc.setFontSize(12);
        let poiCoverageTitle = doc.splitTextToSize('Versorgung der Raumebene "' + spatialUnitLayer.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + '"', 180);
        doc.text(poiCoverageTitle, initX, nextLineY, { baseline: "top" });
        doc.setFont(fontName, "normal", "normal");
        doc.setFontSize(fontSize_default);

        nextLineY += 10;

        let coverages_perRange = spatialUnitLayer.feature.properties.overallCoverages;

        let poiCoverage_tableArray = []
        let spatialUnitPoiCoverage_tableArray = []

        // overall section

        for (const coverage_perRange in coverages_perRange) {
          let range = coverages_perRange[coverage_perRange].range;
          if (kommonitorReachabilityHelperService.settings.focus == 'time') {
            range = Number(range) + " [Minuten]";
          }
          else {
            range = range + " [Meter]"
          }

          let coverage_total_absolute = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(coverages_perRange[coverage_perRange].absoluteCoverage) + " von " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(spatialUnitLayer.feature.properties[__env.indicatorDatePrefix + indicatorStatistic.timestamp]) + " [" + indicatorStatistic.indicator.unit + "]";
          let coverage_total_relative = kommonitorDataExchangeService.getIndicatorValue_asFormattedText(coverages_perRange[coverage_perRange].relativeCoverage * 100) + " [%]";


          poiCoverage_tableArray.push([
            range, coverage_total_absolute, coverage_total_relative, coverages_perRange[coverage_perRange].poiFeatureIds.length
          ]);

        }

        doc.autoTable({
          head: [['Einzugsgebiet', 'geschätzte absolute Versorgung', 'geschätzter Anteil', 'Anzahl beteiligter Punktdaten']],
          body: poiCoverage_tableArray,
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: nextLineY,
        });

        // screenshot of leaflet map
        nextLineY = doc.autoTable.previous.finalY + 5;
        let remainingSpaceY = 297 - nextLineY - 5;

        let leafletMapScreenshot = await kommonitorReachabilityMapHelperService.takeScreenshot_image(domId, this.domToImageMoreSettings);

        // ideal image resolution 
        if (remainingSpaceY < this.pdfLeafletImageHeight) {
          doc.addPage();

          //insert logo
          doc = this.insertLogo(doc);

          // TITLE
          doc = this.insertTitle(doc);

          doc.setFont(fontName, 'bolditalic');
          doc.setFontSize(12);
          let poiCoverageTitle = doc.splitTextToSize('Versorgung der Raumebene "' + spatialUnitLayer.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + '"', 180);
          doc.text(poiCoverageTitle, initX, nextLineY, { baseline: "top" });
          doc.setFont(fontName, "normal", "normal");
          doc.setFontSize(fontSize_default);

          nextLineY += 10;
        }

        doc.addImage(leafletMapScreenshot, "JPEG", initX, nextLineY,
          this.pdfLeafletImageWidth, this.pdfLeafletImageHeight, "", 'MEDIUM');

        return doc;
      }

      this.insertPoiIndividualPage = async function (doc, reachabilityScenario, indicatorStatistic, marker, domId) {

        let feature = marker.feature;
        let poiIsochroneLayer = kommonitorReachabilityMapHelperService.generateSinglePoiIsochroneLayer(feature);
        kommonitorReachabilityMapHelperService.removeSinglePoiIsochroneLayer(domId);
        kommonitorReachabilityMapHelperService.addSinglePoiIsochroneLayer(domId, feature, poiIsochroneLayer, true);

        // maybe wait a bit to ensure that leaflet container is properly rendered.
        await new Promise(resolve => setTimeout(resolve, 750));

        // let popupContent = self.generatePoiPopupContent(feature, indicatorStatisticsCandidate);
        // marker.bindPopup("");

        // //fire event 'click' on target layer 
        // marker.fireEvent('click');
        // marker.closePopup();

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
          head: [['Einzugsgebiet', 'anteilig versorgte Raumebenen']],
          body: spatialUnitPoiCoverage_tableArray,
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles_spatialUnitPoiCoverage,
          startY: nextLineY,
        });

        // screenshot of leaflet map
        nextLineY = doc.autoTable.previous.finalY + 5;
        let remainingSpaceY = 297 - nextLineY - 5;

        let leafletMapScreenshot = await kommonitorReachabilityMapHelperService.takeScreenshot_image(domId, this.domToImageMoreSettings);

        // ideal image resolution
        if (remainingSpaceY < this.pdfLeafletImageHeight) {
          doc.addPage();

          //insert logo
          doc = this.insertLogo(doc);

          // TITLE
          doc = this.insertTitle(doc);

          doc.setFont(fontName, 'bolditalic');
          doc.setFontSize(12);
          let poiCoverageTitle = doc.splitTextToSize('Versorgung durch Punkt "' + marker.feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] + '"', 180);
          doc.text(poiCoverageTitle, initX, nextLineY, { baseline: "top" });
          doc.setFont(fontName, "normal", "normal");
          doc.setFontSize(fontSize_default);

          nextLineY += 10;
        }

        doc.addImage(leafletMapScreenshot, "JPEG", initX, nextLineY,
          this.pdfLeafletImageWidth, this.pdfLeafletImageHeight, "", 'MEDIUM');

        return doc;
      }

      this.initTotalCoverageLeafletMap = async function(leafletMapDomId, reachabilityScenario, indicatorStatistic){
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

        kommonitorReachabilityMapHelperService.zoomToIndicatorLayer(leafletMapDomId);
      };

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
        // kommonitorReachabilityMapHelperService
        //   .replaceIsochroneGeoJSON(
        //     leafletMapDomId,
        //     kommonitorReachabilityHelperService.settings.selectedStartPointLayer.datasetName,
        //     kommonitorReachabilityHelperService.currentIsochronesGeoJSON,
        //     kommonitorReachabilityHelperService.settings.transitMode,
        //     kommonitorReachabilityHelperService.settings.focus,
        //     kommonitorReachabilityHelperService.settings.rangeArray,
        //     kommonitorReachabilityHelperService.settings.useMultipleStartPoints,
        //     kommonitorReachabilityHelperService.settings.dissolveIsochrones);

        let poiDataset = kommonitorReachabilityHelperService.settings.selectedStartPointLayer;
        let original_nonDissolved_isochrones = kommonitorReachabilityHelperService.original_nonDissolved_isochrones;
        await kommonitorReachabilityMapHelperService.replaceReachabilityIndicatorStatisticsOnMap(leafletMapDomId, poiDataset, original_nonDissolved_isochrones, indicatorStatistic);

      }

      this.initSpatialUnitIndividualLeafletMap = async function (leafletMapDomId, reachabilityScenario, indicatorStatistic) {
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
        divContainer.setAttribute("style", "height: " + this.leafletContainer_height_px + "px; width: " + this.leafletContainer_width_px + "px;");

        document.body.appendChild(divContainer);
      }

      this.removeLeafletContainer = function (domId) {
        document.getElementById(domId).remove();
      }

      this.generateCoverageDataTableReport_focusPoiCoverage = async function (doc, indicatorStatistic) {

      };

      // TODO FIXME 
      // currently this method's implementation makes false assumptions
      // the idea is to sum up coverage for each spatial unit feature
      // but the POI oriented data for indicator statistic accumulates indicator values for each POI
      // if multiple near POI isochrones overlap for a large area, then indicator values are accumulated for each POI
      // hence indicator values are taken into account multiple times --> leading to false sum values
      // a different approach must be implemented to achieve this goal
      this.generateFeatureCoverageReport_focusSpatialUnitCoverage = async function (reachabilityScenario, indicatorStatistic) {

        this.reportInProgress_spatialUnitCoverage = true;
        $timeout(function () {
          $rootScope.$digest();
        });

        // create pdf document
        // 210 mm x 297 mm
        let doc = this.setupDoc();

        //insert logo
        doc = this.insertLogo(doc);

        // general settings
        doc.setDrawColor(148, 148, 148);
        doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
        doc.setFontSize(fontSize_default);

        nextLineY = initY;

        // init / clone leaflet map to focus each point by its isochrones BBOX
        let leafletMapDomId = "leaflet_map_spatialUnit_individual_indicator_coverage";

        this.appendLeafletContainer(leafletMapDomId);

        await this.initSpatialUnitIndividualLeafletMap(leafletMapDomId, reachabilityScenario, indicatorStatistic);

        // sort / clone POIs by their total coverage
        let mapParts = kommonitorReachabilityMapHelperService.getMapParts_byDomId(leafletMapDomId);
        let poiLayer = mapParts.indicatorStatistics.poiLayer;
        let indicatorLayer = mapParts.indicatorStatistics.indicatorLayer;

        //now an array
        let indicatorLayer_array = this.aggregatePoisForSpatialUnits(indicatorLayer, poiLayer);

        // for each indicator spatial unit
        // highlight and zoom to spatial unit and make screenshot

        // add screenshot to pdf

        // add coverage information to pdf 

        // for each cutoff value
        for (let index = 0; index < indicatorLayer_array.length; index++) {
          const spatialUnitLayer = indicatorLayer_array[index];
          doc = await self.insertSpatialUnitIndividualPage(doc, reachabilityScenario, indicatorStatistic, spatialUnitLayer, leafletMapDomId);
          if (index < indicatorLayer_array.length - 1) {
            doc.addPage();
          }
        }


        this.removeLeafletContainer(leafletMapDomId);

        doc.save("KomMonitor-Report_Erreichbarkeits_Coverage_Raumebenen-Karte.pdf");

        this.reportInProgress_spatialUnitCoverage = false;
        $timeout(function () {
          $rootScope.$digest();
        });

      };

      this.aggregatePoisForSpatialUnits = function (indicatorLayer, poiLayer) {

        let poiArray = [];

        for (const poiLayerKey in poiLayer._layers) {
          if (Object.hasOwnProperty.call(poiLayer._layers, poiLayerKey)) {
            const markerLayer = poiLayer._layers[poiLayerKey];
            poiArray.push(markerLayer);
          }
        }

        let indicatorArray = [];

        for (const indicatorLayerKey in indicatorLayer._layers) {
          if (Object.hasOwnProperty.call(indicatorLayer._layers, indicatorLayerKey)) {
            let layer = indicatorLayer._layers[indicatorLayerKey];

            let indicatorFeature = layer.feature;
            indicatorFeature = self.aggregatePoiCoverage(indicatorFeature, poiArray);
            layer.feature = indicatorFeature;

            indicatorArray.push(layer);
          }
        }

        indicatorArray.sort(function (a, b) {
          if (!a.feature.properties.overallCoverages) {
            return -1;
          }
          if (!b.feature.properties.overallCoverages) {
            return 0;
          }

          // let lastKey_a = Object.keys(a.feature.properties.overallCoverages)[(Object.keys(a.feature.properties.overallCoverages).length - 1)];
          // let lastKey_b = Object.keys(b.feature.properties.overallCoverages)[(Object.keys(b.feature.properties.overallCoverages).length - 1)];
          let ranges_a = Object.keys(a.feature.properties.overallCoverages).map(item => Number(item));
          let ranges_b = Object.keys(b.feature.properties.overallCoverages).map(item => Number(item));
          let maxRange_a = Math.max(...ranges_a);
          let maxRange_b = Math.max(...ranges_b);
          let coverage_a = a.feature.properties.overallCoverages["" + maxRange_a].absoluteCoverage || 0;
          let coverage_b = b.feature.properties.overallCoverages["" + maxRange_b].absoluteCoverage || 0;
          return coverage_b - coverage_a;
        });

        return indicatorArray;

      }

      // this type of accumulation does not work as expected
      // reason: each POI coverage information is in focus
      // if we simply accumulate over all POIs
      // then we count overlapping coverage zones multiple times
      this.aggregatePoiCoverage = function (indicatorFeature, poiLayerArray) {

        indicatorFeature.properties.overallCoverages = {};

        for (const poiLayer of poiLayerArray) {
          let poiFeature = poiLayer.feature;
          let poiIsochronesArray = poiFeature.properties.individualIsochrones;

          let poiIsochroneStatistics = poiFeature.properties.individualIsochronePruneResults;

          for (const poiIsochroneStatistic of poiIsochroneStatistics) {
            let range = Number(poiIsochroneStatistic.poiFeatureId.split("_")[1]);

            for (const spatialUnitCoverageEntry of poiIsochroneStatistic.spatialUnitCoverage) {
              let spatialUnitFeatureId = spatialUnitCoverageEntry.spatialUnitFeatureId;

              if (spatialUnitFeatureId == indicatorFeature.properties[__env.FEATURE_ID_PROPERTY_NAME]) {
                // accumulate total and relative coverages
                if (indicatorFeature.properties.overallCoverages[range]) {
                  indicatorFeature.properties.overallCoverages[range].absoluteCoverage += spatialUnitCoverageEntry.coverage[0].absoluteCoverage;
                  indicatorFeature.properties.overallCoverages[range].relativeCoverage += spatialUnitCoverageEntry.coverage[0].relativeCoverage;
                  if (!indicatorFeature.properties.overallCoverages[range].poiFeatureIds.includes(poiFeature.properties[__env.FEATURE_ID_PROPERTY_NAME])) {
                    indicatorFeature.properties.overallCoverages[range].poiFeatureIds.push(poiFeature.properties[__env.FEATURE_ID_PROPERTY_NAME]);
                  }
                }
                else {
                  indicatorFeature.properties.overallCoverages[range] = {
                    absoluteCoverage: spatialUnitCoverageEntry.coverage[0].absoluteCoverage,
                    relativeCoverage: spatialUnitCoverageEntry.coverage[0].relativeCoverage,
                    range: range,
                    poiFeatureIds: [poiFeature.properties[__env.FEATURE_ID_PROPERTY_NAME]]
                  }
                }

              }

            }

          }


        }

        return indicatorFeature;
      }

    }]);
