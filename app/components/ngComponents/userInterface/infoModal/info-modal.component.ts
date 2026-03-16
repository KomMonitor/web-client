import { firstValueFrom } from 'rxjs';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from "@angular/common";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { VersionInfoComponent } from 'components/ngComponents/userInterface/versionInfo/version-info.component';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';

@Component({
	selector: 'ngbd-modal-content',
	standalone: true,
	templateUrl: 'info-modal.component.html',
  styleUrls: ['info-modal.component.css'],
  imports: [CommonModule, VersionInfoComponent, SafeHtmlPipe]
})
export class InfoModal implements OnInit {
    activeModal = inject(NgbActiveModal);

    customTabTitle: string = '';
    tab1Title: string = '';
    tab3Title: string = '';
    tab3Content: string = '';
    tab3Active: boolean = false;

    customGreetingsContact_name!: string;
    customGreetingsContact_organisation!: string;
    customGreetingsContact_mail!: string;

    customGreetingsTextInfoMessage!: string;

    hideGreeting: boolean = true;

    landingpageContent: string | undefined;
    customLandingPage: boolean = false;

    @Input() open!: any;

    constructor(
      private exchangeService: DataExchangeService,
      private configStorageService: ConfigStorageService
    ) {}

    ngOnInit(): void {

      this.customGreetingsContact_name = this.exchangeService.customGreetingsContact_name;
      this.customGreetingsContact_organisation = this.exchangeService.customGreetingsContact_organisation;
      this.customGreetingsContact_mail = this.exchangeService.customGreetingsContact_mail;
      this.customGreetingsTextInfoMessage = this.exchangeService.customGreetingsTextInfoMessage;

      this.tab1Title = window.__env.standardInfoModalTabTitle;      

      if(window.__env.enableExtendedInfoModal) {				
        this.tab3Active = true;				
				this.tab3Title = window.__env.extendedInfoModalTabTitle;
				this.tab3Content = window.__env.extendedInfoModalHTMLMessage;				
			}

      if(window.__env.customLandinPage===true)
        this.initCustomLandingpage();
    }

    async initCustomLandingpage() {

      this.customLandingPage = true;
      this.customTabTitle = window.__env.customLandinPageTitle;
      this.landingpageContent = await firstValueFrom(this.configStorageService.getLandingpageConfig());
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
