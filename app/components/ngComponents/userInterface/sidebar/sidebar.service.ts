import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface SidebarData {
  sidebarIdentifier: string;
}

@Injectable({ providedIn: 'root' })
export class SidebarService {

  defaultSidebarOpenElement: string = 'sidebarPoiCollapse';

  sidebarOpenElement$ = new BehaviorSubject<SidebarData>({sidebarIdentifier: this.defaultSidebarOpenElement});
}