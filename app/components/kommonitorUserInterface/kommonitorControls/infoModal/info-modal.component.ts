
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Component, OnInit } from '@angular/core';
import { NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'infoModal',
  templateUrl: 'info-modal.template.html',
  styleUrls: ['info-modal.component.css']
})
export class InfoModalComponent implements OnInit {
 
  isHideGreetings: boolean = false;
 
  customGreetingsContact_name: SafeHtml;
  customGreetingsContact_organisation: SafeHtml;
  customGreetingsContact_mail: string;
  customGreetingsTextInfoMessage: SafeHtml;
    sanitizer: any;


  constructor(private modalService: NgbModal, private router: Router) {
    this.customGreetingsContact_name = this.sanitizer.bypassSecurityTrustHtml(''); 
    this.customGreetingsContact_organisation = this.sanitizer.bypassSecurityTrustHtml(''); 
    this.customGreetingsContact_mail = ''; 
    this.customGreetingsTextInfoMessage = this.sanitizer.bypassSecurityTrustHtml('');

  
  }

  ngOnInit(): void {
    if (!(localStorage.getItem('hideKomMonitorAppGreeting') === 'true')) {
      this.isHideGreetings = false;
      this.modalService.open('infoModal'); 
    } else {
      this.isHideGreetings = true;
    }

  }
  dismissModal() {
    this.modalService.dismissAll();
  }

 
  onChangeHideGreetings(): void {
    if (this.isHideGreetings) {
      localStorage.setItem('hideKomMonitorAppGreeting', 'true');
    } else {
      localStorage.setItem('hideKomMonitorAppGreeting', 'false');
    }
  }
  callStartGuidedTour(): void {
    this.modalService.dismissAll('infoModal'); 
    this.router.navigate(['/guided-tour']); 
  }
  showFeedbackForm(): void {
    this.modalService.dismissAll('infoModal'); 
    this.router.navigate(['/feedback']);
  }
}
























function dismissModal() {
    throw new Error("Function not implemented.");
}

