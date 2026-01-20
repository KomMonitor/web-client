import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "admin-sidebar",
  templateUrl: "./adminSidebar.component.html",
  styleUrls: ["./adminSidebar.component.scss"],
  // imports: [
  //   CommonModule,
  //   RouterModule,
  //   NgbNavModule,
  // ],
  standalone: false,
})
export class AdminSidebarComponent {
  active = "overview";

  isGeodataMgmtExpanded = false;
  isSettingsExpanded = false;

  constructor(
    private router: Router,
    // protected dataExchangeService: DataExchangeService
  ) {}

  switchToMapApplication() {
    this.router.navigate([""]);
  }
}
