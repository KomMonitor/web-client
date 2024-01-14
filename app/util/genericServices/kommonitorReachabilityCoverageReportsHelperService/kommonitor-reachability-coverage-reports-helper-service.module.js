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

      // first column with fixed width
      let columnStyles = {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { fontStyle: 'normal' }
      };

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

        //insert logo
        var img = new Image();
        var subPath = location.pathname;
        img.src = subPath + 'logos/KM_Logo1.png';
        doc.addImage(img, 'PNG', 193, 5, 12, 12);

        // general settings

        doc.setDrawColor(148, 148, 148);
        doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
        doc.setFontSize(fontSize_default);

        doc = await this.generateTotalCoverageSection_focusPoiCoverage(doc, reachabilityScenario, indicatorStatistic);

        doc = await this.generateFeatureCoverageSection_focusPoiCoverage(doc, reachabilityScenario, indicatorStatistic);

        doc = await this.generateCoverageDataTableSection_focusPoiCoverage(doc, reachabilityScenario, indicatorStatistic);

        doc.save("KomMonitor-Report_Erreichbarkeits_Coverage.pdf");
      }

      this.generateTotalCoverageSection_focusPoiCoverage = async function (doc, reachabilityScenario, indicatorStatistic) {

        // TITLE
        // Css takes the top-left edge of the element by default.
        // doc.text takes left-bottom, so we add baseline "top" to achieve the same behavior in jspdf.
        doc.setFont(fontName, 'bolditalic');
        doc.setFontSize(14);
        let titleArray = doc.splitTextToSize("Geschätzte Versorgung durch Punkteinzugsgebiete", 180);
        doc.text(titleArray, initX, initY, { baseline: "top" });
        doc.setFont(fontName, "normal", "normal");
        doc.setFontSize(fontSize_default);

        let nextLineY = initY;

        for (const item of titleArray) {
          nextLineY += 10;
        }

        // // SUBTITLE POI
        // doc.setFont(fontName, 'bold');
        // doc.setFontSize(12);
        // let subtitlePoi = doc.splitTextToSize("Punktdatensatz: " + reachabilityScenario.poiDataset.poiName + " - " + reachabilityScenario.poiDataset.poiDate, 180);
        // doc.text(subtitlePoi, initX, nextLineY, { baseline: "top" });

        // for (const item of subtitlePoi) {
        //   nextLineY += 5;
        // }

        // // SUBTITLE INDICATOR
        // doc.setFont(fontName, 'bold');
        // doc.setFontSize(12);
        // let subtitleIndicator = doc.splitTextToSize("Indikator: " + indicatorStatistic.indicator.indicatorName + " [ " + indicatorStatistic.indicator.unit + " ]" + " - " + indicatorStatistic.spatialUnit.spatialUnitName + " - " + indicatorStatistic.timestamp, 180);
        // doc.text(subtitleIndicator, initX, nextLineY, { baseline: "top" });

        // for (const item of subtitleIndicator) {
        //   nextLineY += 5;
        // }

        // // SUBTITLE COVERAGE TYPE (simple area or residential areas)
        // doc.setFont(fontName, 'bold');
        // doc.setFontSize(12);
        let weightStrategyText = "";
        let weightStrategyExplanationText = "";
        if (indicatorStatistic.weightStrategy == "residential_areas") {
          weightStrategyText += "versorgte Wohnfläche";
          weightStrategyExplanationText += "Pro Raumeinheit wird nur die Wohnfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumeinheit ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Wohnfläche innerhalb der Raumeinheit. Dieses Verfahren berücksichtigt demnach nur die Wohnfläche und liefert daher einen genaueren Schätzwert als der einfache Gesamtflächenanteil. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.";
        }
        else {
          weightStrategyText += "einfacher Gesamtflächenanteil";
          weightStrategyExplanationText += "Pro Raumeinheit wird die Gesamtfläche mit den Einzugsgebieten eines Punktes räumlich verschnitten. Die geschätzte Gesamtversorgung einer Raumeinheit ergibt sich dann aus dem durch die Punkteinzugsgebiete insgesamt überlappenden Anteil an der Gesamtfläche der Raumeinheit. Da keine Einzelpersonen im Verfahren verücksichtigt werden, ist das Ergebnis ausdrücklich als Schätzwert zu interpretieren.";
        }
        // let weightStrategy = doc.splitTextToSize(weightStrategyText, 180);
        // doc.text(weightStrategy, initX, nextLineY, { baseline: "top" });

        // for (const item of weightStrategy) {
        //   nextLineY += 5;
        // }

        // doc.setFont(fontName, 'italic');
        // doc.setFontSize(10);
        // let weightStrategyExplanation = doc.splitTextToSize(weightStrategyExplanationText, 180);
        // doc.text(weightStrategyExplanation, initX, nextLineY, { baseline: "top" });

        // for (const item of weightStrategyExplanation) {
        //   nextLineY += 5;
        // }


        // disclaimer accuracy regarding coverage type --> always insecure. best guess based on selected coverage type

        doc.autoTable({
          head: [['Eingangsdaten', 'Name', 'Zeitschnitt']],
          body: [
            ["Punktdatensatz", reachabilityScenario.poiDataset.poiName, reachabilityScenario.poiDataset.poiDate],
            ["Indikator", indicatorStatistic.indicator.indicatorName + " [ " + indicatorStatistic.indicator.unit + " ]" + "\n - \n" + indicatorStatistic.spatialUnit.spatialUnitName, indicatorStatistic.timestamp]
          ],
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: nextLineY
        });

        doc.autoTable({
          head: [['Gewichtungstyp', 'Hinweis zu Berechnung']],
          body: [
            [weightStrategyText, weightStrategyExplanationText],
          ],
          theme: 'grid',
          headStyles: headStyles,
          bodyStyles: bodyStyles,
          startY: doc.autoTable.previous.finalY + 5,
        });

        nextLineY = doc.autoTable.previous.finalY + 5;

        // SECTION LINE
        doc.line(initX, nextLineY, 180, nextLineY, null);

        nextLineY += 5;

        // TOTAL COVERAGE
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

      this.generateFeatureCoverageSection_focusPoiCoverage = async function (doc, indicatorStatistic) {

        doc.addPage();

        
        return doc;
      };

      this.generateCoverageDataTableSection_focusPoiCoverage = async function (doc, indicatorStatistic) {

        return doc;
      };

    }]);
