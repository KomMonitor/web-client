import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Component, Input, OnChanges, OnInit, Renderer2, SimpleChanges, inject } from '@angular/core';
import { NgbActiveModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


/* <div class="modal-header">
			<h4 class="modal-title">Hi there!</h4>
			<button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss('Cross click')"></button>
		</div>
		<div class="modal-body">
			<p>Hello, {{ name }}!</p>
		</div>
		<div class="modal-footer">
			<button type="button" class="btn btn-outline-secondary" (click)="activeModal.close('Close click')">Close</button>
		</div>  */

@Component({
	selector: 'ngbd-modal-content',
	standalone: true,
	templateUrl: 'info-modal.component.html',
})
export class NgbdModalContent {
	activeModal = inject(NgbActiveModal);

    @Input() hero!: any;
    @Input() customGreetingsContact_name!: string;
    @Input() customGreetingsContact_organisation!: string;
    @Input() customGreetingsContact_mail!: string;
    @Input() customGreetingsTextInfoMessage!: string;
}

@Component({
  selector: 'infoModal',
  templateUrl: 'info-modal.template.html',
  styleUrls: ['info-modal.component.css']
})
export class InfoModalComponent implements OnInit, OnChanges {
    
  @Input() hero!: any;

  isHideGreetings: boolean = false;
 
  customGreetingsContact_name: SafeHtml;
  customGreetingsContact_organisation: SafeHtml;
  customGreetingsContact_mail: string;
  customGreetingsTextInfoMessage: SafeHtml;
    sanitizer: any;


  constructor(
    private modalService: NgbModal, 
    private router: Router,
    private renderer:Renderer2
) {
    // this.customGreetingsContact_name = this.sanitizer.bypassSecurityTrustHtml(''); 
    // this.customGreetingsContact_organisation = this.sanitizer.bypassSecurityTrustHtml(''); 
    // this.customGreetingsContact_mail = ''; 
    // this.customGreetingsTextInfoMessage = this.sanitizer.bypassSecurityTrustHtml('');

    this.customGreetingsContact_name = "Test"; 
    this.customGreetingsContact_organisation = "Test"; 
    this.customGreetingsContact_mail = "Test"; 
    this.customGreetingsTextInfoMessage = "Test";

  }

  ngOnChanges(changes: SimpleChanges) {
        
        if(this.hero) {
                    
            const modalRef = this.modalService.open(NgbdModalContent, {windowClass: 'modal-holder', centered: true}); 
            modalRef.componentInstance.customGreetingsContact_name = this.customGreetingsContact_name;
            modalRef.componentInstance.customGreetingsContact_organisation = this.customGreetingsContact_organisation;
            modalRef.componentInstance.customGreetingsContact_mail = this.customGreetingsContact_mail;
            modalRef.componentInstance.customGreetingsTextInfoMessage = this.customGreetingsTextInfoMessage;
            console.log("Try to open infoModal");

            this.hero = false;
        }
    
    }   

  ngOnInit(): void {

    const modalRef = this.modalService.open(NgbdModalContent, {windowClass: 'modal-holder', centered: true}); 
    modalRef.componentInstance.customGreetingsContact_name = this.customGreetingsContact_name;
    modalRef.componentInstance.customGreetingsContact_organisation = this.customGreetingsContact_organisation;
    modalRef.componentInstance.customGreetingsContact_mail = this.customGreetingsContact_mail;
    modalRef.componentInstance.customGreetingsTextInfoMessage = this.customGreetingsTextInfoMessage;

	//prevent bootrap modals tabs opened by a tag with href elements from adding their anchor location to 
    // URL
	/* $("a[href^='#']").click(function(e) {
        console.log("wgh")
		//e.preventDefault();		
	});   */

    if (!(localStorage.getItem('hideKomMonitorAppGreeting') === 'true')) {
      this.isHideGreetings = false;
      // TODO FIXME 15.08.2023: this code currently breaks app, as modal cannot be interacted with
      // this.modalService.open('infoModal'); 
    } else {
      this.isHideGreetings = true;
    }

    this.renderer.listen('document','testIt',event => {
        console.log("hidfdfdfd");
    });

  }

  testMe() {
    console.log("wprks");
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
