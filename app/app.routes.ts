import { UserInterfaceComponent } from './components/ngComponents/userInterface/user-interface.component';
import { Routes } from '@angular/router';

export const routes: Routes = [{
  path: '**', component: UserInterfaceComponent
}];
