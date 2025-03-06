import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  content:number | boolean = 3; // default: false

  showContent(number) {
    if(this.content!==number)
      this.content = number;
    else
      this.content = false;
  }
}
