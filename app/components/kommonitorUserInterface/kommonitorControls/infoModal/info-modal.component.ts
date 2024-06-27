
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Component, Inject, Input, OnInit, inject } from '@angular/core';
import { NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'ngbd-modal-content',
	standalone: true,
	template: `
		<div class="modal-header">
			<h4 class="modal-title">Hi there!</h4>
			<button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss('Cross click')"></button>
		</div>
		<div class="modal-body">
			<p>Hello, {{ name }}!</p>
		</div>
		<div class="modal-footer">
			<button type="button" class="btn btn-outline-secondary" (click)="activeModal.close('Close click')">Close</button>
		</div>
	`,
})
export class NgbdModalContent {
	activeModal = inject(NgbActiveModal);

	@Input() name!: string;
}



@Component({
  selector: 'infoModal',
  templateUrl: 'info-modal.template.html',
  styleUrls: ['info-modal.component.css'],
  providers: [NgbModal]
})
export class InfoModalComponent implements OnInit {

  isHideGreetings: boolean = false;
 
  customGreetingsContact_name: SafeHtml;
  customGreetingsContact_organisation: SafeHtml;
  customGreetingsContact_mail: string;
  customGreetingsTextInfoMessage: SafeHtml;
    sanitizer: any;


  constructor(private modalService: NgbModal, private router: Router) {
    // this.customGreetingsContact_name = this.sanitizer.bypassSecurityTrustHtml(''); 
    // this.customGreetingsContact_organisation = this.sanitizer.bypassSecurityTrustHtml(''); 
    // this.customGreetingsContact_mail = ''; 
    // this.customGreetingsTextInfoMessage = this.sanitizer.bypassSecurityTrustHtml('');

    this.customGreetingsContact_name = "Test"; 
    this.customGreetingsContact_organisation = "Test"; 
    this.customGreetingsContact_mail = "Test"; 
    this.customGreetingsTextInfoMessage = "Test";

  
  }

  ngOnInit(): void {
    console.log("wdfgj")
    this.modalService.open(NgbdModalContent); 
	//prevent bootrap modals tabs opened by a tag with href elements from adding their anchor location to 
    // URL
	$("a[href^='#']").click(function(e) {
		e.preventDefault();		
	});  

    if (!(localStorage.getItem('hideKomMonitorAppGreeting') === 'true')) {
      this.isHideGreetings = false;
      // TODO FIXME 15.08.2023: this code currently breaks app, as modal cannot be interacted with
      // this.modalService.open('infoModal'); 
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

