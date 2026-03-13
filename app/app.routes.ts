import { AdminComponent } from "components/ngComponents/admin/admin.component";
import { UserInterfaceComponent } from "./components/ngComponents/userInterface/user-interface.component";
import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "administration",
    component: AdminComponent,
    canActivate: [authGuard],
  },
  { path: "**", component: UserInterfaceComponent },
];
