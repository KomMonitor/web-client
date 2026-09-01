import { Component, Input, OnInit } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

export type ExpanableBoxBorderColor = 'primary' | 'red' | 'green' | 'cyan';

/** 'nested' subordinates a box that sits inside another box's body. */
export type ExpandableBoxVariant = 'default' | 'nested';

@Component({
  selector: 'expandable-box',
  templateUrl: './expandable-box.component.html',
  styleUrls: ['./expandable-box.component.scss'],
  imports: [NgbCollapseModule],
  standalone: true,
})
export class ExpandableBoxComponent implements OnInit {
  @Input({ required: true }) title!: string;
  @Input() collapsed: boolean = true;
  @Input() borderColor: ExpanableBoxBorderColor = 'primary';
  @Input() isCollapsible: boolean = true;
  @Input() variant: ExpandableBoxVariant = 'default';

  ngOnInit() {
    if (this.isCollapsible === false) {
      this.collapsed = false;
    }
  }

  onCollapseToggle() {
    if (this.isCollapsible) {
      this.collapsed = !this.collapsed;
    }
  }

  /** Space activates the header like a button, without scrolling the page. */
  onSpace(event: Event) {
    if (!this.isCollapsible) {
      return;
    }
    event.preventDefault();
    this.onCollapseToggle();
  }
}
