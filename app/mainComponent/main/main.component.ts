import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main',
  // TODO:_ resolve this later
  standalone: false,
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(
  ) {}

  async ngOnInit() {
    this.checkBrowser();
  }

  private checkBrowser(): void {
    if (/MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)) {
      // This is internet explorer 9, 10 or 11
      window.alert('Internet Explorer erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
    }


    if (/Edge\/\d./i.test(navigator.userAgent)) {
      // This is Microsoft Edge

      window.alert('Microsoft Edge erkannt. Für eine optimale Nutzung von KomMonitor nutzen Sie nach Möglichkeit die Browser Firefox oder Chrome.');
    }
  }


  
}
