import { AdminComponent } from 'components/ngComponents/admin/admin.component';
import { UserInterfaceComponent } from './components/ngComponents/userInterface/user-interface.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {path: 'administration', component: AdminComponent},
  {path: '**', component: UserInterfaceComponent}
];
