import { Component, OnInit,AfterViewInit, Inject } from '@angular/core';
import { environment } from 'env_backup';
import { ajskommonitorDataExchangeServiceeProvider, kommonitorDataExchangeServiceFactory } from 'app-upgraded-providers';
import { ModalService } from 'util/genericServices/modal.service';
import { VersionInfoComponent } from '../versionInfo/version-info.component';
@Component({
  selector: 'info-modal',
  templateUrl: 'info-modal.template.html',
  styleUrls: ['info-modal.component.css'],
 providers:[ModalService,ajskommonitorDataExchangeServiceeProvider]
})
export class InfoModalComponent implements OnInit{
  
  isHideGreetings: boolean = false;
 tab1:any='null';
  customGreetingsContact_name = "Test"; 
  customGreetingsContact_organisation = "Test"; 
  customGreetingsContact_mail = "Test"; 
  customGreetingsTextInfoMessage = "Test";
  constructor(private modalService: ModalService,@Inject('ajsKommonitorDataExchangeService') public kommonitorDataExchangeService: any) {
    this.customGreetingsContact_name = "Test"; 
    this.customGreetingsContact_organisation = "Test"; 
    this.customGreetingsContact_mail = "Test"; 
    this.customGreetingsTextInfoMessage = "Test";
   }
  

  ngOnInit(): void {



    this.modalService.startGuidedTour$.subscribe(() => {
      // Call a method to handle the guided tour event
      this.callStartGuidedTour();
    });
    this.kommonitorDataExchangeService =  kommonitorDataExchangeServiceFactory(this.kommonitorDataExchangeService);
   
    if (!(localStorage.getItem("hideKomMonitorAppGreeting") === "true")) {
      this.isHideGreetings = false;
      $('#infoModal').modal('show');
    } else {
      this.isHideGreetings = true;
      $("#changeHideGreetingsInput").prop('checked', true);
    }

   const tab1 = document.getElementById("infoModalTab1");
   if(tab1 ){
    tab1.innerHTML = environment.standardInfoModalTabTitle;
    tab1.click();
    tab1.focus();
   
   

    if (environment.enableExtendedInfoModal) {
      const tab3 = document.getElementById("infoModalTab3");
      const tab3content = document.getElementById("infoModalTab3Content");

      if (tab3 && tab3content) {
        tab3.innerHTML = environment.extendedInfoModalTabTitle;
        tab3content.innerHTML =environment.extendedInfoModalHTMLMessage;
      } 
      else {
        alert("not founde")
      }
      
    } 
    else{
      console.log("content hasnt be loaded")
    }
  }
    setTimeout(() => {
      // You might need to use Angular's change detection instead of $digest
    }, 250);
  
  
  }
  

  onChangeHideGreetings(): void {
    if (this.isHideGreetings) {
      localStorage.setItem("hideKomMonitorAppGreeting", "true");
    } else {
      localStorage.setItem("hideKomMonitorAppGreeting", "false");
    }
  }

  onToggleHideGreetings(): void {
    this.isHideGreetings = !this.isHideGreetings;
    localStorage.setItem("hideKomMonitorAppGreeting", this.isHideGreetings ? "true" : "false");
  }

  callStartGuidedTour(): void {
    $('#infoModal').modal('hide');
    this.modalService.startGuidedTour();

  }

  showFeedbackForm(): void {
    $('#infoModal').modal('hide');
    $('#feedbackModal').modal('show');
  }
}
