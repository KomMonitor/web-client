import { Component, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from "@angular/common";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { VersionInfoComponent } from 'components/ngComponents/userInterface/versionInfo/version-info.component';

@Component({
	selector: 'ngbd-modal-content',
	standalone: true,
	templateUrl: 'info-modal.component.html',
  styleUrls: ['info-modal.component.css'],
  imports: [CommonModule, SafeHtmlPipe, VersionInfoComponent]
})
export class InfoModal implements OnInit {
    activeModal = inject(NgbActiveModal);

    tab1Title: string = '';
    tab3Title: string = '';
    tab3Content: string = '';
    tab3Active: boolean = false;

    customGreetingsContact_name!: string;
    customGreetingsContact_organisation!: string;
    customGreetingsContact_mail!: string;

    customGreetingsTextInfoMessage!: string;

    hideGreeting: boolean = true;

    @Input() open!: any;

    constructor(
      private exchangeService: DataExchangeService
    ) {}

    ngOnInit(): void {

      this.customGreetingsContact_name = this.exchangeService.pipedData.customGreetingsContact_name;
      this.customGreetingsContact_organisation = this.exchangeService.pipedData.customGreetingsContact_organisation;
      this.customGreetingsContact_mail = this.exchangeService.pipedData.customGreetingsContact_mail;
      this.customGreetingsTextInfoMessage = this.exchangeService.pipedData.customGreetingsTextInfoMessage;

      this.tab1Title = window.__env.standardInfoModalTabTitle;      

      if(window.__env.enableExtendedInfoModal) {				
        this.tab3Active = true;				
				this.tab3Title = window.__env.extendedInfoModalTabTitle;
				this.tab3Content = window.__env.extendedInfoModalHTMLMessage;				
			}
    }

    onHideGreetingChange(event: any) {

      this.hideGreeting = !this.hideGreeting;

      if (this.hideGreeting) {
        localStorage.setItem('hideKomMonitorAppGreeting', 'true');
      } else {
        localStorage.setItem('hideKomMonitorAppGreeting', 'false');
      }
    }
}
