import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserInterfaceComponent } from 'components/ngComponents/userInterface/user-interface.component';

// Hier definierst du deine Routen
const routes: Routes = [
  { path: '', component: UserInterfaceComponent }, // Default-Route
 /*  { path: 'about', component: AboutComponent }, */
  { path: '**', redirectTo: '' } // Fallback
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
