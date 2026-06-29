import { firstValueFrom } from 'rxjs';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  inject,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { VersionInfoComponent } from 'components/ngComponents/userInterface/versionInfo/version-info.component';
import { ConfigStorageService } from 'services/config-storage-service/config-storage.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'ngbd-modal-content',
  standalone: true,
  templateUrl: 'info-modal.component.html',
  styleUrls: ['info-modal.component.scss'],
  imports: [CommonModule, VersionInfoComponent, SafeHtmlPipe],
})
export class InfoModal implements OnInit {
  private configStorageService = inject(ConfigStorageService);
  private envConfigService = inject(EnvConfigService);

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

  ngOnInit(): void {
    this.customGreetingsContact_name = this.envConfigService.customGreetingsContact_name;
    this.customGreetingsContact_organisation =
      this.envConfigService.customGreetingsContact_organisation;
    this.customGreetingsContact_mail = this.envConfigService.customGreetingsContact_mail;
    this.customGreetingsTextInfoMessage = this.envConfigService.customGreetingsTextInfoMessage;

    this.tab1Title = this.envConfigService.standardInfoModalTabTitle;

    if (this.envConfigService.enableExtendedInfoModal) {
      this.tab3Active = true;
      this.tab3Title = this.envConfigService.extendedInfoModalTabTitle;
      this.tab3Content = this.envConfigService.extendedInfoModalHTMLMessage;
    }

    if (this.envConfigService.customLandinPage === true) this.initCustomLandingpage();
  }

  async initCustomLandingpage() {
    this.customLandingPage = true;
    this.customTabTitle = this.envConfigService.customLandinPageTitle;
    this.landingpageContent = await firstValueFrom(
      this.configStorageService.getLandingpageConfig()
    );
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
