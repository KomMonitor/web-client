import { Component, inject, Input, OnInit } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as echarts from 'echarts';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { LeafletScreenshotCacheHelperService } from 'services/leaflet-screenshot-cache-helper-service/leaflet-screenshot-cache-helper.service';
import * as docx from 'docx';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import pptxgen  from 'pptxgenjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { reportingData } from '../reporting-modal.component';
import { ConfigData, ReportingService } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-generate-report',
  standalone: true,
  templateUrl: './generate-report.component.html',
  styleUrls: ['./generate-report.component.css']
})
export class GenerateReportComponent implements OnInit {

  activeModal = inject(NgbActiveModal);
  
  @Input() data!:reportingData;

  loadingData = false;
  
  deviceScreenDpi;
  echartsImgPixelRatio = 2;
  pxPerMilli;

  constructor(
    private dataExchangeService: DataExchangeService,
    private leafletScreenshotHelperService: LeafletScreenshotCacheHelperService,
    private broadcastService: BroadcastService,
    protected reportingService: ReportingService
  ) {}

  ngOnInit(): void {

    this.deviceScreenDpi = this.calculateScreenDpi();
    this.pxPerMilli = this.deviceScreenDpi / 25.4 // /2.54 --> cm, /10 --> mm
  }

  
  calculateScreenDpi() {
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

  //async
  async generateReport(format) {

    this.setLoadingScreen();

    try {
      format === "pdf" && await this.generatePdfReport();
      format === "docx" && await this.generateWordReport();
      format === "zip" && await this.generateZipFolder();
      format === "pptx" && await this.generatePptxReport();

      this.unsetLoadingScreen();
    } catch (error:any) {
      console.error(error);
      this.dataExchangeService.displayMapApplicationError(error.message);
      this.unsetLoadingScreen();
    }
  }

  setLoadingScreen() {
    this.broadcastService.broadcast('reportGenerationInProgress');
    this.activeModal.close();
  }

  unsetLoadingScreen() {
    this.broadcastService.broadcast('reportGenerationCompleted');
  }

  async generatePptxReport() {

    let doc:any = new pptxgen();

    doc.defineLayout({ name:'A4-landscape', width:29.7, height:21 });
    doc.defineLayout({ name:'A4-portrait', width:21, height:29.7 });

    doc.layout = 'A4-'+this.reportingService.workingTemplate.pages[0].orientation;

    var fontSize = 42;
    var fontFace = "Source Sans Pro";

    // Font setting
    doc.theme = { headFontFace: fontFace };
    doc.theme = { bodyFontFace: fontFace };

    // Master slide def
    doc.defineSlideMaster({
      title: "TEMPLATE_SLIDE",
      background: { color: "FFFFFF" },
      objects: [
        { // title
          placeholder: {
            options: { 
              name: "slide_title", 
              type: "title", 
              w: "80%", 
              h: 1, 
              bold: true, 
              align: "left",
              fontSize: fontSize,
              fontFace: fontFace
            },
            text: "(page_title)",
          },
        },
        { // subtitle
          placeholder: {
            options: { 
              name: "slide_subtitle", 
              type: "title", 
              w: "80%", 
              h: 1, 
              align: "left",
              fontSize: fontSize,
              fontFace: fontFace
            },
            text: "(page_subtitle)",
          },
        },
        { // footer
          placeholder: {
            options: { 
              name: "slide_footer", 
              type: "title", 
              w: "80%", 
              h: 1, 
              align: "left",
              fontSize: fontSize,
              fontFace: fontFace
            },
            text: "(page_subtitle)",
          },
        },
        { // "Seite" - text
          placeholder: {
            options: { 
              name: "slide_pageNumber", 
              type: "title", 
              w: 3, 
              h: 1, 
              align: "left",
              fontSize: fontSize,
              fontFace: fontFace
            },
            text: "(page_pageNumber)",
          }
        },
      ] 
    });


    // 2. Add a Slide to the presentation
    let slide = doc.addSlide({ masterName: "TEMPLATE_SLIDE" });
    // 3. Add 1+ objects (Tables, Shapes, etc.) to the Slide
    slide.addText("Einwohner [Anzahl]", { placeholder: "slide_title" });
    slide.addText("2022-12-31", { placeholder: "slide_subtitle" });
    slide.addText("Erstellt am 2022-12-31 von M.Mustermann, Testkommune", { placeholder: "slide_footer" });


    // Pages

    for(let [idx, page] of this.reportingService.workingTemplate.pages.entries()) {

      if(!this.showThisPage(page)) {
        continue;
      }

      // 2. Add a Slide to the presentation
      let slide = doc.addSlide({ masterName: "TEMPLATE_SLIDE" });

      let formatFactor = 3.4;

      let pageConfig:ConfigData = page.templateSection.pageConfig;

      let pageDom:any = document.querySelector("#reporting-overview-page-" + idx);
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

        let pageElementDimensions:any = {}
        pageElementDimensions.top = pageElement.dimensions.top && this.pxToInch(pageElement.dimensions.top)*formatFactor;
        pageElementDimensions.bottom = pageElement.dimensions.bottom && this.pxToInch(pageElement.dimensions.bottom)*formatFactor;
        pageElementDimensions.left = pageElement.dimensions.left && this.pxToInch(pageElement.dimensions.left)*formatFactor;
        pageElementDimensions.right = pageElement.dimensions.right && this.pxToInch(pageElement.dimensions.right)*formatFactor;
        pageElementDimensions.width = pageElement.dimensions.width && this.pxToInch(pageElement.dimensions.width)*formatFactor;
        pageElementDimensions.height = pageElement.dimensions.height && this.pxToInch(pageElement.dimensions.height)*formatFactor;

        switch(pageElement.type) {
          case "indicatorTitle-landscape":
          case "indicatorTitle-portrait": {
            if (! pageConfig.headerFooterControl.showTitle){
              // skip
              continue;
            }
                    slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_title" });
            break;
          }

          case "communeLogo-landscape":
          case "communeLogo-portrait": {
            if (! pageConfig.headerFooterControl.showLogo){
              // skip
              continue;
            }
            if(pageElement.src && pageElement.src.length) {

              let img = new Image();
              img.src = pageElement.src;
              let imageWidth = img.width;
              let imageHeight = img.height;

              // create an image in width/size of the uploaded one (img object). Then shrink it down to pageElementDimensions, while containing imgRatio
              slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: imageWidth, h: imageHeight, path: pageElement.src, sizing: { type: "contain", w: pageElementDimensions.width, h: pageElementDimensions.height}});
            }
            break;
          }
          case "dataTimestamp-landscape":
          case "dataTimestamp-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_subtitle" });
            break;
          }
          case "dataTimeseries-landscape":
          case "dataTimeseries-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, fontSize: fontSize-3, fontFace: fontFace });
            break;
          }
          case "reachability-subtitle-landscape":
          case "reachability-subtitle-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, fontSize: fontSize-3, fontFace: fontFace });
            break;
          }
          case "footerHorizontalSpacer-landscape":
          case "footerHorizontalSpacer-portrait": {
            if (! pageConfig.headerFooterControl.showFooterCreationInfo){
              // skip
              continue;
            }
            slide.addShape(doc.shapes.LINE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: 0.0, line: { color: '#000000', width: 1 } });
            break;
          }
          case "footerCreationInfo-landscape":
          case "footerCreationInfo-portrait": {  
            if (! pageConfig.headerFooterControl.showFooterCreationInfo){
              // skip
              continue;								
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_footer" });
            break;
          } 
          case "pageNumber-landscape":
          case "pageNumber-portrait": {
            if (! pageConfig.headerFooterControl.showPageNumber){
              // skip
              continue;
            }
            let text = "Seite " + this.getPageNumber(idx);
            slide.addText(text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_pageNumber" });
            break;
          }
          // template-specific elements
          case "map": {
            let instance:any = echarts.getInstanceByDom(pElementDom)
            let imageDataUrl = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
            imageDataUrl = await this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)

            slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: imageDataUrl});
            break;
          }
          // case "mapLegend" can be ignored since it is included in the map if needed
            
            //June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
          
    // 			case "overallAverage":
    // 			case "selectionAverage": {
    // 				let avgType = pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion"
    // 				let text = "Durchschnitt\n" + avgType + ":\n" + pageElement.text.toString();

        //     slide.addShape(doc.shapes.RECTANGLE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, line: { color: '#000000', width: 1 } });
          //   slide.addText(text, { x: pageElementDimensions.left+0.1, y: pageElementDimensions.top+1, fontSize: fontSize-3, fontFace: fontFace });
    // 				break;
    // 			}
    // 			case "overallChange":
    // 			case "selectionChange": {
    // 				let changeType = pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion"
    // 				let text = "Durchschnittliche\nVeränderung\n" + changeType + ":\n" + pageElement.text.toString();

        //     slide.addShape(doc.shapes.RECTANGLE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, line: { color: '#000000', width: 1 } });
          //   slide.addText(text, { x: pageElementDimensions.left+0.1, y: pageElementDimensions.top+1.4, fontSize: fontSize-3, fontFace: fontFace });
    // 				break;
    // 			}
          case "barchart": {
            if(page.type == 'area_specific' && ! pageConfig.sectionContentControl.showRankingChartPerArea){
              continue;
            }
            let instance:any = echarts.getInstanceByDom(pElementDom);
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} );

            slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: base64String});
            break;
          }
          case "linechart": {
            if(page.type == 'area_specific' && ! pageConfig.sectionContentControl.showLineChartPerArea){
              continue;
            }
            let instance:any = echarts.getInstanceByDom(pElementDom);
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} );

            slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: base64String});
            break;
          }
          case "textInput": {
            if (! pageConfig.sectionContentControl.showFreeText){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, fontSize: fontSize-3, fontFace: fontFace });
            break;
          }
          case "datatable": {							

            let table = document.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type + " table") as HTMLTableElement;;

            let data:any = [];
            if(table && table.rows.length>0) {
              Array.from(table.rows).forEach((row, rowIndex) => {

                let singleRowData:any[] = [];
                if(row.cells && row.cells.length>0) {
                  Array.from(row.cells).forEach((cell, cellIndex) => {

                    let fillColour = '#dedede';
                    if(rowIndex>0) {
                      if(rowIndex% 2 == 0)
                        fillColour = '#ffffff';
                      else
                        fillColour = '#f9f9f9';
                    }

                    singleRowData.push({
                      text: cell.innerHTML,
                      options: {
                        align: ((cellIndex==1 && rowIndex>0)?'right':'left'),
                        fontFace: fontFace,
                        fontSize: fontSize-3,
                        bold: ((rowIndex>0)?false:true),
                        fill: fillColour
                      }});
                  });
                  data.push(singleRowData);
                }
              });
            }

            slide.addTable(data, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, rowH: 1, align: "left", border: { pt: "1", color: "#d6d6d6" }});
            break;
          } 
        }
      }
    }
    // pages end

    // 4. Save the Presentation

    let now:any = this.getCurrentDateAndTime();
    doc.writeFile({ fileName: now + "_KomMonitor-Report.pptx" });
    this.loadingData = false;
  }

  filterPagesToShow() {
    let pagesToShow:any[] = [];
    let skipNextPage = false;
    for (let i = 0; i < this.reportingService.workingTemplate.pages.length; i ++) {
      let page = this.reportingService.workingTemplate.pages[i];
      if (this.pageContainsDatatable(i)) {
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

  pageContainsDatatable(pageID) {
    let page = this.reportingService.workingTemplate.pages[pageID];
    let pageContainsDatatable = false;
    for(let pageElement of page.pageElements) {
      if(pageElement.type == "datatable") {
        pageContainsDatatable = true;
      }
    }
    return pageContainsDatatable;
  }

  showThisPage(page) {
    
    if (page.hidden){
      return false;
    }
    let pageWillBeShown = false;
    for(let visiblePage of this.filterPagesToShow()){
      if(visiblePage == page) {
        pageWillBeShown = true;
      }
    }
    return pageWillBeShown;
  }

  async generatePdfReport() {
   
		// create pdf document
    let doc:any = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: this.reportingService.workingTemplate.pages[0].orientation
    });
 
    let fontName = "Helvetica"; // standard

    // todo
   /*  if(this.customFontFile) {
      fontName = 'CustomInternal';
      doc.addFont(this.customFontFile, fontName, 'normal');
    } */

    // external working as well, but unable to check for validity beforehand. Thus resulting in an critical error if invalid at rendering 

    
    doc.setDrawColor(148, 148, 148);
    doc.setFont(fontName, "normal", "normal"); 
    
    for(let [idx, page] of this.reportingService.workingTemplate.pages.entries()) {

      if(!this.showThisPage(page)) {
        continue;
      }

      if(idx > 0) {
        doc.addPage(null, page.orientation);
      }

      let pageConfig:ConfigData = page.templateSection.pageConfig;
      
      let pageDom:any = document.querySelector("#reporting-overview-page-" + idx);
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
        let pageElementDimensions:any = {}
        pageElementDimensions.top = pageElement.dimensions.top && this.pxToMilli(pageElement.dimensions.top);
        pageElementDimensions.bottom = pageElement.dimensions.bottom && this.pxToMilli(pageElement.dimensions.bottom);
        pageElementDimensions.left = pageElement.dimensions.left && this.pxToMilli(pageElement.dimensions.left);
        pageElementDimensions.right = pageElement.dimensions.right && this.pxToMilli(pageElement.dimensions.right);
        pageElementDimensions.width = pageElement.dimensions.width && this.pxToMilli(pageElement.dimensions.width);
        pageElementDimensions.height = pageElement.dimensions.height && this.pxToMilli(pageElement.dimensions.height);
        // TODO some cases could be merged, but it's better to do that later when stuff works
        switch(pageElement.type) {
          case "indicatorTitle-landscape":
          case "indicatorTitle-portrait": {
            if (! pageConfig.headerFooterControl.showTitle){
              // skip
              continue;
            }
            // Css takes the top-left edge of the element by default.
            // doc.text takes left-bottom, so we ass baseline "top" to achieve the same behavior in jspdf.
            doc.setFont(fontName, "normal", "normal")
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" });
            doc.setFont(fontName, "normal", "normal")
            break;
          }
          case "communeLogo-landscape":
          case "communeLogo-portrait": {
            if (! pageConfig.headerFooterControl.showLogo){
              // skip
              continue;
            }
            // only add logo if one was selected
            if(pageElement.src && pageElement.src.length) {
              doc.addImage(pageElement.src, "JPEG", pageElementDimensions.left, pageElementDimensions.top,
                pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
            }
            break;
          }
          case "dataTimestamp-landscape":
          case "dataTimestamp-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "dataTimeseries-landscape":
          case "dataTimeseries-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "reachability-subtitle-landscape":
          case "reachability-subtitle-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "footerHorizontalSpacer-landscape":
          case "footerHorizontalSpacer-portrait": {
            if (! pageConfig.headerFooterControl.showFooterCreationInfo){
              // skip
              continue;
            }
            let x1, x2, y1, y2;
            x1 = pageElementDimensions.left;
            x2 = pageElementDimensions.left + pageElementDimensions.width;
            y1 = pageElementDimensions.top;
            y2 = pageElementDimensions.top;
            doc.line(x1, y1, x2, y2);
            break;
          }
          case "footerCreationInfo-landscape":
          case "footerCreationInfo-portrait": {
            if (! pageConfig.headerFooterControl.showFooterCreationInfo){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "pageNumber-landscape":
          case "pageNumber-portrait": {
            if (! pageConfig.headerFooterControl.showPageNumber){
              // skip
              continue;
            }
            let text = "Seite " + this.getPageNumber(idx);
            doc.text(text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          // template-specific elements
          case "map": {
            let instance:any = echarts.getInstanceByDom(pElementDom)
            let imageDataUrl = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
            imageDataUrl = await this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)

            doc.addImage(imageDataUrl, "PNG", pageElementDimensions.left, pageElementDimensions.top,
              pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
            break;
          }
          // case "mapLegend" can be ignored since it is included in the map if needed
            
            //June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
          
          // case "overallAverage":
          // case "selectionAverage": {
          // 	let x, y, width, height;
          // 	x = pageElementDimensions.left;
          // 	y = pageElementDimensions.top;
          // 	width = pageElementDimensions.width;
          // 	height = pageElementDimensions.height;
          // 	doc.rect(x, y, width, height);
          // 	let avgType = pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion"
          // 	let text = "Durchschnitt\n" + avgType + ":\n" + pageElement.text.toString()
          // 	doc.text(text, pageElementDimensions.left + pxToMilli(5), pageElementDimensions.top + pxToMilli(5), { baseline: "top" });
          // 	break;
          // }
          // case "overallChange":
          // case "selectionChange": {
          // 	let x = pageElementDimensions.left;
          // 	let y = pageElementDimensions.top;
          // 	let width = pageElementDimensions.width;
          // 	let height = pageElementDimensions.height;
          // 	doc.rect(x, y, width, height);
          // 	let changeType = pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion"
          // 	let text = "Durchschnittliche\nVeränderung\n" + changeType + ":\n" + pageElement.text.toString()
          // 	doc.text(text, x + pxToMilli(5), y + pxToMilli(5), { baseline: "top" });
          // 	break;
          // }
          case "barchart": {
            if(page.type == 'area_specific' && ! pageConfig.sectionContentControl.showRankingChartPerArea){
              continue;
            }
            let instance:any = echarts.getInstanceByDom(pElementDom)
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
            doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
                pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
            break;
          }
          case "linechart": {
            if(page.type == 'area_specific' && ! pageConfig.sectionContentControl.showLineChartPerArea){
              continue;
            }
            let instance:any = echarts.getInstanceByDom(pElementDom)
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
            doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
                pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
            break;
          }
          case "textInput": {
            if (! pageConfig.sectionContentControl.showFreeText){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, {
              baseline: "top",
              maxWidth: pageElementDimensions.width
            })
            break;
          }
          case "datatable": {
            autoTable(doc,{
              html: "#reporting-overview-page-" + idx + "-" + pageElement.type + " table",
              startY: pageElementDimensions.top,
              tableWidth: "wrap",
              margin: {left: pageElementDimensions.left},
              theme: "grid",
              //headStyles: {
              //	fillColor: false, // transparent
              //	textColor: [0, 0, 0],
              //}
            });
            break;
          }
        }
      }
    }

    //doc.output("dataurlnewwindow")
    let now = this.getCurrentDateAndTime();
    doc.save(now + "_KomMonitor-Report.pdf");
    this.loadingData = false;
  }

  async createLeafletEChartsMapImage(page, pageDom, pageElement, echartsImgSrc) {
    let result;
    // screenshot leaflet map and merge it with echarts image
    // remove page offset temporarily 
    pageElement.leafletMap.getContainer().style.top = "0px"
    pageElement.leafletMap.getContainer().style.left = "0px"

    // wait for print process to finish
    // var node = document.getElementById(pageDom);
    var node = pageElement.leafletMap["_container"];

    
      //here we must check if the corresponding leaflet image has already been created and stored within cache
      //if not or it's too old, recreate it
      //if yes, simply use it to save a lot of time during report generation!
    
    let leafletMapScreenshot = this.leafletScreenshotHelperService.getResourceFromCache(pageElement.selectedBaseMap.layerConfig.name, page.spatialUnitId, page.spatialUnitFeatureId, page.orientation);
    // let leafletMapScreenshot = await domtoimage
          //   .toJpeg(node, { quality: 1.0 })
          //   .then(function (dataUrl) {
          //     return dataUrl;
          //   })
          //   .catch(function (error) {
          //       console.error('oops, something went wrong!', error);
          //   });

    pageElement.leafletMap.getContainer().style.top = "90px"
    pageElement.leafletMap.getContainer().style.left = "15px"
    
    // combine images
    let canvas = document.createElement('canvas');
    let ctx:any = canvas.getContext('2d', {
      willReadFrequently: true
      });
    let pageElementDimensionsPx = this.calculateDimensions(pageElement.dimensions, "px");
    canvas.width = pageElementDimensionsPx.width;
    canvas.height =  pageElementDimensionsPx.height;
    // we have to draw layers in order
    let leafletMapImg = new Image();
    // leafletMapImg.crossOrigin = "anonymous";
    leafletMapImg.width = canvas.width;
    leafletMapImg.height = canvas.height;
    let leafletMapImgDrawn = new Promise<void>((resolve, reject) => {
      leafletMapImg.onload = function() {
        ctx.drawImage(leafletMapImg, 0, 0, canvas.width, canvas.height);
        resolve();
      }
    });
    leafletMapImg.src = leafletMapScreenshot;
    
    await leafletMapImgDrawn;

    let echartsImg = new Image();
    // echartsImg.crossOrigin = "anonymous";
    let echartsImgDrawn = new Promise<void>((resolve, reject) => {
      echartsImg.onload = function() {
        ctx.drawImage(echartsImg, 0, 0, canvas.width, canvas.height);
        resolve();
      }
    });
    echartsImg.src = echartsImgSrc;
    await echartsImgDrawn

    let mapAttributionImg = pageDom.querySelector(".map-attribution > img");
    ctx.fillStyle = "white";
    ctx.fillRect(0, canvas.height - mapAttributionImg.height, mapAttributionImg.width, mapAttributionImg.height)
    ctx.drawImage(mapAttributionImg, 0, canvas.height - mapAttributionImg.height);
    let mapLegendImg = pageDom.querySelector(".map-legend > img")
    if(mapLegendImg){
      ctx.fillRect(canvas.width - mapLegendImg.width, canvas.height - mapLegendImg.height, mapLegendImg.width, mapLegendImg.height)
      ctx.drawImage(mapLegendImg, canvas.width - mapLegendImg.width, canvas.height - mapLegendImg.height);
    }		
    result = canvas.toDataURL();
    return result;
  }

  getCurrentDateAndTime() {
    let date:any = new Date();
    let year = date.getFullYear().toString();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let time = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let now = "".concat(year, "-", month, "-", day, "_", time, "-", minutes, "-", seconds);
    return now;
  }

  getPageNumber(index) {
    let pageNumber = 1;
    for(let i = 0; i < index; i ++) {
      if (this.showThisPage(this.reportingService.workingTemplate.pages[i])) {
        pageNumber ++;
      }
    }
    return pageNumber;
  }

  pxToMilli(px) {
    // our preview is 830px wide
    // px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
    // This is the short version of:
    // px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
    // pxPerMillimeter cancels out there, so it doesn't matter.
    let result = parseInt(px, 10) / 830 * 297;
    result = Math.round(result * 100) / 100;
    return result;
  }

  calculateDimensions(dimensions, unit) {
    let result:any = {};
    if(unit === "px") {
      // also scale our 830px preview up to A4 here
      let scalefactor = this.pxPerMilli*297 / 830
      result.top = dimensions.top && parseInt(dimensions.top, 10) * scalefactor;
      result.bottom = dimensions.bottom && parseInt(dimensions.bottom, 10) * scalefactor;
      result.left = dimensions.left && parseInt(dimensions.left, 10) * scalefactor;
      result.right = dimensions.right && parseInt(dimensions.right, 10) * scalefactor;
      result.width = dimensions.width && parseInt(dimensions.width, 10) * scalefactor;
      result.height = dimensions.height && parseInt(dimensions.height, 10) * scalefactor;
    }
    if(unit === "milli") {
      result.top = dimensions.top && this.pxToMilli(dimensions.top);
      result.bottom = dimensions.bottom && this.pxToMilli(dimensions.bottom);
      result.left = dimensions.left && this.pxToMilli(dimensions.left);
      result.right = dimensions.right && this.pxToMilli(dimensions.right);
      result.width = dimensions.width && this.pxToMilli(dimensions.width);
      result.height = dimensions.height && this.pxToMilli(dimensions.height);
    }
    if(unit === "twip") {
      result.top = dimensions.top && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.top));
      result.bottom = dimensions.bottom && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.bottom));
      result.left = dimensions.left && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.left));
      result.right = dimensions.right && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.right));
      result.width = dimensions.width && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.width));
      result.height = dimensions.height && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.height));
    }
    if(unit === "emu") {
      result.top = dimensions.top && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.top)));
      result.bottom = dimensions.bottom && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.bottom)));
      result.left = dimensions.left && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.left)));
      result.right = dimensions.right && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.right)));
      result.width = dimensions.width && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.width)));
      result.height = dimensions.height && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.height)));
    }
    return result;
  }

  twipToEmus(value) {
    // see: https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/
    return value * 635;
  }
  
  async generateZipFolder() {
  	// creates a zip folder containing all echarts files
    let zip = new JSZip();
    
    // screenshot map attribution and legend only once per section
    for(let [idx, page] of this.reportingService.workingTemplate.pages.entries()) {
    
      if(!this.showThisPage(page)) {
        continue;
      }

      let pageDom:any = document.querySelector("#reporting-overview-page-" + idx);
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
          let instance:any = echarts.getInstanceByDom(pElementDom);
          let imageDataUrl = instance.getDataURL({
            type: "png",
            pixelRatio: this.echartsImgPixelRatio
          });

          if(pageElement.type === "map")
            imageDataUrl = await this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)
          
          let filename = "Seite_" + (idx+1) + "_" + pageElement.type + ".png";
          if(pageElement.type === "linechart" && pageElement.showPercentageChangeToPrevTimestamp) {
            // two elements with same type on one page
            // use a different filename for one of them so we don't overwrite the other image
            filename = filename.replace(".png", "-proz.Veraenderung.png"); 
          }
            
          zip.file(filename, this.dataURItoBlob2(imageDataUrl));
        }
      }
    }

    let zipFileName = this.getCurrentDateAndTime() + "_Kommonitor-Report-Grafiken";
    zip.generateAsync({type:"blob"}).then((content) => {
      saveAs(content, zipFileName + ".zip");
      this.loadingData = false;
      /* setTimeout(function(){
        this.$digest();
      }); */
    });
  }

  async generateWordReport() {
    // see docx documentation for more info about the format:
    // https://docx.js.org/#/?id=basic-usage

    let sections:any[] = [];

    let font = "Calibri";
    // todo
    /* if(this.customFontFamily!=undefined) {
      font = this.customFontFamily.replace(/['"]+/g,'');
    } */
    for(let [idx, page] of this.reportingService.workingTemplate.pages.entries()) {

      if(!this.showThisPage(page)) {
        continue;
      }
 
      let pageConfig:ConfigData = page.templateSection.pageConfig;

      let paragraphs:any = [];
      let pageDom:any = document.querySelector("#reporting-overview-page-" + idx);
      for(let pageElement of page.pageElements) {

        let pageElementDimensionsPx = this.calculateDimensions(pageElement.dimensions, "px");
        let pageElementDimensionsTwip = this.calculateDimensions(pageElement.dimensions, "twip");
        let pageElementDimensionsEmu = this.calculateDimensions(pageElement.dimensions, "emu");

        switch(pageElement.type) {
          case "indicatorTitle-landscape":
          case "indicatorTitle-portrait": {
            if (! pageConfig.headerFooterControl.showTitle){
              // skip
              continue;
            }
            let paragraph = new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: pageElement.text,
                  bold: true,
                  font: font,
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
          case "communeLogo-landscape":
          case "communeLogo-portrait": {
            if (! pageConfig.headerFooterControl.showLogo){
              // skip
              continue;
            }
            // only add logo if one was selected
            if(pageElement.src && pageElement.src.length) {
              let paragraph = new docx.Paragraph({
                children: [
                  new docx.ImageRun({
                    data: this.dataURItoBlob(pageElement.src),
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
          case "dataTimeseries-landscape":
          case "reachability-subtitle-landscape":
          case "dataTimestamp-portrait":
          case "dataTimeseries-portrait":
          case "reachability-subtitle-portrait": {
            if (! pageConfig.headerFooterControl.showSubtitle){
              // skip
              continue;
            }
            let paragraph = new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: pageElement.text,
                  font: font,
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
          case "footerHorizontalSpacer-portrait":
            if (! pageConfig.headerFooterControl.showFooterCreationInfo){
              // skip
              continue;
            }
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
          case "footerCreationInfo-landscape":
          case "footerCreationInfo-portrait": {
            if (! pageConfig.headerFooterControl.showFooterCreationInfo){
              // skip
              continue;
            }

            let paragraph = new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: pageElement.text,
                  font: font,
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
          case "pageNumber-landscape":
          case "pageNumber-portrait": {
            if (! pageConfig.headerFooterControl.showPageNumber){
              // skip
              continue;
            }
            let paragraph = new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: "Seite " + this.getPageNumber(idx),
                  font: font,
                  size: 32  // 16pt
                }),
                new docx.TextRun({
                  break: 1, // Seitenumbruch
                }),
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
            if(page.type == 'area_specific' && ! pageConfig.sectionContentControl.showLineChartPerArea && pageElement.type === "linechart" ){
              continue;
            }
            if(page.type == 'area_specific' && ! pageConfig.sectionContentControl.showRankingChartPerArea && pageElement.type === "barchart" ){
              continue;
            }
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
            let instance:any = echarts.getInstanceByDom(pElementDom);
            let imageDataUrl = instance.getDataURL({
              type: "png",
              pixelRatio: this.echartsImgPixelRatio
                });	

            if(pageElement.type === "map"){
              imageDataUrl = await this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)
            }
            

            let blob = this.dataURItoBlob(imageDataUrl);

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
            
            //June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
          
          // case "overallAverage":
          // case "selectionAverage": {
          // 	let paragraph = new docx.Paragraph({
          // 		children: [
          // 			new docx.TextRun({
          // 				text: "Durchschnitt",
          // 				font: font,
          // 				size: 28  // 14pt
          // 			}),
          // 			new docx.TextRun({
          // 				text: pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion",
          // 				size: 28,
          // 				font: font,
          // 				break: 1,  // 14pt
          // 			}),
          // 			new docx.TextRun({
          // 				text: pageElement.text.toString(),
          // 				size: 28,
          // 				font: font,
          // 				break: 1  // 14pt
          // 			})
          // 		],
          // 		frame: {
          // 			position: {
          // 				x: pageElementDimensionsTwip.left,
          // 				y: pageElementDimensionsTwip.top,
          // 			},
          // 			width: pageElementDimensionsTwip.width,
          // 			height: pageElementDimensionsTwip.height,
          // 			anchor: {
          // 				horizontal: docx.FrameAnchorType.MARGIN,
          // 				vertical: docx.FrameAnchorType.MARGIN,
          // 			},
          // 			alignment: {
          // 				x: docx.HorizontalPositionAlign.LEFT,
          // 				y: docx.VerticalPositionAlign.TOP,
          // 			}
          // 		},
          // 		border: {
          // 			top: {
          // 				color: "#949494", // gray
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 			right: {
          // 				color: "#949494",
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 			bottom: {
          // 				color: "#949494",
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 			left: {
          // 				color: "#949494",
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 		}
          // 	});
            
          // 	paragraphs.push(paragraph);
          // 	break;
          // }
          // case "overallChange":
          // case "selectionChange": {
          // 	let paragraph = new docx.Paragraph({
          // 		children: [
          // 			new docx.TextRun({
          // 				text: "Durchschnittliche",
          // 				font: font,
          // 				size: 28  // 14pt
          // 			}),
          // 			new docx.TextRun({
          // 				text: "Veränderung",
          // 				font: font,
          // 				break: 1,
          // 				size: 28  // 14pt
          // 			}),
          // 			new docx.TextRun({
          // 				text: pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion",
          // 				break: 1,
          // 				font: font,
          // 				size: 28  // 14pt
          // 			}),
          // 			new docx.TextRun({
          // 				text: pageElement.text.toString(),
          // 				break: 1,
          // 				font: font,
          // 				size: 28  // 14pt
                
          // 			})
          // 		],
          // 		frame: {
          // 			position: {
          // 				x: pageElementDimensionsTwip.left,
          // 				y: pageElementDimensionsTwip.top,
          // 			},
          // 			width: pageElementDimensionsTwip.width,
          // 			height: pageElementDimensionsTwip.height,
          // 			anchor: {
          // 				horizontal: docx.FrameAnchorType.MARGIN,
          // 				vertical: docx.FrameAnchorType.MARGIN,
          // 			},
          // 			alignment: {
          // 				x: docx.HorizontalPositionAlign.LEFT,
          // 				y: docx.VerticalPositionAlign.TOP,
          // 			}
          // 		},
          // 		border: {
          // 			top: {
          // 				color: "#949494", // gray
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 			right: {
          // 				color: "#949494",
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 			bottom: {
          // 				color: "#949494",
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 			left: {
          // 				color: "#949494",
          // 				space: 1,
          // 				style: docx.BorderStyle.SINGLE,
          // 				size: 6 
          // 			},
          // 		}
          // 	});
            
          // 	paragraphs.push(paragraph);
          // 	break;
          // }
          case "textInput": {
            if (! pageConfig.sectionContentControl.showFreeText){
              // skip
              continue;
            }
            let paragraph = new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: pageElement.text,
                  font: font,
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
              let tableDom:any = document.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type + " table");
              let headerFieldsDom = tableDom.querySelectorAll("thead th")
              let tableRowsDom = tableDom.querySelectorAll("tbody tr");
              
              // table to create
              let table:any = {
                columnWidths: [],
                rows: [],
                float: {
                  absoluteHorizontalPosition: pageElementDimensionsTwip.left,
                  absoluteVerticalPosition: pageElementDimensionsTwip.top,
                  overlap: docx.OverlapType.NEVER,
                },
              };
              let headerFields:any = [];
              let headerFieldNames:any = [];
              for(let fieldDom of headerFieldsDom) {
                let widthInTwip = this.pxToTwip(fieldDom.offsetWidth);
                let fieldContent = fieldDom.innerText;
                headerFieldNames.push(fieldContent)
                let field:any = new docx.TableCell({
                  width: {
                    size: widthInTwip,
                    type: docx.WidthType.DXA,
                  },
                  verticalAlign: docx.VerticalAlign.CENTER,
                  children: [new docx.Paragraph({
                    alignment: docx.AlignmentType.CENTER,
                    children: [new docx.TextRun({
                      text: fieldContent,
                      font: font,
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
                let fields:any = [];
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
              start: this.getPageNumber(idx),
              formatType: docx.NumberFormat.DECIMAL,
            },
            size: {
              orientation: page.orientation,
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
  
    let filename = this.getCurrentDateAndTime() + "_KomMonitor-Report"
    // Used to export the file into a .docx file
    docx.Packer.toBlob(doc).then((blob) => {
      saveAs(blob, filename + ".docx");
      this.loadingData = false;
     /*  setTimeout(function(){
        this.$digest();
      }); */
    });
  }

  dataURItoBlob(dataURI) {
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
    //var blob = new Blob([ab], {type: mimeString});
    return ia;
  }

  dataURItoBlob2(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  pxToTwip(px) {
    let result = parseInt(px, 10) * 15; // 1px = 0.75pt = 15twip
    return result * this.pxPerMilli*297 / 830 // scale from 830px to A4 page
  }

  pxToInch(px) {
    // our preview is 830px wide
    // px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
    // This is the short version of:
    // px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
    // pxPerMillimeter cancels out there, so it doesn't matter.
    let result = parseInt(px, 10);
    result = Math.round((result/this.deviceScreenDpi) * 100) / 100;
    return result;
  }
}
