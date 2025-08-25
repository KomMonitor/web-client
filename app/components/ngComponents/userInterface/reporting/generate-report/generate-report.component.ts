import { Component, Input, OnInit } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { jsPDF } from "jspdf";

@Component({
  selector: 'app-generate-report',
  standalone: true,
  templateUrl: './generate-report.component.html',
  styleUrls: ['./generate-report.component.css']
})
export class GenerateReportComponent implements OnInit {

  @Input() data:any = [];

  loadingData = false;
  config: any;


  constructor(
    private dataExchangeService: DataExchangeService
  ) {}

  ngOnInit(): void {
      this.config = this.data.templateData[1];
  }

  //async
  generateReport(format) {
    this.loadingData = true;

    try {
      format === "pdf" && this.generatePdfReport();
      format === "docx" && this.generateWordReport();
      format === "zip" && this.generateZipFolder();
      format === "pptx" && this.generatePptxReport();
    } catch (error:any) {
      this.loadingData = false;
      console.error(error);
      this.dataExchangeService.displayMapApplicationError(error.message);
    }
  }

  generatePptxReport() {

    /* let doc:any = new PptxGenJS();

    doc.defineLayout({ name:'A4-landscape', width:29.7, height:21 });
    doc.defineLayout({ name:'A4-portrait', width:21, height:29.7 });

    doc.layout = 'A4-'+this.config.pages[0].orientation;

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
    slide.addText("Erstellt am 2022-12-31 von M.Mustermann, Testkommune", { placeholder: "slide_footer" }); */


    // Pages
/* 
    for(let [idx, page] of this.config.pages.entries()) {

      if(!this.showThisPage(page)) {
        continue;
      }

      // 2. Add a Slide to the presentation
      let slide = doc.addSlide({ masterName: "TEMPLATE_SLIDE" });

      let formatFactor = 3.4;

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
            if (! page.templateSection.pageConfig.showTitle){
              // skip
              continue;
            }
                    slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_title" });
            break;
          }

          case "communeLogo-landscape":
          case "communeLogo-portrait": {
            if (! page.templateSection.pageConfig.showLogo){
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
            if (! page.templateSection.pageConfig.showSubtitle){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_subtitle" });
            break;
          }
          case "dataTimeseries-landscape":
          case "dataTimeseries-portrait": {
            if (! page.templateSection.pageConfig.showSubtitle){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, fontSize: fontSize-3, fontFace: fontFace });
            break;
          }
          case "reachability-subtitle-landscape":
          case "reachability-subtitle-portrait": {
            if (! page.templateSection.pageConfig.showSubtitle){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, fontSize: fontSize-3, fontFace: fontFace });
            break;
          }
          case "footerHorizontalSpacer-landscape":
          case "footerHorizontalSpacer-portrait": {
            if (! page.templateSection.pageConfig.showFooterCreationInfo){
              // skip
              continue;
            }
            slide.addShape(doc.shapes.LINE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: 0.0, line: { color: '#000000', width: 1 } });
            break;
          }
          case "footerCreationInfo-landscape":
          case "footerCreationInfo-portrait": {  
            if (! page.templateSection.pageConfig.showFooterCreationInfo){
              // skip
              continue;								
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_footer" });
            break;
          } 
          case "pageNumber-landscape":
          case "pageNumber-portrait": {
            if (! page.templateSection.pageConfig.showPageNumber){
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
            imageDataUrl = this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)

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
            if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showRankingChartPerArea){
              continue;
            }
            let instance:any = echarts.getInstanceByDom(pElementDom);
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} );

            slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: base64String});
            break;
          }
          case "linechart": {
            if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showLineChartPerArea){
              continue;
            }
            let instance:any = echarts.getInstanceByDom(pElementDom);
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} );

            slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: base64String});
            break;
          }
          case "textInput": {
            if (! page.templateSection.pageConfig.showFreeText){
              // skip
              continue;
            }
            slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, fontSize: fontSize-3, fontFace: fontFace });
            break;
          }
          case "datatable": {							

            let table:any = document.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type + " table");

            let data:any = [];
            if(table && table.rows.length>0) {
              table.rows.forEach((row, rowIndex) => {

                let singleRowData:any[] = [];
                if(row.cells && row.cells.length>0) {
                  row.cells.forEach((cell, cellIndex) => {

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
    this.loadingData = false; */
  }

  filterPagesToShow() {
    let pagesToShow:any[] = [];
    let skipNextPage = false;
    for (let i = 0; i < this.config.pages.length; i ++) {
      let page = this.config.pages[i];
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
    let page = this.config.pages[pageID];
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

  generatePdfReport() {
    /* 
		// create pdf document
    let doc = new jsPDF({
      margin: 0,	
      unit: 'mm',
      format: 'a4',
      orientation: this.config.pages[0].orientation
    });

    let fontName = "Helvetica"; // standard

    if(this.customFontFile) {
      fontName = 'CustomInternal';
      doc.addFont(this.customFontFile, fontName, 'normal');
    }

    // external working as well, but unable to check for validity beforehand. Thus resulting in an critical error if invalid at rendering 

    
    doc.setDrawColor(148, 148, 148);
    doc.setFont(fontName, "normal", "normal"); 
    
    for(let [idx, page] of this.config.pages.entries()) {

      if(!this.showThisPage(page)) {
        continue;
      }

      if(idx > 0) {
        doc.addPage(null, page.orientation);
      }
      
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
        pageElementDimensions.top = pageElement.dimensions.top && pxToMilli(pageElement.dimensions.top);
        pageElementDimensions.bottom = pageElement.dimensions.bottom && pxToMilli(pageElement.dimensions.bottom);
        pageElementDimensions.left = pageElement.dimensions.left && pxToMilli(pageElement.dimensions.left);
        pageElementDimensions.right = pageElement.dimensions.right && pxToMilli(pageElement.dimensions.right);
        pageElementDimensions.width = pageElement.dimensions.width && pxToMilli(pageElement.dimensions.width);
        pageElementDimensions.height = pageElement.dimensions.height && pxToMilli(pageElement.dimensions.height);
        
        // TODO some cases could be merged, but it's better to do that later when stuff works
        switch(pageElement.type) {
          case "indicatorTitle-landscape":
          case "indicatorTitle-portrait": {
            if (! page.templateSection.pageConfig.showTitle){
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
            if (! page.templateSection.pageConfig.showLogo){
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
            if (! page.templateSection.pageConfig.showSubtitle){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "dataTimeseries-landscape":
          case "dataTimeseries-portrait": {
            if (! page.templateSection.pageConfig.showSubtitle){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "reachability-subtitle-landscape":
          case "reachability-subtitle-portrait": {
            if (! page.templateSection.pageConfig.showSubtitle){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "footerHorizontalSpacer-landscape":
          case "footerHorizontalSpacer-portrait": {
            if (! page.templateSection.pageConfig.showFooterCreationInfo){
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
            if (! page.templateSection.pageConfig.showFooterCreationInfo){
              // skip
              continue;
            }
            doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          case "pageNumber-landscape":
          case "pageNumber-portrait": {
            if (! page.templateSection.pageConfig.showPageNumber){
              // skip
              continue;
            }
            let text = "Seite " + this.getPageNumber(idx);
            doc.text(text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
            break;
          }
          // template-specific elements
          case "map": {
            let instance = echarts.getInstanceByDom(pElementDom)
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
            if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showRankingChartPerArea){
              continue;
            }
            let instance = echarts.getInstanceByDom(pElementDom)
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
            doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
                pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
            break;
          }
          case "linechart": {
            if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showLineChartPerArea){
              continue;
            }
            let instance = echarts.getInstanceByDom(pElementDom)
            let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
            doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
                pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
            break;
          }
          case "textInput": {
            if (! page.templateSection.pageConfig.showFreeText){
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
    this.loadingData = false; */
  }

  
  generateZipFolder() {
  /* 	// creates a zip folder containing all echarts files
    let zip = new JSZip();
    
    // screenshot map attribution and legend only once per section
    for(let [idx, page] of this.config.pages.entries()) {
    
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
          let imageDataUrl = instance.getDataURL({
            type: "png",
            pixelRatio: this.echartsImgPixelRatio
          });
          imageDataUrl = await this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)
          
          let filename = "Seite_" + (idx+1) + "_" + pageElement.type + ".png";
          if(pageElement.type === "linechart" && pageElement.showPercentageChangeToPrevTimestamp) {
            // two elements with same type on one page
            // use a different filename for one of them so we don't overwrite the other image
            filename = filename.replace(".png", "-proz.Veraenderung.png"); 
          }
            
          zip.file(filename, dataURItoBlob(imageDataUrl), "");
        }
      }
    }

    let zipFileName = getCurrentDateAndTime() + "_Kommonitor-Report-Grafiken";
    zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, zipFileName + ".zip");
      this.loadingData = false;
      setTimeout(function(){
        this.$digest();
      });
    }); */
  }

  generateWordReport() {
    /* // see docx documentation for more info about the format:
    // https://docx.js.org/#/?id=basic-usage

    let font = "Calibri";
    if(this.customFontFamily!=undefined) {
      font = this.customFontFamily.replace(/['"]+/g,'');
    }
    for(let [idx, page] of this.config.pages.entries()) {

      if(!this.showThisPage(page)) {
        continue;
      }

      let paragraphs = [];
      let pageDom = document.querySelector("#reporting-overview-page-" + idx);
      for(let pageElement of page.pageElements) {

        let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
        let pageElementDimensionsTwip = calculateDimensions(pageElement.dimensions, "twip");
        let pageElementDimensionsEmu = calculateDimensions(pageElement.dimensions, "emu");

        switch(pageElement.type) {
          case "indicatorTitle-landscape":
          case "indicatorTitle-portrait": {
            if (! page.templateSection.pageConfig.showTitle){
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
            if (! page.templateSection.pageConfig.showLogo){
              // skip
              continue;
            }
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
          case "dataTimeseries-landscape":
          case "reachability-subtitle-landscape":
          case "dataTimestamp-portrait":
          case "dataTimeseries-portrait":
          case "reachability-subtitle-portrait": {
            if (! page.templateSection.pageConfig.showSubtitle){
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
            if (! page.templateSection.pageConfig.showFooterCreationInfo){
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
            if (! page.templateSection.pageConfig.showFooterCreationInfo){
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
            if (! page.templateSection.pageConfig.showPageNumber){
              // skip
              continue;
            }
            let paragraph = new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: "Seite " + this.getPageNumber(idx),
                  font: font,
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
            if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showLineChartPerArea && pageElement.type === "linechart" ){
              continue;
            }
            if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showRankingChartPerArea && pageElement.type === "barchart" ){
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
            let instance = echarts.getInstanceByDom(pElementDom);
            let imageDataUrl = instance.getDataURL({
              type: "png",
              pixelRatio: this.echartsImgPixelRatio
                });	

            if(pageElement.type === "map"){
              imageDataUrl = await this.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)
            }
            

            let blob = dataURItoBlob(imageDataUrl);

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
            if (! page.templateSection.pageConfig.showFreeText){
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
  
    let filename = getCurrentDateAndTime() + "_KomMonitor-Report"
    // Used to export the file into a .docx file
    docx.Packer.toBlob(doc).then((blob) => {
      saveAs(blob, filename + ".docx");
      this.loadingData = false;
      setTimeout(function(){
        this.$digest();
      });
    }); */
  }

}
