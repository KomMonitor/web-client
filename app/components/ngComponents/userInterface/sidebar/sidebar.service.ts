import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface SidebarData {
  sidebarIdentifier: string;
}

export enum SidebarElement {
  POI,
  RTD
}

@Injectable({ providedIn: 'root' })
export class SidebarService {

  openedSidebarElement: SidebarElement | undefined;

  defaultSidebarOpenElement: string = 'sidebarPoiCollapse';

  sidebarOpenElement$ = new BehaviorSubject<SidebarData>({sidebarIdentifier: this.defaultSidebarOpenElement});

  openPois() {
    console.log("hier")
    this.openedSidebarElement = SidebarElement.POI;
    this.sidebarOpenElement$.next({sidebarIdentifier:'sidebarPoiCollapse'});
  }
 
  openRtdDiagrams() {
    if(this.openedSidebarElement!==SidebarElement.RTD) {
      this.openedSidebarElement = SidebarElement.RTD;
      this.sidebarOpenElement$.next({sidebarIdentifier:'sidebarRtdDiagramCollapse'});
    }
  }
}