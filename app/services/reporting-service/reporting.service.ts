import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

export interface ReportingData {
  workflowState: WorkflowState;
  selectedTemplateId: number;
}

export enum WorkflowState {
  workflowSelect,
  templateSelect
}

@Injectable({
  providedIn: 'root'
})
export class ReportingService {

  default:ReportingData = {
    workflowState: WorkflowState.workflowSelect,
    selectedTemplateId: 0
  }

  generalSettings = {
    creator: "M. Mustermann",
    commune: "Testkommune",
    communeLogo: "",
    creationDate: this.getCurrentDate(),
    freeText: "Text",
  };
  
  availableTemplateCategories = [
    {
      id: 1,
      displayName: "Zeitpunkt",
    },
    {
      id: 2,
      displayName: "Zeitserie",
    },
    {
      id: 3,
      displayName: "Erreichbarkeit",
    }
  ];

  
  reportingDefaultTemplatePageElements = [
    {
      "type": "indicatorTitle-landscape",
      "dimensions": {
        "top": "15px",
        "left": "15px",
        "width": "720px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Titel des Indikators [Einheit]",
      "text": "",
      "css": "text-align: left; padding-left: 5px; font-weight: bold;"
    },
    {
      "type": "indicatorTitle-portrait",
      "dimensions": {
        "top": "15px",
        "left": "15px",
        "width": "470px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Titel des Indikators [Einheit]",
      "text": "",
      "css": "text-align: left; padding-left: 5px; font-weight: bold;"
    },
    {
      "type": "dataTimestamp-landscape",
      "dimensions": {
        "top": "50px",
        "left": "15px",
        "width": "720px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Datenstand",
      "text": "",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "dataTimestamp-portrait",
      "dimensions": {
        "top": "50px",
        "left": "15px",
        "width": "470px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Datenstand",
      "text": "",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "dataTimeseries-landscape",
      "dimensions": {
        "top": "50px",
        "left": "15px",
        "width": "720px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Zeitreihe von - bis",
      "text": "",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "dataTimeseries-portrait",
      "dimensions": {
        "top": "50px",
        "left": "15px",
        "width": "470px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Zeitreihe von - bis",
      "text": "",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "reachability-subtitle-landscape",
      "dimensions": {
        "top": "50px",
        "left": "15px",
        "width": "720px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Aktueller Datenstand, Fortbewegungsmittel, [Indikator]",
      "text": "",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "reachability-subtitle-portrait",
      "dimensions": {
        "top": "50px",
        "left": "15px",
        "width": "470px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Aktueller Datenstand, Fortbewegungsmittel, [Indikator]",
      "text": "",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "communeLogo-landscape",
      "dimensions": {
        "top": "15px",
        "left": "740px",
        "width": "75px",
        "height": "65px"
      },
      "isPlaceholder": true,
      "placeholderText": "Logo",
      "src": ""
    },
    {
      "type": "communeLogo-portrait",
      "dimensions": {
        "top": "15px",
        "left": "490px",
        "width": "75px",
        "height": "65px"
      },
      "isPlaceholder": true,
      "placeholderText": "Logo",
      "src": ""
    },
    {
      "type": "footerHorizontalSpacer-landscape",
      "dimensions": {
        "top": "535px",
        "left": "15px",
        "width": "800px",
        "height": "0px"
      },
      "css": "border-top: solid rgb(148, 148, 148) 1px;"
    },
    {
      "type": "footerHorizontalSpacer-portrait",
      "dimensions": {
        "top": "750px",
        "left": "15px",
        "width": "550px",
        "height": "0px"
      },
      "css": "border-top: solid rgb(148, 148, 148) 1px;"
    },

    {
      "type": "footerCreationInfo-landscape",
      "dimensions": {
        "top": "545px",
        "left": "15px",
        "width": "720px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Erstellt am [Datum] von [Name d. Bearbeiters], [Name d. Kommune]",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "footerCreationInfo-portrait",
      "dimensions": {
        "top": "760px",
        "left": "15px",
        "width": "470px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "Erstellt am [Datum] von [Name d. Bearbeiters], [Name d. Kommune]",
      "css": "text-align: left; padding-left: 5px;"
    },
    {
      "type": "pageNumber-landscape",
      "dimensions": {
        "top": "545px",
        "left": "740px",
        "width": "75px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "[Seitenzahl]",
      "css": "text-align: right; padding-right: 5px;"
    },
    {
      "type": "pageNumber-portrait",
      "dimensions": {
        "top": "760px",
        "left": "490px",
        "width": "75px",
        "height": "30px"
      },
      "isPlaceholder": true,
      "placeholderText": "[Seitenzahl]",
      "css": "text-align: right; padding-right: 5px;"
    }
  ];

  // A basic version of the templates.
  // These are not full-fledged templates yet, but they can serve as a starting point and are adjusted according to user choices dynamically.
  availableTemplates = [
    {
      "name": "A4-landscape-timestamp",
      "displayName": "DIN A4, Querformat",
      "categoryId": 1,
      "orientation" : "landscape",
      "pages": [
        {
          "type": "map_overview_unclassified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_unclassified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_classified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_classified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "barchart_overview",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "barchart_overview",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "datatable",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_unclassified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_unclassified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_classified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_classified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "barchart_overview",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "barchart_overview",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "datatable",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_unclassified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_unclassified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_classified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_classified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "linechart_overview",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "linechart_overview",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "boxplot_overview",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "boxplot_overview",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "datatable",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_unclassified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_unclassified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimestamp-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_classified",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_classified",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "linechart_overview",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "linechart_overview",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "boxplot_overview",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "boxplot_overview",
          "orientation": "landscape",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-landscape"),
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "datatable",
          "orientation": "portrait",
          "pageElements": [

            this.getDefaultReportingTemplatePageElement("indicatorTitle-portrait"),
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("dataTimeseries-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_reachability",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "map_overview_reachability",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),
            
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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),
            
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
          "type": "map_overview_reachability",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),

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
          "type": "map_overview_reachability",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),

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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-portrait"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-portrait"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-portrait"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-portrait"),
            this.getDefaultReportingTemplatePageElement("pageNumber-portrait"),
            
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
          "type": "area_specific",
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
            this.getDefaultReportingTemplatePageElement("communeLogo-landscape"),
            this.getDefaultReportingTemplatePageElement("reachability-subtitle-landscape"),
            this.getDefaultReportingTemplatePageElement("footerHorizontalSpacer-landscape"),
            this.getDefaultReportingTemplatePageElement("footerCreationInfo-landscape"),
            this.getDefaultReportingTemplatePageElement("pageNumber-landscape"),
            
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
  ];

  selectedTemplate:any = this.availableTemplates[0];

  private _reportingData$ = new BehaviorSubject<ReportingData>(this.default);

  // nach außen NUR Observable
  reportingData$: Observable<ReportingData> = this._reportingData$.asObservable();

  constructor(
    private dataExchangeService: DataExchangeService
  ) {}

  setValue(val: ReportingData) {
    this._reportingData$.next(val);
  }

  changeWorkflowState(state: WorkflowState) {
    this.setValue({...this._reportingData$.value, workflowState: state});
  }
  
  get currentValue(): ReportingData {
    return this._reportingData$.value;
  }

  get currentWorkflowState(): WorkflowState {
    return this._reportingData$.value.workflowState;
  }

  // Format: YYYY-MM-DD
  getCurrentDate() {
    let now = new Date();
    const offset = now.getTimezoneOffset()
    now = new Date(now.getTime() - (offset*60*1000))
    return now.toISOString().split('T')[0]
  }

  getDefaultReportingTemplatePageElement(type) {
    let result = this.reportingDefaultTemplatePageElements.filter((el) => {
      return el.type === type;
    });
    if(typeof(result) === "undefined") {
      throw "No DefaultReportingTemplatePageElement exists for type " + type + "."
    } else {
      return result[0];
    }
  }
}
