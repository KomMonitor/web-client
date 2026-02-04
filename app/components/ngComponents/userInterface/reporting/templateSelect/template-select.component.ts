import { reportingData } from './../reporting-modal.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ReportingTemplateFilter } from 'pipes/reporting-template-filter.pipe';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { NgbAccordionBody, NgbAccordionModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { sharedReportingData } from '../reporting-modal.component';
import { ReportingService } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-template-select',
  standalone: true,
  templateUrl: './template-select.component.html',
  styleUrls: ['./template-select.component.scss'],
  imports: [CommonModule, ReportingTemplateFilter, FormsModule, SafeHtmlPipe, NgbDatepickerModule, NgbAccordionModule]
})
export class TemplateSelectComponent implements OnInit {
 
  @Input() data!:sharedReportingData;
  @Output() selectedWorkflow = new EventEmitter<any[]>();

  datePickerDate!: any;

  constructor(
    protected reportingService: ReportingService
  ) {}

  //prevent bootrap modals tabs opened by a tag with href elements from adding their anchor location to 
  // URL
 /*  $("a[href^='#']").click(function(e) {
          e.preventDefault();
          
  }) */

  ngOnInit(): void {

    this.resetReportingConfig()

       // todo
  /*   this.datePicker = $('#reporting-general-settings-datefield').datepicker({
      autoclose: true,
      language: 'de',
      format: 'yyyy-mm-dd'
    });
    document.getElementById("reporting-load-commune-logo-button").addEventListener('change', readSingleFile, false); */

    // set the property "isPlaceholder" to false for specific page elements since their content should be replaced right away
    for(let template of this.reportingService.availableTemplates) {
      this.iteratePageElements( template, function(page, pageElement) {
        pageElement.isPlaceholder = (
          pageElement.type.includes("footerCreationInfo-") ||
          pageElement.type.includes("pageNumber-") ||
          pageElement.type === "textInput"
          ) ? false : true;
      })
    }
    
    for(let template of this.reportingService.availableTemplates) {
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

  resetReportingConfig() {
    this.data.reportingConfig = {
      template: {},
      templateSections: [],
      pages: [],
      backupTemplate: {}
    }
  }

  onWorkflowSelect(value: any[]) {
    this.selectedWorkflow.emit(value);
  }

  onChangeDatepickerDate() {
    this.reportingService.generalSettings.creationDate = `${this.datePickerDate.year}-${this.datePickerDate.month}-${this.datePickerDate.day}`;
  }

  getPageNumber(index) {

    let pageNumber = 1;
    for(let i = 0; i < index; i ++) {
      if (this.showThisPage(this.reportingService.selectedTemplate.pages[i])) {
        pageNumber ++;
      }
    }
    return pageNumber;
  }

  showThisPage(page) {
    let pageWillBeShown = false;
    for(let visiblePage of this.filterPagesToShow()){
      if(visiblePage == page) {
        pageWillBeShown = true;
      }
    }
    return pageWillBeShown;
  }

  filterPagesToShow() {
    let pagesToShow:any[] = [];
    let skipNextPage = false;
    for (let i = 0; i < this.reportingService.selectedTemplate.pages.length; i ++) {
      let page = this.reportingService.selectedTemplate.pages[i];
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
    let page = this.reportingService.selectedTemplate.pages[pageID];
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
  templateFilter(categoryId) {
    return function(value) {
      return categoryId === value.categoryId;
    }
  }

  onTemplateElementClicked($event, template) {
    let el = $event.target;
    el.style.backgroundColor = "#0078D7";
    el.style.color = "white";
    document.querySelectorAll(".reporting-selectable-template").forEach( (element:any) => {
      if( el !== element) {
        element.style.backgroundColor = "white";
        element.style.color = "black";
      }
    });
    // set scope variable manually each time
    if(this.reportingService.selectedTemplate !== template) {
      this.reportingService.selectedTemplate = template;
    }
  }

  /**
   * converts a base64 encoded data url SVG image to a PNG image
   * @param originalBase64 data url of svg image
   * @param width target width in pixel of PNG image
   * @return {Promise<String>} resolves to png data url of the image
   */
  async base64SvgToBase64Png (originalBase64, width) {
    return await new Promise(resolve => {
      let img:any = document.createElement('img');
      img.onload = () => {
        document.body.appendChild(img);
        let canvas = document.createElement("canvas");
        let ratio = (img.clientWidth / img.clientHeight) || 1;
        document.body.removeChild(img);
        canvas.width = width;
        canvas.height = width / ratio;
        let ctx:any = canvas.getContext("2d");
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
  readSingleFile(e) {
    let content = "";
    let srcElement = e.srcElement;
    let file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    // async
    reader.onload = (e:any) => {
      let content:any = e.target.result;

      // if content is SVG base64 string then convert that to png image
      // as svg is porblemativ when perfirming PDF export later with jsPDF
      if(content.includes("svg")){
        content = this.base64SvgToBase64Png(content, 250);
      }

      if(srcElement.id === "reporting-load-commune-logo-button") {
        this.reportingService.generalSettings.communeLogo = content;
        // set isPlaceholder to false
        for(let template of this.reportingService.availableTemplates) {
          this.iteratePageElements( template, function(page, pageElement) {
            if(pageElement.type.includes("communeLogo-")) {
              pageElement.isPlaceholder = false;
              pageElement.src = content;
            }
          })
        }
      }
     };
    reader.readAsDataURL(file);
  }

  templateSupportsFreeText() {
    if(typeof(this.reportingService.selectedTemplate) === "undefined")
      return false;

    if(!this.reportingService.selectedTemplate.pages) {
      return false;
    }

    for(let page of this.reportingService.selectedTemplate.pages) {
      for(let pageElement of page.pageElements) {
        if (pageElement.type === "textInput") {
          return true;
        }
      }
    }
    return false;
  }

  onTemplateSelected() {

    // update selected template with general settings
    for(let [idx, page] of this.reportingService.selectedTemplate.pages.entries()) {
      for(let el of page.pageElements) {
        if(el.type.includes("footerCreationInfo-")) {
          el.text = "Erstellt am " + this.reportingService.generalSettings.creationDate + " von " + this.reportingService.generalSettings.creator + ", " + this.reportingService.generalSettings.commune
        }
        if(el.type === "textInput") {
          el.text = this.reportingService.generalSettings.freeText;
        }

        // page number is generated by html expression, but we update if anyway for consistency
        if(el.type.includes("pageNumber-")) {
          el.placeholderText = "Seite " + this.getPageNumber(idx)
        }
      }
    }

    console.log(this.reportingService.selectedTemplate)

    this.data.reportingConfig.template = this.reportingService.selectedTemplate;
    this.data.reportingConfig.backupTemplate = JSON.stringify(this.reportingService.selectedTemplate);

    this.onWorkflowSelect([2,this.data]);
  }
  
  copy(obj) {
    var cp = {};
    for (var o in obj) {
        cp[o] = obj[o];
    }
    return cp;
  }

  onBackToWorkflowSelectionClicked() {
    this.reportingService.selectedTemplate = {};
    this.onWorkflowSelect([0]);
  }

  iteratePageElements(template, functionToExecute) {
    for(let page of template.pages) {
      for(let pageElement of page.pageElements) {
        functionToExecute(page, pageElement);
      }
    }
  }

}
